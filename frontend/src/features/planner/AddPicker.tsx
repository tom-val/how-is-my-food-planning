import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Popover } from "../../components/sage/Popover";
import { Icon } from "../../components/sage/Icon";
import type { RecipeWithIngredients } from "../../api/recipeApi";

interface AddPickerProps {
  anchor: HTMLElement | null;
  slot: string;
  dayName: string;
  recipes: RecipeWithIngredients[];
  onPick: (recipe: RecipeWithIngredients) => void;
  onPickCustom: (name: string) => void;
  onCreateNew: (prefilledName: string | null) => void;
  onClose: () => void;
}

export function AddPicker({
  anchor,
  slot,
  dayName,
  recipes,
  onPick,
  onPickCustom,
  onCreateNew,
  onClose,
}: AddPickerProps) {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(id);
  }, []);

  const slotMatches = recipes.filter(
    ({ recipe }) =>
      recipe.categories.length === 0 || recipe.categories.includes(slot),
  );
  const search = q.trim().toLowerCase();
  const filtered = search
    ? recipes.filter(
        ({ recipe, ingredients }) =>
          recipe.name.toLowerCase().includes(search) ||
          ingredients.some((i) => i.name.toLowerCase().includes(search)),
      )
    : slotMatches.slice(0, 4);
  const showingSuggestions = !search;

  const letterOf = (name: string) =>
    name.replace(/[^a-zA-ZąčęėįšųūžĄČĘĖĮŠŲŪŽ]/g, "")[0] ?? "·";

  if (!anchor) return null;

  return (
    <Popover anchor={anchor} onClose={onClose} className="fp-addpicker" align="left">
      <div className="fp-addpicker-head">
        <div className="fp-addpicker-eyebrow">
          {dayName} · {t(`planner.${slot}`)}
        </div>
        <div className="fp-addpicker-search">
          <Icon.Search />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("planner.searchRecipes")}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "Enter") {
                if (filtered[0]) onPick(filtered[0]);
                else if (q.trim()) onPickCustom(q.trim());
              }
            }}
          />
          {q && (
            <button
              type="button"
              className="fp-addpicker-clear"
              onClick={() => setQ("")}
              aria-label="Clear"
            >
              <Icon.X />
            </button>
          )}
        </div>
      </div>
      <div className="fp-addpicker-body">
        {showingSuggestions && filtered.length > 0 && (
          <div className="fp-addpicker-sectiontitle">
            <Icon.Sparkles />
            {t("planner.suggestedFor", { slot: t(`planner.${slot}`) })}
          </div>
        )}
        {!showingSuggestions && filtered.length > 0 && (
          <div className="fp-addpicker-sectiontitle">
            <Icon.Search />
            {filtered.length === 1
              ? t("planner.matchFound", { count: 1 })
              : t("planner.matchesFound", { count: filtered.length })}
          </div>
        )}
        {filtered.length === 0 && (
          <div className="fp-addpicker-empty">
            <div className="fp-addpicker-empty-title">{t("recipes.noMatches", { q })}</div>
            <div className="fp-addpicker-empty-sub">{t("recipes.noMatchesSub")}</div>
          </div>
        )}
        <div className="fp-addpicker-list">
          {filtered.map(({ recipe, ingredients }) => (
            <button
              key={recipe.id}
              type="button"
              className="fp-addpicker-row"
              onClick={() => onPick({ recipe, ingredients })}
            >
              <span className="fp-addpicker-row-thumb">{letterOf(recipe.name)}</span>
              <span className="fp-addpicker-row-body">
                <span className="fp-addpicker-row-name">{recipe.name}</span>
                <span className="fp-addpicker-row-meta">
                  {recipe.categories.slice(0, 2).map((c) => (
                    <span key={c} className="fp-addpicker-tag">
                      {t(`planner.${c}`)}
                    </span>
                  ))}
                  {recipe.categories.length > 0 && <span>·</span>}
                  <span>{ingredients.length} ing.</span>
                </span>
              </span>
            </button>
          ))}
        </div>
        {showingSuggestions && slotMatches.length > 4 && (
          <div className="fp-addpicker-hint">
            {t("planner.moreRecipes", { n: slotMatches.length - 4, slot: t(`planner.${slot}`) })}
          </div>
        )}
        {q.trim() && (
          <div className="fp-addpicker-list" style={{ marginTop: 4 }}>
            <button
              type="button"
              className="fp-addpicker-row"
              onClick={() => onPickCustom(q.trim())}
            >
              <span className="fp-addpicker-row-thumb">
                <Icon.Plus />
              </span>
              <span className="fp-addpicker-row-body">
                <span className="fp-addpicker-row-name">{q.trim()}</span>
                <span className="fp-addpicker-row-meta">
                  <span>{t("planner.customMeal")}</span>
                </span>
              </span>
            </button>
          </div>
        )}
      </div>
      <div className="fp-addpicker-foot">
        <button
          type="button"
          className="fp-addpicker-newbtn"
          onClick={() => {
            onCreateNew(q.trim() || null);
            onClose();
          }}
        >
          <Icon.Plus />
          {q ? t("planner.addAsNew", { q }) : t("planner.addNewRecipe")}
        </button>
        <span className="fp-addpicker-kbd">{t("planner.kbdHint")}</span>
      </div>
    </Popover>
  );
}
