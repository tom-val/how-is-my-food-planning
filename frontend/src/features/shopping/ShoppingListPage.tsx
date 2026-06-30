import { useState } from "react";
import { useTranslation } from "react-i18next";
import WeeklyShoppingList from "./WeeklyShoppingList";
import GeneralShoppingList from "./GeneralShoppingList";

type Tab = "weekly" | "general";

export default function ShoppingListPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>(() => {
    const saved = localStorage.getItem("shopping.tab");
    return saved === "general" ? "general" : "weekly";
  });

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
      <div className="fp-tabs no-print" role="tablist">
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

      {tab === "weekly" ? <WeeklyShoppingList /> : <GeneralShoppingList />}
    </div>
  );
}
