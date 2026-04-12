import apiClient from "./client";

export interface ShoppingListItem {
  id: string;
  weeklyPlanId: string;
  ingredientName: string;
  totalQuantity: number | null;
  unit: string | null;
  isChecked: boolean;
  checkedBy: string | null;
}

export interface IngredientRecipeMapping {
  ingredientName: string;
  unit: string | null;
  recipeName: string;
}

export interface ShoppingListResponse {
  items: ShoppingListItem[];
  recipeMappings: IngredientRecipeMapping[];
}

export async function getShoppingList(
  planId: string,
): Promise<ShoppingListResponse> {
  const { data } = await apiClient.get<ShoppingListResponse>(
    `/v1/plans/${planId}/shopping-list`,
  );
  return data;
}

export async function generateShoppingList(
  planId: string,
): Promise<ShoppingListResponse> {
  const { data } = await apiClient.post<ShoppingListResponse>(
    `/v1/plans/${planId}/shopping-list/generate`,
  );
  return data;
}

export async function toggleItem(
  itemId: string,
  isChecked: boolean,
): Promise<void> {
  await apiClient.patch(`/v1/shopping-list-items/${itemId}`, { isChecked });
}

export async function addCustomItem(
  planId: string,
  ingredientName: string,
  quantity: number | null,
  unit: string | null,
): Promise<ShoppingListItem> {
  const { data } = await apiClient.post<ShoppingListItem>(
    `/v1/plans/${planId}/shopping-list/items`,
    { ingredientName, quantity, unit },
  );
  return data;
}

export async function deleteItem(itemId: string): Promise<void> {
  await apiClient.delete(`/v1/shopping-list-items/${itemId}`);
}
