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
        app.MapPatch("/v1/shopping-list-items/{id:guid}", ToggleItem);
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

        return Results.Ok(items);
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
        return Results.Ok(items);
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
}

public record ToggleRequest(bool IsChecked);
