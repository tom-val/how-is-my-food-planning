using System.Buffers.Text;
using FoodPlanning.Api.Features.Recipes;

namespace FoodPlanning.Api.Tests.Features.Recipes;

public class RecipeShareTokensTests
{
    [Fact]
    public void Generate_ShouldReturnUrlSafeTokenOfExpectedLength()
    {
        var token = RecipeShareTokens.Generate();

        Assert.Equal(RecipeShareTokens.TokenLength, token.Length);
        Assert.Matches("^[A-Za-z0-9_-]+$", token);
    }

    [Fact]
    public void Generate_ShouldEncodeAtLeast128BitsOfRandomness()
    {
        var token = RecipeShareTokens.Generate();

        var bytes = Base64Url.DecodeFromChars(token);
        Assert.True(bytes.Length * 8 >= 128);
        Assert.Equal(RecipeShareTokens.ByteLength, bytes.Length);
    }

    [Fact]
    public void Generate_ShouldProduceTokensThatPassFormatValidation()
    {
        for (var i = 0; i < 100; i++)
            Assert.True(RecipeShareTokens.IsValidFormat(RecipeShareTokens.Generate()));
    }

    [Fact]
    public void Generate_ShouldNotRepeatTokens()
    {
        var tokens = Enumerable.Range(0, 1000).Select(_ => RecipeShareTokens.Generate()).ToHashSet();

        Assert.Equal(1000, tokens.Count);
    }

    [Theory]
    [InlineData("AbCdEfGhIjKlMnOpQrStUv-_")]
    [InlineData("000000000000000000000000")]
    [InlineData("________________________")]
    public void IsValidFormat_ShouldAccept_WhenWellFormed(string token)
    {
        Assert.True(RecipeShareTokens.IsValidFormat(token));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("short")]
    [InlineData("AbCdEfGhIjKlMnOpQrStUv-")] // 23 characters
    [InlineData("AbCdEfGhIjKlMnOpQrStUv-_x")] // 25 characters
    [InlineData("AbCdEfGhIjKlMnOpQrStUv+/")] // standard base64 alphabet, not URL-safe
    [InlineData("AbCdEfGhIjKlMnOpQrStUv==")] // padding
    [InlineData("AbCdEfGhIjKlMnOpQrStU%2F")] // percent-encoding
    [InlineData("../../../../v1/recipes/x")] // path traversal attempt
    [InlineData("AbCdEfGhIjKlMnOpQrStUvw ")] // trailing whitespace
    [InlineData("AbCdEfGhIjKlMnOpQrStUvwž")] // non-ASCII letter
    [InlineData("' OR 1=1 --xxxxxxxxxxxxx")] // SQL-ish input
    public void IsValidFormat_ShouldReject_WhenMalformed(string? token)
    {
        Assert.False(RecipeShareTokens.IsValidFormat(token));
    }
}
