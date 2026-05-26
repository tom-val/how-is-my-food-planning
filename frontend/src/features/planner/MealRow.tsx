import { useRef, useState } from "react";
import { Icon } from "../../components/sage/Icon";
import { MEAL_META, type MealType } from "../../components/sage/mealMeta";
import type { PlannedMeal } from "../../api/plannerApi";
import { useTranslation } from "react-i18next";

interface MealRowProps {
  slot: MealType;
  meals: PlannedMeal[];
  onMealClick: (anchor: HTMLElement, meal: PlannedMeal) => void;
  onMealLongPress: (anchor: HTMLElement, meal: PlannedMeal) => void;
  onRemove: (meal: PlannedMeal) => void;
  onAdd: (anchor: HTMLElement) => void;
  onDice: (anchor: HTMLElement) => void;
}

export function MealRow({
  slot,
  meals,
  onMealClick,
  onMealLongPress,
  onRemove,
  onAdd,
  onDice,
}: MealRowProps) {
  const { t } = useTranslation();
  const meta = MEAL_META[slot];
  const I = meta.icon;
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longFired = useRef(false);
  const [pressedId, setPressedId] = useState<string | null>(null);

  const startPress = (e: React.MouseEvent | React.TouchEvent, meal: PlannedMeal) => {
    if (meal.isCustom) return;
    longFired.current = false;
    const target = e.currentTarget as HTMLElement;
    setPressedId(meal.id);
    pressTimer.current = setTimeout(() => {
      longFired.current = true;
      setPressedId(null);
      onMealLongPress(target, meal);
    }, 480);
  };
  const endPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    setPressedId(null);
  };
  const handleClick = (e: React.MouseEvent, meal: PlannedMeal) => {
    if (longFired.current) {
      longFired.current = false;
      e.preventDefault();
      return;
    }
    onMealClick(e.currentTarget as HTMLElement, meal);
  };

  return (
    <div className="fp-meal">
      <div className="fp-meal-icon" style={{ background: meta.bg, color: meta.ink }}>
        <I />
      </div>
      <div className="fp-meal-label">{t(`planner.${slot}`)}</div>
      <div className="fp-meal-slot">
        {meals.map((meal) => (
          <span
            key={meal.id}
            className={`fp-meal-pill ${pressedId === meal.id ? "is-pressed" : ""} ${meal.isCustom ? "is-custom" : ""}`}
            style={
              meal.isCustom
                ? undefined
                : ({
                    "--meal-bg": meta.bg,
                    "--meal-ink": meta.ink,
                    "--meal-bd": "transparent",
                  } as React.CSSProperties)
            }
            onMouseDown={(e) => startPress(e, meal)}
            onMouseUp={endPress}
            onMouseLeave={endPress}
            onTouchStart={(e) => startPress(e, meal)}
            onTouchEnd={endPress}
            onClick={(e) => handleClick(e, meal)}
          >
            {meal.isShadow ? (
              <span
                className="fp-meal-pill-mark"
                title={t("planner.repeated")}
                aria-label={t("planner.repeated")}
              >
                <Icon.Refresh />
              </span>
            ) : (
              <span className="fp-meal-pill-dot" />
            )}
            <span className="fp-meal-pill-name">{meal.recipeName}</span>
            <button
              type="button"
              className="fp-meal-pill-x"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(meal);
              }}
              aria-label={t("common.remove")}
            >
              <Icon.X />
            </button>
          </span>
        ))}
        <button
          type="button"
          className="fp-meal-add no-print"
          onClick={(e) => onAdd(e.currentTarget)}
          aria-label={t("planner.addMeal")}
        >
          <Icon.Plus />
        </button>
        <button
          type="button"
          className="fp-meal-dice no-print"
          onClick={(e) => onDice(e.currentTarget)}
          aria-label={t("planner.randomRecipe")}
        >
          <Icon.Dice />
        </button>
      </div>
    </div>
  );
}
