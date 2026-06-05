-- Up Migration
-- Ledger for server-scheduled pushes (the hourly scheduler.js CronJob).
-- Serves two jobs at once:
--   1. Dedup / multi-run safety — send is gated on INSERT .. ON CONFLICT DO
--      NOTHING against the (user_id, dedup_key) PK, so two overlapping cron
--      runs (or a retried Job) can never double-send the same notification.
--   2. Frequency caps — "max once per N days" is a NOT EXISTS check on
--      (user_id, type, sent_at) within an interval.
-- dedup_key encodes the natural once-per-window unit, usually the user's local
-- date, e.g. 'weekend:2026-06-06' or 'on_a_roll:2026-06-05'.
CREATE TABLE IF NOT EXISTS notifications_log (
    user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type      VARCHAR(64) NOT NULL,
    dedup_key VARCHAR(128) NOT NULL,
    sent_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, dedup_key)
);

-- Supports the frequency-cap lookup: most recent send of a given type per user.
CREATE INDEX IF NOT EXISTS idx_notifications_log_user_type
    ON notifications_log(user_id, type, sent_at DESC);


-- Down Migration
DROP INDEX IF EXISTS idx_notifications_log_user_type;
DROP TABLE IF EXISTS notifications_log;
