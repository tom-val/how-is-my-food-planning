using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using FoodPlanning.Api.Shared;
using Microsoft.Extensions.Options;

namespace FoodPlanning.Api.Features.Recipes;

public record AiMessage(string Role, string Content);

public record AiSuggestRequest(List<AiMessage> Messages);

public record AiSuggestedRecipe(
    string Name,
    string? Instructions,
    string[] Categories,
    List<IngredientInput> Ingredients);

public record AiSuggestResponse(
    List<AiSuggestedRecipe> Recipes,
    string Message,
    string AssistantMessage);

public interface IAiRecipeService
{
    Task<AiSuggestResponse> SuggestAsync(List<AiMessage> messages);
}

public class AiRecipeService : IAiRecipeService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly ILogger<AiRecipeService> _logger;

    private const string SystemPrompt = """
        You are a cooking assistant. The user will describe a dish or type of food they want,
        or provide a URL to a recipe page. If a URL is provided, use web search to fetch the
        recipe from that page.

        Respond with 1-3 recipe suggestions in JSON format.

        IMPORTANT: Always respond with valid JSON matching this exact schema:
        {
          "recipes": [
            {
              "name": "Recipe name",
              "instructions": "Step by step instructions...",
              "categories": ["breakfast", "lunch", "dinner", "snack"],
              "ingredients": [
                { "name": "Ingredient", "quantity": 1.0, "unit": "kg" }
              ]
            }
          ],
          "message": "Brief friendly message about the suggestions"
        }

        Rules:
        - categories must only contain: "breakfast", "lunch", "dinner", "snack"
        - Leave categories empty [] if the dish suits any meal
        - quantity can be null if not applicable
        - unit can be null if not applicable
        - Instructions should be detailed and in the same language as the user's request
        - Recipe names should be in the same language as the user's request
        - If the user asks to modify a recipe, return the modified version
        - If the user provides a URL, fetch the recipe from it and convert to the JSON format
        - Always return valid JSON, nothing else
        """;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public AiRecipeService(HttpClient httpClient, IOptions<OpenAiSettings> settings, ILogger<AiRecipeService> logger)
    {
        _httpClient = httpClient;
        _apiKey = settings.Value.ApiKey;
        _logger = logger;
    }

    public async Task<AiSuggestResponse> SuggestAsync(List<AiMessage> messages)
    {
        if (string.IsNullOrEmpty(_apiKey))
            throw new InvalidOperationException("OpenAI API key is not configured.");

        // Build input as conversation messages for the Responses API.
        var input = new List<object>();
        foreach (var msg in messages)
        {
            input.Add(new { role = msg.Role, content = msg.Content });
        }

        var requestBody = new
        {
            model = "gpt-5.4",
            instructions = SystemPrompt,
            input,
            tools = new object[]
            {
                new { type = "web_search" }
            },
            max_output_tokens = 50000,
        };

        var json = JsonSerializer.Serialize(requestBody, JsonOptions);
        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/responses")
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json"),
        };
        request.Headers.Add("Authorization", $"Bearer {_apiKey}");

        var response = await _httpClient.SendAsync(request);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("[AiRecipe] OpenAI API error: {StatusCode} {Body}",
                response.StatusCode, responseBody);
            throw new InvalidOperationException($"OpenAI API returned {response.StatusCode}.");
        }

        // Parse the Responses API response.
        using var doc = JsonDocument.Parse(responseBody);
        var content = doc.RootElement.GetProperty("output_text").GetString();

        if (string.IsNullOrEmpty(content))
            throw new InvalidOperationException("Empty response from OpenAI.");

        // Extract JSON from the response — it may be wrapped in markdown code fences.
        var jsonContent = ExtractJson(content);

        // Parse the JSON content from the assistant.
        var parsed = JsonSerializer.Deserialize<AiParsedResponse>(jsonContent, JsonOptions);
        if (parsed is null)
            throw new InvalidOperationException("Failed to parse AI response.");

        return new AiSuggestResponse(
            parsed.Recipes ?? [],
            parsed.Message ?? "",
            content);
    }

    private static string ExtractJson(string text)
    {
        // Try to extract JSON from markdown code fences like ```json ... ```
        var trimmed = text.Trim();

        var jsonStart = trimmed.IndexOf("```json", StringComparison.OrdinalIgnoreCase);
        if (jsonStart >= 0)
        {
            var contentStart = trimmed.IndexOf('\n', jsonStart) + 1;
            var contentEnd = trimmed.IndexOf("```", contentStart, StringComparison.Ordinal);
            if (contentEnd > contentStart)
                return trimmed[contentStart..contentEnd].Trim();
        }

        var fenceStart = trimmed.IndexOf("```", StringComparison.Ordinal);
        if (fenceStart >= 0)
        {
            var contentStart = trimmed.IndexOf('\n', fenceStart) + 1;
            var contentEnd = trimmed.IndexOf("```", contentStart, StringComparison.Ordinal);
            if (contentEnd > contentStart)
                return trimmed[contentStart..contentEnd].Trim();
        }

        // Try to find raw JSON object.
        var braceStart = trimmed.IndexOf('{');
        var braceEnd = trimmed.LastIndexOf('}');
        if (braceStart >= 0 && braceEnd > braceStart)
            return trimmed[braceStart..(braceEnd + 1)];

        return trimmed;
    }

    private record AiParsedResponse(
        List<AiSuggestedRecipe>? Recipes,
        string? Message);
}
