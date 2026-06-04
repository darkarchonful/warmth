-- Up Migration
-- Telemetry: the client's OS notification-permission status, reported on /me
-- via an X-Notif-Permission header (mirrors the X-Timezone capture). Lets us
-- see who is actually reachable by push BEFORE a launch announcement, and tell
-- a real denial apart from "never prompted" — which a push_tokens row alone
-- can't (a token implies granted; its absence is ambiguous).
--   'granted' | 'denied' | 'undetermined'
-- Stays NULL until the client first reports it.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notif_permission VARCHAR(16),
  ADD COLUMN IF NOT EXISTS notif_permission_at TIMESTAMP;


-- Down Migration
ALTER TABLE users
  DROP COLUMN IF EXISTS notif_permission,
  DROP COLUMN IF EXISTS notif_permission_at;
