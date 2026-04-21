import apiClient from "./client";

export interface PlannedMeal {
  id: string;
  weeklyPlanId: string;
  dayOfWeek: number;
  mealType: string;
  recipeId: string;
  recipeName: string;
  isShadow: boolean;
}

export interface WeeklyPlan {
  id: string;
  familyId: string;
  weekStartDate: string;
  createdBy: string;
  createdAt: string;
  assignedTo: string | null;
  assignedName: string | null;
}

export interface WeeklyPlanWithMeals {
  plan: WeeklyPlan;
  meals: PlannedMeal[];
}

export async function getPlan(
  weekStart: string,
): Promise<WeeklyPlanWithMeals> {
  const { data } = await apiClient.get<WeeklyPlanWithMeals>("/v1/plans", {
    params: { weekStart },
  });
  return data;
}

export async function addMeal(
  planId: string,
  dayOfWeek: number,
  mealType: string,
  recipeId: string,
  isShadow: boolean = false,
): Promise<PlannedMeal> {
  const { data } = await apiClient.post<PlannedMeal>(
    `/v1/plans/${planId}/meals`,
    { dayOfWeek, mealType, recipeId, isShadow },
  );
  return data;
}

export async function removeMeal(
  planId: string,
  mealId: string,
): Promise<void> {
  await apiClient.delete(`/v1/plans/${planId}/meals/${mealId}`);
}

export async function scheduleMeal(
  date: string,
  mealType: string,
  recipeId: string,
  isShadow: boolean = false,
): Promise<PlannedMeal> {
  const { data } = await apiClient.post<PlannedMeal>("/v1/plans/schedule", {
    date,
    mealType,
    recipeId,
    isShadow,
  });
  return data;
}

export async function assignPlan(
  planId: string,
  assignedTo: string | null,
  assignedName: string | null,
): Promise<WeeklyPlan> {
  const { data } = await apiClient.patch<WeeklyPlan>(
    `/v1/plans/${planId}/assign`,
    { assignedTo, assignedName },
  );
  return data;
}

/** Get the Monday of the week containing the given date. */
export function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}
