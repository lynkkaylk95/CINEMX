CREATE TABLE IF NOT EXISTS movies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  genre TEXT NOT NULL,
  genres_json TEXT NOT NULL DEFAULT '[]',
  type TEXT NOT NULL DEFAULT 'Película',
  year INTEGER NOT NULL,
  rating REAL NOT NULL DEFAULT 0,
  duration TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🎬',
  yt TEXT NOT NULL UNIQUE,
  thumb TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  badge TEXT NOT NULL DEFAULT '',
  episodes_json TEXT NOT NULL DEFAULT '[]',
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_movies_added_at ON movies(added_at DESC);
CREATE INDEX IF NOT EXISTS idx_movies_year ON movies(year);
CREATE INDEX IF NOT EXISTS idx_movies_type ON movies(type);

CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_hash TEXT NOT NULL,
  attempted_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_admin_attempts_ip_time
  ON admin_login_attempts(ip_hash, attempted_at);
