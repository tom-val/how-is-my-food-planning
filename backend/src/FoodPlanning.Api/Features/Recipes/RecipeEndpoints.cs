using FluentValidation;
using FoodPlanning.Api.Features.Families;
using FoodPlanning.Api.Shared.Extensions;

namespace FoodPlanning.Api.Features.Recipes;

public static class RecipeEndpoints
{
    public static void MapRecipeEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/v1/recipes");

        group.MapGet("/", ListRecipes);
        group.MapGet("/ingredients", ListIngredientNames);
        group.MapPost("/ai/start", AiStart);
        group.MapGet("/ai/jobs/{jobId:guid}", AiPoll);
        group.MapPost("/ai/jobs/{jobId:guid}/process", AiProcess);
        group.MapPost("/", CreateRecipe);
        group.MapGet("/{id:guid}", GetRecipe);
        group.MapPut("/{id:guid}", UpdateRecipe);
        group.MapDelete("/{id:guid}", DeleteRecipe);
    }

    private static async Task<IResult> ListRecipes(
        IRecipeRepository repository,
        IFamilyMembershipService membership,
        HttpContext context)
    {
        var userId = context.GetUserId();
        var member = await membership.RequireMembershipAsync(userId);

        var recipes = await repository.GetAllByFamilyAsync(member.FamilyId);
        return Results.Ok(recipes);
    }

    private static async Task<IResult> ListIngredientNames(
        IRecipeRepository repository,
        IFamilyMembershipService membership,
        HttpContext context)
    {
        var userId = context.GetUserId();
        var member = await membership.RequireMembershipAsync(userId);

        var names = await repository.GetDistinctIngredientNamesAsync(member.FamilyId);
        return Results.Ok(names);
    }

    private static async Task<IResult> CreateRecipe(
        CreateRecipeRequest request,
        IValidator<CreateRecipeRequest> validator,
        IRecipeRepository repository,
        IFamilyMembershipService membership,
        HttpContext context)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var userId = context.GetUserId();
        var member = await membership.RequireMembershipAsync(userId);

        var recipe = await repository.CreateAsync(
            member.FamilyId, userId, request.Name, request.Instructions, request.Categories ?? [], request.Ingredients);

        return Results.Created($"/v1/recipes/{recipe.Recipe.Id}", recipe);
    }

    private static async Task<IResult> GetRecipe(
        Guid id,
        IRecipeRepository repository,
        IFamilyMembershipService membership,
        HttpContext context)
    {
        var userId = context.GetUserId();
        var member = await membership.RequireMembershipAsync(userId);

        var recipe = await repository.GetByIdAsync(id, member.FamilyId);
        return recipe is null
            ? Results.NotFound(new { error = "Recipe not found." })
            : Results.Ok(recipe);
    }

    private static async Task<IResult> UpdateRecipe(
        Guid id,
        UpdateRecipeRequest request,
        IValidator<UpdateRecipeRequest> validator,
        IRecipeRepository repository,
        IFamilyMembershipService membership,
        HttpContext context)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var userId = context.GetUserId();
        var member = await membership.RequireMembershipAsync(userId);

        var recipe = await repository.UpdateAsync(
            id, member.FamilyId, request.Name, request.Instructions, request.Categories ?? [], request.Ingredients);

        return recipe is null
            ? Results.NotFound(new { error = "Recipe not found." })
            : Results.Ok(recipe);
    }

    private static async Task<IResult> DeleteRecipe(
        Guid id,
        IRecipeRepository repository,
        IFamilyMembershipService membership,
        HttpContext context)
    {
        var userId = context.GetUserId();
        var member = await membership.RequireMembershipAsync(userId);

        var deleted = await repository.DeleteAsync(id, member.FamilyId);
        return deleted
            ? Results.NoContent()
            : Results.NotFound(new { error = "Recipe not found." });
    }

    private static async Task<IResult> AiStart(
        AiSuggestRequest request,
        IAiRecipeJobRepository jobRepository,
        IFamilyMembershipService membership,
        HttpContext context)
    {
        var userId = context.GetUserId();
        var member = await membership.RequireMembershipAsync(userId);

        if (request.Messages.Count == 0)
            return Results.BadRequest(new { error = "At least one message is required." });

        var jobId = await jobRepository.CreateJobAsync(member.FamilyId, userId, request.Messages);

        // Fire-and-forget: trigger processing via a self-call.
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = context.RequestServices.CreateScope();
                var aiService = scope.ServiceProvider.GetRequiredService<IAiRecipeService>();
                var repo = scope.ServiceProvider.GetRequiredService<IAiRecipeJobRepository>();

                var job = await repo.GetPendingJobAsync(jobId);
                if (job is null) return;

                var result = await aiService.SuggestAsync(job.Value.Messages);
                await repo.CompleteJobAsync(jobId, result);
            }
            catch (Exception ex)
            {
                using var scope = context.RequestServices.CreateScope();
                var repo = scope.ServiceProvider.GetRequiredService<IAiRecipeJobRepository>();
                await repo.FailJobAsync(jobId, ex.Message);
            }
        });

        return Results.Accepted(value: new { jobId });
    }

    private static async Task<IResult> AiPoll(
        Guid jobId,
        IAiRecipeJobRepository jobRepository,
        IFamilyMembershipService membership,
        HttpContext context)
    {
        var userId = context.GetUserId();
        await membership.RequireMembershipAsync(userId);

        var job = await jobRepository.GetJobAsync(jobId);
        if (job is null)
            return Results.NotFound(new { error = "Job not found." });

        return Results.Ok(job);
    }

    private static async Task<IResult> AiProcess(
        Guid jobId,
        IAiRecipeService aiService,
        IAiRecipeJobRepository jobRepository,
        IFamilyMembershipService membership,
        HttpContext context)
    {
        var userId = context.GetUserId();
        await membership.RequireMembershipAsync(userId);

        var job = await jobRepository.GetPendingJobAsync(jobId);
        if (job is null)
            return Results.NotFound(new { error = "Job not found or already processed." });

        try
        {
            var result = await aiService.SuggestAsync(job.Value.Messages);
            await jobRepository.CompleteJobAsync(jobId, result);
            return Results.Ok(new AiRecipeJob(jobId, "completed", result, null));
        }
        catch (Exception ex)
        {
            await jobRepository.FailJobAsync(jobId, ex.Message);
            return Results.Ok(new AiRecipeJob(jobId, "failed", null, ex.Message));
        }
    }
}
