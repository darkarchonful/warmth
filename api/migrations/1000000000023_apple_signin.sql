-- Up Migration
-- Sign in with Apple. Apple users have no google_id (only an Apple `sub`),
-- so google_id becomes nullable and a unique apple_id column is added.
-- A user row has exactly one of (google_id, apple_id) set per provider.

ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_id VARCHAR(255) UNIQUE;
ALTER TABLE users ALTER COLUMN google_id DROP NOT NULL;


-- Down Migration
ALTER TABLE users ALTER COLUMN google_id SET NOT NULL;
ALTER TABLE users DROP COLUMN IF EXISTS apple_id;
