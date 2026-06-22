-- Up Migration
-- Couple-uploaded photo for a memory, stored in Postgres so it's durable,
-- backed up with the DB, and works across both API replicas without any
-- shared volume. One row per memory (the couple's single chosen photo); kept
-- in its own table so the bytea never sits in the rows the memories list
-- scans. The phone resizes/compresses (~1280px, JPEG ~q0.7) before upload, so
-- rows stay small. When set, the app prefers this over the activity art.
CREATE TABLE IF NOT EXISTS memory_photos (
  memory_id   integer PRIMARY KEY REFERENCES memories(id) ON DELETE CASCADE,
  data        bytea  NOT NULL,
  mime        text   NOT NULL DEFAULT 'image/jpeg',
  width       integer,
  height      integer,
  uploaded_by integer REFERENCES users(id),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
