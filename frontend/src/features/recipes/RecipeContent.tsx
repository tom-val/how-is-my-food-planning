import { useTranslation } from "react-i18next";
import { Icon } from "../../components/sage/Icon";
import { isUrl, splitSteps, splitTitle } from "./recipeFormat";

/**
 * Read-only recipe building blocks shared by the in-app detail page and the
 * public shared-recipe page, so both render recipes identically.
 */

export function RecipeTitle({ name }: { name: string }) {
  const { head, tail } = splitTitle(name);
  return (
    <h1>
      {head && <>{head} </>}
      <em>{tail}</em>
    </h1>
  );
}

export function RecipeCategoryTags({ categories }: { categories: string[] }) {
  const { t } = useTranslation();
  return (
    <>
      {categories.map((c) => (
        <span key={c} className="fp-recipe-meta-tag">
          {t(`planner.${c}`)}
        </span>
      ))}
    </>
  );
}

interface IngredientLike {
  id?: string;
  name: string;
  quantity: number | null;
  unit: string | null;
}

export function RecipeIngredientList({
  ingredients,
}: {
  ingredients: IngredientLike[];
}) {
  const { t } = useTranslation();
  return (
    <>
      <div className="fp-section-title">
        {t("recipes.ingredients")} <span className="count">{ingredients.length}</span>
      </div>
      <div className="fp-ingredients">
        {ingredients.map((ing, index) => (
          <div className="fp-ingredient" key={ing.id ?? index}>
            <span className="fp-ingredient-name">{ing.name}</span>
            <span className="fp-ingredient-qty">{ing.quantity ?? "—"}</span>
            <span className="fp-ingredient-unit">{ing.unit ?? ""}</span>
          </div>
        ))}
      </div>
    </>
  );
}

/**
 * Renders instructions: a link when the text is a single URL, otherwise the
 * text as written. With `numbered`, multi-line text becomes a numbered list.
 */
export function RecipeInstructions({
  text,
  numbered = false,
}: {
  text: string;
  numbered?: boolean;
}) {
  if (isUrl(text)) {
    return (
      <div className="fp-instructions">
        <a href={text} target="_blank" rel="noopener noreferrer">
          <Icon.External />
          {text}
        </a>
      </div>
    );
  }

  if (numbered) {
    const steps = splitSteps(text);
    if (steps.length > 1) {
      return (
        <ol className="fp-instructions fp-steps">
          {steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      );
    }
  }

  return <div className="fp-instructions">{text}</div>;
}
