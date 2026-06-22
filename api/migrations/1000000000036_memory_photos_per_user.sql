-- Up Migration
-- Move from one shared photo per memory to one photo per partner: each user
-- adds (and owns) their own photo; both are visible to both, but neither can
-- touch the other's. PK becomes (memory_id, uploaded_by). Any existing row
-- already has uploaded_by set, so it simply becomes that uploader's photo.
ALTER TABLE memory_photos ALTER COLUMN uploaded_by SET NOT NULL;
ALTER TABLE memory_photos DROP CONSTRAINT memory_photos_pkey;
ALTER TABLE memory_photos ADD PRIMARY KEY (memory_id, uploaded_by);
