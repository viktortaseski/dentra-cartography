-- Migration 007: Make appointments.patient_id nullable so external appointments
-- can exist without requiring a matching local patient record.

-- 1. Explicitly delete appointments that belong to [Online] placeholder patients,
--    then delete the placeholder patients themselves.
DELETE FROM appointments WHERE patient_id IN (
  SELECT id FROM patients WHERE full_name LIKE '[Online] %'
);
DELETE FROM patients WHERE full_name LIKE '[Online] %';

-- 2. Recreate appointments with patient_id nullable and ON DELETE SET NULL.
--    SQLite does not support ALTER COLUMN, so we must recreate the table.
CREATE TABLE IF NOT EXISTS appointments_v2 (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id   INTEGER REFERENCES patients(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  date         TEXT NOT NULL,
  start_time   TEXT NOT NULL,
  end_time     TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'scheduled',
  notes        TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
  external_id  TEXT,
  source       TEXT NOT NULL DEFAULT 'local',
  patient_name TEXT
);

INSERT INTO appointments_v2
  SELECT id, patient_id, title, date, start_time, end_time, status, notes,
         created_at, updated_at, external_id, source, patient_name
  FROM appointments;

DROP TABLE appointments;
ALTER TABLE appointments_v2 RENAME TO appointments;

CREATE INDEX IF NOT EXISTS idx_appointments_date     ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient  ON appointments(patient_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_external_id
  ON appointments(external_id) WHERE external_id IS NOT NULL;
