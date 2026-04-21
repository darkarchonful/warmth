-- Up Migration
ALTER TABLE memories
  ADD COLUMN repeat_requested_by INTEGER REFERENCES users(id),
  ADD COLUMN repeat_requested_at TIMESTAMP;

-- Down Migration
ALTER TABLE memories
  DROP COLUMN IF EXISTS repeat_requested_by,
  DROP COLUMN IF EXISTS repeat_requested_at;
