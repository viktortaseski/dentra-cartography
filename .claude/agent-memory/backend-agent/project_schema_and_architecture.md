---
name: project_schema_and_architecture
description: Schema structure, IPC channels, model patterns, and key architectural decisions for the Dental Cartography Electron backend
type: project
---

## Database Schema

### Migration 001 (`001_initial.sql`)

- `meta(key TEXT PK, value TEXT NOT NULL)` — stores `schema_version` as a string integer
- `patients(id, full_name, date_of_birth, sex CHECK IN ('male','female','other'), phone, email, address, insurance_provider, insurance_policy, medical_alerts, notes, archived_at, created_at, updated_at)`
- `tooth_conditions(id, patient_id FK CASCADE, tooth_fdi INTEGER, surface TEXT, condition TEXT DEFAULT 'healthy', updated_at, UNIQUE(patient_id, tooth_fdi, surface))` — CURRENT STATE only, overwritten on change
- `treatments(id, patient_id FK CASCADE, tooth_fdi, surface, condition_type, status CHECK IN ('planned','completed','referred'), date_performed, performed_by, notes, created_at)` — APPEND-ONLY, never updated or deleted

### Migration 002 (`002_appointments_pricing_clinic.sql`)

- `treatments` gains an additional column: `price REAL` (nullable)
- `clinic_settings(key TEXT PK, value TEXT NOT NULL)` — key-value store, seeded with 6 defaults: `clinic_name`, `clinic_address`, `clinic_phone`, `clinic_email`, `clinic_website`, `dentist_name`
- `appointments(id, patient_id FK CASCADE, title TEXT NOT NULL, date TEXT NOT NULL, start_time TEXT NOT NULL, end_time TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'scheduled', notes TEXT, created_at, updated_at)`
  - Indexes: `idx_appointments_date(date)`, `idx_appointments_patient(patient_id)`
  - Valid statuses: `'scheduled' | 'completed' | 'cancelled' | 'no_show'`

Current migration version: 2.

## IPC Channel Names (must match preload)

- `patients:list`, `patients:get`, `patients:create`, `patients:update`, `patients:archive`
- `teeth:getChart`, `teeth:setCondition`
- `treatments:listForTooth`, `treatments:listForPatient`, `treatments:add`
- `clinic:getSettings`, `clinic:updateSettings`
- `appointments:list`, `appointments:listForPatient`, `appointments:create`, `appointments:update`, `appointments:delete`

## Key Types (shared/types.ts)

- Patient uses `fullName` (camelCase) mapped from DB column `full_name`
- `ToothCondition` is a union of 12 string literals, not a table
- `Treatment` uses `conditionType` (not `description`) and `datePerformed` (not `performed_at`); includes `price: number | null`
- `AddTreatmentRequest` is `Omit<Treatment, 'id' | 'createdAt'>` — `price` is included automatically
- `archivePatient` (not `deletePatient`) — soft delete via `archived_at` timestamp
- `ClinicSettings` — camelCase keys; model maps them to/from snake_case DB keys via `toDbKey()`
- `Appointment` — camelCase in TypeScript; DB uses `patient_id`, `start_time`, `end_time`, `created_at`, `updated_at`
- `AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'`

## New Model Files (migration 002)

- `electron/models/clinicSettings.ts` — `getClinicSettings()`, `updateClinicSettings(data)`, both call `getDb()` internally
- `electron/models/appointment.ts` — `listAppointments(date?)`, `listAppointmentsForPatient(patientId)`, `createAppointment(data)`, `updateAppointment(id, data)`, `deleteAppointment(id)`; all call `getDb()` internally

## Architecture

- DB is a module-level singleton in `connection.ts`, accessed via `getDb()`
- `initDatabase()` called in `main.ts` before `registerIpcHandlers()`
- All DB calls are synchronous (better-sqlite3)
- `@shared/*` alias resolves to `./shared/` in both main and renderer builds
- Vite config: `electron.vite.config.ts` (not `vite.config.ts`)
- IPC handlers thin: validate in `ipc/`, business logic in `models/`

**Why:** Standalone offline-first desktop app. No server. Patient data stays local.
**How to apply:** Any new DB column/table needs a new numbered migration file. Models call `getDb()` directly; they do not receive the db connection as a parameter (unlike the original treatment.ts which did receive `db` — clinic/appointment models use `getDb()` internally, which is the preferred pattern going forward).
