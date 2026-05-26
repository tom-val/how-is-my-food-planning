import { useTranslation } from "react-i18next";
import { Popover } from "../../components/sage/Popover";
import { Icon } from "../../components/sage/Icon";
import type { PlannedMeal } from "../../api/plannerApi";

interface Props {
  anchor: HTMLElement | null;
  meal: PlannedMeal | null;
  onClose: () => void;
  onCopyNextWeek: () => void;
  onCopyRandomNextWeek: () => void;
  onCopyRandom30Days: () => void;
  onCopyRandom6Months: () => void;
  onOpenRecipe: () => void;
  onRemove: () => void;
}

export function MealActionsPopover({
  anchor,
  meal,
  onClose,
  onCopyNextWeek,
  onCopyRandomNextWeek,
  onCopyRandom30Days,
  onCopyRandom6Months,
  onOpenRecipe,
  onRemove,
}: Props) {
  const { t } = useTranslation();
  if (!anchor || !meal) return null;
  return (
    <Popover anchor={anchor} onClose={onClose} align="center">
      <div className="fp-popover-head">{meal.recipeName}</div>
      {!meal.isCustom && meal.recipeId && (
        <>
          <button
            type="button"
            className="fp-popover-item"
            onClick={() => {
              onCopyNextWeek();
              onClose();
            }}
          >
            <Icon.Forward />
            {t("planner.sameDayNextWeek")}
            <span className="fp-popover-item-sub">{t("planner.sameDayNextWeekSub")}</span>
          </button>
          <button
            type="button"
            className="fp-popover-item"
            onClick={() => {
              onCopyRandomNextWeek();
              onClose();
            }}
          >
            <Icon.CalendarArrow />
            {t("planner.randomNextWeek")}
          </button>
          <button
            type="button"
            className="fp-popover-item"
            onClick={() => {
              onCopyRandom30Days();
              onClose();
            }}
          >
            <Icon.Copy />
            {t("planner.random30Days")}
          </button>
          <button
            type="button"
            className="fp-popover-item"
            onClick={() => {
              onCopyRandom6Months();
              onClose();
            }}
          >
            <Icon.Copy />
            {t("planner.random6Months")}
          </button>
          <div className="fp-popover-divider" />
          <button
            type="button"
            className="fp-popover-item"
            onClick={() => {
              onOpenRecipe();
              onClose();
            }}
          >
            <Icon.Book />
            {t("planner.openRecipe")}
          </button>
          <div className="fp-popover-divider" />
        </>
      )}
      <button
        type="button"
        className="fp-popover-item is-danger"
        onClick={() => {
          onRemove();
          onClose();
        }}
      >
        <Icon.Trash />
        {t("planner.removeFromPlan")}
      </button>
    </Popover>
  );
}
