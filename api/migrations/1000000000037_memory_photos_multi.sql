-- Up Migration
-- Let each partner add up to a few photos per memory (a small gallery), not
-- just one. Drop the one-row-per-(memory, uploader) PK; give each photo its
-- own surrogate id. memory_id + uploaded_by stay as plain columns so we can
-- still couple-scope reads and enforce own-only deletes / the per-user cap.
-- Existing rows get ids via the new sequence.
ALTER TABLE memory_photos ADD COLUMN id serial;
ALTER TABLE memory_photos DROP CONSTRAINT memory_photos_pkey;
ALTER TABLE memory_photos ADD PRIMARY KEY (id);
CREATE INDEX IF NOT EXISTS idx_memory_photos_memory ON memory_photos(memory_id);
