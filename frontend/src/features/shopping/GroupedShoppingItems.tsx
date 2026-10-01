import { Fragment, useCallback, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { ShoppingCategory } from "../../api/shoppingCategoriesApi";
import { CategoryPicker } from "./CategoryPicker";
import { groupByCategory } from "./groupByCategory";
import { AllTickedState, HiddenTickedNote } from "./HideTicked";
import { TagIcon } from "./shoppingIcons";
import { useAssignCategory } from "./useShoppingCategories";
import { useTickedFilter } from "./useTickedFilter";

interface GroupedShoppingItemsProps<T> {
  items: T[];
  categories: ShoppingCategory[];
  getId: (item: T) => string;
  getName: (item: T) => string;
  getCategoryId: (item: T) => string | null;
  isChecked: (item: T) => boolean;
  /** Ticks or unticks an item (the list's optimistic update). */
  onToggle: (item: T, isChecked: boolean) => void;
  /** Whether ticked items are hidden (see `useHideTicked`). */
  hideTicked: boolean;
  /** Turns the "hide ticked" filter off. */
  onShowTicked: () => void;
  /**
   * Renders one `.fp-shop-item` row. `moveAction` is the "change category"
   * button to place in the row (null when the family has no categories) and
   * `toggle` ticks or unticks the item; use it rather than calling the
   * mutation directly so a fresh tick stays visible while ticked items are
   * hidden.
   */
  renderItem: (item: T, moveAction: ReactNode, toggle: () => void) => ReactNode;
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
 * per-item "move to category" picker. When `hideTicked` is on, only unticked
 * items (and groups that still have some) are shown.
 */
export function GroupedShoppingItems<T>({
  items,
  categories,
  getId,
  getName,
  getCategoryId,
  isChecked,
  onToggle,
  hideTicked,
  onShowTicked,
  renderItem,
}: GroupedShoppingItemsProps<T>) {
  const { t } = useTranslation();
  const assign = useAssignCategory();
  const [picker, setPicker] = useState<PickerState | null>(null);
  const closePicker = useCallback(() => setPicker(null), []);
  const { visible, hiddenCount, noteToggle } = useTickedFilter(items, {
    enabled: hideTicked,
    getId,
    isChecked,
  });

  const toggle = (item: T) => () => {
    const next = !isChecked(item);
    noteToggle(getId(item), next);
    onToggle(item, next);
  };

  if (hideTicked && visible.length === 0) {
    return <AllTickedState onShow={onShowTicked} />;
  }

  const hiddenNote =
    hideTicked && hiddenCount > 0 ? (
      <HiddenTickedNote count={hiddenCount} onShow={onShowTicked} />
    ) : null;
  const filterClass = hideTicked ? " fp-shop-hide-ticked" : "";

  if (categories.length === 0) {
    return (
      <>
        <div className={`fp-shop-list${filterClass}`}>
          {visible.map((item) => (
            <Fragment key={getId(item)}>
              {renderItem(item, null, toggle(item))}
            </Fragment>
          ))}
        </div>
        {hiddenNote}
      </>
    );
  }

  // The picker only stays open while its row is on screen (a just-ticked item
  // disappears after a moment when ticked items are hidden).
  const visibleIds = new Set(visible.map(getId));
  const openPicker =
    picker && visibleIds.has(picker.itemId) && picker.anchor.isConnected
      ? picker
      : null;

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
        aria-expanded={openPicker?.itemId === id}
        onClick={(e) => {
          e.stopPropagation();
          setPicker(
            openPicker?.itemId === id
              ? null
              : {
                  anchor: e.currentTarget,
                  itemId: id,
                  itemName: name,
                  categoryId: getCategoryId(item),
                },
          );
        }}
      >
        <TagIcon />
      </button>
    );
  };

  // Header counts always cover every item in the category, like the summary.
  const counts = new Map(
    groupByCategory(items, categories, getCategoryId).map((group) => [
      group.key,
      `${group.items.filter(isChecked).length}/${group.items.length}`,
    ]),
  );
  const groups = groupByCategory(visible, categories, getCategoryId);

  return (
    <>
      <div className={`fp-shop-groups${filterClass}`}>
        {groups.map((group) => (
          <section key={group.key} className="fp-shop-category">
            <div className="fp-shop-category-head">
              <h2 className="fp-shop-category-name">
                {group.category?.name ?? t("shopping.categories.other")}
              </h2>
              <span className="fp-shop-category-rule" />
              <span className="fp-shop-category-count">{counts.get(group.key)}</span>
            </div>
            <div className="fp-shop-list">
              {group.items.map((item) => (
                <Fragment key={getId(item)}>
                  {renderItem(item, moveAction(item), toggle(item))}
                </Fragment>
              ))}
            </div>
          </section>
        ))}
      </div>
      {hiddenNote}

      {openPicker && (
        <CategoryPicker
          anchor={openPicker.anchor}
          itemName={openPicker.itemName}
          currentCategoryId={openPicker.categoryId}
          categories={categories}
          onClose={closePicker}
          onPick={(categoryId) =>
            assign.mutate({ itemName: openPicker.itemName, categoryId })
          }
        />
      )}
    </>
  );
}
