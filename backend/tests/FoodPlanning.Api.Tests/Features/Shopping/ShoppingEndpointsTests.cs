using FoodPlanning.Api.Features.Families;
using FoodPlanning.Api.Features.Shopping;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using NSubstitute;

namespace FoodPlanning.Api.Tests.Features.Shopping;

/// <summary>
/// Endpoint-level family scoping for shopping list items. The SQL scoping (via the
/// item's weekly plan) is in the repository and is not covered by unit tests.
/// </summary>
public class ShoppingEndpointsTests
{
    private const string UserId = "user-1";

    private readonly Guid _familyId = Guid.NewGuid();
    private readonly Guid _itemId = Guid.NewGuid();
    private readonly IShoppingRepository _repository = Substitute.For<IShoppingRepository>();
    private readonly IFamilyRepository _familyRepository = Substitute.For<IFamilyRepository>();
    private readonly FamilyMembershipService _membership;
    private readonly DefaultHttpContext _context = new();

    public ShoppingEndpointsTests()
    {
        _membership = new FamilyMembershipService(_familyRepository);
        _context.Items["UserId"] = UserId;
        _familyRepository.GetMembershipAsync(UserId).Returns(
            new FamilyMember(Guid.NewGuid(), _familyId, UserId, "Test User", "member", DateTime.UtcNow));
    }

    [Fact]
    public async Task ToggleItem_ShouldScopeToCallersFamily()
    {
        // Arrange
        _repository.ToggleItemAsync(_itemId, _familyId, true, UserId).Returns(true);

        // Act
        var result = await ShoppingEndpoints.ToggleItem(
            _itemId, new ToggleRequest(true), _repository, _membership, _context);

        // Assert
        Assert.IsType<NoContent>(result);
        await _repository.Received(1).ToggleItemAsync(_itemId, _familyId, true, UserId);
    }

    [Fact]
    public async Task ToggleItem_ShouldReturnNotFound_WhenItemIsNotInCallersFamily()
    {
        // Arrange
        _repository.ToggleItemAsync(_itemId, _familyId, true, UserId).Returns(false);

        // Act
        var result = await ShoppingEndpoints.ToggleItem(
            _itemId, new ToggleRequest(true), _repository, _membership, _context);

        // Assert
        Assert.Equal(StatusCodes.Status404NotFound, Assert.IsAssignableFrom<IStatusCodeHttpResult>(result).StatusCode);
    }

    [Fact]
    public async Task ToggleItem_ShouldThrow_WithoutTouchingItems_WhenUserHasNoFamily()
    {
        // Arrange
        _familyRepository.GetMembershipAsync(UserId).Returns((FamilyMember?)null);

        // Act & Assert
        await Assert.ThrowsAsync<FamilyMembershipException>(() => ShoppingEndpoints.ToggleItem(
            _itemId, new ToggleRequest(true), _repository, _membership, _context));
        await _repository.DidNotReceiveWithAnyArgs().ToggleItemAsync(default, default, default, default!);
    }

    [Fact]
    public async Task DeleteItem_ShouldScopeToCallersFamily()
    {
        // Arrange
        _repository.DeleteItemAsync(_itemId, _familyId).Returns(true);

        // Act
        var result = await ShoppingEndpoints.DeleteItem(_itemId, _repository, _membership, _context);

        // Assert
        Assert.IsType<NoContent>(result);
        await _repository.Received(1).DeleteItemAsync(_itemId, _familyId);
    }

    [Fact]
    public async Task DeleteItem_ShouldReturnNotFound_WhenItemIsNotInCallersFamily()
    {
        // Arrange
        _repository.DeleteItemAsync(_itemId, _familyId).Returns(false);

        // Act
        var result = await ShoppingEndpoints.DeleteItem(_itemId, _repository, _membership, _context);

        // Assert
        Assert.Equal(StatusCodes.Status404NotFound, Assert.IsAssignableFrom<IStatusCodeHttpResult>(result).StatusCode);
    }

    [Fact]
    public async Task DeleteItem_ShouldThrow_WithoutTouchingItems_WhenUserHasNoFamily()
    {
        // Arrange
        _familyRepository.GetMembershipAsync(UserId).Returns((FamilyMember?)null);

        // Act & Assert
        await Assert.ThrowsAsync<FamilyMembershipException>(
            () => ShoppingEndpoints.DeleteItem(_itemId, _repository, _membership, _context));
        await _repository.DidNotReceiveWithAnyArgs().DeleteItemAsync(default, default);
    }
}
