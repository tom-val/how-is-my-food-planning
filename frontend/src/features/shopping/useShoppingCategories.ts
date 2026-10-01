import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import {
  assignShoppingCategory,
  getShoppingCategories,
  readApiError,
  type ShoppingCategory,
} from "../../api/shoppingCategoriesApi";
import type { ShoppingListResponse } from "../../api/shoppingApi";
import type { GeneralShoppingItem } from "../../api/generalShoppingApi";

/** Query key roots shared across the shopping feature. */
export const SHOPPING_CATEGORIES_KEY = ["shopping-categories"];
export const WEEKLY_SHOPPING_KEY_ROOT = ["shopping-list"];
export const GENERAL_SHOPPING_KEY = ["general-shopping"];

const ASSIGN_MUTATION_KEY = ["shopping-category-assign"];

const NO_CATEGORIES: ShoppingCategory[] = [];

/**
 * Normalises a product name exactly as the server builds item keys,
 * `lower(btrim(name))`: case-insensitive, with leading/trailing spaces removed.
 */
export function normaliseItemName(name: string): string {
  return name.replace(/^ +| +$/g, "").toLowerCase();
}

/** The family's shopping categories, in display order. */
export function useShoppingCategories() {
  const { data, isLoading } = useQuery({
    queryKey: SHOPPING_CATEGORIES_KEY,
    queryFn: getShoppingCategories,
  });
  const categories = data ?? NO_CATEGORIES;
  return { categories, isLoading };
}

/** Refetches both shopping lists (any week) and the categories. */
export function invalidateShoppingData(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: WEEKLY_SHOPPING_KEY_ROOT }),
    queryClient.invalidateQueries({ queryKey: GENERAL_SHOPPING_KEY }),
    queryClient.invalidateQueries({ queryKey: SHOPPING_CATEGORIES_KEY }),
  ]);
}

/** Sets the category on every cached item (weekly and general) with the given name. */
function patchCachedItems(
  queryClient: QueryClient,
  itemName: string,
  categoryId: string | null,
) {
  const key = normaliseItemName(itemName);
  queryClient.setQueriesData<ShoppingListResponse>(
    { queryKey: WEEKLY_SHOPPING_KEY_ROOT },
    (old) =>
      old && {
        ...old,
        items: old.items.map((i) =>
          normaliseItemName(i.ingredientName) === key ? { ...i, categoryId } : i,
        ),
      },
  );
  queryClient.setQueryData<GeneralShoppingItem[]>(GENERAL_SHOPPING_KEY, (old) =>
    old?.map((i) =>
      normaliseItemName(i.itemName) === key ? { ...i, categoryId } : i,
    ),
  );
}

/**
 * Manually moves a product (by name, family-wide) to a category.
 * Optimistically regroups both lists, then refetches.
 */
export function useAssignCategory() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationKey: ASSIGN_MUTATION_KEY,
    mutationFn: ({
      itemName,
      categoryId,
    }: {
      itemName: string;
      categoryId: string | null;
    }) => assignShoppingCategory(itemName, categoryId),
    onMutate: async ({ itemName, categoryId }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: WEEKLY_SHOPPING_KEY_ROOT }),
        queryClient.cancelQueries({ queryKey: GENERAL_SHOPPING_KEY }),
      ]);
      patchCachedItems(queryClient, itemName, categoryId);
    },
    onError: () => {
      enqueueSnackbar(t("shopping.categories.moveError"), { variant: "error" });
    },
    onSettled: () => {
      // Only refetch once the last of several quick moves has settled, so
      // intermediate server states don't make items jump back and forth.
      if (queryClient.isMutating({ mutationKey: ASSIGN_MUTATION_KEY }) <= 1) {
        return invalidateShoppingData(queryClient);
      }
    },
  });
}

/** Maps a create/rename error to a user-facing, translated message. */
export function categorySaveErrorMessage(err: unknown, t: TFunction): string {
  const { status } = readApiError(err);
  if (status === 409) return t("shopping.categories.errorDuplicate");
  if (status === 400) return t("shopping.categories.errorInvalid");
  return t("shopping.categories.errorGeneric");
}
