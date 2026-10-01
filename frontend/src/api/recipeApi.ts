import axios from "axios";
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
  /** Set while the recipe is publicly shared; null when it is not. */
  shareToken: string | null;
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

export async function aiStartImageJob(
  imageBase64: string,
): Promise<{ jobId: string }> {
  const { data } = await apiClient.post<{ jobId: string }>(
    "/v1/recipes/ai/image",
    { imageBase64 },
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

// --- Public sharing ---

export interface ShareRecipeResponse {
  shareToken: string;
}

/** Creates the public link, or returns the existing one if already shared. */
export async function shareRecipe(id: string): Promise<ShareRecipeResponse> {
  const { data } = await apiClient.post<ShareRecipeResponse>(
    `/v1/recipes/${id}/share`,
  );
  return data;
}

/** Revokes the public link; the old URL stops working immediately. */
export async function unshareRecipe(id: string): Promise<void> {
  await apiClient.delete(`/v1/recipes/${id}/share`);
}

export interface PublicRecipeIngredient {
  name: string;
  quantity: number | null;
  unit: string | null;
}

export interface PublicRecipe {
  name: string;
  instructions: string | null;
  categories: string[];
  ingredients: PublicRecipeIngredient[];
}

// Bare client for anonymous endpoints: same API base URL but none of
// apiClient's interceptors, so no Cognito session lookup happens and no
// Authorization header is ever sent, whether or not the viewer is signed in.
const publicClient = axios.create({ baseURL: apiClient.defaults.baseURL });

export async function getPublicRecipe(token: string): Promise<PublicRecipe> {
  const { data } = await publicClient.get<PublicRecipe>(
    `/v1/public/recipes/${encodeURIComponent(token)}`,
  );
  return data;
}

export function buildShareUrl(token: string): string {
  return `${window.location.origin}/share/${token}`;
}
