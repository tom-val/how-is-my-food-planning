namespace FoodPlanning.Api.Features.Families;

/// <summary>
/// Checks family membership for the current user. Used by all feature
/// endpoints to scope data to the user's family.
/// </summary>
public interface IFamilyMembershipService
{
    Task<FamilyMember> RequireMembershipAsync(string userId);
    Task<FamilyMember> RequireOwnerAsync(string userId, Guid familyId);
}

public class FamilyMembershipService : IFamilyMembershipService
{
    private readonly IFamilyRepository _repository;

    public FamilyMembershipService(IFamilyRepository repository)
    {
        _repository = repository;
    }

    public async Task<FamilyMember> RequireMembershipAsync(string userId)
    {
        var membership = await _repository.GetMembershipAsync(userId);
        if (membership is null)
            throw new FamilyMembershipException("User does not belong to a family.");

        return membership;
    }

    public async Task<FamilyMember> RequireOwnerAsync(string userId, Guid familyId)
    {
        var membership = await RequireMembershipAsync(userId);
        if (membership.FamilyId != familyId || membership.Role != "owner")
            throw new FamilyMembershipException("Only the family owner can perform this action.");

        return membership;
    }
}

public class FamilyMembershipException : Exception
{
    public FamilyMembershipException(string message) : base(message) { }
}
