---
name: Integration Service
description: External appointment sync integration — migration 006, IPC channels, patient resolution strategy
type: project
---

Migration 006 (`006_integration.sql`) adds:
- `integration_settings` table — key-value store (keys: `api_url`, `clinic_name`, `username`, `password`)
- `external_id TEXT`, `source TEXT DEFAULT 'local'`, `patient_name TEXT` columns on `appointments`
- Unique partial index `idx_appointments_external_id` on `appointments(external_id) WHERE external_id IS NOT NULL`

IPC channels registered in `electron/ipc/integration.ts`:
- `integration:getConfig` — returns `IntegrationConfig` (never exposes password to renderer)
- `integration:saveConfig` — upserts all four keys including password
- `integration:testConnection` — POST `/api/auth/login`, returns `{ success, error? }`
- `integration:sync` — authenticates, fetches remote appointments, upserts locally

Patient resolution during sync: tries `SELECT id FROM patients WHERE full_name = ?` first. On no match, inserts a placeholder with `date_of_birth = '1900-01-01'` and `sex = 'other'` to satisfy the `patient_id NOT NULL` FK. This placeholder is detectable by its obviously wrong DOB.

JWT extraction: checks `Set-Cookie: admin_session=<token>` header first, falls back to `body.token` or `body.accessToken`.

**Why:** External scheduling service sends appointments that may not yet have a matching local patient record. Creating a placeholder avoids NULL FK violations without altering the schema constraint.

**How to apply:** When modifying sync logic, preserve the placeholder-patient strategy. If schema is ever altered to allow NULL patient_id, update the resolver and this memory.
