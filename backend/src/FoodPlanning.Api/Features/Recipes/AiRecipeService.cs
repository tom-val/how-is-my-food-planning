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
        or provide a URL to a recipe page.

        WHEN PAGE CONTENT IS PROVIDED:
        - The page content has been fetched for you. Extract the EXACT recipe from it.
        - Do NOT make up or guess the recipe. Use the EXACT ingredients, quantities, and instructions from the provided content.
        - If the content is structured data (JSON-LD), parse it accurately.
        - If the page is in Lithuanian, keep the recipe in Lithuanian.
        - Return exactly 1 recipe matching what is on the page.

        WHEN A DISH NAME IS PROVIDED:
        - Suggest 1-3 recipe variations.
        - Be creative but accurate with ingredients and quantities.

        ALWAYS respond with valid JSON matching this exact schema:
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

        // Build input as conversation messages for the Responses API.
        var input = new List<object>
        {
            new { role = "user", content = "Respond in JSON format." }
        };

        // If any message contains a URL, fetch the page content and inject it.
        foreach (var msg in messages)
        {
            var msgContent = msg.Content;
            if (msg.Role == "user")
            {
                var url = ExtractUrl(msgContent);
                if (url != null)
                {
                    var pageContent = await FetchPageContentAsync(url);
                    if (pageContent != null)
                    {
                        msgContent = $"Extract the recipe from this page: {url}\n\n--- PAGE CONTENT ---\n{pageContent}\n--- END PAGE CONTENT ---";
                    }
                }
            }
            input.Add(new { role = msg.Role, content = msgContent });
        }

        var requestBody = new
        {
            model = "gpt-5.4",
            instructions = SystemPrompt,
            input,
            text = new { format = new { type = "json_object" } },
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
        _logger.LogInformation("[AiRecipe] Response: {Body}", responseBody);
        using var doc = JsonDocument.Parse(responseBody);
        var root = doc.RootElement;

        // Try output_text first, then fall back to searching the output array.
        string? content = null;
        if (root.TryGetProperty("output_text", out var outputText))
        {
            content = outputText.GetString();
        }
        else if (root.TryGetProperty("output", out var output) && output.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in output.EnumerateArray())
            {
                if (item.TryGetProperty("type", out var type) && type.GetString() == "message" &&
                    item.TryGetProperty("content", out var msgContent) && msgContent.ValueKind == JsonValueKind.Array)
                {
                    foreach (var part in msgContent.EnumerateArray())
                    {
                        if (part.TryGetProperty("type", out var partType) && partType.GetString() == "output_text" &&
                            part.TryGetProperty("text", out var text))
                        {
                            content = text.GetString();
                            break;
                        }
                    }
                }
                if (content != null) break;
            }
        }

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

    private static string? ExtractUrl(string text)
    {
        // Simple URL extraction — find the first http(s) URL in the text.
        var words = text.Split(' ', '\n', '\t');
        return words.FirstOrDefault(w =>
            w.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
            w.StartsWith("https://", StringComparison.OrdinalIgnoreCase));
    }

    private async Task<string?> FetchPageContentAsync(string url)
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Add("User-Agent", "Mozilla/5.0 (compatible; FoodPlanningBot/1.0)");
            request.Headers.Add("Accept", "text/html,application/xhtml+xml");

            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10));
            var response = await _httpClient.SendAsync(request, cts.Token);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("[AiRecipe] Failed to fetch URL {Url}: {StatusCode}", url, response.StatusCode);
                return null;
            }

            var html = await response.Content.ReadAsStringAsync(cts.Token);

            // Try to extract JSON-LD structured data (schema.org/Recipe) — most recipe sites have this.
            var jsonLd = ExtractJsonLd(html);
            if (jsonLd != null)
            {
                _logger.LogInformation("[AiRecipe] Found JSON-LD recipe data from {Url}", url);
                return $"STRUCTURED RECIPE DATA (JSON-LD):\n{jsonLd}";
            }

            // Fall back to raw HTML, truncated to avoid token limits.
            _logger.LogInformation("[AiRecipe] No JSON-LD found, using raw HTML from {Url}", url);
            // Strip script/style tags and truncate.
            var cleaned = StripHtmlNoise(html);
            return cleaned.Length > 15000 ? cleaned[..15000] : cleaned;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[AiRecipe] Error fetching URL {Url}", url);
            return null;
        }
    }

    private static string? ExtractJsonLd(string html)
    {
        // Find all <script type="application/ld+json"> blocks and look for Recipe schema.
        const string openTag = "<script type=\"application/ld+json\">";
        const string closeTag = "</script>";

        var index = 0;
        while (true)
        {
            var start = html.IndexOf(openTag, index, StringComparison.OrdinalIgnoreCase);
            if (start < 0) break;

            var contentStart = start + openTag.Length;
            var end = html.IndexOf(closeTag, contentStart, StringComparison.OrdinalIgnoreCase);
            if (end < 0) break;

            var jsonText = html[contentStart..end].Trim();
            if (jsonText.Contains("Recipe", StringComparison.OrdinalIgnoreCase))
                return jsonText;

            index = end + closeTag.Length;
        }

        return null;
    }

    private static string StripHtmlNoise(string html)
    {
        // Remove script and style blocks.
        var result = System.Text.RegularExpressions.Regex.Replace(
            html, @"<(script|style)[^>]*>[\s\S]*?</\1>", "", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        // Remove HTML tags.
        result = System.Text.RegularExpressions.Regex.Replace(result, @"<[^>]+>", " ");
        // Collapse whitespace.
        result = System.Text.RegularExpressions.Regex.Replace(result, @"\s+", " ");
        return result.Trim();
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
