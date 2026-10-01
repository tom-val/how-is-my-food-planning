import { useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createShoppingCategory,
  reorderShoppingCategories,
  MAX_CATEGORIES,
  MAX_CATEGORY_NAME_LENGTH,
  MIN_CATEGORIES_FOR_AI_SORT,
  type ShoppingCategory,
} from "../../api/shoppingCategoriesApi";
import { Icon } from "../../components/sage/Icon";
import { Spinner } from "../../components/sage/Spinner";
import { Modal } from "../../components/sage/Modal";
import { BottomSheet } from "../../components/sage/BottomSheet";
import { useMobile } from "../../components/sage/useMobile";
import { CategoryRow } from "./CategoryRow";
import { LayersIcon } from "./shoppingIcons";
import {
  SHOPPING_CATEGORIES_KEY,
  categorySaveErrorMessage,
  normaliseItemName,
  useShoppingCategories,
} from "./useShoppingCategories";

const REORDER_MUTATION_KEY = ["shopping-categories-order"];

interface CategoryManagerProps {
  open: boolean;
  onClose: () => void;
}

/** Add / rename / delete / reorder the family's shopping categories. */
export function CategoryManager({ open, onClose }: CategoryManagerProps) {
  const { t } = useTranslation();
  const isMobile = useMobile();
  if (!open) return null;

  const title = t("shopping.categories.title");
  const footer = (
    <button type="button" className="fp-btn fp-btn-primary" onClick={onClose}>
      <Icon.Check />
      {t("shopping.categories.done")}
    </button>
  );

  // The body is only mounted while open, so its form state resets on close.
  return isMobile ? (
    <BottomSheet open onClose={onClose} title={title} footer={footer}>
      <CategoryManagerBody />
    </BottomSheet>
  ) : (
    <Modal open onClose={onClose} title={title} footer={footer} width={520}>
      <CategoryManagerBody />
    </Modal>
  );
}

function CategoryManagerBody() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { categories, isLoading } = useShoppingCategories();
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const atLimit = categories.length >= MAX_CATEGORIES;

  const isDuplicateName = (name: string, exceptId?: string) => {
    const key = normaliseItemName(name);
    return categories.some(
      (c) => c.id !== exceptId && normaliseItemName(c.name) === key,
    );
  };

  const createMutation = useMutation({
    mutationFn: (name: string) => createShoppingCategory(name),
    onSuccess: (created) => {
      queryClient.setQueryData<ShoppingCategory[]>(SHOPPING_CATEGORIES_KEY, (old) =>
        old ? [...old, created] : [created],
      );
      setNewName("");
      setAddError(null);
      inputRef.current?.focus();
    },
    onError: (err) => setAddError(categorySaveErrorMessage(err, t)),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: SHOPPING_CATEGORIES_KEY }),
  });

  // Reorders run one at a time (same scope) so quick successive moves reach
  // the server in order; the list is updated optimistically on click.
  const reorderMutation = useMutation({
    mutationKey: REORDER_MUTATION_KEY,
    scope: { id: "shopping-categories-order" },
    mutationFn: (ids: string[]) => reorderShoppingCategories(ids),
    onError: () => setListError(t("shopping.categories.errorReorder")),
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey: REORDER_MUTATION_KEY }) <= 1) {
        return queryClient.invalidateQueries({
          queryKey: SHOPPING_CATEGORIES_KEY,
        });
      }
    },
  });

  const ordered = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= ordered.length) return;
    const next = [...ordered];
    [next[index], next[target]] = [next[target], next[index]];
    const reordered = next.map((c, i) => ({ ...c, sortOrder: i }));
    void queryClient.cancelQueries({ queryKey: SHOPPING_CATEGORIES_KEY });
    queryClient.setQueryData(SHOPPING_CATEGORIES_KEY, reordered);
    setListError(null);
    reorderMutation.mutate(reordered.map((c) => c.id));
  };

  const add = (e: FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name || createMutation.isPending) return;
    if (atLimit) {
      setAddError(t("shopping.categories.errorLimit", { max: MAX_CATEGORIES }));
      return;
    }
    if (isDuplicateName(name)) {
      setAddError(t("shopping.categories.errorDuplicate"));
      return;
    }
    createMutation.mutate(name);
  };

  return (
    <div className="fp-catman">
      <form className="fp-catman-add" onSubmit={add}>
        <input
          ref={inputRef}
          className="fp-input"
          value={newName}
          onChange={(e) => {
            setNewName(e.target.value);
            setAddError(null);
          }}
          placeholder={t("shopping.categories.addPlaceholder")}
          aria-label={t("shopping.categories.nameLabel")}
          aria-invalid={!!addError}
          maxLength={MAX_CATEGORY_NAME_LENGTH}
          disabled={atLimit}
        />
        <button
          type="submit"
          className="fp-btn fp-btn-primary"
          disabled={!newName.trim() || atLimit || createMutation.isPending}
        >
          <Icon.Plus />
          {t("shopping.categories.add")}
        </button>
      </form>
      {addError && (
        <div className="fp-catman-error" role="alert">
          {addError}
        </div>
      )}
      {atLimit && !addError && (
        <div className="fp-catman-note">
          {t("shopping.categories.errorLimit", { max: MAX_CATEGORIES })}
        </div>
      )}

      {isLoading ? (
        <Spinner />
      ) : ordered.length === 0 ? (
        <div className="fp-catman-empty">
          <div className="fp-emptystate-mark">
            <LayersIcon />
          </div>
          <div className="fp-catman-empty-title">
            {t("shopping.categories.emptyTitle")}
          </div>
          <p>{t("shopping.categories.emptyBody")}</p>
          <p>
            {t("shopping.categories.emptyAiHint", {
              min: MIN_CATEGORIES_FOR_AI_SORT,
            })}
          </p>
        </div>
      ) : (
        <>
          {listError && (
            <div className="fp-alert fp-alert-error" role="alert">
              {listError}
            </div>
          )}
          <ul className="fp-catman-list">
            {ordered.map((category, index) => (
              <CategoryRow
                key={category.id}
                category={category}
                canMoveUp={index > 0}
                canMoveDown={index < ordered.length - 1}
                onMoveUp={() => move(index, -1)}
                onMoveDown={() => move(index, 1)}
                isDuplicateName={isDuplicateName}
              />
            ))}
          </ul>
          <div className="fp-catman-note">
            {t("shopping.categories.footnote", {
              n: ordered.length,
              max: MAX_CATEGORIES,
            })}
          </div>
        </>
      )}
    </div>
  );
}
