import axios from "axios";
import apiClient from "./client";

export interface ShoppingCategory {
  id: string;
  name: string;
  sortOrder: number;
}

export type AiSortList = "weekly" | "general";

export type AiSortJobStatus = "pending" | "completed" | "failed";

export interface AiSortJob {
  status: AiSortJobStatus;
  error: string | null;
}

/** Limits enforced by the API; mirrored here for client-side validation. */
export const MAX_CATEGORIES = 30;
export const MAX_CATEGORY_NAME_LENGTH = 50;
export const MIN_CATEGORIES_FOR_AI_SORT = 3;

export async function getShoppingCategories(): Promise<ShoppingCategory[]> {
  const { data } = await apiClient.get<ShoppingCategory[]>(
    "/v1/shopping-categories",
  );
  return data;
}

export async function createShoppingCategory(
  name: string,
): Promise<ShoppingCategory> {
  const { data } = await apiClient.post<ShoppingCategory>(
    "/v1/shopping-categories",
    { name },
  );
  return data;
}

export async function renameShoppingCategory(
  id: string,
  name: string,
): Promise<ShoppingCategory> {
  const { data } = await apiClient.put<ShoppingCategory>(
    `/v1/shopping-categories/${id}`,
    { name },
  );
  return data;
}

export async function reorderShoppingCategories(ids: string[]): Promise<void> {
  await apiClient.put("/v1/shopping-categories/order", { ids });
}

export async function deleteShoppingCategory(id: string): Promise<void> {
  await apiClient.delete(`/v1/shopping-categories/${id}`);
}

/** Assigns a product name to a category family-wide (null = uncategorised). */
export async function assignShoppingCategory(
  itemName: string,
  categoryId: string | null,
): Promise<void> {
  await apiClient.put("/v1/shopping-categories/assignments", {
    itemName,
    categoryId,
  });
}

/** Starts an AI sort job. `jobId` is null when there is nothing to sort. */
export async function startAiSort(
  list: AiSortList,
  planId?: string,
): Promise<{ jobId: string | null }> {
  const { data } = await apiClient.post<{ jobId: string | null }>(
    "/v1/shopping-categories/ai-sort",
    planId ? { list, planId } : { list },
  );
  return data;
}

export async function getAiSortJob(jobId: string): Promise<AiSortJob> {
  const { data } = await apiClient.get<AiSortJob>(
    `/v1/shopping-categories/ai-sort/${jobId}`,
    { timeout: 30000 },
  );
  return data;
}

export interface ApiErrorInfo {
  status: number | null;
  error: string | null;
  code: string | null;
}

/** Extracts `{ error, code }` and the HTTP status from an API error. */
export function readApiError(err: unknown): ApiErrorInfo {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as
      | { error?: unknown; code?: unknown }
      | undefined;
    return {
      status: err.response?.status ?? null,
      error: typeof body?.error === "string" ? body.error : null,
      code: typeof body?.code === "string" ? body.code : null,
    };
  }
  return { status: null, error: null, code: null };
}
