import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import type { IngredientInput } from "../../api/recipeApi";
import { listIngredientNames } from "../../api/recipeApi";
import { Icon } from "../../components/sage/Icon";
import { MEAL_META, MEAL_TYPES, type MealType } from "../../components/sage/mealMeta";

const UNITS = ["", "g", "kg", "ml", "l", "vnt", "v.š.", "a.š.", "rieks.", "sk."];

interface RecipeFormProps {
  initialName?: string;
  initialInstructions?: string | null;
  initialCategories?: string[];
  initialIngredients?: IngredientInput[];
  onSubmit: (
    name: string,
    instructions: string | null,
    categories: string[],
    ingredients: IngredientInput[],
  ) => void;
  isSubmitting: boolean;
  isEdit?: boolean;
  onCancel: () => void;
}

const emptyIngredient = (): IngredientInput => ({
  name: "",
  quantity: null,
  unit: null,
});

export function RecipeForm({
  initialName = "",
  initialInstructions = "",
  initialCategories = [],
  initialIngredients,
  onSubmit,
  isSubmitting,
  isEdit = false,
  onCancel,
}: RecipeFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName);
  const [instructions, setInstructions] = useState(initialInstructions ?? "");
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [ingredients, setIngredients] = useState<IngredientInput[]>(
    initialIngredients?.length ? initialIngredients : [emptyIngredient()],
  );

  const { data: knownIngredients = [] } = useQuery({
    queryKey: ["ingredient-names"],
    queryFn: listIngredientNames,
  });

  const toggleCategory = (c: MealType) =>
    setCategories((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );

  const updateIng = (idx: number, field: keyof IngredientInput, value: string) => {
    setIngredients((prev) =>
      prev.map((ing, i) => {
        if (i !== idx) return ing;
        if (field === "quantity") {
          return { ...ing, quantity: value === "" ? null : Number(value) };
        }
        return { ...ing, [field]: value || null };
      }),
    );
  };

  const removeIng = (idx: number) =>
    setIngredients((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== idx),
    );

  const addIng = () => setIngredients((prev) => [...prev, emptyIngredient()]);

  const validIngredients = ingredients.filter((i) => (i.name ?? "").trim() !== "");
  const valid = name.trim() !== "" && validIngredients.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onSubmit(name.trim(), instructions || null, categories, validIngredients);
  };

  return (
    <div className="fp-main-narrow">
      <div className="fp-page-head">
        <div>
          <div className="fp-page-eyebrow">
            {isEdit ? t("recipes.editRecipeEyebrow") : t("recipes.newRecipeEyebrow")}
          </div>
          <h1>
            {isEdit ? t("recipes.editRecipeHeader") : t("recipes.newRecipeHeader")}{" "}
            <em>{t("recipes.recipeNoun")}</em>
          </h1>
          <div className="fp-page-sub">{t("recipes.recipeFormSubtitle")}</div>
        </div>
        <button type="button" className="fp-btn fp-btn-ghost" onClick={onCancel}>
          <Icon.X />
          {t("common.cancel")}
        </button>
      </div>

      <form className="fp-form" onSubmit={handleSubmit}>
        <div className="fp-field">
          <label className="fp-field-label">
            {t("recipes.name")} <span className="fp-field-req">{t("recipes.required")}</span>
          </label>
          <input
            className="fp-input fp-input-lg"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("recipes.namePlaceholder")}
            autoFocus
          />
        </div>

        <div className="fp-field">
          <label className="fp-field-label">
            {t("recipes.categories")}{" "}
            <span className="fp-field-hint">{t("recipes.categoriesHint")}</span>
          </label>
          <div className="fp-mealchoice">
            {MEAL_TYPES.map((mt) => {
              const meta = MEAL_META[mt];
              const Ico = meta.icon;
              const active = categories.includes(mt);
              return (
                <button
                  type="button"
                  key={mt}
                  className={`fp-mealchoice-btn ${active ? "is-active" : ""}`}
                  style={
                    active
                      ? ({
                          "--c-bg": meta.bg,
                          "--c-ink": meta.ink,
                        } as React.CSSProperties)
                      : undefined
                  }
                  onClick={() => toggleCategory(mt)}
                >
                  <span className="fp-mealchoice-ico">
                    <Ico />
                  </span>
                  <span>{t(`planner.${mt}`)}</span>
                  {active && (
                    <span className="fp-mealchoice-check">
                      <Icon.Check />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="fp-field">
          <label className="fp-field-label">
            {t("recipes.ingredients")}{" "}
            <span className="fp-field-hint">
              {t("recipes.addedSummary", { n: validIngredients.length })}
            </span>
          </label>
          <div className="fp-ing-list">
            {ingredients.map((ing, idx) => (
              <div className="fp-ing-row" key={idx}>
                <span className="fp-ing-handle" aria-hidden>
                  {idx + 1}
                </span>
                <input
                  className="fp-input fp-ing-name"
                  placeholder={idx === 0 ? t("recipes.ingredientPlaceholder") : t("recipes.ingredientName")}
                  value={ing.name}
                  onChange={(e) => updateIng(idx, "name", e.target.value)}
                  list="known-ingredients"
                />
                <input
                  className="fp-input fp-ing-qty"
                  placeholder={t("recipes.quantity")}
                  type="number"
                  step="any"
                  min={0}
                  value={ing.quantity ?? ""}
                  onChange={(e) => updateIng(idx, "quantity", e.target.value)}
                />
                <select
                  className="fp-input fp-ing-unit"
                  value={ing.unit ?? ""}
                  onChange={(e) => updateIng(idx, "unit", e.target.value)}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u || t("recipes.unit").toLowerCase()}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="fp-ing-remove"
                  onClick={() => removeIng(idx)}
                  disabled={ingredients.length === 1}
                  aria-label={t("common.remove")}
                >
                  <Icon.Trash />
                </button>
              </div>
            ))}
          </div>
          <datalist id="known-ingredients">
            {knownIngredients.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
          <button type="button" className="fp-add-row" onClick={addIng}>
            <Icon.Plus />
            {t("recipes.addIngredient")}
          </button>
        </div>

        <div className="fp-field">
          <label className="fp-field-label">
            {t("recipes.instructions")}{" "}
            <span className="fp-field-hint">{t("recipes.instructionsHint")}</span>
          </label>
          <textarea
            className="fp-input fp-textarea"
            rows={5}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder={t("recipes.instructionsPlaceholder")}
          />
        </div>

        <div className="fp-form-foot">
          <button type="button" className="fp-btn fp-btn-ghost" onClick={onCancel}>
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            className="fp-btn fp-btn-primary"
            disabled={!valid || isSubmitting}
          >
            <Icon.Check />
            {isEdit ? t("recipes.saveChanges") : t("recipes.saveRecipe")}
          </button>
        </div>
        {!valid && (
          <div className="fp-form-hint">{t("recipes.formMissingHint")}</div>
        )}
      </form>
    </div>
  );
}
