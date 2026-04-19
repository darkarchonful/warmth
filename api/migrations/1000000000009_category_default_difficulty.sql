-- Up Migration
ALTER TABLE categories ADD COLUMN default_difficulty INTEGER NOT NULL DEFAULT 3;

UPDATE categories SET default_difficulty = 1 WHERE name IN ('Daily', 'Chill');
UPDATE categories SET default_difficulty = 2 WHERE name IN ('Creative', 'Romance', 'Food');
UPDATE categories SET default_difficulty = 3 WHERE name IN ('Seasonal', 'Sporty');
UPDATE categories SET default_difficulty = 4 WHERE name = 'Travel';
UPDATE categories SET default_difficulty = 5 WHERE name = 'Adventures';

-- Auto-inherit difficulty from category on insert unless explicitly set
CREATE OR REPLACE FUNCTION set_activity_default_difficulty()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.difficulty = 3 AND NEW.category_id IS NOT NULL THEN
    SELECT default_difficulty INTO NEW.difficulty FROM categories WHERE id = NEW.category_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER activity_default_difficulty
BEFORE INSERT ON activities
FOR EACH ROW EXECUTE FUNCTION set_activity_default_difficulty();

-- Down Migration
DROP TRIGGER IF EXISTS activity_default_difficulty ON activities;
DROP FUNCTION IF EXISTS set_activity_default_difficulty();
ALTER TABLE categories DROP COLUMN default_difficulty;
