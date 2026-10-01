using System.Text.Json;
using Amazon.SQS;
using Amazon.SQS.Model;
using FluentValidation;
using FoodPlanning.Api.Features.Families;
using FoodPlanning.Api.Features.Planner;
using FoodPlanning.Api.Shared;
using FoodPlanning.Api.Shared.Extensions;
using Microsoft.Extensions.Options;

namespace FoodPlanning.Api.Features.ShoppingCategories;

public static class ShoppingCategoryEndpoints
{
    public static void MapShoppingCategoryEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/v1/shopping-categories");

        group.MapGet("/", ListCategories);
        group.MapPost("/", CreateCategory);
        group.MapPut("/order", ReorderCategories);
        group.MapPut("/assignments", AssignCategory);
        group.MapPost("/ai-sort", AiSortStart);
        group.MapGet("/ai-sort/{jobId:guid}", AiSortPoll);
        group.MapPut("/{id:guid}", RenameCategory);
        group.MapDelete("/{id:guid}", DeleteCategory);
    }

    private static async Task<IResult> ListCategories(
        IShoppingCategoryRepository repository,
        IFamilyMembershipService membership,
        HttpContext context)
    {
        var userId = context.GetUserId();
        var member = await membership.RequireMembershipAsync(userId);

        var categories = await repository.GetByFamilyIdAsync(member.FamilyId);
        return Results.Ok(categories);
    }

    private static async Task<IResult> CreateCategory(
        SaveShoppingCategoryRequest request,
        IValidator<SaveShoppingCategoryRequest> validator,
        IShoppingCategoryRepository repository,
        IFamilyMembershipService membership,
        HttpContext context)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var userId = context.GetUserId();
        var member = await membership.RequireMembershipAsync(userId);

        var result = await repository.CreateAsync(member.FamilyId, request.Name.Trim(), userId);
        return result.Outcome switch
        {
            ShoppingCategorySaveOutcome.Saved =>
                Results.Created($"/v1/shopping-categories/{result.Category!.Id}", result.Category),
            ShoppingCategorySaveOutcome.DuplicateName =>
                Results.Conflict(new { error = "A category with this name already exists." }),
            _ => Results.BadRequest(new
            {
                error = $"A family can have at most {ShoppingCategoryLimits.MaxCategoriesPerFamily} categories.",
            }),
        };
    }

    private static async Task<IResult> RenameCategory(
        Guid id,
        SaveShoppingCategoryRequest request,
        IValidator<SaveShoppingCategoryRequest> validator,
        IShoppingCategoryRepository repository,
        IFamilyMembershipService membership,
        HttpContext context)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var userId = context.GetUserId();
        var member = await membership.RequireMembershipAsync(userId);

        var result = await repository.RenameAsync(id, member.FamilyId, request.Name.Trim());
        return result.Outcome switch
        {
            ShoppingCategorySaveOutcome.Saved => Results.Ok(result.Category),
            ShoppingCategorySaveOutcome.DuplicateName =>
                Results.Conflict(new { error = "A category with this name already exists." }),
            _ => Results.NotFound(new { error = "Category not found." }),
        };
    }

    private static async Task<IResult> ReorderCategories(
        ReorderShoppingCategoriesRequest request,
        IValidator<ReorderShoppingCategoriesRequest> validator,
        IShoppingCategoryRepository repository,
        IFamilyMembershipService membership,
        HttpContext context)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var userId = context.GetUserId();
        var member = await membership.RequireMembershipAsync(userId);

        var reordered = await repository.ReorderAsync(member.FamilyId, request.Ids);
        return reordered
            ? Results.NoContent()
            : Results.BadRequest(new { error = "Ids must contain exactly the family's categories." });
    }

    private static async Task<IResult> DeleteCategory(
        Guid id,
        IShoppingCategoryRepository repository,
        IFamilyMembershipService membership,
        HttpContext context)
    {
        var userId = context.GetUserId();
        var member = await membership.RequireMembershipAsync(userId);

        var deleted = await repository.DeleteAsync(id, member.FamilyId);
        return deleted
            ? Results.NoContent()
            : Results.NotFound(new { error = "Category not found." });
    }

    private static async Task<IResult> AssignCategory(
        AssignShoppingCategoryRequest request,
        IValidator<AssignShoppingCategoryRequest> validator,
        IShoppingCategoryRepository repository,
        IFamilyMembershipService membership,
        HttpContext context)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var userId = context.GetUserId();
        var member = await membership.RequireMembershipAsync(userId);

        // The item name is passed through untrimmed: the item key is normalised in SQL,
        // exactly as it is when joining against the shopping list tables.
        if (request.CategoryId is null)
        {
            await repository.UnassignAsync(member.FamilyId, request.ItemName);
            return Results.NoContent();
        }

        var assigned = await repository.AssignAsync(member.FamilyId, request.ItemName, request.CategoryId.Value);
        return assigned
            ? Results.NoContent()
            : Results.NotFound(new { error = "Category not found." });
    }

    private static async Task<IResult> AiSortStart(
        AiSortShoppingCategoriesRequest request,
        IValidator<AiSortShoppingCategoriesRequest> validator,
        IShoppingCategoryRepository repository,
        IPlannerRepository plannerRepository,
        IAmazonSQS sqsClient,
        IOptions<SqsSettings> sqsSettings,
        IFamilyMembershipService membership,
        HttpContext context)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var userId = context.GetUserId();
        var member = await membership.RequireMembershipAsync(userId);

        var categories = await repository.GetByFamilyIdAsync(member.FamilyId);
        if (categories.Count < ShoppingCategoryLimits.MinCategoriesForAiSort)
        {
            return Results.BadRequest(new
            {
                error = $"At least {ShoppingCategoryLimits.MinCategoriesForAiSort} categories are required to sort with AI.",
                code = "notEnoughCategories",
            });
        }

        // Item names are always read from the database, never taken from the client.
        List<CategoriseJobItem> items;
        if (request.List == AiSortShoppingCategoriesValidator.Weekly)
        {
            var planId = request.PlanId!.Value;
            var planFamilyId = await plannerRepository.GetPlanFamilyIdAsync(planId);
            if (planFamilyId is null || planFamilyId != member.FamilyId)
                return Results.NotFound(new { error = "Plan not found." });

            items = await repository.GetWeeklyItemsToSortAsync(
                planId, member.FamilyId, ShoppingCategoryLimits.MaxItemsPerAiSort);
        }
        else
        {
            items = await repository.GetGeneralItemsToSortAsync(
                member.FamilyId, ShoppingCategoryLimits.MaxItemsPerAiSort);
        }

        if (items.Count == 0)
            return Results.Ok(new { jobId = (Guid?)null });

        var jobRequest = new CategoriseJobRequest(
            categories.Select(c => new CategoriseJobCategory(c.Id, c.Name)).ToList(),
            items);
        var jobId = await repository.CreateSortJobAsync(member.FamilyId, userId, jobRequest);

        // Send to SQS for async processing by the AI processor.
        var queueUrl = sqsSettings.Value.AiRecipeQueueUrl;
        if (!string.IsNullOrEmpty(queueUrl))
        {
            await sqsClient.SendMessageAsync(new SendMessageRequest
            {
                QueueUrl = queueUrl,
                MessageBody = JsonSerializer.Serialize(new { jobId, type = "categorise" }),
            });
        }

        return Results.Accepted(value: new { jobId });
    }

    private static async Task<IResult> AiSortPoll(
        Guid jobId,
        IShoppingCategoryRepository repository,
        IFamilyMembershipService membership,
        HttpContext context)
    {
        var userId = context.GetUserId();
        var member = await membership.RequireMembershipAsync(userId);

        var job = await repository.GetSortJobAsync(jobId, member.FamilyId);
        return job is null
            ? Results.NotFound(new { error = "Job not found." })
            : Results.Ok(job);
    }
}
