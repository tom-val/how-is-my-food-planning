using FluentValidation;

namespace FoodPlanning.Api.Features.Planner;

public record AddMealRequest(int DayOfWeek, string MealType, Guid RecipeId, bool IsShadow = false);

public record ScheduleMealRequest(string Date, string MealType, Guid RecipeId, bool IsShadow = false);

public class AddMealValidator : AbstractValidator<AddMealRequest>
{
    private static readonly string[] ValidMealTypes = ["breakfast", "lunch", "dinner", "snack"];

    public AddMealValidator()
    {
        RuleFor(x => x.DayOfWeek).InclusiveBetween(0, 6);
        RuleFor(x => x.MealType).Must(t => ValidMealTypes.Contains(t))
            .WithMessage($"Meal type must be one of: {string.Join(", ", ValidMealTypes)}.");
        RuleFor(x => x.RecipeId).NotEmpty();
    }
}

public class ScheduleMealValidator : AbstractValidator<ScheduleMealRequest>
{
    private static readonly string[] ValidMealTypes = ["breakfast", "lunch", "dinner", "snack"];

    public ScheduleMealValidator()
    {
        RuleFor(x => x.Date).NotEmpty()
            .Must(d => DateOnly.TryParse(d, out _))
            .WithMessage("Date must be a valid yyyy-MM-dd format.");
        RuleFor(x => x.MealType).Must(t => ValidMealTypes.Contains(t))
            .WithMessage($"Meal type must be one of: {string.Join(", ", ValidMealTypes)}.");
        RuleFor(x => x.RecipeId).NotEmpty();
    }
}
