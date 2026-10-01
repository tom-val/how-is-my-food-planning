using FoodPlanning.Api.Features.Families;
using FoodPlanning.Api.Features.Planner;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using NSubstitute;

namespace FoodPlanning.Api.Tests.Features.Planner;

/// <summary>
/// Endpoint-level family scoping of the recipe added to a plan. The SQL scoping
/// (the recipe must belong to the family) is in the repository and is not covered
/// by unit tests.
/// </summary>
public class PlannerEndpointsTests
{
    private const string UserId = "user-1";

    private readonly Guid _familyId = Guid.NewGuid();
    private readonly Guid _planId = Guid.NewGuid();
    private readonly Guid _recipeId = Guid.NewGuid();
    private readonly IPlannerRepository _repository = Substitute.For<IPlannerRepository>();
    private readonly IFamilyRepository _familyRepository = Substitute.For<IFamilyRepository>();
    private readonly FamilyMembershipService _membership;
    private readonly DefaultHttpContext _context = new();

    public PlannerEndpointsTests()
    {
        _membership = new FamilyMembershipService(_familyRepository);
        _context.Items["UserId"] = UserId;
        _familyRepository.GetMembershipAsync(UserId).Returns(
            new FamilyMember(Guid.NewGuid(), _familyId, UserId, "Test User", "member", DateTime.UtcNow));
        _repository.GetPlanFamilyIdAsync(_planId).Returns(_familyId);
    }

    [Fact]
    public async Task AddMeal_ShouldScopeRecipeToCallersFamily()
    {
        // Arrange
        var meal = CreateMeal();
        _repository.AddMealAsync(_planId, _familyId, 0, "dinner", _recipeId, false).Returns(meal);

        // Act
        var result = await PlannerEndpoints.AddMeal(
            _planId, new AddMealRequest(0, "dinner", _recipeId), new AddMealValidator(),
            _repository, _membership, _context);

        // Assert
        var created = Assert.IsType<Created<PlannedMeal>>(result);
        Assert.Same(meal, created.Value);
        await _repository.Received(1).AddMealAsync(_planId, _familyId, 0, "dinner", _recipeId, false);
    }

    [Fact]
    public async Task AddMeal_ShouldReturnNotFound_WhenRecipeIsNotInCallersFamily()
    {
        // Arrange
        _repository.AddMealAsync(_planId, _familyId, 0, "dinner", _recipeId, false).Returns((PlannedMeal?)null);

        // Act
        var result = await PlannerEndpoints.AddMeal(
            _planId, new AddMealRequest(0, "dinner", _recipeId), new AddMealValidator(),
            _repository, _membership, _context);

        // Assert
        Assert.Equal(StatusCodes.Status404NotFound, Assert.IsAssignableFrom<IStatusCodeHttpResult>(result).StatusCode);
    }

    [Fact]
    public async Task ScheduleMeal_ShouldScopeRecipeToCallersFamily()
    {
        // Arrange
        var meal = CreateMeal();
        _repository.ScheduleMealAsync(_familyId, UserId, new DateOnly(2026, 10, 1), "dinner", _recipeId, false)
            .Returns(meal);

        // Act
        var result = await PlannerEndpoints.ScheduleMeal(
            new ScheduleMealRequest("2026-10-01", "dinner", _recipeId), new ScheduleMealValidator(),
            _repository, _membership, _context);

        // Assert
        var created = Assert.IsType<Created<PlannedMeal>>(result);
        Assert.Same(meal, created.Value);
    }

    [Fact]
    public async Task ScheduleMeal_ShouldReturnNotFound_WhenRecipeIsNotInCallersFamily()
    {
        // Arrange
        _repository.ScheduleMealAsync(_familyId, UserId, new DateOnly(2026, 10, 1), "dinner", _recipeId, false)
            .Returns((PlannedMeal?)null);

        // Act
        var result = await PlannerEndpoints.ScheduleMeal(
            new ScheduleMealRequest("2026-10-01", "dinner", _recipeId), new ScheduleMealValidator(),
            _repository, _membership, _context);

        // Assert
        Assert.Equal(StatusCodes.Status404NotFound, Assert.IsAssignableFrom<IStatusCodeHttpResult>(result).StatusCode);
    }

    private PlannedMeal CreateMeal() =>
        new(Guid.NewGuid(), _planId, 0, "dinner", _recipeId, "Recipe", false, false);
}
