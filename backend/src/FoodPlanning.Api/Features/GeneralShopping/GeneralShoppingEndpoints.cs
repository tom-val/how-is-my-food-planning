using FoodPlanning.Api.Features.Families;
using FoodPlanning.Api.Shared.Extensions;

namespace FoodPlanning.Api.Features.GeneralShopping;

public static class GeneralShoppingEndpoints
{
    public static void MapGeneralShoppingEndpoints(this WebApplication app)
    {
        app.MapGet("/v1/general-shopping", GetList);
        app.MapPost("/v1/general-shopping/items", AddItem);
        app.MapPatch("/v1/general-shopping-items/{id:guid}", ToggleItem);
        app.MapDelete("/v1/general-shopping-items/{id:guid}", DeleteItem);
    }

    private static async Task<IResult> GetList(
        IGeneralShoppingRepository repository,
        IFamilyMembershipService membership,
        HttpContext context)
    {
        var userId = context.GetUserId();
        var member = await membership.RequireMembershipAsync(userId);

        var items = await repository.GetByFamilyIdAsync(member.FamilyId);
        return Results.Ok(items);
    }

    private static async Task<IResult> AddItem(
        AddGeneralItemRequest request,
        IGeneralShoppingRepository repository,
        IFamilyMembershipService membership,
        HttpContext context)
    {
        var userId = context.GetUserId();
        var member = await membership.RequireMembershipAsync(userId);

        if (string.IsNullOrWhiteSpace(request.ItemName))
            return Results.BadRequest(new { error = "Item name is required." });

        var item = await repository.AddItemAsync(
            member.FamilyId, request.ItemName.Trim(), request.Quantity, request.Unit?.Trim(), userId);
        return Results.Created($"/v1/general-shopping-items/{item.Id}", item);
    }

    private static async Task<IResult> ToggleItem(
        Guid id,
        ToggleGeneralItemRequest request,
        IGeneralShoppingRepository repository,
        IFamilyMembershipService membership,
        HttpContext context)
    {
        var userId = context.GetUserId();
        var member = await membership.RequireMembershipAsync(userId);

        var updated = await repository.ToggleItemAsync(id, member.FamilyId, request.IsChecked, userId);
        return updated
            ? Results.NoContent()
            : Results.NotFound(new { error = "Item not found." });
    }

    private static async Task<IResult> DeleteItem(
        Guid id,
        IGeneralShoppingRepository repository,
        IFamilyMembershipService membership,
        HttpContext context)
    {
        var userId = context.GetUserId();
        var member = await membership.RequireMembershipAsync(userId);

        var deleted = await repository.DeleteItemAsync(id, member.FamilyId);
        return deleted
            ? Results.NoContent()
            : Results.NotFound(new { error = "Item not found." });
    }
}

public record AddGeneralItemRequest(string ItemName, decimal? Quantity, string? Unit);
public record ToggleGeneralItemRequest(bool IsChecked);
