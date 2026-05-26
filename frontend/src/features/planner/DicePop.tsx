import { useTranslation } from "react-i18next";
import { Popover } from "../../components/sage/Popover";
import { Icon } from "../../components/sage/Icon";
import type { RecipeWithIngredients } from "../../api/recipeApi";

interface Props {
  anchor: HTMLElement | null;
  slot: string;
  suggested: RecipeWithIngredients | null;
  libraryCount: number;
  onAccept: () => void;
  onReroll: () => void;
  onClose: () => void;
}

export function DicePop({
  anchor,
  slot,
  suggested,
  libraryCount,
  onAccept,
  onReroll,
  onClose,
}: Props) {
  const { t } = useTranslation();
  if (!anchor || !suggested) return null;
  return (
    <Popover anchor={anchor} onClose={onClose} className="fp-dice-pop" align="left">
      <div className="fp-dice-pop-head">
        <div className="ico">
          <Icon.Sparkles />
        </div>
        <div>
          <div className="fp-dice-pop-title">
            {t("planner.diceTitle", { slot: t(`planner.${slot}`) })}
          </div>
          <div className="fp-dice-pop-sub">{t("planner.diceSub", { n: libraryCount })}</div>
        </div>
      </div>
      <div className="fp-dice-pop-suggestion">
        <div className="fp-dice-pop-suggestion-name">{suggested.recipe.name}</div>
        <div className="fp-dice-pop-suggestion-meta">
          {t("recipes.ingredientsCount", { count: suggested.ingredients.length })}
        </div>
      </div>
      <div className="fp-dice-pop-actions">
        <button
          type="button"
          className="fp-btn fp-btn-primary"
          style={{ flex: 1, justifyContent: "center" }}
          onClick={onAccept}
        >
          <Icon.Check />
          {t("planner.diceUseThis")}
        </button>
        <button type="button" className="fp-btn fp-btn-ghost" onClick={onReroll}>
          <Icon.Dice />
          {t("planner.diceReroll")}
        </button>
      </div>
    </Popover>
  );
}
