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
        You are a cooking assistant. The user will describe a dish or type of food they want.
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

        var chatMessages = new List<object>
        {
            new { role = "system", content = SystemPrompt }
        };

        foreach (var msg in messages)
        {
            chatMessages.Add(new { role = msg.Role, content = msg.Content });
        }

        var requestBody = new
        {
            model = "gpt-5.4",
            messages = chatMessages,
            temperature = 0.7,
            max_completion_tokens = 50000,
            response_format = new { type = "json_object" },
        };

        var json = JsonSerializer.Serialize(requestBody, JsonOptions);
        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions")
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

        // Parse the chat completion response.
        using var doc = JsonDocument.Parse(responseBody);
        var content = doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString();

        if (string.IsNullOrEmpty(content))
            throw new InvalidOperationException("Empty response from OpenAI.");

        // Parse the JSON content from the assistant.
        var parsed = JsonSerializer.Deserialize<AiParsedResponse>(content, JsonOptions);
        if (parsed is null)
            throw new InvalidOperationException("Failed to parse AI response.");

        return new AiSuggestResponse(
            parsed.Recipes ?? [],
            parsed.Message ?? "",
            content);
    }

    private record AiParsedResponse(
        List<AiSuggestedRecipe>? Recipes,
        string? Message);
}
