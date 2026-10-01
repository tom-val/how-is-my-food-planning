using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.AspNetCoreServer;
using FoodPlanning.Api.Shared.Middleware;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;

namespace FoodPlanning.Api.Tests.Shared.Middleware;

public class AuthorizerContextMiddlewareTests
{
    private bool _nextCalled;

    private AuthorizerContextMiddleware CreateMiddleware() =>
        new(_ =>
        {
            _nextCalled = true;
            return Task.CompletedTask;
        }, NullLogger<AuthorizerContextMiddleware>.Instance);

    private static DefaultHttpContext CreateContext(string path, string? authorizerUserId = null)
    {
        var context = new DefaultHttpContext();
        context.Request.Path = path;

        if (authorizerUserId is not null)
        {
            context.Items[AbstractAspNetCoreFunction.LAMBDA_REQUEST_OBJECT] = new APIGatewayHttpApiV2ProxyRequest
            {
                RequestContext = new APIGatewayHttpApiV2ProxyRequest.ProxyRequestContext
                {
                    Authorizer = new APIGatewayHttpApiV2ProxyRequest.AuthorizerDescription
                    {
                        Lambda = new Dictionary<string, object> { ["userId"] = authorizerUserId },
                    },
                },
            };
        }

        return context;
    }

    [Theory]
    [InlineData("/health")]
    [InlineData("/v1/public/recipes/AbCdEfGhIjKlMnOpQrStUv-_")]
    public async Task ShouldPassThroughWithoutUser_WhenPathIsPublic(string path)
    {
        // Arrange
        var context = CreateContext(path);

        // Act
        await CreateMiddleware().InvokeAsync(context);

        // Assert
        Assert.True(_nextCalled);
        Assert.False(context.Items.ContainsKey("UserId"));
        Assert.Equal(StatusCodes.Status200OK, context.Response.StatusCode);
    }

    [Fact]
    public async Task ShouldNotSetUser_OnPublicPath_EvenWhenAuthorizerContextIsPresent()
    {
        // Arrange
        var context = CreateContext("/v1/public/recipes/AbCdEfGhIjKlMnOpQrStUv-_", authorizerUserId: "user-1");

        // Act
        await CreateMiddleware().InvokeAsync(context);

        // Assert
        Assert.True(_nextCalled);
        Assert.False(context.Items.ContainsKey("UserId"));
    }

    [Theory]
    [InlineData("/v1/recipes")]
    [InlineData("/v1/recipes/3f2504e0-4f89-11d3-9a0c-0305e82c3301/share")]
    [InlineData("/v1/publicity")] // shares a prefix but not the "/v1/public" segment
    [InlineData("/v1")]
    public async Task ShouldReturn401_WhenPathIsNotPublicAndNoUser(string path)
    {
        // Arrange
        var context = CreateContext(path);

        // Act
        await CreateMiddleware().InvokeAsync(context);

        // Assert
        Assert.False(_nextCalled);
        Assert.Equal(StatusCodes.Status401Unauthorized, context.Response.StatusCode);
    }

    [Fact]
    public async Task ShouldSetUser_WhenPathIsNotPublicAndAuthorizerProvidesUser()
    {
        // Arrange
        var context = CreateContext("/v1/recipes", authorizerUserId: "user-1");

        // Act
        await CreateMiddleware().InvokeAsync(context);

        // Assert
        Assert.True(_nextCalled);
        Assert.Equal("user-1", context.Items["UserId"]);
    }
}
