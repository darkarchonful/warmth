-- Up Migration
-- Store each user's IANA timezone (e.g. 'Europe/Amsterdam') so server-scheduled
-- notifications fire at the user's local time rather than UTC. Captured
-- opportunistically from an X-Timezone request header on /me; stays NULL until
-- the client first reports it (treat NULL as UTC when scheduling).
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(64);


-- Down Migration
ALTER TABLE users
  DROP COLUMN IF EXISTS timezone;
