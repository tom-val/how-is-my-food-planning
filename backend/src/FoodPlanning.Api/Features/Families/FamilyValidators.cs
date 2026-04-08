using FluentValidation;

namespace FoodPlanning.Api.Features.Families;

public record CreateFamilyRequest(string Name, string DisplayName);
public record JoinFamilyRequest(string InviteCode, string DisplayName);

public class CreateFamilyValidator : AbstractValidator<CreateFamilyRequest>
{
    public CreateFamilyValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.DisplayName).NotEmpty().MaximumLength(100);
    }
}

public class JoinFamilyValidator : AbstractValidator<JoinFamilyRequest>
{
    public JoinFamilyValidator()
    {
        RuleFor(x => x.InviteCode).NotEmpty().MaximumLength(20);
        RuleFor(x => x.DisplayName).NotEmpty().MaximumLength(100);
    }
}
