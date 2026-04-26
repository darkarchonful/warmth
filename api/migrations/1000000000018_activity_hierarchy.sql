-- Activity hierarchy: "journey" parent activities unlock sub-activities
-- when both partners approve the parent on the checklist.

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS parent_activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_journey BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_activities_parent ON activities(parent_activity_id);
CREATE INDEX IF NOT EXISTS idx_activities_journey ON activities(is_journey) WHERE is_journey = TRUE;

ALTER TABLE checklist
  ADD COLUMN IF NOT EXISTS parent_checklist_id INTEGER REFERENCES checklist(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_checklist_parent ON checklist(parent_checklist_id);

ALTER TABLE memories
  ADD COLUMN IF NOT EXISTS journey_steps TEXT[];

-- Seed 4 journeys with 4–5 subs each. Each parent gets is_journey=TRUE,
-- each sub gets parent_activity_id pointing at the parent. Subs are excluded
-- from the swipe feed via the parent_activity_id IS NULL filter in /activities/next.
DO $$
DECLARE
  j1 INT; j2 INT; j3 INT; j4 INT;
BEGIN
  -- Skip if already seeded (idempotent).
  IF EXISTS (SELECT 1 FROM activities WHERE is_journey = TRUE) THEN
    RETURN;
  END IF;

  INSERT INTO activities (category_id, title, tagline, seasons, difficulty, is_journey)
  VALUES (4, 'Visit a new country', 'A trip somewhere neither of you has been', ARRAY['all'], 5, TRUE)
  RETURNING id INTO j1;

  INSERT INTO activities (category_id, title, tagline, seasons, difficulty, parent_activity_id) VALUES
    (4, 'Pack the night before', 'Lay it all out together — no last-minute panic', ARRAY['all'], 1, j1),
    (4, 'Learn 5 phrases in the language', 'Hello, thank you, two beers please', ARRAY['all'], 1, j1),
    (4, 'Map the must-sees', 'Pick three places each — compare lists', ARRAY['all'], 1, j1),
    (4, 'Plan the first meal', 'Find the spot before you land', ARRAY['all'], 1, j1),
    (4, 'Pick a keepsake to bring home', 'Something small, something you''ll see daily', ARRAY['all'], 1, j1);

  INSERT INTO activities (category_id, title, tagline, seasons, difficulty, is_journey)
  VALUES (4, 'Weekend road trip', 'Anywhere two tanks of gas gets you', ARRAY['spring','summer','autumn'], 3, TRUE)
  RETURNING id INTO j2;

  INSERT INTO activities (category_id, title, tagline, seasons, difficulty, parent_activity_id) VALUES
    (4, 'Make a road-trip playlist', 'One song each, take turns — no skipping', ARRAY['all'], 1, j2),
    (4, 'Map three photo stops', 'Scenic lookouts, weird roadside signs, whatever', ARRAY['all'], 1, j2),
    (4, 'Buy snacks for the drive', 'Grocery run, ten minutes, no planning', ARRAY['all'], 1, j2),
    (4, 'Trade one memory per hour', 'A story from before you met, every hour on the road', ARRAY['all'], 1, j2);

  INSERT INTO activities (category_id, title, tagline, seasons, difficulty, is_journey)
  VALUES (1, 'Cabin weekend', 'Off-grid, just the two of you', ARRAY['all'], 3, TRUE)
  RETURNING id INTO j3;

  INSERT INTO activities (category_id, title, tagline, seasons, difficulty, parent_activity_id) VALUES
    (8, 'Cook something you never cook at home', 'The recipe you always scroll past', ARRAY['all'], 2, j3),
    (1, 'Stargaze one night', 'Lights off, blanket out, look up', ARRAY['all'], 1, j3),
    (2, 'Read one chapter aloud', 'One of you reads, the other listens', ARRAY['all'], 1, j3),
    (2, 'No-phone dinner', 'Both phones in another room', ARRAY['all'], 1, j3);

  INSERT INTO activities (category_id, title, tagline, seasons, difficulty, is_journey)
  VALUES (3, 'Learn a dance together', 'Pick one, practice for a week', ARRAY['all'], 2, TRUE)
  RETURNING id INTO j4;

  INSERT INTO activities (category_id, title, tagline, seasons, difficulty, parent_activity_id) VALUES
    (3, 'Pick the song', 'Three minutes, pick together, no second-guessing', ARRAY['all'], 1, j4),
    (3, 'Practice one minute before dinner', 'Tiny daily rep, five days', ARRAY['all'], 1, j4),
    (3, 'Film one take', 'Phone on the counter, one try', ARRAY['all'], 1, j4),
    (3, 'Show someone', 'A friend, a parent, a camera roll post', ARRAY['all'], 1, j4);
END $$;
