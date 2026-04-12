import { useNavigate, useLocation } from "react-router-dom";
import { Typography, Box, Button } from "@mui/material";
import { Close } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRecipe } from "../../api/recipeApi";
import { RecipeForm } from "./RecipeForm";
import type { AiSuggestedRecipe, IngredientInput } from "../../api/recipeApi";

export default function RecipeCreatePage() {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const aiRecipe = (location.state as { aiRecipe?: AiSuggestedRecipe } | null)?.aiRecipe;

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
    <Box maxWidth={600} mx="auto">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">{t("recipes.create")}</Typography>
        <Button
          variant="outlined"
          startIcon={<Close />}
          onClick={() => navigate("/recipes")}
        >
          {t("common.cancel")}
        </Button>
      </Box>
      <RecipeForm
        initialName={aiRecipe?.name}
        initialInstructions={aiRecipe?.instructions}
        initialCategories={aiRecipe?.categories}
        initialIngredients={aiRecipe?.ingredients}
        onSubmit={(name, instructions, categories, ingredients) =>
          mutation.mutate({ name, instructions, categories, ingredients })
        }
        isSubmitting={mutation.isPending}
        submitLabel={t("common.save")}
      />
    </Box>
  );
}
