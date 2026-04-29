-- Enable RLS on all public tables.
-- The .NET API connects via the service role connection string which bypasses RLS,
-- so it retains full access. PostgREST/anon access is blocked by RLS being enabled
-- with no policies, which is what we want — this app does not expose data via
-- PostgREST/anon API. Family-scoped authorisation is enforced in the API layer.

ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recipe_jobs ENABLE ROW LEVEL SECURITY;
