import { useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  Print,
  Person,
  PersonOff,
  Casino,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPlan,
  addMeal,
  removeMeal,
  scheduleMeal,
  assignPlan,
  getMonday,
} from "../../api/plannerApi";
import { listRecipes } from "../../api/recipeApi";
import { getMyFamily } from "../../api/familyApi";
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [weekOffset, setWeekOffset] = useState(0);
  const [addDialog, setAddDialog] = useState<{
    dayOfWeek: number;
    mealType: string;
  } | null>(null);
  const [recipeSearch, setRecipeSearch] = useState("");

  // Assign menu state.
  const [assignAnchorEl, setAssignAnchorEl] = useState<HTMLElement | null>(null);

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

  const { data: familyData } = useQuery({
    queryKey: ["family", "my"],
    queryFn: getMyFamily,
  });

  const assignMutation = useMutation({
    mutationFn: ({ assignedTo, assignedName }: { assignedTo: string | null; assignedName: string | null }) =>
      assignPlan(planData!.plan.id, assignedTo, assignedName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plan", weekStart] });
      setAssignAnchorEl(null);
    },
  });

  const getRecipesForMealType = useCallback(
    (mealType: string) => {
      if (!recipes) return [];
      return recipes.filter(
        ({ recipe }) =>
          recipe.categories.length === 0 ||
          recipe.categories.includes(mealType),
      );
    },
    [recipes],
  );

  const filteredRecipes = useMemo(() => {
    const base = addDialog ? getRecipesForMealType(addDialog.mealType) : recipes ?? [];
    if (!recipeSearch.trim()) return base;
    const q = recipeSearch.toLowerCase();
    return base.filter(({ recipe }) =>
      recipe.name.toLowerCase().includes(q),
    );
  }, [recipes, recipeSearch, addDialog, getRecipesForMealType]);

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

  const longPressTriggered = useRef(false);

  const handleLongPressStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent, meal: PlannedMeal, dayOfWeek: number) => {
      longPressTriggered.current = false;
      const target = e.currentTarget as HTMLElement;
      longPressTimer.current = setTimeout(() => {
        longPressTriggered.current = true;
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

  const handleChipClick = useCallback(
    (meal: PlannedMeal) => {
      if (!longPressTriggered.current) {
        navigate(`/recipes/${meal.recipeId}`);
      }
    },
    [navigate],
  );

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
        <IconButton onClick={() => setWeekOffset((o) => o - 1)} className="no-print">
          <ChevronLeft />
        </IconButton>
        <Box textAlign="center">
          <Typography variant="h4">{t("planner.title")}</Typography>
          <Typography variant="body2" color="text.secondary">
            {weekLabel}
          </Typography>
        </Box>
        <IconButton onClick={() => setWeekOffset((o) => o + 1)} className="no-print">
          <ChevronRight />
        </IconButton>
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        {/* Assignee chip */}
        <Chip
          icon={planData?.plan.assignedName ? <Person /> : <PersonOff />}
          label={planData?.plan.assignedName ?? t("planner.unassigned")}
          variant={planData?.plan.assignedName ? "filled" : "outlined"}
          color={planData?.plan.assignedName ? "primary" : "default"}
          onClick={(e) => setAssignAnchorEl(e.currentTarget)}
          size="small"
          className="no-print-action"
        />
        {/* Print-only assignee text */}
        {planData?.plan.assignedName && (
          <Typography className="print-only" variant="body2" fontWeight={600}>
            {planData.plan.assignedName}
          </Typography>
        )}

        <Box display="flex" gap={1} className="no-print">
          {weekOffset !== 0 && (
            <Button size="small" onClick={() => setWeekOffset(0)}>
              {t("planner.today")}
            </Button>
          )}
          <Button
            size="small"
            startIcon={<Print />}
            onClick={() => window.print()}
          >
            {t("common.print")}
          </Button>
        </Box>
      </Box>

      {/* Assign menu */}
      <Menu
        anchorEl={assignAnchorEl}
        open={!!assignAnchorEl}
        onClose={() => setAssignAnchorEl(null)}
      >
        <MenuItem
          onClick={() => assignMutation.mutate({ assignedTo: null, assignedName: null })}
        >
          <ListItemIcon><PersonOff fontSize="small" /></ListItemIcon>
          <ListItemText>{t("planner.unassigned")}</ListItemText>
        </MenuItem>
        {familyData?.members.map((member) => (
          <MenuItem
            key={member.userId}
            selected={planData?.plan.assignedTo === member.userId}
            onClick={() =>
              assignMutation.mutate({
                assignedTo: member.userId,
                assignedName: member.displayName,
              })
            }
          >
            <ListItemIcon><Person fontSize="small" /></ListItemIcon>
            <ListItemText>{member.displayName}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      {/* Day cards */}
      <Box display="flex" flexDirection="column" gap={2} className="planner-days-grid">
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
                          onClick={() => handleChipClick(meal)}
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
                        className="no-print"
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
                      <IconButton
                        size="small"
                        className="no-print"
                        title={t("planner.randomRecipe")}
                        onClick={() => {
                          const available = getRecipesForMealType(mealType);
                          if (available.length === 0) return;
                          const pick = available[Math.floor(Math.random() * available.length)];
                          addMeal(planData!.plan.id, dayIndex, mealType, pick.recipe.id).then(() =>
                            queryClient.invalidateQueries({ queryKey: ["plan", weekStart] }),
                          );
                        }}
                        sx={{
                          width: 28,
                          height: 28,
                          border: 1,
                          borderColor: "divider",
                          borderStyle: "dashed",
                        }}
                      >
                        <Casino fontSize="small" />
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
