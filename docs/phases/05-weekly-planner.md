# Phase 5: Weekly Planner

## Goal

Family members can plan meals for each day of the week. The planner shows a 7-day grid (Monday–Sunday) with 4 meal slots per day (breakfast, lunch, dinner, snack). Recipes are assigned to slots.

## Tasks

### Backend
- [ ] Create `Features/Planner/` folder
- [ ] `PlannerRepository` — CRUD on `weekly_plans` and `planned_meals` tables
- [ ] `PlannerEndpoints`:
  - `GET /v1/plans?weekStart=2026-04-06` — Get plan for the given week (auto-create if not exists)
  - `POST /v1/plans` — Create plan for a week `{ weekStartDate }`
  - `POST /v1/plans/{id}/meals` — Add meal to plan `{ dayOfWeek, mealType, recipeId }`
  - `DELETE /v1/plans/{id}/meals/{mealId}` — Remove meal from plan
- [ ] `PlannerValidators` — Validate weekStartDate is a Monday, mealType enum
- [ ] Family scoping
- [ ] Unit tests

### Frontend
- [ ] Create `features/planner/` folder
- [ ] Weekly grid component:
  - Columns: Mon–Sun
  - Rows: Breakfast, Lunch, Dinner, Snack
  - Each cell shows assigned recipe name (or empty + "Add" button)
- [ ] "Add Meal" dialog — recipe selection from family recipes list
- [ ] Week navigation (previous/next week buttons, current week label)
- [ ] Tap on assigned recipe → navigate to recipe detail
- [ ] Remove meal (long press or swipe on mobile, button on desktop)
- [ ] Mobile layout: vertical day cards instead of grid (each day is a collapsible section)
- [ ] Add translations

## Design Notes

- `week_start_date` is always a Monday (ISO 8601 week)
- `day_of_week`: 0=Monday, 1=Tuesday, ..., 6=Sunday
- Multiple recipes can be assigned to the same meal slot (e.g. 2 snacks)
- The GET endpoint auto-creates a plan for the requested week if one doesn't exist

## Verification

- Open planner → see current week grid
- Add recipe to Monday breakfast → appears in grid
- Navigate to next week → empty grid
- Remove a meal → disappears from grid
- Other family members see the same plan
