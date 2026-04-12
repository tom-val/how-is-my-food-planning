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
