import { useState, type FormEvent, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteShoppingCategory,
  renameShoppingCategory,
  MAX_CATEGORY_NAME_LENGTH,
  type ShoppingCategory,
} from "../../api/shoppingCategoriesApi";
import { Icon } from "../../components/sage/Icon";
import {
  GENERAL_SHOPPING_KEY,
  SHOPPING_CATEGORIES_KEY,
  WEEKLY_SHOPPING_KEY_ROOT,
  categorySaveErrorMessage,
} from "./useShoppingCategories";

interface CategoryRowProps {
  category: ShoppingCategory;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  /** True when another category already uses this name (case-insensitive). */
  isDuplicateName: (name: string, exceptId: string) => boolean;
}

type Mode = "view" | "edit" | "confirmDelete";

/** One category in the manager: view, inline rename, or delete confirmation. */
export function CategoryRow({
  category,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  isDuplicateName,
}: CategoryRowProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>("view");
  const [draft, setDraft] = useState(category.name);
  const [error, setError] = useState<string | null>(null);

  const renameMutation = useMutation({
    mutationFn: (name: string) => renameShoppingCategory(category.id, name),
    onSuccess: (updated) => {
      // Only take the name: a reorder may still be in flight.
      queryClient.setQueryData<ShoppingCategory[]>(SHOPPING_CATEGORIES_KEY, (old) =>
        old?.map((c) => (c.id === updated.id ? { ...c, name: updated.name } : c)),
      );
      setMode("view");
      setError(null);
    },
    onError: (err) => setError(categorySaveErrorMessage(err, t)),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: SHOPPING_CATEGORIES_KEY }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteShoppingCategory(category.id),
    onSuccess: () => {
      queryClient.setQueryData<ShoppingCategory[]>(SHOPPING_CATEGORIES_KEY, (old) =>
        old?.filter((c) => c.id !== category.id),
      );
      // Its items become uncategorised.
      queryClient.invalidateQueries({ queryKey: WEEKLY_SHOPPING_KEY_ROOT });
      queryClient.invalidateQueries({ queryKey: GENERAL_SHOPPING_KEY });
    },
    onError: () => setError(t("shopping.categories.errorDelete")),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: SHOPPING_CATEGORIES_KEY }),
  });

  const startEdit = () => {
    setDraft(category.name);
    setError(null);
    setMode("edit");
  };

  const cancel = () => {
    setError(null);
    setMode("view");
  };

  const saveRename = (e: FormEvent) => {
    e.preventDefault();
    const name = draft.trim();
    if (!name || renameMutation.isPending) return;
    if (name === category.name) {
      cancel();
      return;
    }
    if (isDuplicateName(name, category.id)) {
      setError(t("shopping.categories.errorDuplicate"));
      return;
    }
    setError(null);
    renameMutation.mutate(name);
  };

  const onEditKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      // Cancel the edit without also closing the surrounding dialog.
      e.stopPropagation();
      cancel();
    }
  };

  if (mode === "edit") {
    return (
      <li className="fp-catman-row is-editing">
        <form className="fp-catman-edit" onSubmit={saveRename}>
          <input
            className="fp-input"
            value={draft}
            maxLength={MAX_CATEGORY_NAME_LENGTH}
            onChange={(e) => {
              setDraft(e.target.value);
              setError(null);
            }}
            onKeyDown={onEditKeyDown}
            aria-label={t("shopping.categories.nameLabel")}
            aria-invalid={!!error}
            autoFocus
          />
          <button
            type="submit"
            className="fp-icon-btn"
            aria-label={t("common.save")}
            title={t("common.save")}
            disabled={!draft.trim() || renameMutation.isPending}
          >
            <Icon.Check />
          </button>
          <button
            type="button"
            className="fp-icon-btn"
            aria-label={t("common.cancel")}
            title={t("common.cancel")}
            onClick={cancel}
          >
            <Icon.X />
          </button>
        </form>
        {error && (
          <div className="fp-catman-error" role="alert">
            {error}
          </div>
        )}
      </li>
    );
  }

  if (mode === "confirmDelete") {
    return (
      <li className="fp-catman-row is-confirm">
        <div className="fp-catman-confirm-text">
          {t("shopping.categories.deleteConfirm", { name: category.name })}
        </div>
        {error && (
          <div className="fp-catman-error" role="alert">
            {error}
          </div>
        )}
        <div className="fp-catman-confirm-actions">
          <button
            type="button"
            className="fp-btn fp-btn-ghost"
            onClick={cancel}
            disabled={deleteMutation.isPending}
            autoFocus
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className="fp-btn fp-btn-danger"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            <Icon.Trash />
            {t("common.delete")}
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="fp-catman-row">
      <span className="fp-catman-name">{category.name}</span>
      <span className="fp-catman-actions">
        <button
          type="button"
          className="fp-icon-btn"
          aria-label={t("shopping.categories.moveUp", { name: category.name })}
          title={t("shopping.categories.moveUpShort")}
          onClick={onMoveUp}
          disabled={!canMoveUp}
        >
          <Icon.Chevron dir="up" />
        </button>
        <button
          type="button"
          className="fp-icon-btn"
          aria-label={t("shopping.categories.moveDown", { name: category.name })}
          title={t("shopping.categories.moveDownShort")}
          onClick={onMoveDown}
          disabled={!canMoveDown}
        >
          <Icon.Chevron dir="down" />
        </button>
        <button
          type="button"
          className="fp-icon-btn"
          aria-label={t("shopping.categories.rename", { name: category.name })}
          title={t("common.edit")}
          onClick={startEdit}
        >
          <Icon.Edit />
        </button>
        <button
          type="button"
          className="fp-icon-btn fp-catman-delete"
          aria-label={t("shopping.categories.delete", { name: category.name })}
          title={t("common.delete")}
          onClick={() => {
            setError(null);
            setMode("confirmDelete");
          }}
        >
          <Icon.Trash />
        </button>
      </span>
    </li>
  );
}
