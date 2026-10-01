using FoodPlanning.Api.Features.Recipes;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using NSubstitute;

namespace FoodPlanning.Api.Tests.Features.Recipes;

public class PublicRecipeEndpointsTests
{
    private const string ValidToken = "AbCdEfGhIjKlMnOpQrStUv-_";

    private readonly IRecipeRepository _repository = Substitute.For<IRecipeRepository>();

    // A context with no "UserId" item, i.e. an anonymous request. The handler
    // would throw UnauthorizedAccessException if it called GetUserId().
    private readonly DefaultHttpContext _anonymousContext = new();

    [Fact]
    public async Task GetPublicRecipe_ShouldReturnRecipe_WhenTokenIsKnown_WithoutAnyUser()
    {
        // Arrange
        var recipe = new PublicRecipe(
            "Pancakes",
            "Mix.\nFry.",
            ["breakfast"],
            [new PublicRecipeIngredient("Flour", 200, "g")]);
        _repository.GetPublicByShareTokenAsync(ValidToken).Returns(recipe);

        // Act
        var result = await PublicRecipeEndpoints.GetPublicRecipe(ValidToken, _repository, _anonymousContext);

        // Assert
        var ok = Assert.IsType<Ok<PublicRecipe>>(result);
        Assert.Same(recipe, ok.Value);
    }

    [Fact]
    public async Task GetPublicRecipe_ShouldReturnNotFound_WhenTokenIsUnknown()
    {
        // Arrange
        _repository.GetPublicByShareTokenAsync(ValidToken).Returns((PublicRecipe?)null);

        // Act
        var result = await PublicRecipeEndpoints.GetPublicRecipe(ValidToken, _repository, _anonymousContext);

        // Assert
        Assert.Equal(StatusCodes.Status404NotFound, Assert.IsAssignableFrom<IStatusCodeHttpResult>(result).StatusCode);
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-a-token")]
    [InlineData("AbCdEfGhIjKlMnOpQrStUv+/")]
    public async Task GetPublicRecipe_ShouldReturnNotFound_WithoutQuerying_WhenTokenIsMalformed(string token)
    {
        // Act
        var result = await PublicRecipeEndpoints.GetPublicRecipe(token, _repository, _anonymousContext);

        // Assert
        Assert.Equal(StatusCodes.Status404NotFound, Assert.IsAssignableFrom<IStatusCodeHttpResult>(result).StatusCode);
        await _repository.DidNotReceiveWithAnyArgs().GetPublicByShareTokenAsync(default!);
    }

    [Fact]
    public async Task GetPublicRecipe_ShouldDisableCaching_SoRevocationIsImmediate()
    {
        // Arrange
        _repository.GetPublicByShareTokenAsync(ValidToken).Returns((PublicRecipe?)null);

        // Act
        await PublicRecipeEndpoints.GetPublicRecipe(ValidToken, _repository, _anonymousContext);

        // Assert
        Assert.Equal("no-store", _anonymousContext.Response.Headers.CacheControl.ToString());
    }

    [Fact]
    public void PublicRecipe_ShouldOnlyExposePublicSafeFields()
    {
        // Guards against someone later adding ids, family or author data to the public shape.
        var recipeProperties = typeof(PublicRecipe).GetProperties().Select(p => p.Name).Order();
        var ingredientProperties = typeof(PublicRecipeIngredient).GetProperties().Select(p => p.Name).Order();

        Assert.Equal(["Categories", "Ingredients", "Instructions", "Name"], recipeProperties);
        Assert.Equal(["Name", "Quantity", "Unit"], ingredientProperties);
    }
}
