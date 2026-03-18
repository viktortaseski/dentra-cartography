-- Integration connection config (one row, key-value like clinic_settings)
CREATE TABLE IF NOT EXISTS integration_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

-- Add external sync columns to appointments
ALTER TABLE appointments ADD COLUMN external_id  TEXT;
ALTER TABLE appointments ADD COLUMN source       TEXT NOT NULL DEFAULT 'local';
ALTER TABLE appointments ADD COLUMN patient_name TEXT;

-- Unique constraint to prevent duplicate synced appointments
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_external_id
  ON appointments(external_id) WHERE external_id IS NOT NULL;
