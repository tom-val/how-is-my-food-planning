import { Icon } from "./Icon";

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const MEAL_META: Record<
  MealType,
  {
    icon: typeof Icon.Coffee;
    bg: string;
    ink: string;
  }
> = {
  breakfast: { icon: Icon.Coffee, bg: "var(--meal-breakfast)", ink: "var(--meal-breakfast-ink)" },
  lunch: { icon: Icon.Bowl, bg: "var(--meal-lunch)", ink: "var(--meal-lunch-ink)" },
  dinner: { icon: Icon.Plate, bg: "var(--meal-dinner)", ink: "var(--meal-dinner-ink)" },
  snack: { icon: Icon.Apple, bg: "var(--meal-snack)", ink: "var(--meal-snack-ink)" },
};
