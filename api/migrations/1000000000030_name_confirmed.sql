-- Up Migration
-- Track whether the user has confirmed their display name. New sign-ups start
-- FALSE so the app can prompt them to replace the email-derived placeholder
-- (e.g. "darkarchonful") with a name they prefer. Existing users have already
-- been using the app under their current name — mark them confirmed so they're
-- never prompted.
ALTER TABLE users ADD COLUMN IF NOT EXISTS name_confirmed BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE users SET name_confirmed = TRUE;
ALTER TABLE users ALTER COLUMN name_confirmed SET DEFAULT FALSE;

-- Down Migration
ALTER TABLE users DROP COLUMN IF EXISTS name_confirmed;
