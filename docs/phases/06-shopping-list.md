# Phase 6: Shopping List

## Goal

Generate a shopping list from a weekly plan by aggregating all ingredients across all planned meals. Items can be checked off (marking them as bought or already available).

## Tasks

### Backend
- [ ] Create `Features/Shopping/` folder
- [ ] `ShoppingRepository` — CRUD on `shopping_list_items` table
- [ ] `ShoppingEndpoints`:
  - `GET /v1/plans/{id}/shopping-list` — Get or generate shopping list for a plan
  - `PATCH /v1/shopping-list-items/{id}` — Toggle checkbox `{ isChecked }`
- [ ] Shopping list generation logic:
  - Collect all `recipe_ingredients` from all `planned_meals` in the plan
  - Aggregate by `ingredient_name` + `unit` (sum quantities)
  - Create `shopping_list_items` rows
  - If list already exists, preserve checkbox state and update quantities
- [ ] Family scoping
- [ ] Unit tests for aggregation logic

### Frontend
- [ ] Create `features/shopping/` folder
- [ ] Shopping List page:
  - Accessed from the planner (button: "View Shopping List")
  - List of ingredients with checkboxes
  - Show ingredient name, total quantity, unit
  - Checked items move to bottom / appear struck through
  - "Refresh" button to regenerate from plan (warns about losing checkbox state)
- [ ] Real-time checkbox toggling (optimistic update)
- [ ] Sort: unchecked items first, then checked
- [ ] Add translations

## Aggregation Example

If Monday breakfast has "Pancakes" (needs 2 eggs, 200g flour) and Wednesday dinner also has "Pancakes":
- Shopping list shows: eggs × 4, flour × 400g (aggregated)

## Verification

- Plan meals for the week → open shopping list → all ingredients aggregated correctly
- Check an item → it moves to "checked" section
- Uncheck → moves back
- Add more meals → refresh list → new ingredients appear, checked state preserved where possible
- Other family members see the same list and can toggle items
