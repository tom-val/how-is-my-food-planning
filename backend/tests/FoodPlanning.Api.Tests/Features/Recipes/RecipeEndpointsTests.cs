using FoodPlanning.Api.Features.Families;
using FoodPlanning.Api.Features.Recipes;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using NSubstitute;

namespace FoodPlanning.Api.Tests.Features.Recipes;

/// <summary>
/// Endpoint-level family scoping for AI recipe jobs. The SQL scoping (family and
/// job type) is in the repository and is not covered by unit tests.
/// </summary>
public class RecipeEndpointsTests
{
    private const string UserId = "user-1";

    private readonly Guid _familyId = Guid.NewGuid();
    private readonly Guid _jobId = Guid.NewGuid();
    private readonly IAiRecipeJobRepository _jobRepository = Substitute.For<IAiRecipeJobRepository>();
    private readonly IFamilyRepository _familyRepository = Substitute.For<IFamilyRepository>();
    private readonly FamilyMembershipService _membership;
    private readonly DefaultHttpContext _context = new();

    public RecipeEndpointsTests()
    {
        _membership = new FamilyMembershipService(_familyRepository);
        _context.Items["UserId"] = UserId;
        _familyRepository.GetMembershipAsync(UserId).Returns(
            new FamilyMember(Guid.NewGuid(), _familyId, UserId, "Test User", "member", DateTime.UtcNow));
    }

    [Fact]
    public async Task AiPoll_ShouldReturnJob_ScopedToCallersFamily()
    {
        // Arrange
        var job = new AiRecipeJob(_jobId, "pending", null, null);
        _jobRepository.GetJobAsync(_jobId, _familyId).Returns(job);

        // Act
        var result = await RecipeEndpoints.AiPoll(_jobId, _jobRepository, _membership, _context);

        // Assert
        var ok = Assert.IsType<Ok<AiRecipeJob>>(result);
        Assert.Same(job, ok.Value);
        await _jobRepository.Received(1).GetJobAsync(_jobId, _familyId);
    }

    [Fact]
    public async Task AiPoll_ShouldReturnNotFound_WhenJobIsNotInCallersFamily()
    {
        // Arrange
        _jobRepository.GetJobAsync(_jobId, _familyId).Returns((AiRecipeJob?)null);

        // Act
        var result = await RecipeEndpoints.AiPoll(_jobId, _jobRepository, _membership, _context);

        // Assert
        Assert.Equal(StatusCodes.Status404NotFound, Assert.IsAssignableFrom<IStatusCodeHttpResult>(result).StatusCode);
    }

    [Fact]
    public async Task AiPoll_ShouldThrow_WithoutReadingJobs_WhenUserHasNoFamily()
    {
        // Arrange
        _familyRepository.GetMembershipAsync(UserId).Returns((FamilyMember?)null);

        // Act & Assert
        await Assert.ThrowsAsync<FamilyMembershipException>(
            () => RecipeEndpoints.AiPoll(_jobId, _jobRepository, _membership, _context));
        await _jobRepository.DidNotReceiveWithAnyArgs().GetJobAsync(default, default);
    }
}
