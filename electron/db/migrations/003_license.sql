CREATE TABLE IF NOT EXISTS license_activations (
  id           INTEGER PRIMARY KEY,
  license_key  TEXT NOT NULL UNIQUE,
  licensee     TEXT NOT NULL,
  email        TEXT,
  issued_at    TEXT NOT NULL,
  expires_at   TEXT,
  activated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
