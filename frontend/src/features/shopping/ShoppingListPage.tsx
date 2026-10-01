import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import WeeklyShoppingList from "./WeeklyShoppingList";
import GeneralShoppingList from "./GeneralShoppingList";
import { CategoryManager } from "./CategoryManager";
import { LayersIcon } from "./shoppingIcons";
import { useShoppingCategories } from "./useShoppingCategories";

type Tab = "weekly" | "general";

export default function ShoppingListPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>(() => {
    const saved = localStorage.getItem("shopping.tab");
    return saved === "general" ? "general" : "weekly";
  });
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const { categories } = useShoppingCategories();

  const openCategories = useCallback(() => setCategoriesOpen(true), []);
  const closeCategories = useCallback(() => setCategoriesOpen(false), []);

  const selectTab = (next: Tab) => {
    setTab(next);
    try {
      localStorage.setItem("shopping.tab", next);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="fp-main-wide">
      <div className="fp-shop-topbar no-print">
        <div className="fp-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "weekly"}
            className={`fp-tab ${tab === "weekly" ? "is-active" : ""}`}
            onClick={() => selectTab("weekly")}
          >
            {t("shopping.tabWeekly")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "general"}
            className={`fp-tab ${tab === "general" ? "is-active" : ""}`}
            onClick={() => selectTab("general")}
          >
            {t("shopping.tabGeneral")}
          </button>
        </div>
        <button
          type="button"
          className="fp-btn fp-btn-ghost fp-shop-catbtn"
          onClick={openCategories}
        >
          <LayersIcon />
          {t("shopping.categories.manage")}
          {categories.length > 0 && (
            <span className="fp-shop-catbtn-count">{categories.length}</span>
          )}
        </button>
      </div>

      {tab === "weekly" ? (
        <WeeklyShoppingList onManageCategories={openCategories} />
      ) : (
        <GeneralShoppingList onManageCategories={openCategories} />
      )}

      <CategoryManager open={categoriesOpen} onClose={closeCategories} />
    </div>
  );
}
