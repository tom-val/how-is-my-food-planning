-- Categories stored as a text array. Empty/null means "all categories".
-- Values: 'breakfast', 'lunch', 'dinner', 'snack'
ALTER TABLE recipes ADD COLUMN categories TEXT[] DEFAULT '{}';
