import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Typography,
  Box,
  Button,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRecipe, deleteRecipe } from "../../api/recipeApi";

export default function RecipeDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["recipes", id],
    queryFn: () => getRecipe(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteRecipe(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      navigate("/recipes");
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

  const { recipe, ingredients } = data;

  return (
    <Box maxWidth={600} mx="auto">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">{recipe.name}</Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => navigate(`/recipes/${id}/edit`)}
          >
            {t("common.edit")}
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            {t("common.delete")}
          </Button>
        </Box>
      </Box>

      {recipe.instructions && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t("recipes.instructions")}
          </Typography>
          <Typography whiteSpace="pre-wrap">{recipe.instructions}</Typography>
        </Paper>
      )}

      <Typography variant="h6" gutterBottom>
        {t("recipes.ingredients")} ({ingredients.length})
      </Typography>
      <Paper>
        <List>
          {ingredients.map((ingredient, index) => (
            <Box key={ingredient.id}>
              {index > 0 && <Divider />}
              <ListItem>
                <ListItemText
                  primary={ingredient.name}
                  secondary={
                    [ingredient.quantity, ingredient.unit]
                      .filter(Boolean)
                      .join(" ") || undefined
                  }
                />
              </ListItem>
            </Box>
          ))}
        </List>
      </Paper>

      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <DialogTitle>{t("recipes.deleteConfirmTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("recipes.deleteConfirmMessage", { name: recipe.name })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            color="error"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {t("common.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
