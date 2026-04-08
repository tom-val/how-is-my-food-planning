using FoodPlanning.Api.Features.Families;
using NSubstitute;

namespace FoodPlanning.Api.Tests.Features.Families;

public class FamilyMembershipServiceTests
{
    private readonly IFamilyRepository _repository = Substitute.For<IFamilyRepository>();
    private readonly FamilyMembershipService _service;

    public FamilyMembershipServiceTests()
    {
        _service = new FamilyMembershipService(_repository);
    }

    [Fact]
    public async Task RequireMembership_ShouldReturnMember_WhenUserBelongsToFamily()
    {
        // Arrange
        var member = CreateMember("user-1", "owner");
        _repository.GetMembershipAsync("user-1").Returns(member);

        // Act
        var result = await _service.RequireMembershipAsync("user-1");

        // Assert
        Assert.Equal("user-1", result.UserId);
    }

    [Fact]
    public async Task RequireMembership_ShouldThrow_WhenUserHasNoFamily()
    {
        // Arrange
        _repository.GetMembershipAsync("user-2").Returns((FamilyMember?)null);

        // Act & Assert
        await Assert.ThrowsAsync<FamilyMembershipException>(
            () => _service.RequireMembershipAsync("user-2"));
    }

    [Fact]
    public async Task RequireOwner_ShouldReturnMember_WhenUserIsOwner()
    {
        // Arrange
        var familyId = Guid.NewGuid();
        var member = CreateMember("user-1", "owner", familyId);
        _repository.GetMembershipAsync("user-1").Returns(member);

        // Act
        var result = await _service.RequireOwnerAsync("user-1", familyId);

        // Assert
        Assert.Equal("owner", result.Role);
    }

    [Fact]
    public async Task RequireOwner_ShouldThrow_WhenUserIsNotOwner()
    {
        // Arrange
        var familyId = Guid.NewGuid();
        var member = CreateMember("user-1", "member", familyId);
        _repository.GetMembershipAsync("user-1").Returns(member);

        // Act & Assert
        await Assert.ThrowsAsync<FamilyMembershipException>(
            () => _service.RequireOwnerAsync("user-1", familyId));
    }

    [Fact]
    public async Task RequireOwner_ShouldThrow_WhenUserBelongsToDifferentFamily()
    {
        // Arrange
        var member = CreateMember("user-1", "owner", Guid.NewGuid());
        _repository.GetMembershipAsync("user-1").Returns(member);

        // Act & Assert
        await Assert.ThrowsAsync<FamilyMembershipException>(
            () => _service.RequireOwnerAsync("user-1", Guid.NewGuid()));
    }

    private static FamilyMember CreateMember(
        string userId,
        string role,
        Guid? familyId = null) => new(
        Guid.NewGuid(),
        familyId ?? Guid.NewGuid(),
        userId,
        "Test User",
        role,
        DateTime.UtcNow);
}
