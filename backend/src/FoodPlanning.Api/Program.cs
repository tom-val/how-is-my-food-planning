using Amazon.Lambda.AspNetCoreServer;
using FluentValidation;
using FoodPlanning.Api.Features.Families;
using FoodPlanning.Api.Features.Planner;
using FoodPlanning.Api.Features.Recipes;
using FoodPlanning.Api.Features.Shopping;
using FoodPlanning.Api.Shared;
using FoodPlanning.Api.Shared.Database;
using FoodPlanning.Api.Shared.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Structured JSON logging for Lambda (queryable in CloudWatch Logs Insights).
if (!builder.Environment.IsDevelopment())
{
    builder.Logging.AddJsonConsole(options => options.IncludeScopes = true);
}

// AWS Lambda hosting.
builder.Services.AddAWSLambdaHosting(LambdaEventSource.HttpApi);

// Configuration.
builder.Services
    .AddOptions<DatabaseSettings>()
    .Bind(builder.Configuration.GetSection(DatabaseSettings.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

// Database.
builder.Services.AddScoped<DbConnectionFactory>();

// CORS.
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? [];

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

// FluentValidation.
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// Repositories and services.
builder.Services.AddScoped<IFamilyRepository, FamilyRepository>();
builder.Services.AddScoped<IFamilyMembershipService, FamilyMembershipService>();
builder.Services.AddScoped<IRecipeRepository, RecipeRepository>();
builder.Services.AddScoped<IPlannerRepository, PlannerRepository>();
builder.Services.AddScoped<IShoppingRepository, ShoppingRepository>();

var app = builder.Build();

// Middleware pipeline.
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseMiddleware<RequestLoggingMiddleware>();
app.UseCors();

// Auth middleware: production reads the userId from the Lambda authorizer context.
if (!app.Environment.IsDevelopment() && !app.Environment.IsEnvironment("Testing"))
{
    app.UseMiddleware<AuthorizerContextMiddleware>();
}

// Routes.
app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));
app.MapFamilyEndpoints();
app.MapRecipeEndpoints();
app.MapPlannerEndpoints();
app.MapShoppingEndpoints();

app.Run();
