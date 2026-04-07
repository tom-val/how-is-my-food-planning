using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.AspNetCoreServer;

namespace FoodPlanning.Api.Shared.Middleware;

/// <summary>
/// Production auth middleware that reads the userId set by the Lambda
/// authorizer from the API Gateway request context.
/// </summary>
public class AuthorizerContextMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<AuthorizerContextMiddleware> _logger;

    public AuthorizerContextMiddleware(RequestDelegate next, ILogger<AuthorizerContextMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Path.StartsWithSegments("/health"))
        {
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
}
