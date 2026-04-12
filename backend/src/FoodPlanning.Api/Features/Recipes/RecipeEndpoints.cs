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
}
