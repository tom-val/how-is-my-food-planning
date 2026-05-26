import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPlan,
  addMeal,
  addCustomMeal,
  removeMeal,
  scheduleMeal,
  assignPlan,
  getMonday,
} from "../../api/plannerApi";
import { listRecipes } from "../../api/recipeApi";
import { getMyFamily } from "../../api/familyApi";
import type { PlannedMeal } from "../../api/plannerApi";
import type { RecipeWithIngredients } from "../../api/recipeApi";
import { Icon } from "../../components/sage/Icon";
import { Spinner } from "../../components/sage/Spinner";
import { Popover } from "../../components/sage/Popover";
import { useMobile } from "../../components/sage/useMobile";
import {
  addDays,
  buildWeekDays,
  isoWeek,
  parseLocalDate,
  weekOffsetLabel,
  weekRangeLabel,
} from "../../components/sage/dateUtils";
import { MEAL_TYPES, type MealType } from "../../components/sage/mealMeta";
import { MealRow } from "./MealRow";
import { AddPicker } from "./AddPicker";
import { MealActionsPopover } from "./MealActionsPopover";
import { DicePop } from "./DicePop";

const SLOTS = MEAL_TYPES;
const TOTAL_SLOTS = 28;

function randomDateInRange(fromDays: number, toDays: number): string {
  const today = new Date();
  const offset = fromDays + Math.floor(Math.random() * (toDays - fromDays + 1));
  today.setDate(today.getDate() + offset);
  return today.toISOString().split("T")[0];
}

function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function PlannerPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useMobile();

  const [weekOffset, setWeekOffset] = useState(() => {
    try {
      const saved = localStorage.getItem("planner.lastWeekStart");
      if (!saved) return 0;
      const savedDate = parseLocalDate(saved);
      const todayMonday = parseLocalDate(getMonday(new Date()));
      const diffMs = savedDate.getTime() - todayMonday.getTime();
      return Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
    } catch {
      return 0;
    }
  });
  const [filter, setFilter] = useState<"all" | "unassigned">("all");
  const [toast, setToast] = useState<string | null>(null);

  const [addAnchor, setAddAnchor] = useState<{
    anchor: HTMLElement;
    dayOfWeek: number;
    slot: MealType;
  } | null>(null);
  const [actionAnchor, setActionAnchor] = useState<{
    anchor: HTMLElement;
    meal: PlannedMeal;
    dayOfWeek: number;
  } | null>(null);
  const [diceAnchor, setDiceAnchor] = useState<{
    anchor: HTMLElement;
    dayOfWeek: number;
    slot: MealType;
    suggested: RecipeWithIngredients | null;
  } | null>(null);
  const [assignAnchor, setAssignAnchor] = useState<HTMLElement | null>(null);

  const weekStart = useMemo(() => {
    const today = new Date();
    today.setDate(today.getDate() + weekOffset * 7);
    return getMonday(today);
  }, [weekOffset]);

  useEffect(() => {
    try {
      localStorage.setItem("planner.lastWeekStart", weekStart);
    } catch {
      /* ignore */
    }
  }, [weekStart]);

  const { data: planData, isLoading: isPlanLoading } = useQuery({
    queryKey: ["plan", weekStart],
    queryFn: () => getPlan(weekStart),
  });
  const { data: recipes } = useQuery({ queryKey: ["recipes"], queryFn: listRecipes });
  const { data: familyData } = useQuery({ queryKey: ["family", "my"], queryFn: getMyFamily });

  const assignMutation = useMutation({
    mutationFn: ({
      assignedTo,
      assignedName,
    }: {
      assignedTo: string | null;
      assignedName: string | null;
    }) => assignPlan(planData!.plan.id, assignedTo, assignedName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plan", weekStart] });
      setAssignAnchor(null);
    },
  });

  const addMutation = useMutation({
    mutationFn: ({
      dayOfWeek,
      slot,
      recipeId,
      isShadow,
    }: {
      dayOfWeek: number;
      slot: MealType;
      recipeId: string;
      isShadow?: boolean;
    }) =>
      addMeal(planData!.plan.id, dayOfWeek, slot, recipeId, isShadow ?? false),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["plan", weekStart] }),
  });
  const customMutation = useMutation({
    mutationFn: ({
      dayOfWeek,
      slot,
      name,
    }: {
      dayOfWeek: number;
      slot: MealType;
      name: string;
    }) => addCustomMeal(planData!.plan.id, dayOfWeek, slot, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["plan", weekStart] }),
  });
  const removeMutation = useMutation({
    mutationFn: (meal: PlannedMeal) => removeMeal(planData!.plan.id, meal.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["plan", weekStart] }),
  });
  const scheduleMutation = useMutation({
    mutationFn: ({
      date,
      slot,
      recipeId,
      isShadow,
    }: {
      date: string;
      slot: MealType;
      recipeId: string;
      isShadow: boolean;
    }) => scheduleMeal(date, slot, recipeId, isShadow),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["plan"] }),
  });

  const monday = parseLocalDate(weekStart);
  const todayMonday = parseLocalDate(getMonday(new Date()));
  const locale = i18n.language;

  const days = useMemo(
    () => buildWeekDays(monday, (k) => t(k), locale),
    [monday, locale, t],
  );

  const lbl = weekOffsetLabel(weekOffset, (k, opts) => t(k, opts));
  const range = weekRangeLabel(monday, locale);
  const weekNo = isoWeek(monday);
  const year = monday.getFullYear();

  const getMealsForSlot = (dayOfWeek: number, slot: MealType): PlannedMeal[] =>
    planData?.meals.filter((m) => m.dayOfWeek === dayOfWeek && m.mealType === slot) ?? [];

  const plannedCount = useMemo(() => {
    if (!planData) return 0;
    const filled = new Set<string>();
    for (const m of planData.meals) filled.add(`${m.dayOfWeek}-${m.mealType}`);
    return filled.size;
  }, [planData]);

  const stripWeeks = useMemo(
    () =>
      [-2, -1, 0, 1, 2].map((off) => {
        const target = weekOffset + off;
        const m = addDays(todayMonday, target * 7);
        return {
          offset: target,
          monday: m,
          label: weekOffsetLabel(target, (k, opts) => t(k, opts)),
          range: weekRangeLabel(m, locale),
          isToday: target === 0,
        };
      }),
    [weekOffset, todayMonday, t, locale],
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const handlePickRecipe = (recipe: RecipeWithIngredients) => {
    if (!addAnchor) return;
    addMutation.mutate({
      dayOfWeek: addAnchor.dayOfWeek,
      slot: addAnchor.slot,
      recipeId: recipe.recipe.id,
    });
    setAddAnchor(null);
  };
  const handlePickCustom = (name: string) => {
    if (!addAnchor) return;
    customMutation.mutate({
      dayOfWeek: addAnchor.dayOfWeek,
      slot: addAnchor.slot,
      name,
    });
    setAddAnchor(null);
  };
  const handleCreateNew = (prefilled: string | null) => {
    navigate("/recipes/new", { state: { prefilledName: prefilled } });
  };

  const handleCopyNextWeek = () => {
    if (!actionAnchor?.meal.recipeId) return;
    const slot = actionAnchor.meal.mealType as MealType;
    const d = addDays(monday, actionAnchor.dayOfWeek + 7);
    scheduleMutation.mutate({
      date: isoDay(d),
      slot,
      recipeId: actionAnchor.meal.recipeId,
      isShadow: actionAnchor.meal.isShadow,
    });
    showToast(t("planner.copiedToast", { when: t("planner.weekLabel.nextHead") + " " + t("planner.weekLabel.nextTail") }));
  };
  const handleScheduleRandom = (fromDays: number, toDays: number, whenLabel: string) => {
    if (!actionAnchor?.meal.recipeId) return;
    scheduleMutation.mutate({
      date: randomDateInRange(fromDays, toDays),
      slot: actionAnchor.meal.mealType as MealType,
      recipeId: actionAnchor.meal.recipeId,
      isShadow: actionAnchor.meal.isShadow,
    });
    showToast(t("planner.copiedToast", { when: whenLabel }));
  };

  const handleDice = (anchor: HTMLElement, dayOfWeek: number, slot: MealType) => {
    if (!recipes || recipes.length === 0) return;
    const matches = recipes.filter(
      ({ recipe }) =>
        recipe.categories.length === 0 || recipe.categories.includes(slot),
    );
    const pool = matches.length > 0 ? matches : recipes;
    // eslint-disable-next-line react-hooks/purity
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setDiceAnchor({ anchor, dayOfWeek, slot, suggested: pick });
  };
  const handleDiceReroll = () => {
    if (!diceAnchor || !recipes) return;
    const matches = recipes.filter(
      ({ recipe }) =>
        recipe.categories.length === 0 || recipe.categories.includes(diceAnchor.slot),
    );
    const pool = matches.length > 0 ? matches : recipes;
    const remaining =
      pool.length > 1 && diceAnchor.suggested
        ? pool.filter((r) => r.recipe.id !== diceAnchor.suggested!.recipe.id)
        : pool;
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    setDiceAnchor({ ...diceAnchor, suggested: pick });
  };
  const handleDiceAccept = () => {
    if (!diceAnchor?.suggested) return;
    addMutation.mutate({
      dayOfWeek: diceAnchor.dayOfWeek,
      slot: diceAnchor.slot,
      recipeId: diceAnchor.suggested.recipe.id,
    });
    setDiceAnchor(null);
  };

  if (isPlanLoading) {
    return <Spinner />;
  }

  return (
    <div className="fp-main-wide">
      <div className="fp-page-head">
        <div>
          <div className="fp-page-eyebrow">
            {t("planner.eyebrow", { week: weekNo, year })}
          </div>
          <h1>
            {t("planner.title")} <em>{t("planner.titleAccent")}</em>
          </h1>
          <div className="fp-page-sub">
            {t("planner.subtitle", {
              range,
              planned: plannedCount,
              total: TOTAL_SLOTS,
            })}
          </div>
        </div>
        <div className="fp-weeknav">
          <button
            type="button"
            onClick={() => setWeekOffset((o) => o - 1)}
            aria-label="Previous week"
          >
            <Icon.Chevron dir="left" />
          </button>
          <span className="fp-weeknav-label">
            <span className="display">{lbl.head}</span>
            {lbl.tail}
          </span>
          <button
            type="button"
            onClick={() => setWeekOffset((o) => o + 1)}
            aria-label="Next week"
          >
            <Icon.Chevron dir="right" />
          </button>
        </div>
      </div>

      {!isMobile && (
        <div className="fp-weekstrip no-print">
          {stripWeeks.map((w) => (
            <button
              key={w.offset}
              type="button"
              className={`fp-weekstrip-item ${w.offset === weekOffset ? "is-active" : ""} ${w.isToday ? "is-today" : ""}`}
              onClick={() => setWeekOffset(w.offset)}
            >
              <span className="fp-weekstrip-label">
                {w.label.head} {w.label.tail}
              </span>
              <span className="fp-weekstrip-range">{w.range}</span>
            </button>
          ))}
          {weekOffset !== 0 && (
            <button
              type="button"
              className="fp-weekstrip-jump"
              onClick={() => setWeekOffset(0)}
            >
              <Icon.Calendar />
              {t("planner.jumpToToday")}
            </button>
          )}
        </div>
      )}

      <div className="fp-toolbar no-print">
        <div className="fp-chipset">
          <button
            type="button"
            className={`fp-chip ${filter === "all" ? "is-active" : ""}`}
            onClick={() => setFilter("all")}
          >
            {t("planner.filters.all")}
          </button>
          <button
            type="button"
            className={`fp-chip ${filter === "unassigned" ? "is-active" : ""}`}
            onClick={() => setFilter("unassigned")}
          >
            <Icon.Plus />
            {t("planner.filters.unassigned")}
          </button>
          <button
            type="button"
            className={`fp-chip ${planData?.plan.assignedName ? "is-active" : ""}`}
            onClick={(e) => setAssignAnchor(e.currentTarget)}
            title={t("planner.assignTo")}
          >
            <Icon.Person />
            {planData?.plan.assignedName ?? t("planner.unassigned")}
          </button>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {isMobile && weekOffset !== 0 && (
            <button
              type="button"
              className="fp-textbtn"
              onClick={() => setWeekOffset(0)}
            >
              <Icon.Calendar />
              {t("planner.today")}
            </button>
          )}
          <button
            type="button"
            className="fp-textbtn"
            onClick={() => window.print()}
          >
            <Icon.Printer />
            {isMobile ? t("planner.print") : t("planner.printWeek")}
          </button>
        </div>
      </div>

      <div className="fp-planner-days">
        {days.map((d, dayIdx) => {
          const visibleSlots =
            filter === "unassigned"
              ? SLOTS.filter((s) => getMealsForSlot(dayIdx, s).length === 0)
              : SLOTS;
          if (filter === "unassigned" && visibleSlots.length === 0) return null;
          return (
            <div
              key={dayIdx}
              className={`fp-day ${d.isToday ? "is-today" : ""} ${d.isPast ? "is-past" : ""}`}
            >
              <div className="fp-day-head">
                <span className="fp-day-name display">{d.name}</span>
                <span className="fp-day-date">{d.date}</span>
                {d.isToday && <span className="fp-day-today">{t("planner.today")}</span>}
                {d.isPast && !d.isToday && (
                  <span className="fp-day-past">{t("planner.past")}</span>
                )}
              </div>
              {visibleSlots.map((slot) => (
                <MealRow
                  key={slot}
                  slot={slot}
                  meals={getMealsForSlot(dayIdx, slot)}
                  onMealClick={(_a, meal) => {
                    if (meal.recipeId) navigate(`/recipes/${meal.recipeId}`);
                  }}
                  onMealLongPress={(anchor, meal) =>
                    setActionAnchor({ anchor, meal, dayOfWeek: dayIdx })
                  }
                  onRemove={(meal) => removeMutation.mutate(meal)}
                  onAdd={(anchor) =>
                    setAddAnchor({ anchor, dayOfWeek: dayIdx, slot })
                  }
                  onDice={(anchor) => handleDice(anchor, dayIdx, slot)}
                />
              ))}
            </div>
          );
        })}
      </div>

      {plannedCount === 0 && filter === "all" && (
        <div className="fp-emptystate">
          <div className="fp-emptystate-mark">
            <Icon.Leaf />
          </div>
          <div className="fp-emptystate-title">
            {t("planner.emptyTitle", { label: `${lbl.head.toLowerCase()} ${lbl.tail}` })}
          </div>
          <div className="fp-emptystate-sub">{t("planner.emptySub")}</div>
        </div>
      )}

      {addAnchor && recipes && (
        <AddPicker
          anchor={addAnchor.anchor}
          slot={addAnchor.slot}
          dayName={days[addAnchor.dayOfWeek].name}
          recipes={recipes}
          onPick={handlePickRecipe}
          onPickCustom={handlePickCustom}
          onCreateNew={handleCreateNew}
          onClose={() => setAddAnchor(null)}
        />
      )}

      {actionAnchor && (
        <MealActionsPopover
          anchor={actionAnchor.anchor}
          meal={actionAnchor.meal}
          onClose={() => setActionAnchor(null)}
          onCopyNextWeek={handleCopyNextWeek}
          onCopyRandomNextWeek={() =>
            handleScheduleRandom(7, 13, t("planner.randomNextWeek"))
          }
          onCopyRandom30Days={() =>
            handleScheduleRandom(1, 30, t("planner.random30Days"))
          }
          onCopyRandom6Months={() =>
            handleScheduleRandom(1, 180, t("planner.random6Months"))
          }
          onOpenRecipe={() => {
            if (actionAnchor.meal.recipeId)
              navigate(`/recipes/${actionAnchor.meal.recipeId}`);
          }}
          onRemove={() => removeMutation.mutate(actionAnchor.meal)}
        />
      )}

      {diceAnchor && (
        <DicePop
          anchor={diceAnchor.anchor}
          slot={diceAnchor.slot}
          suggested={diceAnchor.suggested}
          libraryCount={recipes?.length ?? 0}
          onAccept={handleDiceAccept}
          onReroll={handleDiceReroll}
          onClose={() => setDiceAnchor(null)}
        />
      )}

      {assignAnchor && (
        <Popover
          anchor={assignAnchor}
          onClose={() => setAssignAnchor(null)}
          align="left"
        >
          <div className="fp-popover-head">{t("planner.assignTo")}</div>
          <button
            type="button"
            className="fp-popover-item"
            onClick={() =>
              assignMutation.mutate({ assignedTo: null, assignedName: null })
            }
          >
            <Icon.PersonOff />
            {t("planner.unassigned")}
          </button>
          <div className="fp-popover-divider" />
          {familyData?.members.map((member) => {
            const active = planData?.plan.assignedTo === member.userId;
            return (
              <button
                key={member.userId}
                type="button"
                className="fp-popover-item"
                onClick={() =>
                  assignMutation.mutate({
                    assignedTo: member.userId,
                    assignedName: member.displayName,
                  })
                }
                style={
                  active
                    ? { background: "var(--sage-50)", color: "var(--sage-800)" }
                    : undefined
                }
              >
                <Icon.Person />
                {member.displayName}
                {active && (
                  <span className="fp-popover-item-sub">
                    <Icon.Check />
                  </span>
                )}
              </button>
            );
          })}
        </Popover>
      )}

      {toast && <div className="fp-toast">{toast}</div>}
    </div>
  );
}
