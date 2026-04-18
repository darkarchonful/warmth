ALTER TABLE memories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_memories_viewed_at TIMESTAMP;

-- Initialize updated_at for existing rows
UPDATE memories SET updated_at = completed_at WHERE updated_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_memories_updated ON memories (couple_id, updated_at);
