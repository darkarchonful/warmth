-- Up Migration
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  parent_type TEXT NOT NULL CHECK (parent_type IN ('plan', 'memory')),
  parent_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX comments_parent_idx ON comments (parent_type, parent_id, created_at);

ALTER TABLE checklist ADD COLUMN last_comment_seen_a TIMESTAMP;
ALTER TABLE checklist ADD COLUMN last_comment_seen_b TIMESTAMP;
ALTER TABLE memories ADD COLUMN last_comment_seen_a TIMESTAMP;
ALTER TABLE memories ADD COLUMN last_comment_seen_b TIMESTAMP;

-- Down Migration
DROP INDEX IF EXISTS comments_parent_idx;
DROP TABLE IF EXISTS comments;
ALTER TABLE checklist DROP COLUMN IF EXISTS last_comment_seen_a;
ALTER TABLE checklist DROP COLUMN IF EXISTS last_comment_seen_b;
ALTER TABLE memories DROP COLUMN IF EXISTS last_comment_seen_a;
ALTER TABLE memories DROP COLUMN IF EXISTS last_comment_seen_b;
