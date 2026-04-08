using FluentValidation;

namespace FoodPlanning.Api.Features.Planner;

public record AddMealRequest(int DayOfWeek, string MealType, Guid RecipeId);

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
