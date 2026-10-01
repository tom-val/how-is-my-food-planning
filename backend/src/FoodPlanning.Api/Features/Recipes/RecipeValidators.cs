using FluentValidation;

namespace FoodPlanning.Api.Features.Recipes;

public record CreateRecipeRequest(string Name, string? Instructions, string[] Categories, List<IngredientInput> Ingredients);
public record UpdateRecipeRequest(string Name, string? Instructions, string[] Categories, List<IngredientInput> Ingredients);
public record ShareRecipeResponse(string ShareToken);

/// <summary>
/// Result of saving a shared recipe into the caller's family. <see cref="RecipeId"/>
/// is always a recipe in the caller's own family (the new copy, or the original
/// when <see cref="AlreadyOwned"/> is true).
/// </summary>
public record CopySharedRecipeResponse(Guid RecipeId, bool AlreadyOwned);

public class CreateRecipeValidator : AbstractValidator<CreateRecipeRequest>
{
    private static readonly string[] ValidCategories = ["breakfast", "lunch", "dinner", "snack"];

    public CreateRecipeValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Instructions).MaximumLength(5000);
        RuleForEach(x => x.Categories).Must(c => ValidCategories.Contains(c))
            .WithMessage($"Category must be one of: {string.Join(", ", ValidCategories)}.");
        RuleFor(x => x.Ingredients).NotEmpty().WithMessage("At least one ingredient is required.");
        RuleForEach(x => x.Ingredients).ChildRules(ingredient =>
        {
            ingredient.RuleFor(i => i.Name).NotEmpty().MaximumLength(200);
            ingredient.RuleFor(i => i.Quantity).GreaterThan(0).When(i => i.Quantity.HasValue);
            ingredient.RuleFor(i => i.Unit).MaximumLength(50);
        });
    }
}

public class UpdateRecipeValidator : AbstractValidator<UpdateRecipeRequest>
{
    private static readonly string[] ValidCategories = ["breakfast", "lunch", "dinner", "snack"];

    public UpdateRecipeValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Instructions).MaximumLength(5000);
        RuleForEach(x => x.Categories).Must(c => ValidCategories.Contains(c))
            .WithMessage($"Category must be one of: {string.Join(", ", ValidCategories)}.");
        RuleFor(x => x.Ingredients).NotEmpty().WithMessage("At least one ingredient is required.");
        RuleForEach(x => x.Ingredients).ChildRules(ingredient =>
        {
            ingredient.RuleFor(i => i.Name).NotEmpty().MaximumLength(200);
            ingredient.RuleFor(i => i.Quantity).GreaterThan(0).When(i => i.Quantity.HasValue);
            ingredient.RuleFor(i => i.Unit).MaximumLength(50);
        });
    }
}
