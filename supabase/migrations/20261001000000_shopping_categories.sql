-- Shopping list categories: user-defined, family-scoped categories (e.g. supermarket
-- sections) used to group items on both the weekly and the general shopping lists.

CREATE TABLE shopping_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 50),
    sort_order INT NOT NULL DEFAULT 0,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_shopping_categories_family_name
    ON shopping_categories(family_id, lower(name));
CREATE INDEX idx_shopping_categories_family ON shopping_categories(family_id);

-- Family-level memory of which category a product name belongs to. Keyed by the
-- normalised item name rather than by list item id, so assignments survive weekly
-- shopping list regeneration and apply to both the weekly and the general lists.
-- item_key is always computed in SQL as lower(btrim(name)) so the .NET API and the
-- Node.js AI processor never disagree on normalisation.
CREATE TABLE shopping_item_categories (
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    item_key TEXT NOT NULL CHECK (item_key <> '' AND item_key = lower(btrim(item_key))),
    category_id UUID NOT NULL REFERENCES shopping_categories(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('ai', 'manual')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (family_id, item_key)
);

-- Supports the ON DELETE CASCADE from shopping_categories.
CREATE INDEX idx_shopping_item_categories_category ON shopping_item_categories(category_id);

-- The AI job table now also carries shopping list categorisation jobs.
ALTER TABLE ai_recipe_jobs
    ADD COLUMN job_type TEXT NOT NULL DEFAULT 'recipe'
    CHECK (job_type IN ('recipe', 'categorise'));

-- The .NET API connects via the service role connection string which bypasses
-- RLS. Enabling RLS with no policies blocks PostgREST/anon access, matching the
-- pattern in 20260413000000_enable_rls.sql.
ALTER TABLE shopping_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_item_categories ENABLE ROW LEVEL SECURITY;
