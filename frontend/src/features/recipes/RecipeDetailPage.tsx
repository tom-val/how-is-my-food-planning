import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRecipe, deleteRecipe } from "../../api/recipeApi";
import { Icon } from "../../components/sage/Icon";
import { Spinner } from "../../components/sage/Spinner";
import { Modal } from "../../components/sage/Modal";
import {
  RecipeCategoryTags,
  RecipeIngredientList,
  RecipeInstructions,
  RecipeTitle,
} from "./RecipeContent";
import { RecipeShareDialog } from "./RecipeShareDialog";
import { LinkIcon, ShareIcon } from "./shareIcons";
import { useRecipeSharing } from "./useRecipeSharing";

export default function RecipeDetailPage() {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const sharing = useRecipeSharing(id!);

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
  const isShared = !!recipe.shareToken;

  const openShare = () => {
    // Create the link up front (idempotent on the server) so the dialog can show it.
    if (!recipe.shareToken) sharing.share.mutate();
    setShareOpen(true);
  };

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
          <RecipeTitle name={recipe.name} />
          <div className="fp-recipe-hero-tags">
            <RecipeCategoryTags categories={recipe.categories} />
            {isShared && (
              <button
                type="button"
                className="fp-recipe-meta-tag fp-recipe-shared-tag"
                onClick={openShare}
                title={t("share.sharedHint")}
              >
                <LinkIcon />
                {t("share.sharedBadge")}
              </button>
            )}
          </div>
        </div>
        <div className="fp-recipe-hero-actions">
          <button type="button" className="fp-btn fp-btn-ghost" onClick={openShare}>
            <ShareIcon />
            {t("share.button")}
          </button>
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

      <RecipeIngredientList ingredients={ingredients} />

      {recipe.instructions ? (
        <>
          <div className="fp-section-title">{t("recipes.instructions")}</div>
          <RecipeInstructions text={recipe.instructions} />
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

      <RecipeShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        recipeName={recipe.name}
        shareToken={recipe.shareToken}
        sharing={sharing}
      />

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
