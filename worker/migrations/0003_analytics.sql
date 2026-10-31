-- Anonymous first-party usage analytics (see docs/ANALYTICS.md).
-- One row per anonymous count: event name, page key, optional short
-- detail (directory state, category tag, or referrer domain), device
-- class, and timestamp. No cookies, no identifiers, no IP addresses,
-- no user-agent strings, no third parties. Application, contact, and
-- feedback contents are NEVER written here.
CREATE TABLE analytics_events (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  event     TEXT NOT NULL,   -- allowlisted in worker/src/analytics.js
  page      TEXT NOT NULL DEFAULT '',
  detail    TEXT NOT NULL DEFAULT '',
  device    TEXT NOT NULL DEFAULT 'unknown',  -- mobile | desktop | unknown
  referrer  TEXT NOT NULL DEFAULT '',         -- referrer hostname only
  created_at TEXT NOT NULL   -- ISO 8601 UTC
);
CREATE INDEX idx_analytics_events_event_created
  ON analytics_events (event, created_at);
CREATE INDEX idx_analytics_events_page_created
  ON analytics_events (page, created_at);
