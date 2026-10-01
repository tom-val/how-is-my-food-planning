using FluentValidation;

namespace FoodPlanning.Api.Features.ShoppingCategories;

public record SaveShoppingCategoryRequest(string Name);
public record ReorderShoppingCategoriesRequest(List<Guid> Ids);
public record AssignShoppingCategoryRequest(string ItemName, Guid? CategoryId);
public record AiSortShoppingCategoriesRequest(string List, Guid? PlanId);

public static class ShoppingCategoryLimits
{
    public const int MaxNameLength = 50;
    public const int MaxCategoriesPerFamily = 30;
    public const int MinCategoriesForAiSort = 3;
    public const int MaxItemsPerAiSort = 300;

    // Generous, as existing shopping item names have no length limit; this only
    // keeps item keys well within the B-tree index entry size limit.
    public const int MaxItemNameLength = 500;
}

/// <summary>
/// Shared by create and rename. The name is validated after trimming, as that is
/// what gets stored.
/// </summary>
public class SaveShoppingCategoryValidator : AbstractValidator<SaveShoppingCategoryRequest>
{
    public SaveShoppingCategoryValidator()
    {
        RuleFor(x => x.Name)
            .Cascade(CascadeMode.Stop)
            .Must(n => !string.IsNullOrWhiteSpace(n))
            .WithMessage("Category name is required.")
            .Must(n => n.Trim().Length <= ShoppingCategoryLimits.MaxNameLength)
            .WithMessage($"Category name must be {ShoppingCategoryLimits.MaxNameLength} characters or fewer.");
    }
}

public class ReorderShoppingCategoriesValidator : AbstractValidator<ReorderShoppingCategoriesRequest>
{
    public ReorderShoppingCategoriesValidator()
    {
        RuleFor(x => x.Ids)
            .Cascade(CascadeMode.Stop)
            .NotNull()
            .Must(ids => ids.Count <= ShoppingCategoryLimits.MaxCategoriesPerFamily)
            .WithMessage($"At most {ShoppingCategoryLimits.MaxCategoriesPerFamily} categories can be ordered.")
            .Must(ids => ids.Distinct().Count() == ids.Count)
            .WithMessage("Category ids must be unique.");
        RuleForEach(x => x.Ids).NotEmpty();
    }
}

public class AssignShoppingCategoryValidator : AbstractValidator<AssignShoppingCategoryRequest>
{
    public AssignShoppingCategoryValidator()
    {
        RuleFor(x => x.ItemName)
            .Cascade(CascadeMode.Stop)
            .Must(n => !string.IsNullOrWhiteSpace(n))
            .WithMessage("Item name is required.")
            .MaximumLength(ShoppingCategoryLimits.MaxItemNameLength);
        RuleFor(x => x.CategoryId)
            .NotEqual(Guid.Empty)
            .When(x => x.CategoryId.HasValue);
    }
}

public class AiSortShoppingCategoriesValidator : AbstractValidator<AiSortShoppingCategoriesRequest>
{
    public const string Weekly = "weekly";
    public const string General = "general";

    public AiSortShoppingCategoriesValidator()
    {
        RuleFor(x => x.List)
            .Must(l => l is Weekly or General)
            .WithMessage($"List must be one of: {Weekly}, {General}.");
        RuleFor(x => x.PlanId)
            .Must(id => id.HasValue && id.Value != Guid.Empty)
            .When(x => x.List == Weekly)
            .WithMessage("Plan id is required for the weekly list.");
    }
}
