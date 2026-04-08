import { useNavigate, useParams } from "react-router-dom";
import { Typography, Box, CircularProgress } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRecipe, updateRecipe } from "../../api/recipeApi";
import { RecipeForm } from "./RecipeForm";
import type { IngredientInput } from "../../api/recipeApi";

export default function RecipeEditPage() {
  const { t } = useTranslation();
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
      ingredients,
    }: {
      name: string;
      instructions: string | null;
      ingredients: IngredientInput[];
    }) => updateRecipe(id!, name, instructions, ingredients),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      navigate(`/recipes/${id}`);
    },
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return <Typography>{t("recipes.notFound")}</Typography>;
  }

  return (
    <Box maxWidth={600} mx="auto">
      <Typography variant="h4" gutterBottom>
        {t("common.edit")}
      </Typography>
      <RecipeForm
        initialName={data.recipe.name}
        initialInstructions={data.recipe.instructions}
        initialIngredients={data.ingredients.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
        }))}
        onSubmit={(name, instructions, ingredients) =>
          mutation.mutate({ name, instructions, ingredients })
        }
        isSubmitting={mutation.isPending}
        submitLabel={t("common.save")}
      />
    </Box>
  );
}
