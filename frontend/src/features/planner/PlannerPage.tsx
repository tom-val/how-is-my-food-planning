import { useState, useMemo, useCallback, useRef } from "react";
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
  TextField,
  Menu,
  MenuItem,
  ListItemIcon,
} from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  Add,
  Close,
  Today,
  Shuffle,
  CalendarMonth,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPlan,
  addMeal,
  removeMeal,
  scheduleMeal,
  getMonday,
} from "../../api/plannerApi";
import { listRecipes } from "../../api/recipeApi";
import type { PlannedMeal } from "../../api/plannerApi";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

function randomDateInRange(fromDays: number, toDays: number): string {
  const today = new Date();
  const offset =
    fromDays + Math.floor(Math.random() * (toDays - fromDays + 1));
  today.setDate(today.getDate() + offset);
  return today.toISOString().split("T")[0];
}

function sameDayNextWeek(weekStart: string, dayOfWeek: number): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 7 + dayOfWeek);
  return d.toISOString().split("T")[0];
}

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
  const [recipeSearch, setRecipeSearch] = useState("");

  // Long-press schedule menu state.
  const [scheduleMenu, setScheduleMenu] = useState<{
    anchorEl: HTMLElement;
    meal: PlannedMeal;
    dayOfWeek: number;
  } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const filteredRecipes = useMemo(() => {
    if (!recipes) return [];
    if (!recipeSearch.trim()) return recipes;
    const q = recipeSearch.toLowerCase();
    return recipes.filter(({ recipe }) =>
      recipe.name.toLowerCase().includes(q),
    );
  }, [recipes, recipeSearch]);

  const addMutation = useMutation({
    mutationFn: (recipeId: string) =>
      addMeal(
        planData!.plan.id,
        addDialog!.dayOfWeek,
        addDialog!.mealType,
        recipeId,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plan", weekStart] });
      setAddDialog(null);
      setRecipeSearch("");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (mealId: string) => removeMeal(planData!.plan.id, mealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plan", weekStart] });
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: ({
      date,
      mealType,
      recipeId,
    }: {
      date: string;
      mealType: string;
      recipeId: string;
    }) => scheduleMeal(date, mealType, recipeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plan"] });
      setScheduleMenu(null);
    },
  });

  const getMealsForSlot = (
    dayOfWeek: number,
    mealType: string,
  ): PlannedMeal[] =>
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

  const handleLongPressStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent, meal: PlannedMeal, dayOfWeek: number) => {
      const target = e.currentTarget as HTMLElement;
      longPressTimer.current = setTimeout(() => {
        setScheduleMenu({ anchorEl: target, meal, dayOfWeek });
      }, 1500);
    },
    [],
  );

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleSchedule = (date: string) => {
    if (!scheduleMenu) return;
    scheduleMutation.mutate({
      date,
      mealType: scheduleMenu.meal.mealType,
      recipeId: scheduleMenu.meal.recipeId,
    });
  };

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
                    <Box
                      display="flex"
                      flexWrap="wrap"
                      gap={0.5}
                      alignItems="center"
                    >
                      {meals.map((meal) => (
                        <Chip
                          key={meal.id}
                          label={meal.recipeName}
                          onDelete={() => removeMutation.mutate(meal.id)}
                          size={isMobile ? "small" : "medium"}
                          color="primary"
                          variant="outlined"
                          onMouseDown={(e) =>
                            handleLongPressStart(e, meal, dayIndex)
                          }
                          onMouseUp={handleLongPressEnd}
                          onMouseLeave={handleLongPressEnd}
                          onTouchStart={(e) =>
                            handleLongPressStart(e, meal, dayIndex)
                          }
                          onTouchEnd={handleLongPressEnd}
                          sx={{ cursor: "pointer" }}
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

      {/* Add meal dialog — searchable */}
      <Dialog
        open={!!addDialog}
        onClose={() => {
          setAddDialog(null);
          setRecipeSearch("");
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {t("planner.addMeal")}
          <IconButton
            size="small"
            onClick={() => {
              setAddDialog(null);
              setRecipeSearch("");
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 2, pt: 0 }}>
          <TextField
            fullWidth
            placeholder={t("planner.searchRecipes")}
            value={recipeSearch}
            onChange={(e) => setRecipeSearch(e.target.value)}
            size="small"
            autoFocus
            sx={{ mb: 1 }}
          />
          {!filteredRecipes.length ? (
            <Typography sx={{ py: 2 }} color="text.secondary" align="center">
              {t("recipes.empty")}
            </Typography>
          ) : (
            <List disablePadding>
              {filteredRecipes.map(({ recipe }) => (
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

      {/* Schedule menu — long press on meal chip */}
      <Menu
        anchorEl={scheduleMenu?.anchorEl}
        open={!!scheduleMenu}
        onClose={() => setScheduleMenu(null)}
      >
        <MenuItem disabled sx={{ opacity: "1 !important" }}>
          <Typography variant="subtitle2" color="text.secondary">
            {t("planner.scheduleTitle", {
              name: scheduleMenu?.meal.recipeName,
            })}
          </Typography>
        </MenuItem>
        <MenuItem
          onClick={() =>
            handleSchedule(
              sameDayNextWeek(weekStart, scheduleMenu!.dayOfWeek),
            )
          }
        >
          <ListItemIcon>
            <Today fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("planner.sameDayNextWeek")}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleSchedule(randomDateInRange(7, 13))}>
          <ListItemIcon>
            <Shuffle fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("planner.randomNextWeek")}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleSchedule(randomDateInRange(14, 20))}>
          <ListItemIcon>
            <Shuffle fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("planner.randomWeekAfter")}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleSchedule(randomDateInRange(1, 30))}>
          <ListItemIcon>
            <CalendarMonth fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("planner.random30Days")}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleSchedule(randomDateInRange(1, 180))}>
          <ListItemIcon>
            <CalendarMonth fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("planner.random6Months")}</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}
