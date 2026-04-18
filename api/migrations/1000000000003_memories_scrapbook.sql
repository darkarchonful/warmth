ALTER TABLE memories
  ADD COLUMN IF NOT EXISTS activity_title TEXT,
  ADD COLUMN IF NOT EXISTS activity_tagline TEXT,
  ADD COLUMN IF NOT EXISTS activity_image_url TEXT,
  ADD COLUMN IF NOT EXISTS activity_category TEXT,
  ADD COLUMN IF NOT EXISTS rating INT,
  ADD COLUMN IF NOT EXISTS mood TEXT;

-- Make FK nullable + SET NULL on delete so memories survive checklist cleanup
ALTER TABLE memories ALTER COLUMN checklist_id DROP NOT NULL;
ALTER TABLE memories DROP CONSTRAINT IF EXISTS memories_checklist_id_fkey;
ALTER TABLE memories
  ADD CONSTRAINT memories_checklist_id_fkey
  FOREIGN KEY (checklist_id) REFERENCES checklist(id) ON DELETE SET NULL;

-- Backfill denormalized fields for existing memories
UPDATE memories m
SET activity_title = a.title,
    activity_tagline = a.tagline,
    activity_image_url = a.image_url,
    activity_category = c.name
FROM checklist cl
JOIN activities a ON a.id = cl.activity_id
JOIN categories c ON c.id = a.category_id
WHERE cl.id = m.checklist_id AND m.activity_title IS NULL;
