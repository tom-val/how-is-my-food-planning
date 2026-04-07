# Phase 4: Recipes

## Goal

Family members can create, view, edit, and delete recipes. Each recipe has a name, optional instructions, and a list of ingredients (name, quantity, unit).

## Tasks

### Backend
- [ ] Create `Features/Recipes/` folder
- [ ] `RecipeRepository` — CRUD on `recipes` and `recipe_ingredients` tables
- [ ] `RecipeEndpoints`:
  - `GET /v1/recipes` — List all family recipes
  - `POST /v1/recipes` — Create recipe with ingredients
  - `GET /v1/recipes/{id}` — Get recipe with ingredients
  - `PUT /v1/recipes/{id}` — Update recipe and ingredients
  - `DELETE /v1/recipes/{id}` — Delete recipe
- [ ] `RecipeValidators` — Validate recipe name, ingredients (non-empty)
- [ ] Family scoping — all queries filter by user's `family_id`
- [ ] Unit tests

### Frontend
- [ ] Create `features/recipes/` folder
- [ ] Recipe List page — cards or list showing recipe names, ingredient count
- [ ] Create Recipe page — form with name, instructions (textarea), dynamic ingredient list (add/remove rows)
- [ ] Edit Recipe page — same form, pre-populated
- [ ] Recipe Detail page — show name, instructions, ingredient list
- [ ] Delete confirmation dialog
- [ ] Add translations

## Data Model

```
Recipe:
  - name: string (required)
  - instructions: string (optional, multiline)
  - ingredients: array of:
    - name: string (required)
    - quantity: number (optional)
    - unit: string (optional, e.g. "kg", "ml", "vnt")
```

## Verification

- Create recipe with 3 ingredients → appears in list
- Edit recipe (change name, add ingredient) → changes saved
- View recipe detail → shows all fields
- Delete recipe → removed from list
- Other family members see the same recipes
