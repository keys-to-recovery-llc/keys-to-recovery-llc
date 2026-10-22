-- Keys to Recovery LLC — initial D1 schema
-- See docs/API-CONTRACT.md for the interface this schema serves.

-- Users. password_hash is NULL for migrated users until they set a
-- password through the first-login flow (see API-CONTRACT.md §4.8).
-- password_hash format when set: pbkdf2-sha256$<iterations>$<salt b64>$<hash b64>
CREATE TABLE users (
  id                TEXT PRIMARY KEY,
  email             TEXT UNIQUE,
  full_name         TEXT NOT NULL,
  role              TEXT NOT NULL DEFAULT 'user',
  external_id       TEXT UNIQUE,            -- original platform user ID, when migrated
  password_hash     TEXT,                   -- NULL until a password is set
  must_set_password INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL
);

-- Server-side sessions so logout truly revokes. The cookie carries an
-- HMAC-signed opaque token; only its SHA-256 hash is stored here.
CREATE TABLE sessions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Single-use password set/reset tokens (first-login flow for migrated
-- users + ordinary password resets). Only the SHA-256 hash is stored.
CREATE TABLE password_reset_tokens (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at    TEXT
);
CREATE INDEX idx_reset_user ON password_reset_tokens(user_id);

-- Form submissions (API-CONTRACT.md §2). kind = 'apply' rows are
-- protected records: no read API exists; retrieval is operator-only
-- via direct database access.
CREATE TABLE submissions (
  id         TEXT PRIMARY KEY,
  kind       TEXT NOT NULL,                 -- apply | investor | feedback | contact
  recipient  TEXT NOT NULL,
  subject    TEXT NOT NULL,
  body       TEXT NOT NULL,
  fields     TEXT,                          -- JSON of the structured form fields
  created_at TEXT NOT NULL
);
CREATE INDEX idx_submissions_kind_created ON submissions(kind, created_at);

-- Navigation app-logs (API-CONTRACT.md §5). Fire-and-forget analytics.
CREATE TABLE app_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT REFERENCES users(id),
  page       TEXT NOT NULL,
  created_at TEXT NOT NULL
);
