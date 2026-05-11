using FluentValidation;
using FoodPlanning.Api.Features.Families;
using FoodPlanning.Api.Shared.Extensions;

namespace FoodPlanning.Api.Features.Planner;

public static class PlannerEndpoints
{
    public static void MapPlannerEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/v1/plans");

        group.MapGet("/", GetPlan);
        group.MapPost("/{id:guid}/meals", AddMeal);
        group.MapPost("/{id:guid}/custom-meals", AddCustomMeal);
        group.MapDelete("/{id:guid}/meals/{mealId:guid}", RemoveMeal);
        group.MapPost("/schedule", ScheduleMeal);
        group.MapPatch("/{id:guid}/assign", AssignPlan);
    }

    private static async Task<IResult> GetPlan(
        string weekStart,
        IPlannerRepository repository,
        IFamilyMembershipService membership,
        HttpContext context)
    {
        var userId = context.GetUserId();
        var member = await membership.RequireMembershipAsync(userId);

        if (!DateOnly.TryParse(weekStart, out var date))
            return Results.BadRequest(new { error = "Invalid weekStart date. Use yyyy-MM-dd format." });

        // Ensure it's a Monday.
        if (date.DayOfWeek != System.DayOfWeek.Monday)
            return Results.BadRequest(new { error = "weekStart must be a Monday." });

        var plan = await repository.GetOrCreateAsync(member.FamilyId, date, userId);
        return Results.Ok(plan);
    }

    private static async Task<IResult> AddMeal(
        Guid id,
        AddMealRequest request,
        IValidator<AddMealRequest> validator,
        IPlannerRepository repository,
        IFamilyMembershipService membership,
        HttpContext context)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var userId = context.GetUserId();
        var member = await membership.RequireMembershipAsync(userId);

        var planFamilyId = await repository.GetPlanFamilyIdAsync(id);
        if (planFamilyId is null || planFamilyId != member.FamilyId)
            return Results.NotFound(new { error = "Plan not found." });

        var meal = await repository.AddMealAsync(id, request.DayOfWeek, request.MealType, request.RecipeId, request.IsShadow);
        return Results.Created($"/v1/plans/{id}/meals/{meal.Id}", meal);
    }

    private static async Task<IResult> AddCustomMeal(
        Guid id,
        AddCustomMealRequest request,
        IValidator<AddCustomMealRequest> validator,
        IPlannerRepository repository,
        IFamilyMembershipService membership,
        HttpContext context)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var userId = context.GetUserId();
        var member = await membership.RequireMembershipAsync(userId);

        var planFamilyId = await repository.GetPlanFamilyIdAsync(id);
        if (planFamilyId is null || planFamilyId != member.FamilyId)
            return Results.NotFound(new { error = "Plan not found." });

        var meal = await repository.AddCustomMealAsync(id, request.DayOfWeek, request.MealType, request.CustomName.Trim());
        return Results.Created($"/v1/plans/{id}/meals/{meal.Id}", meal);
    }

    private static async Task<IResult> RemoveMeal(
        Guid id,
        Guid mealId,
        IPlannerRepository repository,
        IFamilyMembershipService membership,
        HttpContext context)
    {
        var userId = context.GetUserId();
        var member = await membership.RequireMembershipAsync(userId);

        var planFamilyId = await repository.GetPlanFamilyIdAsync(id);
        if (planFamilyId is null || planFamilyId != member.FamilyId)
            return Results.NotFound(new { error = "Plan not found." });

        var removed = await repository.RemoveMealAsync(id, mealId);
        return removed
            ? Results.NoContent()
            : Results.NotFound(new { error = "Meal not found." });
    }

    private static async Task<IResult> ScheduleMeal(
        ScheduleMealRequest request,
        IValidator<ScheduleMealRequest> validator,
        IPlannerRepository repository,
        IFamilyMembershipService membership,
        HttpContext context)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var userId = context.GetUserId();
        var member = await membership.RequireMembershipAsync(userId);
        var date = DateOnly.Parse(request.Date);

        var meal = await repository.ScheduleMealAsync(
            member.FamilyId, userId, date, request.MealType, request.RecipeId, request.IsShadow);

        return Results.Created($"/v1/plans/{meal.WeeklyPlanId}/meals/{meal.Id}", meal);
    }

    private static async Task<IResult> AssignPlan(
        Guid id,
        AssignPlanRequest request,
        IPlannerRepository repository,
        IFamilyMembershipService membership,
        HttpContext context)
    {
        var userId = context.GetUserId();
        var member = await membership.RequireMembershipAsync(userId);

        var planFamilyId = await repository.GetPlanFamilyIdAsync(id);
        if (planFamilyId is null || planFamilyId != member.FamilyId)
            return Results.NotFound(new { error = "Plan not found." });

        var plan = await repository.AssignPlanAsync(id, request.AssignedTo, request.AssignedName);
        return Results.Ok(plan);
    }
}

public record AssignPlanRequest(string? AssignedTo, string? AssignedName);
