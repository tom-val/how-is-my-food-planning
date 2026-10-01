import { useId } from "react";
import { useTranslation } from "react-i18next";
import {
  MIN_CATEGORIES_FOR_AI_SORT,
  type AiSortList,
} from "../../api/shoppingCategoriesApi";
import { Icon } from "../../components/sage/Icon";
import { Spinner } from "../../components/sage/Spinner";
import { useAiSort } from "./useAiSort";

interface AiSortButtonProps {
  list: AiSortList;
  /** Required for the weekly list. */
  planId?: string;
  itemCount: number;
  categoryCount: number;
  onManageCategories: () => void;
}

/** "Sort with AI" button plus an always-visible hint explaining its state. */
export function AiSortButton({
  list,
  planId,
  itemCount,
  categoryCount,
  onManageCategories,
}: AiSortButtonProps) {
  const { t } = useTranslation();
  const hintId = useId();
  const { start, isRunning } = useAiSort(list, planId);

  const notEnoughCategories = categoryCount < MIN_CATEGORIES_FOR_AI_SORT;
  const missingPlan = list === "weekly" && !planId;
  const disabled =
    isRunning || notEnoughCategories || itemCount === 0 || missingPlan;

  return (
    <div className="fp-shop-aisort no-print">
      <button
        type="button"
        className="fp-btn fp-btn-ghost fp-shop-aisort-btn"
        onClick={start}
        disabled={disabled}
        aria-busy={isRunning}
        aria-describedby={hintId}
      >
        {isRunning ? <Spinner inline /> : <Icon.Sparkles />}
        {isRunning
          ? t("shopping.categories.aiSortBusy")
          : t("shopping.categories.aiSort")}
      </button>
      <span id={hintId} className="fp-shop-aisort-hint" aria-live="polite">
        {isRunning ? (
          t("shopping.categories.aiSortBusyHint")
        ) : notEnoughCategories ? (
          <>
            {t("shopping.categories.aiSortNeedCategories", {
              min: MIN_CATEGORIES_FOR_AI_SORT,
            })}{" "}
            <button
              type="button"
              className="fp-shop-linkbtn"
              onClick={onManageCategories}
            >
              {t("shopping.categories.manageLink")}
            </button>
          </>
        ) : (
          t("shopping.categories.aiSortHint")
        )}
      </span>
    </div>
  );
}
