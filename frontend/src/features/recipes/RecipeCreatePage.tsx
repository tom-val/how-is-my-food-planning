import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRecipe } from "../../api/recipeApi";
import { RecipeForm } from "./RecipeForm";
import type { AiSuggestedRecipe, IngredientInput } from "../../api/recipeApi";

interface LocationState {
  aiRecipe?: AiSuggestedRecipe;
  prefilledName?: string | null;
}

export default function RecipeCreatePage() {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const state = location.state as LocationState | null;
  const aiRecipe = state?.aiRecipe;
  const prefilledName = state?.prefilledName;

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
    }) => createRecipe(name, instructions, categories, ingredients),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      enqueueSnackbar(t("recipes.saved"), { variant: "success" });
      navigate(`/recipes/${data.recipe.id}`);
    },
  });

  return (
    <RecipeForm
      initialName={aiRecipe?.name ?? prefilledName ?? ""}
      initialInstructions={aiRecipe?.instructions}
      initialCategories={aiRecipe?.categories}
      initialIngredients={aiRecipe?.ingredients}
      onSubmit={(name, instructions, categories, ingredients) =>
        mutation.mutate({ name, instructions, categories, ingredients })
      }
      isSubmitting={mutation.isPending}
      onCancel={() => navigate("/recipes")}
    />
  );
}
