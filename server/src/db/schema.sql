-- VibeCare schema (v1).
-- Mirrors the previous Supabase tables and replaces auth/triggers with local equivalents.
-- All application-level ownership checks live in the route layer; CHECK constraints
-- here are belt + braces for the cases where bad data would be load-bearing.

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name  TEXT NOT NULL DEFAULT 'Anonymous User',
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  revoked    INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS profiles (
  user_id          TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name     TEXT,
  onboarded_at     TEXT,
  coins            INTEGER NOT NULL DEFAULT 50,
  last_check_in    TEXT,
  current_streak   INTEGER NOT NULL DEFAULT 0,
  longest_streak   INTEGER NOT NULL DEFAULT 0,
  total_check_ins  INTEGER NOT NULL DEFAULT 0,
  hairstyle        TEXT NOT NULL DEFAULT 'long',
  hair_color       TEXT NOT NULL DEFAULT 'brown',
  eye_color        TEXT NOT NULL DEFAULT 'brown_eyes',
  top              TEXT NOT NULL DEFAULT 'basic_shirt',
  bottom           TEXT NOT NULL DEFAULT 'basic_pants',
  accessory        TEXT NOT NULL DEFAULT 'none',
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS shop_items (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  category    TEXT NOT NULL,
  price       INTEGER NOT NULL CHECK (price >= 0),
  icon        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_shop_items_category ON shop_items(category, price);

CREATE TABLE IF NOT EXISTS user_inventory (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  item_id      TEXT NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
  purchased_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, item_id)
);
CREATE INDEX IF NOT EXISTS idx_user_inventory_user ON user_inventory(user_id);

CREATE TABLE IF NOT EXISTS mood_entries (
  id                         TEXT PRIMARY KEY,
  user_id                    TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  mood                       INTEGER NOT NULL CHECK (mood BETWEEN 1 AND 5),
  sleep_hours                REAL,
  physical_activity_minutes  INTEGER,
  screen_time_minutes        INTEGER,
  hydration_ml               INTEGER,
  location                   TEXT,
  notes                      TEXT,
  created_at                 TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_created ON mood_entries(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS calendar_events (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  start_iso  TEXT NOT NULL,
  end_iso    TEXT NOT NULL,
  date       TEXT NOT NULL,
  category   TEXT NOT NULL,
  notes      TEXT,
  color      TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_date ON calendar_events(user_id, date);

CREATE TABLE IF NOT EXISTS event_notes (
  event_id   TEXT PRIMARY KEY REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  notes      TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS community_messages (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  flagged       INTEGER NOT NULL DEFAULT 0,
  flag_reason   TEXT,
  flag_severity TEXT CHECK (flag_severity IN ('low','medium','high','critical'))
);
CREATE INDEX IF NOT EXISTS idx_community_created ON community_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_flagged ON community_messages(flagged) WHERE flagged = 1;

CREATE TABLE IF NOT EXISTS settings (
  user_id              TEXT PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
  ai_provider          TEXT NOT NULL DEFAULT 'template'
                        CHECK (ai_provider IN ('template','remote')),
  ai_model             TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash',
  crisis_sensitivity   TEXT NOT NULL DEFAULT 'medium'
                        CHECK (crisis_sensitivity IN ('low','medium','high')),
  ai_key_ciphertext    TEXT,
  ai_key_iv            TEXT,
  ai_key_tag           TEXT,
  has_key              INTEGER NOT NULL DEFAULT 0,
  onboarding_payload   TEXT,
  onboarding_support   TEXT,
  updated_at           TEXT NOT NULL DEFAULT (datetime('now'))
);