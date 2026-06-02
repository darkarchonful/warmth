-- Up Migration
-- Premium is a couple-level entitlement: either partner subscribes and both
-- are unlocked. Free tier allows 3 completed memories; the 4th requires
-- premium. premium_expires_at supports subscriptions (NULL = lifetime/never
-- expires); a couple is premium when is_premium AND (expires_at is NULL OR
-- in the future).

ALTER TABLE couples
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS premium_since TIMESTAMP,
  ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS premium_product VARCHAR(64),
  ADD COLUMN IF NOT EXISTS premium_purchaser_user_id INTEGER REFERENCES users(id);


-- Down Migration
ALTER TABLE couples
  DROP COLUMN IF EXISTS is_premium,
  DROP COLUMN IF EXISTS premium_since,
  DROP COLUMN IF EXISTS premium_expires_at,
  DROP COLUMN IF EXISTS premium_product,
  DROP COLUMN IF EXISTS premium_purchaser_user_id;
