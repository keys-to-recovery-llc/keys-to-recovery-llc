-- Credit Repair Advocate chat: per-IP daily usage counting.
-- Only a SHA-256 of the caller IP is stored, never the IP itself, and no
-- message content is ever persisted (see worker/src/creditAdvocate.js).
CREATE TABLE credit_chat_usage (
  ip_hash TEXT NOT NULL,
  day     TEXT NOT NULL,                 -- UTC date, YYYY-MM-DD
  count   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ip_hash, day)
);
