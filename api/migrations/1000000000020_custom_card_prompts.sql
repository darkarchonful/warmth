-- State for the gamified "write your own card" prompt in the swipe deck.
-- next_prompt_at_swipe = the swipe-count threshold at which the user's
-- next prompt fires (NULL until the unlock rule activates). When a
-- prompt is served, the column is bumped to a new future value drawn
-- from a window so the cadence isn't predictable.
-- prompts_served distinguishes the onboarding moment (0) from recurring
-- prompts (>0) — different copy in the UI.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS next_prompt_at_swipe INTEGER,
  ADD COLUMN IF NOT EXISTS prompts_served INTEGER NOT NULL DEFAULT 0;
