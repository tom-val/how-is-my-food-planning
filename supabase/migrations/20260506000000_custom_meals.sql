-- Allow custom meals (text-only entries without a linked recipe).
ALTER TABLE planned_meals ALTER COLUMN recipe_id DROP NOT NULL;
ALTER TABLE planned_meals ADD COLUMN custom_name TEXT;

-- Either recipe_id or custom_name must be set, but not both.
ALTER TABLE planned_meals ADD CONSTRAINT planned_meals_recipe_or_custom_check
    CHECK (
        (recipe_id IS NOT NULL AND custom_name IS NULL)
        OR (recipe_id IS NULL AND custom_name IS NOT NULL)
    );
