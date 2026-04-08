import { useState, useMemo } from "react";
import {
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItemButton,
  ListItemText,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  Add,
  Close,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPlan, addMeal, removeMeal, getMonday } from "../../api/plannerApi";
import { listRecipes } from "../../api/recipeApi";
import type { PlannedMeal } from "../../api/plannerApi";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export default function PlannerPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [weekOffset, setWeekOffset] = useState(0);
  const [addDialog, setAddDialog] = useState<{
    dayOfWeek: number;
    mealType: string;
  } | null>(null);

  const weekStart = useMemo(() => {
    const today = new Date();
    today.setDate(today.getDate() + weekOffset * 7);
    return getMonday(today);
  }, [weekOffset]);

  const { data: planData, isLoading: isPlanLoading } = useQuery({
    queryKey: ["plan", weekStart],
    queryFn: () => getPlan(weekStart),
  });

  const { data: recipes } = useQuery({
    queryKey: ["recipes"],
    queryFn: listRecipes,
  });

  const addMutation = useMutation({
    mutationFn: (recipeId: string) =>
      addMeal(planData!.plan.id, addDialog!.dayOfWeek, addDialog!.mealType, recipeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plan", weekStart] });
      setAddDialog(null);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (mealId: string) => removeMeal(planData!.plan.id, mealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plan", weekStart] });
    },
  });

  const getMealsForSlot = (dayOfWeek: number, mealType: string): PlannedMeal[] =>
    planData?.meals.filter(
      (m) => m.dayOfWeek === dayOfWeek && m.mealType === mealType,
    ) ?? [];

  const weekLabel = useMemo(() => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const fmt = (d: Date) =>
      d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `${fmt(start)} – ${fmt(end)}`;
  }, [weekStart]);

  if (isPlanLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Week navigation */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <IconButton onClick={() => setWeekOffset((o) => o - 1)}>
          <ChevronLeft />
        </IconButton>
        <Box textAlign="center">
          <Typography variant="h4">{t("planner.title")}</Typography>
          <Typography variant="body2" color="text.secondary">
            {weekLabel}
          </Typography>
        </Box>
        <IconButton onClick={() => setWeekOffset((o) => o + 1)}>
          <ChevronRight />
        </IconButton>
      </Box>

      {weekOffset !== 0 && (
        <Box display="flex" justifyContent="center" mb={2}>
          <Button size="small" onClick={() => setWeekOffset(0)}>
            {t("planner.today")}
          </Button>
        </Box>
      )}

      {/* Day cards */}
      <Box display="flex" flexDirection="column" gap={2}>
        {DAY_KEYS.map((dayKey, dayIndex) => (
          <Card key={dayKey}>
            <CardContent sx={{ pb: "12px !important" }}>
              <Typography variant="h6" gutterBottom>
                {t(`days.${dayKey}`)}
              </Typography>

              {MEAL_TYPES.map((mealType) => {
                const meals = getMealsForSlot(dayIndex, mealType);
                return (
                  <Box key={mealType} sx={{ mb: 1 }}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      {t(`planner.${mealType}`)}
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5} alignItems="center">
                      {meals.map((meal) => (
                        <Chip
                          key={meal.id}
                          label={meal.recipeName}
                          onDelete={() => removeMutation.mutate(meal.id)}
                          size={isMobile ? "small" : "medium"}
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                      <IconButton
                        size="small"
                        onClick={() =>
                          setAddDialog({ dayOfWeek: dayIndex, mealType })
                        }
                        sx={{
                          width: 28,
                          height: 28,
                          border: 1,
                          borderColor: "divider",
                          borderStyle: "dashed",
                        }}
                      >
                        <Add fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Add meal dialog */}
      <Dialog
        open={!!addDialog}
        onClose={() => setAddDialog(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {t("planner.addMeal")}
          <IconButton size="small" onClick={() => setAddDialog(null)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {!recipes?.length ? (
            <Typography sx={{ p: 3 }} color="text.secondary">
              {t("recipes.empty")}
            </Typography>
          ) : (
            <List>
              {recipes.map(({ recipe }) => (
                <ListItemButton
                  key={recipe.id}
                  onClick={() => addMutation.mutate(recipe.id)}
                  disabled={addMutation.isPending}
                >
                  <ListItemText primary={recipe.name} />
                </ListItemButton>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
