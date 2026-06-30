import apiClient from "./client";

export interface GeneralShoppingItem {
  id: string;
  familyId: string;
  itemName: string;
  quantity: number | null;
  unit: string | null;
  isChecked: boolean;
  checkedBy: string | null;
}

export async function getGeneralShoppingList(): Promise<GeneralShoppingItem[]> {
  const { data } = await apiClient.get<GeneralShoppingItem[]>(
    "/v1/general-shopping",
  );
  return data;
}

export async function addGeneralItem(
  itemName: string,
  quantity: number | null,
  unit: string | null,
): Promise<GeneralShoppingItem> {
  const { data } = await apiClient.post<GeneralShoppingItem>(
    "/v1/general-shopping/items",
    { itemName, quantity, unit },
  );
  return data;
}

export async function toggleGeneralItem(
  itemId: string,
  isChecked: boolean,
): Promise<void> {
  await apiClient.patch(`/v1/general-shopping-items/${itemId}`, { isChecked });
}

export async function deleteGeneralItem(itemId: string): Promise<void> {
  await apiClient.delete(`/v1/general-shopping-items/${itemId}`);
}
