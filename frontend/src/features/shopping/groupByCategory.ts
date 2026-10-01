import type { ShoppingCategory } from "../../api/shoppingCategoriesApi";

export interface CategoryGroup<T> {
  key: string;
  /** null for the trailing "Other" (uncategorised) group. */
  category: ShoppingCategory | null;
  items: T[];
}

export const OTHER_GROUP_KEY = "__other";

/**
 * Splits items into category groups in category sort order, followed by an
 * "Other" group for uncategorised items (or items pointing at a category that
 * no longer exists). Empty groups are omitted and the incoming item order is
 * preserved within each group.
 */
export function groupByCategory<T>(
  items: readonly T[],
  categories: readonly ShoppingCategory[],
  getCategoryId: (item: T) => string | null,
): CategoryGroup<T>[] {
  // Array.prototype.sort is stable, so ties keep the API's order.
  const ordered = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
  const buckets = new Map<string, T[]>(ordered.map((c) => [c.id, []]));
  const other: T[] = [];

  for (const item of items) {
    const id = getCategoryId(item);
    const bucket = id ? buckets.get(id) : undefined;
    (bucket ?? other).push(item);
  }

  const groups: CategoryGroup<T>[] = [];
  for (const category of ordered) {
    const bucket = buckets.get(category.id)!;
    if (bucket.length > 0) {
      groups.push({ key: category.id, category, items: bucket });
    }
  }
  if (other.length > 0) {
    groups.push({ key: OTHER_GROUP_KEY, category: null, items: other });
  }
  return groups;
}
