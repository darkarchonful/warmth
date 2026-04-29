-- Loved-memory nudges: occasional resurfacing of past activities the couple
-- enjoyed (or never rated, giving them a second chance).
ALTER TABLE memories
  ADD COLUMN IF NOT EXISTS last_nudged_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS nudge_response_a BOOLEAN,
  ADD COLUMN IF NOT EXISTS nudge_response_b BOOLEAN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS next_nudge_at_swipe INTEGER;
