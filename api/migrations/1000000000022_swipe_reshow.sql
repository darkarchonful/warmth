-- Re-show skipped cards after 30 days. One re-show only; if they say no
-- twice the card is gone for good.
ALTER TABLE swipes
  ADD COLUMN IF NOT EXISTS re_show_count INT NOT NULL DEFAULT 0;
