import { useNavigate } from "react-router-dom";
import { Typography, Box, Button } from "@mui/material";
import { Close } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRecipe } from "../../api/recipeApi";
import { RecipeForm } from "./RecipeForm";
import type { IngredientInput } from "../../api/recipeApi";

export default function RecipeCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      name,
      instructions,
      ingredients,
    }: {
      name: string;
      instructions: string | null;
      ingredients: IngredientInput[];
    }) => createRecipe(name, instructions, ingredients),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
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
        onSubmit={(name, instructions, ingredients) =>
          mutation.mutate({ name, instructions, ingredients })
        }
        isSubmitting={mutation.isPending}
        submitLabel={t("common.save")}
      />
    </Box>
  );
}
