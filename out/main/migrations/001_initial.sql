-- Meta table for tracking migration versions
CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO meta (key, value) VALUES ('schema_version', '0');

-- Patients
CREATE TABLE IF NOT EXISTS patients (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name          TEXT    NOT NULL,
  date_of_birth      TEXT    NOT NULL,
  sex                TEXT    NOT NULL CHECK (sex IN ('male', 'female', 'other')),
  phone              TEXT,
  email              TEXT,
  address            TEXT,
  insurance_provider TEXT,
  insurance_policy   TEXT,
  medical_alerts     TEXT,
  notes              TEXT,
  archived_at        TEXT,
  created_at         TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Current visual state of each tooth surface (overwritten on change)
-- tooth_conditions represents CURRENT STATE only — never use this as history
CREATE TABLE IF NOT EXISTS tooth_conditions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id  INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  tooth_fdi   INTEGER NOT NULL,
  surface     TEXT    NOT NULL,
  condition   TEXT    NOT NULL DEFAULT 'healthy',
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (patient_id, tooth_fdi, surface)
);

-- Append-only treatment log (never updated or deleted)
-- treatments is a full audit history — records are only ever inserted
CREATE TABLE IF NOT EXISTS treatments (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id     INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  tooth_fdi      INTEGER NOT NULL,
  surface        TEXT,
  condition_type TEXT    NOT NULL,
  status         TEXT    NOT NULL CHECK (status IN ('planned', 'completed', 'referred')),
  date_performed TEXT    NOT NULL,
  performed_by   TEXT,
  notes          TEXT,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);
