using FoodPlanning.Api.Features.Families;
using FoodPlanning.Api.Features.Planner;
using FoodPlanning.Api.Shared.Extensions;

namespace FoodPlanning.Api.Features.Shopping;

public static class ShoppingEndpoints
{
    public static void MapShoppingEndpoints(this WebApplication app)
    {
        app.MapGet("/v1/plans/{id:guid}/shopping-list", GetShoppingList);
        app.MapPost("/v1/plans/{id:guid}/shopping-list/generate", GenerateShoppingList);
        app.MapPost("/v1/plans/{id:guid}/shopping-list/items", AddCustomItem);
        app.MapPatch("/v1/shopping-list-items/{id:guid}", ToggleItem);
        app.MapDelete("/v1/shopping-list-items/{id:guid}", DeleteItem);
    }

    private static async Task<IResult> GetShoppingList(
        Guid id,
        IShoppingRepository repository,
        IPlannerRepository plannerRepository,
        IFamilyMembershipService membership,
        HttpContext context)
    {
        var userId = context.GetUserId();
        var member = await membership.RequireMembershipAsync(userId);

        var planFamilyId = await plannerRepository.GetPlanFamilyIdAsync(id);
        if (planFamilyId is null || planFamilyId != member.FamilyId)
            return Results.NotFound(new { error = "Plan not found." });

        var items = await repository.GetByPlanIdAsync(id);

        // Auto-generate if empty.
        if (items.Count == 0)
            items = await repository.GenerateAsync(id);

        var mappings = await repository.GetRecipeMappingsAsync(id);
        return Results.Ok(new ShoppingListResponse(items, mappings));
    }

    private static async Task<IResult> GenerateShoppingList(
        Guid id,
        IShoppingRepository repository,
        IPlannerRepository plannerRepository,
        IFamilyMembershipService membership,
        HttpContext context)
    {
        var userId = context.GetUserId();
        var member = await membership.RequireMembershipAsync(userId);

        var planFamilyId = await plannerRepository.GetPlanFamilyIdAsync(id);
        if (planFamilyId is null || planFamilyId != member.FamilyId)
            return Results.NotFound(new { error = "Plan not found." });

        var items = await repository.GenerateAsync(id);
        var mappings = await repository.GetRecipeMappingsAsync(id);
        return Results.Ok(new ShoppingListResponse(items, mappings));
    }

    private static async Task<IResult> ToggleItem(
        Guid id,
        ToggleRequest request,
        IShoppingRepository repository,
        HttpContext context)
    {
        var userId = context.GetUserId();
        var updated = await repository.ToggleItemAsync(id, request.IsChecked, userId);

        return updated
            ? Results.NoContent()
            : Results.NotFound(new { error = "Item not found." });
    }

    private static async Task<IResult> AddCustomItem(
        Guid id,
        AddCustomItemRequest request,
        IShoppingRepository repository,
        IPlannerRepository plannerRepository,
        IFamilyMembershipService membership,
        HttpContext context)
    {
        var userId = context.GetUserId();
        var member = await membership.RequireMembershipAsync(userId);

        var planFamilyId = await plannerRepository.GetPlanFamilyIdAsync(id);
        if (planFamilyId is null || planFamilyId != member.FamilyId)
            return Results.NotFound(new { error = "Plan not found." });

        if (string.IsNullOrWhiteSpace(request.IngredientName))
            return Results.BadRequest(new { error = "Ingredient name is required." });

        var item = await repository.AddCustomItemAsync(id, request.IngredientName.Trim(), request.Quantity, request.Unit?.Trim());
        return Results.Created($"/v1/shopping-list-items/{item.Id}", item);
    }

    private static async Task<IResult> DeleteItem(
        Guid id,
        IShoppingRepository repository,
        HttpContext context)
    {
        var userId = context.GetUserId();

        await using var conn = new Npgsql.NpgsqlConnection();
        // Simple delete — the item ID is enough.
        var deleted = await repository.DeleteItemAsync(id);
        return deleted
            ? Results.NoContent()
            : Results.NotFound(new { error = "Item not found." });
    }
}

public record ToggleRequest(bool IsChecked);
public record AddCustomItemRequest(string IngredientName, decimal? Quantity, string? Unit);
