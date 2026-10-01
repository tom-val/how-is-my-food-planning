import { Fragment, useCallback, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { ShoppingCategory } from "../../api/shoppingCategoriesApi";
import { CategoryPicker } from "./CategoryPicker";
import { groupByCategory } from "./groupByCategory";
import { TagIcon } from "./shoppingIcons";
import { useAssignCategory } from "./useShoppingCategories";

interface GroupedShoppingItemsProps<T> {
  items: T[];
  categories: ShoppingCategory[];
  getId: (item: T) => string;
  getName: (item: T) => string;
  getCategoryId: (item: T) => string | null;
  isChecked: (item: T) => boolean;
  /**
   * Renders one `.fp-shop-item` row. `moveAction` is the "change category"
   * button to place in the row (null when the family has no categories).
   */
  renderItem: (item: T, moveAction: ReactNode) => ReactNode;
}

interface PickerState {
  anchor: HTMLElement;
  itemId: string;
  itemName: string;
  categoryId: string | null;
}

/**
 * Renders a shopping list either flat (no categories — exactly as before) or
 * grouped under category headers with a trailing "Other" group, and owns the
 * per-item "move to category" picker.
 */
export function GroupedShoppingItems<T>({
  items,
  categories,
  getId,
  getName,
  getCategoryId,
  isChecked,
  renderItem,
}: GroupedShoppingItemsProps<T>) {
  const { t } = useTranslation();
  const assign = useAssignCategory();
  const [picker, setPicker] = useState<PickerState | null>(null);
  const closePicker = useCallback(() => setPicker(null), []);

  if (categories.length === 0) {
    return (
      <div className="fp-shop-list">
        {items.map((item) => (
          <Fragment key={getId(item)}>{renderItem(item, null)}</Fragment>
        ))}
      </div>
    );
  }

  const moveAction = (item: T) => {
    const id = getId(item);
    const name = getName(item);
    return (
      <button
        type="button"
        className="fp-icon-btn fp-shop-move no-print"
        aria-label={t("shopping.categories.moveItem", { name })}
        title={t("shopping.categories.moveTo")}
        aria-haspopup="true"
        aria-expanded={picker?.itemId === id}
        onClick={(e) => {
          e.stopPropagation();
          const anchor = e.currentTarget;
          setPicker((current) =>
            current?.itemId === id
              ? null
              : { anchor, itemId: id, itemName: name, categoryId: getCategoryId(item) },
          );
        }}
      >
        <TagIcon />
      </button>
    );
  };

  const groups = groupByCategory(items, categories, getCategoryId);

  return (
    <>
      <div className="fp-shop-groups">
        {groups.map((group) => {
          const done = group.items.filter(isChecked).length;
          return (
            <section key={group.key} className="fp-shop-category">
              <div className="fp-shop-category-head">
                <h2 className="fp-shop-category-name">
                  {group.category?.name ?? t("shopping.categories.other")}
                </h2>
                <span className="fp-shop-category-rule" />
                <span className="fp-shop-category-count">
                  {done}/{group.items.length}
                </span>
              </div>
              <div className="fp-shop-list">
                {group.items.map((item) => (
                  <Fragment key={getId(item)}>
                    {renderItem(item, moveAction(item))}
                  </Fragment>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {picker && (
        <CategoryPicker
          anchor={picker.anchor}
          itemName={picker.itemName}
          currentCategoryId={picker.categoryId}
          categories={categories}
          onClose={closePicker}
          onPick={(categoryId) =>
            assign.mutate({ itemName: picker.itemName, categoryId })
          }
        />
      )}
    </>
  );
}
