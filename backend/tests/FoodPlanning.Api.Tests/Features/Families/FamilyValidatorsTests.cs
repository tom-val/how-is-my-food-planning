using FluentValidation.TestHelper;
using FoodPlanning.Api.Features.Families;

namespace FoodPlanning.Api.Tests.Features.Families;

public class CreateFamilyValidatorTests
{
    private readonly CreateFamilyValidator _validator = new();

    [Fact]
    public void ShouldPass_WhenValid()
    {
        var result = _validator.TestValidate(new CreateFamilyRequest("Test Family", "Tomas"));
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("", "Tomas")]
    [InlineData("Family", "")]
    [InlineData("", "")]
    public void ShouldFail_WhenEmpty(string name, string displayName)
    {
        var result = _validator.TestValidate(new CreateFamilyRequest(name, displayName));
        Assert.False(result.IsValid);
    }

    [Fact]
    public void ShouldFail_WhenNameTooLong()
    {
        var result = _validator.TestValidate(new CreateFamilyRequest(new string('a', 101), "Tomas"));
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }
}

public class JoinFamilyValidatorTests
{
    private readonly JoinFamilyValidator _validator = new();

    [Fact]
    public void ShouldPass_WhenValid()
    {
        var result = _validator.TestValidate(new JoinFamilyRequest("abc12345", "Tomas"));
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("", "Tomas")]
    [InlineData("abc123", "")]
    public void ShouldFail_WhenEmpty(string code, string displayName)
    {
        var result = _validator.TestValidate(new JoinFamilyRequest(code, displayName));
        Assert.False(result.IsValid);
    }
}
