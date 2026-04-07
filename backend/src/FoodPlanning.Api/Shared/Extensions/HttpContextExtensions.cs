namespace FoodPlanning.Api.Shared.Extensions;

public static class HttpContextExtensions
{
    public static string GetUserId(this HttpContext context)
    {
        return context.Items["UserId"] as string
            ?? throw new UnauthorizedAccessException("UserId not found in request context.");
    }

    public static string? TryGetUserId(this HttpContext context)
    {
        return context.Items["UserId"] as string;
    }
}
