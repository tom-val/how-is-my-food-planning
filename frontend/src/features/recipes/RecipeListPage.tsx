import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Typography,
  Box,
  Button,
  IconButton,
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
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listRecipes, deleteRecipe } from "../../api/recipeApi";
import type { RecipeWithIngredients } from "../../api/recipeApi";
import { useMemo } from "react";

const CATEGORIES = ["breakfast", "lunch", "dinner", "snack"] as const;

export default function RecipeListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [recipeToDelete, setRecipeToDelete] = useState<RecipeWithIngredients | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const { data: recipes, isLoading } = useQuery({
    queryKey: ["recipes"],
    queryFn: listRecipes,
  });

  const filteredRecipes = useMemo(() => {
    if (!recipes) return [];
    if (!activeFilter) return recipes;
    return recipes.filter(
      ({ recipe }) =>
        recipe.categories.length === 0 ||
        recipe.categories.includes(activeFilter),
    );
  }, [recipes, activeFilter]);

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
          <IconButton
            color="primary"
            onClick={() => navigate("/recipes/ai")}
            title={t("recipes.aiCreate")}
            sx={{ border: 1, borderColor: "primary.main" }}
          >
            <AutoAwesome />
          </IconButton>
          <IconButton
            color="primary"
            onClick={() => navigate("/recipes/new")}
            title={t("recipes.create")}
            sx={{ bgcolor: "primary.main", color: "white", "&:hover": { bgcolor: "primary.dark" } }}
          >
            <Add />
          </IconButton>
        </Box>
      </Box>

      {/* Category filter */}
      <Box display="flex" gap={0.5} mb={2} flexWrap="wrap">
        <Chip
          label={t("recipes.allCategories")}
          size="small"
          color={activeFilter === null ? "primary" : "default"}
          variant={activeFilter === null ? "filled" : "outlined"}
          onClick={() => setActiveFilter(null)}
        />
        {CATEGORIES.map((cat) => (
          <Chip
            key={cat}
            label={t(`planner.${cat}`)}
            size="small"
            color={activeFilter === cat ? "primary" : "default"}
            variant={activeFilter === cat ? "filled" : "outlined"}
            onClick={() => setActiveFilter(activeFilter === cat ? null : cat)}
          />
        ))}
      </Box>

      {!filteredRecipes?.length ? (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <Typography color="text.secondary" variant="body1">
            {t("recipes.empty")}
          </Typography>
        </Box>
      ) : (
        <Box display="flex" flexDirection="column" gap={1.5}>
          {filteredRecipes.map(({ recipe, ingredients }) => (
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

    </Box>
  );
}
