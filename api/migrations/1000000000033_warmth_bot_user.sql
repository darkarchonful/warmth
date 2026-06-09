-- Up Migration
-- Reserved system user that the scheduler posts stale-plan nudges as. It never
-- logs in (no real google_id, no token issued), never joins a couple, and never
-- registers a push token — so every couples/scheduler query that joins on
-- couples or push_tokens naturally skips it. In the comment thread its messages
-- render on the partner side with the author name "Warmth".
INSERT INTO users (google_id, email, name, name_confirmed, intro_seen)
VALUES ('warmth-system-bot', 'bot@warmth.internal', 'Warmth', TRUE, TRUE)
ON CONFLICT (email) DO NOTHING;

-- Down Migration
DELETE FROM users WHERE email = 'bot@warmth.internal';
