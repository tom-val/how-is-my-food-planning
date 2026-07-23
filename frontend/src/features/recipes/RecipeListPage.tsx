import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { listRecipes, aiStartImageJob, aiPollJob } from "../../api/recipeApi";
import { Icon } from "../../components/sage/Icon";
import { Spinner } from "../../components/sage/Spinner";

const CATEGORIES = ["all", "breakfast", "lunch", "dinner", "snack"] as const;

function letterOf(name: string): string {
  return name.replace(/[^a-zA-ZąčęėįšųūžĄČĘĖĮŠŲŪŽ]/g, "")[0] ?? "·";
}

export default function RecipeListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<(typeof CATEGORIES)[number]>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { data: recipes, isLoading } = useQuery({
    queryKey: ["recipes"],
    queryFn: listRecipes,
  });

  const filtered = useMemo(() => {
    if (!recipes) return [];
    let result = recipes;
    if (activeFilter !== "all") {
      result = result.filter(
        ({ recipe }) =>
          recipe.categories.length === 0 || recipe.categories.includes(activeFilter),
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        ({ recipe, ingredients }) =>
          recipe.name.toLowerCase().includes(q) ||
          ingredients.some((i) => i.name.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [recipes, activeFilter, searchQuery]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImageProcessing(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(",")[1];
        const { jobId } = await aiStartImageJob(base64);
        const poll = setInterval(async () => {
          try {
            const job = await aiPollJob(jobId);
            if (job.status === "completed" && job.response?.recipes?.length) {
              clearInterval(poll);
              setIsImageProcessing(false);
              navigate("/recipes/new", {
                state: { aiRecipe: job.response.recipes[0] },
              });
            } else if (job.status === "failed") {
              clearInterval(poll);
              setIsImageProcessing(false);
            }
          } catch {
            /* keep polling */
          }
        }, 5000);
      } catch {
        setIsImageProcessing(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  if (isLoading) return <Spinner />;

  const count = recipes?.length ?? 0;

  return (
    <div className="fp-main-wide">
      <div className="fp-page-head">
        <div>
          <div className="fp-page-eyebrow">
            {t("recipes.cookbookEyebrow", { count })}
          </div>
          <h1>
            {t("recipes.cookbookTitle")} <em>{t("recipes.cookbookTitleAccent")}</em>
          </h1>
          <div className="fp-page-sub">{t("recipes.cookbookSubtitle")}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            type="file"
            accept="image/*"
            ref={imageInputRef}
            onChange={handleImageUpload}
            style={{ display: "none" }}
          />
          <button
            type="button"
            className="fp-btn fp-btn-ghost"
            onClick={() => imageInputRef.current?.click()}
            disabled={isImageProcessing}
          >
            {isImageProcessing ? <Spinner inline /> : <Icon.Camera />}
            {t("recipes.fromImage")}
          </button>
          <button
            type="button"
            className="fp-btn fp-btn-ghost"
            onClick={() => navigate("/recipes/ai")}
          >
            <Icon.Sparkles />
            {t("recipes.aiCreate")}
          </button>
          <button
            type="button"
            className="fp-btn fp-btn-ghost"
            onClick={() => navigate("/recipes/import")}
            title="Vienkartinis importas iš „meal plan.xlsx“"
          >
            <Icon.Forward />
            Importas
          </button>
          <button
            type="button"
            className="fp-btn fp-btn-primary"
            onClick={() => navigate("/recipes/new")}
          >
            <Icon.Plus />
            {t("recipes.create")}
          </button>
        </div>
      </div>

      <div className="fp-search">
        <Icon.Search />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("recipes.searchPlaceholder")}
        />
        <span className="fp-search-kbd">⌘ K</span>
      </div>

      <div className="fp-toolbar" style={{ marginBottom: 14 }}>
        <div className="fp-chipset">
          {CATEGORIES.map((f) => (
            <button
              key={f}
              type="button"
              className={`fp-chip ${activeFilter === f ? "is-active" : ""}`}
              onClick={() => setActiveFilter(f)}
            >
              {f === "all" ? `${t("recipes.allCategories")} · ${count}` : t(`planner.${f}`)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="fp-emptystate">
          <div className="fp-emptystate-mark">
            <Icon.Book />
          </div>
          <div className="fp-emptystate-title">{t("recipes.empty")}</div>
          <div className="fp-emptystate-sub">
            <button
              type="button"
              className="fp-textbtn"
              onClick={() => navigate("/recipes/new")}
            >
              <Icon.Plus />
              {t("recipes.create")}
            </button>
          </div>
        </div>
      ) : (
        <div className="fp-recipe-list">
          {filtered.map(({ recipe, ingredients }) => (
            <div
              key={recipe.id}
              className="fp-recipe-row"
              onClick={() => navigate(`/recipes/${recipe.id}`)}
            >
              <div className="fp-recipe-thumb leaf">{letterOf(recipe.name)}</div>
              <div className="fp-recipe-body">
                <div className="fp-recipe-name">{recipe.name}</div>
                <div className="fp-recipe-meta">
                  {recipe.categories.map((c) => (
                    <span key={c} className="fp-recipe-meta-tag">
                      {t(`planner.${c}`)}
                    </span>
                  ))}
                  {recipe.categories.length > 0 && <span>·</span>}
                  <span>{t("recipes.ingredientsCount", { count: ingredients.length })}</span>
                </div>
              </div>
              <div className="fp-recipe-count">
                <span className="fp-recipe-count-n">{ingredients.length}</span>
                <span className="fp-recipe-count-l">ing.</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
