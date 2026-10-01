using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.AspNetCoreServer;

namespace FoodPlanning.Api.Shared.Middleware;

/// <summary>
/// Production auth middleware that reads the userId set by the Lambda
/// authorizer from the API Gateway request context.
/// </summary>
public class AuthorizerContextMiddleware
{
    /// <summary>
    /// Path prefix for anonymous endpoints (e.g. shared recipes). Requests under
    /// it are passed through WITHOUT a userId: <c>GetUserId()</c> throws there,
    /// so an authenticated endpoint accidentally mapped under this prefix fails
    /// closed (401) rather than exposing data.
    /// </summary>
    public const string PublicPathPrefix = "/v1/public";

    private readonly RequestDelegate _next;
    private readonly ILogger<AuthorizerContextMiddleware> _logger;

    public AuthorizerContextMiddleware(RequestDelegate next, ILogger<AuthorizerContextMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (IsPublicPath(context.Request.Path))
        {
            // Deliberately do not read or set the authorizer userId here, even
            // if one is present: public handlers must not depend on identity.
            await _next(context);
            return;
        }

        var apiGatewayContext = context.Items[AbstractAspNetCoreFunction.LAMBDA_REQUEST_OBJECT]
            as APIGatewayHttpApiV2ProxyRequest;
        var userId = apiGatewayContext?.RequestContext?.Authorizer?.Lambda?
            .TryGetValue("userId", out var value) == true ? value?.ToString() : null;

        if (string.IsNullOrEmpty(userId))
        {
            _logger.LogWarning("[AuthorizerContext] No userId found in Lambda authorizer context.");
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return;
        }

        context.Items["UserId"] = userId;
        await _next(context);
    }

    // StartsWithSegments matches whole segments only, so "/v1/publicity" is not public.
    public static bool IsPublicPath(PathString path) =>
        path.StartsWithSegments("/health") || path.StartsWithSegments(PublicPathPrefix);
}
