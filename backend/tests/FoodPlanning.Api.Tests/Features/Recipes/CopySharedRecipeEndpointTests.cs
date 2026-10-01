using FoodPlanning.Api.Features.Families;
using FoodPlanning.Api.Features.Recipes;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using NSubstitute;

namespace FoodPlanning.Api.Tests.Features.Recipes;

/// <summary>
/// Endpoint-level behaviour of "save a shared recipe to my recipes"
/// (POST /v1/recipes/shared/{token}/copy). The copy itself (SQL, transaction,
/// same-family detection) is in the repository and is not covered here.
/// </summary>
public class CopySharedRecipeEndpointTests
{
    private const string UserId = "user-1";
    private const string ValidToken = "AbCdEfGhIjKlMnOpQrStUv-_";

    private readonly Guid _familyId = Guid.NewGuid();
    private readonly IRecipeRepository _repository = Substitute.For<IRecipeRepository>();
    private readonly IFamilyRepository _familyRepository = Substitute.For<IFamilyRepository>();
    private readonly FamilyMembershipService _membership;
    private readonly DefaultHttpContext _context = new();

    public CopySharedRecipeEndpointTests()
    {
        _membership = new FamilyMembershipService(_familyRepository);
        _context.Items["UserId"] = UserId;
        _familyRepository.GetMembershipAsync(UserId).Returns(
            new FamilyMember(Guid.NewGuid(), _familyId, UserId, "Test User", "member", DateTime.UtcNow));
    }

    [Fact]
    public async Task CopySharedRecipe_ShouldReturnCreated_WithNewRecipeId_ForCallersFamilyAndUser()
    {
        // Arrange
        var newRecipeId = Guid.NewGuid();
        _repository.CopySharedAsync(ValidToken, _familyId, UserId)
            .Returns(new SharedRecipeCopy(newRecipeId, AlreadyOwned: false));

        // Act
        var result = await RecipeEndpoints.CopySharedRecipe(ValidToken, _repository, _membership, _context);

        // Assert
        var created = Assert.IsType<Created<CopySharedRecipeResponse>>(result);
        Assert.Equal(new CopySharedRecipeResponse(newRecipeId, AlreadyOwned: false), created.Value);
        Assert.Equal($"/v1/recipes/{newRecipeId}", created.Location);
        await _repository.Received(1).CopySharedAsync(ValidToken, _familyId, UserId);
    }

    [Fact]
    public async Task CopySharedRecipe_ShouldReturnOk_WithExistingRecipe_WhenAlreadyInCallersFamily()
    {
        // Arrange
        var ownRecipeId = Guid.NewGuid();
        _repository.CopySharedAsync(ValidToken, _familyId, UserId)
            .Returns(new SharedRecipeCopy(ownRecipeId, AlreadyOwned: true));

        // Act
        var result = await RecipeEndpoints.CopySharedRecipe(ValidToken, _repository, _membership, _context);

        // Assert
        var ok = Assert.IsType<Ok<CopySharedRecipeResponse>>(result);
        Assert.Equal(new CopySharedRecipeResponse(ownRecipeId, AlreadyOwned: true), ok.Value);
    }

    [Fact]
    public async Task CopySharedRecipe_ShouldReturnNotFound_WhenNoRecipeIsSharedUnderToken()
    {
        // Arrange: unknown or revoked token.
        _repository.CopySharedAsync(ValidToken, _familyId, UserId).Returns((SharedRecipeCopy?)null);

        // Act
        var result = await RecipeEndpoints.CopySharedRecipe(ValidToken, _repository, _membership, _context);

        // Assert
        Assert.Equal(StatusCodes.Status404NotFound, Assert.IsAssignableFrom<IStatusCodeHttpResult>(result).StatusCode);
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-a-token")]
    [InlineData("AbCdEfGhIjKlMnOpQrStUv+/")]
    [InlineData("AbCdEfGhIjKlMnOpQrStUv-_x")]
    public async Task CopySharedRecipe_ShouldReturnNotFound_WithoutQuerying_WhenTokenIsMalformed(string token)
    {
        // Act
        var result = await RecipeEndpoints.CopySharedRecipe(token, _repository, _membership, _context);

        // Assert
        Assert.Equal(StatusCodes.Status404NotFound, Assert.IsAssignableFrom<IStatusCodeHttpResult>(result).StatusCode);
        Assert.Empty(_repository.ReceivedCalls());
    }

    [Fact]
    public async Task CopySharedRecipe_ShouldThrow_WithoutCopying_WhenUserHasNoFamily()
    {
        // Arrange
        _familyRepository.GetMembershipAsync(UserId).Returns((FamilyMember?)null);

        // Act & Assert
        await Assert.ThrowsAsync<FamilyMembershipException>(
            () => RecipeEndpoints.CopySharedRecipe(ValidToken, _repository, _membership, _context));
        Assert.Empty(_repository.ReceivedCalls());
    }

    [Fact]
    public async Task CopySharedRecipe_ShouldThrow_WhenRequestHasNoUser()
    {
        // Act & Assert: an anonymous request must fail closed (401 via middleware).
        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => RecipeEndpoints.CopySharedRecipe(ValidToken, _repository, _membership, new DefaultHttpContext()));
        Assert.Empty(_repository.ReceivedCalls());
    }

    [Fact]
    public void CopySharedRecipeResponse_ShouldOnlyExposeRecipeIdAndAlreadyOwned()
    {
        // Guards against someone later returning the source family, author or share token.
        var properties = typeof(CopySharedRecipeResponse).GetProperties().Select(p => p.Name).Order();

        Assert.Equal(["AlreadyOwned", "RecipeId"], properties);
    }
}
