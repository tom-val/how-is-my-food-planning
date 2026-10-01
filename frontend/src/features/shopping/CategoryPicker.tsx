import { useTranslation } from "react-i18next";
import type { ShoppingCategory } from "../../api/shoppingCategoriesApi";
import { Icon } from "../../components/sage/Icon";
import { Popover } from "../../components/sage/Popover";
import { BottomSheet } from "../../components/sage/BottomSheet";
import { useMobile } from "../../components/sage/useMobile";

interface CategoryPickerProps {
  anchor: HTMLElement;
  itemName: string;
  currentCategoryId: string | null;
  categories: ShoppingCategory[];
  onPick: (categoryId: string | null) => void;
  onClose: () => void;
}

/**
 * Lets the user move one item to another category: a popover next to the
 * item on desktop, a bottom sheet with large tap targets on mobile.
 */
export function CategoryPicker({
  anchor,
  itemName,
  currentCategoryId,
  categories,
  onPick,
  onClose,
}: CategoryPickerProps) {
  const { t } = useTranslation();
  const isMobile = useMobile();

  // A stale id (category deleted meanwhile) counts as uncategorised.
  const activeId = categories.some((c) => c.id === currentCategoryId)
    ? currentCategoryId
    : null;

  const pick = (categoryId: string | null) => {
    onClose();
    if (categoryId !== activeId) onPick(categoryId);
  };

  const option = (categoryId: string | null, label: string) => {
    const active = categoryId === activeId;
    return (
      <button
        key={categoryId ?? "__other"}
        type="button"
        className={`fp-popover-item ${active ? "is-active" : ""}`}
        aria-pressed={active}
        onClick={() => pick(categoryId)}
      >
        <span className="fp-catpick-label">{label}</span>
        {active && (
          <span className="fp-popover-item-sub">
            <Icon.Check />
          </span>
        )}
      </button>
    );
  };

  const options = (
    <>
      {categories.map((c) => option(c.id, c.name))}
      <div className="fp-popover-divider" />
      {option(null, t("shopping.categories.other"))}
    </>
  );

  if (isMobile) {
    return (
      <BottomSheet open onClose={onClose} title={itemName}>
        <div className="fp-catpick-sub">{t("shopping.categories.moveTo")}</div>
        <div className="fp-catpick fp-catpick-sheet">{options}</div>
      </BottomSheet>
    );
  }

  return (
    <Popover anchor={anchor} onClose={onClose} align="right">
      <div className="fp-popover-head">{t("shopping.categories.moveTo")}</div>
      <div className="fp-catpick">{options}</div>
    </Popover>
  );
}
