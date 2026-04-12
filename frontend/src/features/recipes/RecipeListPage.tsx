import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { Add, AutoAwesome } from "@mui/icons-material";
import { AiRecipeDialog } from "./AiRecipeDialog";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listRecipes, deleteRecipe } from "../../api/recipeApi";
import type { RecipeWithIngredients } from "../../api/recipeApi";

export default function RecipeListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [recipeToDelete, setRecipeToDelete] = useState<RecipeWithIngredients | null>(null);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);

  const { data: recipes, isLoading } = useQuery({
    queryKey: ["recipes"],
    queryFn: listRecipes,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRecipe(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      setRecipeToDelete(null);
    },
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box maxWidth={600} mx="auto">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">{t("recipes.title")}</Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<AutoAwesome />}
            onClick={() => setIsAiDialogOpen(true)}
          >
            {t("recipes.aiCreate")}
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate("/recipes/new")}
          >
            {t("recipes.create")}
          </Button>
        </Box>
      </Box>

      {!recipes?.length ? (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <Typography color="text.secondary" variant="body1">
            {t("recipes.empty")}
          </Typography>
        </Box>
      ) : (
        <Box display="flex" flexDirection="column" gap={1.5}>
          {recipes.map(({ recipe, ingredients }) => (
            <Card key={recipe.id}>
              <CardActionArea
                onClick={() => navigate(`/recipes/${recipe.id}`)}
              >
                <CardContent sx={{ py: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="h6">{recipe.name}</Typography>
                    <Chip
                      label={`${ingredients.length}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                  {recipe.categories.length > 0 && (
                    <Box display="flex" gap={0.5} mb={0.5}>
                      {recipe.categories.map((cat) => (
                        <Chip key={cat} label={t(`planner.${cat}`)} size="small" variant="outlined" sx={{ height: 20, fontSize: "0.7rem" }} />
                      ))}
                    </Box>
                  )}
                  {ingredients.length > 0 && (
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {ingredients.map((i) => i.name).join(", ")}
                    </Typography>
                  )}
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}

      <Dialog
        open={!!recipeToDelete}
        onClose={() => setRecipeToDelete(null)}
      >
        <DialogTitle>{t("recipes.deleteConfirmTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("recipes.deleteConfirmMessage", { name: recipeToDelete?.recipe.name })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRecipeToDelete(null)}>
            {t("common.cancel")}
          </Button>
          <Button
            color="error"
            onClick={() => recipeToDelete && deleteMutation.mutate(recipeToDelete.recipe.id)}
            disabled={deleteMutation.isPending}
          >
            {t("common.delete")}
          </Button>
        </DialogActions>
      </Dialog>

      <AiRecipeDialog open={isAiDialogOpen} onClose={() => setIsAiDialogOpen(false)} />
    </Box>
  );
}
