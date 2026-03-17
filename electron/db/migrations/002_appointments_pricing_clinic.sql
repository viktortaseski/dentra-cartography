-- Add price column to treatments
ALTER TABLE treatments ADD COLUMN price REAL;

-- Clinic settings key-value store
CREATE TABLE IF NOT EXISTS clinic_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Seed default clinic settings
INSERT OR IGNORE INTO clinic_settings (key, value) VALUES
  ('clinic_name',    'My Dental Clinic'),
  ('clinic_address', ''),
  ('clinic_phone',   ''),
  ('clinic_email',   ''),
  ('clinic_website', ''),
  ('dentist_name',   '');

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id   INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  date         TEXT NOT NULL,        -- YYYY-MM-DD
  start_time   TEXT NOT NULL,        -- HH:MM
  end_time     TEXT NOT NULL,        -- HH:MM
  status       TEXT NOT NULL DEFAULT 'scheduled',
  notes        TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
