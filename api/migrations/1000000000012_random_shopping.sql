-- Up Migration
INSERT INTO activities (category_id, title, tagline) VALUES
  ((SELECT id FROM categories WHERE name='Chill'), 'Random shopping together', 'No list, just wander and pick');

-- Down Migration
DELETE FROM activities WHERE title = 'Random shopping together';
