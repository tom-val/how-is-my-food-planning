using FluentValidation.TestHelper;
using FoodPlanning.Api.Features.Recipes;

namespace FoodPlanning.Api.Tests.Features.Recipes;

public class CreateRecipeValidatorTests
{
    private readonly CreateRecipeValidator _validator = new();

    [Fact]
    public void ShouldPass_WhenValid()
    {
        var request = new CreateRecipeRequest(
            "Pancakes",
            "Mix and fry.",
            ["breakfast"],
            [new IngredientInput("Flour", 200, "g")]);

        var result = _validator.TestValidate(request);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void ShouldPass_WhenNoCategories()
    {
        var request = new CreateRecipeRequest(
            "Pancakes",
            null,
            [],
            [new IngredientInput("Flour", null, null)]);

        var result = _validator.TestValidate(request);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void ShouldFail_WhenNameEmpty()
    {
        var request = new CreateRecipeRequest(
            "",
            null,
            [],
            [new IngredientInput("Flour", 200, "g")]);

        var result = _validator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void ShouldFail_WhenNoIngredients()
    {
        var request = new CreateRecipeRequest("Pancakes", null, [], []);

        var result = _validator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(x => x.Ingredients);
    }

    [Fact]
    public void ShouldFail_WhenIngredientNameEmpty()
    {
        var request = new CreateRecipeRequest(
            "Pancakes",
            null,
            [],
            [new IngredientInput("", 200, "g")]);

        var result = _validator.TestValidate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void ShouldFail_WhenQuantityNegative()
    {
        var request = new CreateRecipeRequest(
            "Pancakes",
            null,
            [],
            [new IngredientInput("Flour", -1, "g")]);

        var result = _validator.TestValidate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void ShouldFail_WhenCategoryInvalid()
    {
        var request = new CreateRecipeRequest(
            "Pancakes",
            null,
            ["brunch"],
            [new IngredientInput("Flour", 200, "g")]);

        var result = _validator.TestValidate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void ShouldPass_WhenMultipleCategories()
    {
        var request = new CreateRecipeRequest(
            "Pancakes",
            null,
            ["breakfast", "snack"],
            [new IngredientInput("Flour", 200, "g")]);

        var result = _validator.TestValidate(request);
        result.ShouldNotHaveAnyValidationErrors();
    }
}
