-- Couple-scoped custom activities. couple_id NULL = global seed card;
-- non-NULL = private to the creating couple. The swipe feed filter in
-- /activities/next must AND (couple_id IS NULL OR couple_id = $couple)
-- so couples don't see each other's customs.

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS couple_id INTEGER REFERENCES couples(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_activities_couple ON activities(couple_id) WHERE couple_id IS NOT NULL;
