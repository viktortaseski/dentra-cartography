-- Migration 008: Clean up auto-created placeholder patients from early sync runs.
-- These were created with date_of_birth = '1900-01-01' and sex = 'other' by the
-- old resolvePatientId() helper. They have no real treatments and are only
-- referenced by externally-synced appointments.

-- Detach placeholder patients from their external appointments (set patient_id = NULL)
-- so the appointments remain on the calendar.
UPDATE appointments
SET patient_id = NULL
WHERE patient_id IN (
  SELECT p.id FROM patients p
  WHERE p.date_of_birth = '1900-01-01'
    AND p.sex = 'other'
    AND NOT EXISTS (
      SELECT 1 FROM treatments t WHERE t.patient_id = p.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.patient_id = p.id AND (a.source IS NULL OR a.source = 'local')
    )
);

-- Now delete those placeholder patients (no FK references remain).
DELETE FROM patients
WHERE date_of_birth = '1900-01-01'
  AND sex = 'other'
  AND NOT EXISTS (
    SELECT 1 FROM treatments t WHERE t.patient_id = patients.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.patient_id = patients.id AND (a.source IS NULL OR a.source = 'local')
  );
