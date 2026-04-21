-- Up Migration
ALTER TABLE memories ADD COLUMN activity_id INTEGER REFERENCES activities(id);

-- Backfill from checklist where still present
UPDATE memories m
SET activity_id = cl.activity_id
FROM checklist cl
WHERE m.checklist_id = cl.id AND m.activity_id IS NULL;

-- Backfill remaining rows by matching title (title is unique enough in seed data)
UPDATE memories m
SET activity_id = a.id
FROM activities a
WHERE m.activity_id IS NULL AND m.activity_title = a.title;

-- Down Migration
ALTER TABLE memories DROP COLUMN IF EXISTS activity_id;
