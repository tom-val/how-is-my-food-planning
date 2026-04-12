import apiClient from "./client";

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  name: string;
  quantity: number | null;
  unit: string | null;
}

export interface Recipe {
  id: string;
  familyId: string;
  name: string;
  instructions: string | null;
  categories: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeWithIngredients {
  recipe: Recipe;
  ingredients: RecipeIngredient[];
}

export interface IngredientInput {
  name: string;
  quantity: number | null;
  unit: string | null;
}

export async function listIngredientNames(): Promise<string[]> {
  const { data } = await apiClient.get<string[]>("/v1/recipes/ingredients");
  return data;
}

export interface AiMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiSuggestedRecipe {
  name: string;
  instructions: string | null;
  categories: string[];
  ingredients: IngredientInput[];
}

export interface AiSuggestResponse {
  recipes: AiSuggestedRecipe[];
  message: string;
  assistantMessage: string;
}

export interface AiRecipeJob {
  id: string;
  status: "pending" | "completed" | "failed";
  response: AiSuggestResponse | null;
  error: string | null;
}

export async function aiStartJob(
  messages: AiMessage[],
): Promise<{ jobId: string }> {
  const { data } = await apiClient.post<{ jobId: string }>(
    "/v1/recipes/ai/start",
    { messages },
  );
  return data;
}

export async function aiPollJob(jobId: string): Promise<AiRecipeJob> {
  const { data } = await apiClient.get<AiRecipeJob>(
    `/v1/recipes/ai/jobs/${jobId}`,
    { timeout: 60000 },
  );
  return data;
}

export async function listRecipes(): Promise<RecipeWithIngredients[]> {
  const { data } = await apiClient.get<RecipeWithIngredients[]>("/v1/recipes");
  return data;
}

export async function getRecipe(id: string): Promise<RecipeWithIngredients> {
  const { data } = await apiClient.get<RecipeWithIngredients>(
    `/v1/recipes/${id}`,
  );
  return data;
}

export async function createRecipe(
  name: string,
  instructions: string | null,
  categories: string[],
  ingredients: IngredientInput[],
): Promise<RecipeWithIngredients> {
  const { data } = await apiClient.post<RecipeWithIngredients>("/v1/recipes", {
    name,
    instructions,
    categories,
    ingredients,
  });
  return data;
}

export async function updateRecipe(
  id: string,
  name: string,
  instructions: string | null,
  categories: string[],
  ingredients: IngredientInput[],
): Promise<RecipeWithIngredients> {
  const { data } = await apiClient.put<RecipeWithIngredients>(
    `/v1/recipes/${id}`,
    { name, instructions, categories, ingredients },
  );
  return data;
}

export async function deleteRecipe(id: string): Promise<void> {
  await apiClient.delete(`/v1/recipes/${id}`);
}
