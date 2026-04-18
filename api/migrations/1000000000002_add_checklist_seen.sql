ALTER TABLE checklist ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_checklist_viewed_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_checklist_updated ON checklist (couple_id, updated_at);
