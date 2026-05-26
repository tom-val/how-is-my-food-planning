import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRecipe, updateRecipe } from "../../api/recipeApi";
import { RecipeForm } from "./RecipeForm";
import { Spinner } from "../../components/sage/Spinner";
import type { IngredientInput } from "../../api/recipeApi";

export default function RecipeEditPage() {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["recipes", id],
    queryFn: () => getRecipe(id!),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: ({
      name,
      instructions,
      categories,
      ingredients,
    }: {
      name: string;
      instructions: string | null;
      categories: string[];
      ingredients: IngredientInput[];
    }) => updateRecipe(id!, name, instructions, categories, ingredients),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      enqueueSnackbar(t("recipes.saved"), { variant: "success" });
      navigate(`/recipes/${id}`);
    },
  });

  if (isLoading) return <Spinner />;
  if (!data) {
    return (
      <div className="fp-main-narrow">
        <div className="fp-emptystate">
          <div className="fp-emptystate-title">{t("recipes.notFound")}</div>
        </div>
      </div>
    );
  }

  return (
    <RecipeForm
      isEdit
      initialName={data.recipe.name}
      initialInstructions={data.recipe.instructions}
      initialCategories={data.recipe.categories}
      initialIngredients={data.ingredients.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
      }))}
      onSubmit={(name, instructions, categories, ingredients) =>
        mutation.mutate({ name, instructions, categories, ingredients })
      }
      isSubmitting={mutation.isPending}
      onCancel={() => navigate(`/recipes/${id}`)}
    />
  );
}
