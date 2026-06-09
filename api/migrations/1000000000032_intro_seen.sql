-- Up Migration
ALTER TABLE users ADD COLUMN IF NOT EXISTS intro_seen BOOLEAN NOT NULL DEFAULT FALSE;
-- Existing users have already been swiping; only brand-new accounts should see
-- the one-time "first card" intro, so backfill everyone to TRUE.
UPDATE users SET intro_seen = TRUE;
ALTER TABLE users ALTER COLUMN intro_seen SET DEFAULT FALSE;
-- Down Migration
ALTER TABLE users DROP COLUMN IF EXISTS intro_seen;
