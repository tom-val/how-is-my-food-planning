using FluentValidation.TestHelper;
using FoodPlanning.Api.Features.ShoppingCategories;

namespace FoodPlanning.Api.Tests.Features.ShoppingCategories;

public class SaveShoppingCategoryValidatorTests
{
    private readonly SaveShoppingCategoryValidator _validator = new();

    [Theory]
    [InlineData("Dairy")]
    [InlineData("Pieno produktai")]
    [InlineData("a")]
    public void ShouldPass_WhenValid(string name)
    {
        var result = _validator.TestValidate(new SaveShoppingCategoryRequest(name));
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("\t")]
    [InlineData(null)]
    public void ShouldFail_WhenEmpty(string? name)
    {
        var result = _validator.TestValidate(new SaveShoppingCategoryRequest(name!));
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void ShouldPass_WhenExactlyMaxLength()
    {
        var result = _validator.TestValidate(new SaveShoppingCategoryRequest(new string('a', 50)));
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void ShouldFail_WhenNameTooLong()
    {
        var result = _validator.TestValidate(new SaveShoppingCategoryRequest(new string('a', 51)));
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void ShouldPass_WhenTooLongOnlyBecauseOfSurroundingWhitespace()
    {
        var result = _validator.TestValidate(new SaveShoppingCategoryRequest($"  {new string('a', 50)}  "));
        result.ShouldNotHaveAnyValidationErrors();
    }
}

public class ReorderShoppingCategoriesValidatorTests
{
    private readonly ReorderShoppingCategoriesValidator _validator = new();

    [Fact]
    public void ShouldPass_WhenValid()
    {
        var request = new ReorderShoppingCategoriesRequest([Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()]);

        var result = _validator.TestValidate(request);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void ShouldPass_WhenEmpty()
    {
        var result = _validator.TestValidate(new ReorderShoppingCategoriesRequest([]));
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void ShouldFail_WhenNull()
    {
        var result = _validator.TestValidate(new ReorderShoppingCategoriesRequest(null!));
        result.ShouldHaveValidationErrorFor(x => x.Ids);
    }

    [Fact]
    public void ShouldFail_WhenDuplicateIds()
    {
        var id = Guid.NewGuid();
        var result = _validator.TestValidate(new ReorderShoppingCategoriesRequest([id, Guid.NewGuid(), id]));
        result.ShouldHaveValidationErrorFor(x => x.Ids);
    }

    [Fact]
    public void ShouldFail_WhenEmptyGuid()
    {
        var result = _validator.TestValidate(new ReorderShoppingCategoriesRequest([Guid.NewGuid(), Guid.Empty]));
        Assert.False(result.IsValid);
    }

    [Fact]
    public void ShouldFail_WhenTooManyIds()
    {
        var ids = Enumerable.Range(0, 31).Select(_ => Guid.NewGuid()).ToList();

        var result = _validator.TestValidate(new ReorderShoppingCategoriesRequest(ids));
        result.ShouldHaveValidationErrorFor(x => x.Ids);
    }
}

public class AssignShoppingCategoryValidatorTests
{
    private readonly AssignShoppingCategoryValidator _validator = new();

    [Fact]
    public void ShouldPass_WhenAssigning()
    {
        var result = _validator.TestValidate(new AssignShoppingCategoryRequest("Pienas", Guid.NewGuid()));
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void ShouldPass_WhenClearing()
    {
        var result = _validator.TestValidate(new AssignShoppingCategoryRequest("Pienas", null));
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void ShouldFail_WhenItemNameEmpty(string? itemName)
    {
        var result = _validator.TestValidate(new AssignShoppingCategoryRequest(itemName!, Guid.NewGuid()));
        result.ShouldHaveValidationErrorFor(x => x.ItemName);
    }

    [Fact]
    public void ShouldFail_WhenItemNameTooLong()
    {
        var result = _validator.TestValidate(new AssignShoppingCategoryRequest(new string('a', 501), Guid.NewGuid()));
        result.ShouldHaveValidationErrorFor(x => x.ItemName);
    }

    [Fact]
    public void ShouldFail_WhenCategoryIdEmptyGuid()
    {
        var result = _validator.TestValidate(new AssignShoppingCategoryRequest("Pienas", Guid.Empty));
        result.ShouldHaveValidationErrorFor(x => x.CategoryId);
    }
}

public class AiSortShoppingCategoriesValidatorTests
{
    private readonly AiSortShoppingCategoriesValidator _validator = new();

    [Fact]
    public void ShouldPass_WhenWeeklyWithPlanId()
    {
        var result = _validator.TestValidate(new AiSortShoppingCategoriesRequest("weekly", Guid.NewGuid()));
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void ShouldPass_WhenGeneralWithoutPlanId()
    {
        var result = _validator.TestValidate(new AiSortShoppingCategoriesRequest("general", null));
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void ShouldFail_WhenWeeklyWithoutPlanId()
    {
        var result = _validator.TestValidate(new AiSortShoppingCategoriesRequest("weekly", null));
        result.ShouldHaveValidationErrorFor(x => x.PlanId);
    }

    [Fact]
    public void ShouldFail_WhenWeeklyWithEmptyPlanId()
    {
        var result = _validator.TestValidate(new AiSortShoppingCategoriesRequest("weekly", Guid.Empty));
        result.ShouldHaveValidationErrorFor(x => x.PlanId);
    }

    [Theory]
    [InlineData("")]
    [InlineData("Weekly")]
    [InlineData("monthly")]
    [InlineData(null)]
    public void ShouldFail_WhenListInvalid(string? list)
    {
        var result = _validator.TestValidate(new AiSortShoppingCategoriesRequest(list!, Guid.NewGuid()));
        result.ShouldHaveValidationErrorFor(x => x.List);
    }
}
