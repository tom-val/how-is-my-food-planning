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
