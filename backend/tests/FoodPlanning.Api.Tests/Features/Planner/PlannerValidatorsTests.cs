using FluentValidation.TestHelper;
using FoodPlanning.Api.Features.Planner;

namespace FoodPlanning.Api.Tests.Features.Planner;

public class AddMealValidatorTests
{
    private readonly AddMealValidator _validator = new();

    [Theory]
    [InlineData(0, "breakfast")]
    [InlineData(6, "dinner")]
    [InlineData(3, "snack")]
    [InlineData(1, "lunch")]
    public void ShouldPass_WhenValid(int dayOfWeek, string mealType)
    {
        var request = new AddMealRequest(dayOfWeek, mealType, Guid.NewGuid());
        var result = _validator.TestValidate(request);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(7)]
    public void ShouldFail_WhenDayOfWeekOutOfRange(int dayOfWeek)
    {
        var request = new AddMealRequest(dayOfWeek, "breakfast", Guid.NewGuid());
        var result = _validator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(x => x.DayOfWeek);
    }

    [Theory]
    [InlineData("brunch")]
    [InlineData("")]
    [InlineData("supper")]
    public void ShouldFail_WhenMealTypeInvalid(string mealType)
    {
        var request = new AddMealRequest(0, mealType, Guid.NewGuid());
        var result = _validator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(x => x.MealType);
    }

    [Fact]
    public void ShouldFail_WhenRecipeIdEmpty()
    {
        var request = new AddMealRequest(0, "breakfast", Guid.Empty);
        var result = _validator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(x => x.RecipeId);
    }
}
