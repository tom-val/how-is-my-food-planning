import { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Paper,
  Autocomplete,
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import type { IngredientInput } from "../../api/recipeApi";
import { listIngredientNames } from "../../api/recipeApi";

interface RecipeFormProps {
  initialName?: string;
  initialInstructions?: string | null;
  initialIngredients?: IngredientInput[];
  onSubmit: (
    name: string,
    instructions: string | null,
    ingredients: IngredientInput[],
  ) => void;
  isSubmitting: boolean;
  submitLabel: string;
}

const emptyIngredient = (): IngredientInput => ({
  name: "",
  quantity: null,
  unit: null,
});

export function RecipeForm({
  initialName = "",
  initialInstructions = "",
  initialIngredients,
  onSubmit,
  isSubmitting,
  submitLabel,
}: RecipeFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName);
  const [instructions, setInstructions] = useState(initialInstructions ?? "");
  const [ingredients, setIngredients] = useState<IngredientInput[]>(
    initialIngredients?.length ? initialIngredients : [emptyIngredient()],
  );

  const { data: knownIngredients = [] } = useQuery({
    queryKey: ["ingredient-names"],
    queryFn: listIngredientNames,
  });

  const updateIngredient = (
    index: number,
    field: keyof IngredientInput,
    value: string,
  ) => {
    setIngredients((prev) =>
      prev.map((ing, i) => {
        if (i !== index) return ing;
        if (field === "quantity") {
          return { ...ing, quantity: value === "" ? null : Number(value) };
        }
        return { ...ing, [field]: value || null };
      }),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validIngredients = ingredients.filter((i) => i.name.trim() !== "");
    if (validIngredients.length === 0) return;
    onSubmit(name, instructions || null, validIngredients);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <TextField
        fullWidth
        label={t("recipes.name")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        margin="normal"
        required
      />
      <TextField
        fullWidth
        label={t("recipes.instructions")}
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        margin="normal"
        multiline
        minRows={3}
      />

      <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
        {t("recipes.ingredients")}
      </Typography>

      {ingredients.map((ingredient, index) => (
        <Paper
          key={index}
          variant="outlined"
          sx={{ p: 1.5, mb: 1, display: "flex", gap: 1, alignItems: "center" }}
        >
          <Autocomplete
            freeSolo
            options={knownIngredients}
            value={ingredient.name}
            onInputChange={(_e, value) =>
              updateIngredient(index, "name", value)
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label={t("recipes.ingredientName")}
                size="small"
                required
              />
            )}
            sx={{ flex: 2 }}
          />
          <TextField
            label={t("recipes.quantity")}
            value={ingredient.quantity ?? ""}
            onChange={(e) => updateIngredient(index, "quantity", e.target.value)}
            size="small"
            type="number"
            inputProps={{ step: "any", min: 0 }}
            sx={{ flex: 1 }}
          />
          <TextField
            label={t("recipes.unit")}
            value={ingredient.unit ?? ""}
            onChange={(e) => updateIngredient(index, "unit", e.target.value)}
            size="small"
            sx={{ flex: 1 }}
          />
          <IconButton
            onClick={() =>
              setIngredients((prev) => prev.filter((_, i) => i !== index))
            }
            disabled={ingredients.length <= 1}
            size="small"
          >
            <Delete />
          </IconButton>
        </Paper>
      ))}

      <Button
        startIcon={<Add />}
        onClick={() => setIngredients((prev) => [...prev, emptyIngredient()])}
        sx={{ mb: 2 }}
      >
        {t("recipes.addIngredient")}
      </Button>

      <Box>
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isSubmitting}
          fullWidth
        >
          {submitLabel}
        </Button>
      </Box>
    </Box>
  );
}
