using FluentValidation;
using FoodPlanning.Api.Shared.Extensions;

namespace FoodPlanning.Api.Features.Families;

public static class FamilyEndpoints
{
    public static void MapFamilyEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/v1/families");

        group.MapPost("/", CreateFamily);
        group.MapGet("/my", GetMyFamily);
        group.MapPost("/join", JoinFamily);
        group.MapGet("/{id:guid}/members", GetMembers);
        group.MapPost("/{id:guid}/regenerate-code", RegenerateCode);
        group.MapDelete("/{id:guid}/members/{userId}", RemoveMember);
        group.MapPost("/leave", LeaveFamily);
    }

    private static async Task<IResult> CreateFamily(
        CreateFamilyRequest request,
        IValidator<CreateFamilyRequest> validator,
        IFamilyRepository repository,
        HttpContext context)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var userId = context.GetUserId();

        // Check user doesn't already belong to a family.
        var existing = await repository.GetMembershipAsync(userId);
        if (existing is not null)
            return Results.Conflict(new { error = "User already belongs to a family." });

        var family = await repository.CreateAsync(request.Name, userId, request.DisplayName);
        return Results.Created($"/v1/families/{family.Id}", family);
    }

    private static async Task<IResult> GetMyFamily(
        IFamilyRepository repository,
        HttpContext context)
    {
        var userId = context.GetUserId();
        var result = await repository.GetByUserIdAsync(userId);

        return result is null
            ? Results.NotFound(new { error = "User does not belong to a family." })
            : Results.Ok(result);
    }

    private static async Task<IResult> JoinFamily(
        JoinFamilyRequest request,
        IValidator<JoinFamilyRequest> validator,
        IFamilyRepository repository,
        HttpContext context)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var userId = context.GetUserId();

        // Check user doesn't already belong to a family.
        var existing = await repository.GetMembershipAsync(userId);
        if (existing is not null)
            return Results.Conflict(new { error = "User already belongs to a family." });

        var family = await repository.GetByInviteCodeAsync(request.InviteCode);
        if (family is null)
            return Results.NotFound(new { error = "Invalid invite code." });

        var member = await repository.JoinAsync(family.Id, userId, request.DisplayName);
        return Results.Ok(member);
    }

    private static async Task<IResult> GetMembers(
        Guid id,
        IFamilyRepository repository,
        IFamilyMembershipService membership,
        HttpContext context)
    {
        var userId = context.GetUserId();
        var member = await membership.RequireMembershipAsync(userId);

        if (member.FamilyId != id)
            return Results.Forbid();

        var members = await repository.GetMembersAsync(id);
        return Results.Ok(members);
    }

    private static async Task<IResult> RegenerateCode(
        Guid id,
        IFamilyRepository repository,
        IFamilyMembershipService membership,
        HttpContext context)
    {
        var userId = context.GetUserId();
        await membership.RequireOwnerAsync(userId, id);

        var newCode = await repository.RegenerateInviteCodeAsync(id);
        return Results.Ok(new { inviteCode = newCode });
    }

    private static async Task<IResult> RemoveMember(
        Guid id,
        string userId,
        IFamilyRepository repository,
        IFamilyMembershipService membership,
        HttpContext context)
    {
        var currentUserId = context.GetUserId();
        await membership.RequireOwnerAsync(currentUserId, id);

        var removed = await repository.RemoveMemberAsync(id, userId);
        return removed
            ? Results.NoContent()
            : Results.NotFound(new { error = "Member not found or cannot remove owner." });
    }

    private static async Task<IResult> LeaveFamily(
        IFamilyRepository repository,
        HttpContext context)
    {
        var userId = context.GetUserId();
        var membership = await repository.GetMembershipAsync(userId);

        if (membership is null)
            return Results.NotFound(new { error = "User does not belong to a family." });

        await repository.LeaveAsync(membership.FamilyId, userId);
        return Results.NoContent();
    }
}
