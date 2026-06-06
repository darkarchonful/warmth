-- Up Migration
-- Passwordless email login. We email the user a short numeric code; they type
-- it back to prove they control the inbox, and we issue the usual JWT. Codes
-- are single-use, short-lived, and rate-limited.
--   * One active code per email (PK on email) — a new request replaces the old.
--   * code_hash: SHA-256 of the code, never the plaintext (a DB leak must not
--     hand out live login codes).
--   * attempts: failed verifies; we lock the code after a few to stop guessing
--     (a 6-digit code is only 1e6 wide).
--   * last_sent_at: throttle resends.
CREATE TABLE email_login_codes (
  email        VARCHAR(255) PRIMARY KEY,
  code_hash    VARCHAR(64)  NOT NULL,
  expires_at   TIMESTAMP    NOT NULL,
  attempts     INTEGER      NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMP    NOT NULL DEFAULT now(),
  created_at   TIMESTAMP    NOT NULL DEFAULT now()
);

-- Down Migration
DROP TABLE IF EXISTS email_login_codes;
