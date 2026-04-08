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

export async function getShoppingList(
  planId: string,
): Promise<ShoppingListItem[]> {
  const { data } = await apiClient.get<ShoppingListItem[]>(
    `/v1/plans/${planId}/shopping-list`,
  );
  return data;
}

export async function generateShoppingList(
  planId: string,
): Promise<ShoppingListItem[]> {
  const { data } = await apiClient.post<ShoppingListItem[]>(
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
