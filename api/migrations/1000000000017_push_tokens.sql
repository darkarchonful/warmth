-- Up Migration
-- Expo push tokens for notifications. One row per device; a user can have many
-- (phone + tablet). Token is unique globally so re-registering the same device
-- under a different user moves ownership rather than duplicating.

CREATE TABLE IF NOT EXISTS push_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    token TEXT UNIQUE NOT NULL,
    platform VARCHAR(10),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);


-- Down Migration
DROP INDEX IF EXISTS idx_push_tokens_user;
DROP TABLE IF EXISTS push_tokens;
