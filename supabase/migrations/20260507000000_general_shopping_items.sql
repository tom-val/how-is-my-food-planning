-- General (non-week-specific) shopping list: standing household supplies
-- (cleaners, toilet paper, etc.). Scoped directly by family_id, unlike
-- shopping_list_items which is scoped via its weekly plan.

CREATE TABLE general_shopping_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    quantity DECIMAL,
    unit TEXT,
    is_checked BOOLEAN NOT NULL DEFAULT false,
    checked_by TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_general_shopping_family ON general_shopping_items(family_id);

-- The .NET API connects via the service role connection string which bypasses
-- RLS. Enabling RLS with no policies blocks PostgREST/anon access, matching the
-- pattern in 20260413000000_enable_rls.sql.
ALTER TABLE general_shopping_items ENABLE ROW LEVEL SECURITY;
