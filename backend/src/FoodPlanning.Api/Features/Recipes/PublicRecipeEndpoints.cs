using FoodPlanning.Api.Shared.Middleware;

namespace FoodPlanning.Api.Features.Recipes;

/// <summary>
/// Anonymous, read-only endpoints for publicly shared recipes.
///
/// Everything under <see cref="AuthorizerContextMiddleware.PublicPathPrefix"/> is
/// reachable without signing in, so handlers here must never call
/// <c>GetUserId()</c>, never touch family-scoped data, and only ever return the
/// public-safe <see cref="PublicRecipe"/> projection. The share token is the
/// sole credential.
/// </summary>
public static class PublicRecipeEndpoints
{
    public static void MapPublicRecipeEndpoints(this WebApplication app)
    {
        var group = app.MapGroup($"{AuthorizerContextMiddleware.PublicPathPrefix}/recipes");

        group.MapGet("/{token}", GetPublicRecipe);
    }

    public static async Task<IResult> GetPublicRecipe(
        string token,
        IRecipeRepository repository,
        HttpContext context)
    {
        // Revocation must take effect immediately, so shared/browser caches
        // must not keep a copy; also keep shared recipes out of search indexes.
        context.Response.Headers.CacheControl = "no-store";
        context.Response.Headers["X-Robots-Tag"] = "noindex, nofollow";

        // Reject malformed tokens before querying. Invalid and unknown tokens
        // get the same response so nothing can be learnt from the difference.
        if (!RecipeShareTokens.IsValidFormat(token))
            return NotAvailable();

        var recipe = await repository.GetPublicByShareTokenAsync(token);
        return recipe is null ? NotAvailable() : Results.Ok(recipe);
    }

    private static IResult NotAvailable() =>
        Results.NotFound(new { error = "Shared recipe not found." });
}
