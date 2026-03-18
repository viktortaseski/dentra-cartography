CREATE TABLE IF NOT EXISTS tooth_notes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  tooth_fdi  INTEGER NOT NULL,
  notes      TEXT    NOT NULL DEFAULT '',
  updated_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(patient_id, tooth_fdi)
);
