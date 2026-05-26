import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRecipe, deleteRecipe } from "../../api/recipeApi";
import { Icon } from "../../components/sage/Icon";
import { Spinner } from "../../components/sage/Spinner";
import { Modal } from "../../components/sage/Modal";

function splitTitle(name: string): { head: string; tail: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { head: "", tail: parts[0] };
  return { head: parts.slice(0, -1).join(" "), tail: parts.slice(-1)[0] };
}

function isUrl(text: string): boolean {
  return /^https?:\/\//i.test(text.trim());
}

export default function RecipeDetailPage() {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["recipes", id],
    queryFn: () => getRecipe(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteRecipe(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      enqueueSnackbar(t("recipes.deleted"), { variant: "success" });
      navigate("/recipes");
    },
  });

  if (isLoading) return <Spinner />;
  if (!data) {
    return (
      <div className="fp-main-wide">
        <div className="fp-emptystate">
          <div className="fp-emptystate-title">{t("recipes.notFound")}</div>
        </div>
      </div>
    );
  }

  const { recipe, ingredients } = data;
  const { head, tail } = splitTitle(recipe.name);
  const instructionsIsLink = recipe.instructions && isUrl(recipe.instructions);

  return (
    <div className="fp-main-wide">
      <div className="fp-recipe-hero">
        <div className="fp-recipe-hero-inner">
          <button
            type="button"
            className="fp-recipe-hero-back"
            onClick={() => navigate("/recipes")}
          >
            <Icon.ArrowLeft />
            {t("recipes.backToAll")}
          </button>
          <h1>
            {head && <>{head} </>}
            <em>{tail}</em>
          </h1>
          <div className="fp-recipe-hero-tags">
            {recipe.categories.map((c) => (
              <span key={c} className="fp-recipe-meta-tag">
                {t(`planner.${c}`)}
              </span>
            ))}
          </div>
        </div>
        <div className="fp-recipe-hero-actions">
          <button
            type="button"
            className="fp-btn fp-btn-ghost"
            onClick={() => navigate(`/recipes/${id}/edit`)}
          >
            <Icon.Edit />
            {t("common.edit")}
          </button>
          <button
            type="button"
            className="fp-btn fp-btn-danger"
            onClick={() => setDeleteOpen(true)}
          >
            <Icon.Trash />
            {t("common.delete")}
          </button>
        </div>
      </div>

      <div className="fp-section-title">
        {t("recipes.ingredients")} <span className="count">{ingredients.length}</span>
      </div>
      <div className="fp-ingredients">
        {ingredients.map((ing) => (
          <div className="fp-ingredient" key={ing.id}>
            <span className="fp-ingredient-name">{ing.name}</span>
            <span className="fp-ingredient-qty">{ing.quantity ?? "—"}</span>
            <span className="fp-ingredient-unit">{ing.unit ?? ""}</span>
          </div>
        ))}
      </div>

      {recipe.instructions ? (
        <>
          <div className="fp-section-title">{t("recipes.instructions")}</div>
          <div className="fp-instructions">
            {instructionsIsLink ? (
              <a
                href={recipe.instructions}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon.External />
                {recipe.instructions}
              </a>
            ) : (
              recipe.instructions
            )}
          </div>
        </>
      ) : (
        <>
          <div className="fp-section-title">{t("recipes.method")}</div>
          <div className="fp-instructions" style={{ color: "var(--muted)" }}>
            <p style={{ margin: "0 0 10px" }}>{t("recipes.noIngredient")}</p>
            <button
              type="button"
              className="fp-textbtn"
              style={{ padding: "6px 10px" }}
              onClick={() => navigate(`/recipes/${id}/edit`)}
            >
              <Icon.Plus />
              {t("recipes.addLink")}
            </button>
          </div>
        </>
      )}

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={t("recipes.deleteConfirmTitle")}
        footer={
          <>
            <button
              type="button"
              className="fp-btn fp-btn-ghost"
              onClick={() => setDeleteOpen(false)}
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className="fp-btn fp-btn-danger"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              <Icon.Trash />
              {t("common.delete")}
            </button>
          </>
        }
      >
        <p style={{ margin: 0, color: "var(--muted)" }}>
          {t("recipes.deleteConfirmMessage", { name: recipe.name })}
        </p>
      </Modal>
    </div>
  );
}
