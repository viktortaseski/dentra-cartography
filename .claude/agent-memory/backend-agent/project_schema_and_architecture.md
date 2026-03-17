---
name: project_schema_and_architecture
description: Schema structure, IPC channels, model patterns, and key architectural decisions for the Dental Cartography Electron backend
type: project
---

## Database Schema (migration 001)

Tables in `electron/db/migrations/001_initial.sql`:

- `meta(key TEXT PK, value TEXT NOT NULL)` — stores `schema_version` as a string integer
- `patients(id, full_name, date_of_birth, sex CHECK IN ('male','female','other'), phone, email, address, insurance_provider, insurance_policy, medical_alerts, notes, archived_at, created_at, updated_at)`
- `tooth_conditions(id, patient_id FK CASCADE, tooth_fdi INTEGER, surface TEXT, condition TEXT DEFAULT 'healthy', updated_at, UNIQUE(patient_id, tooth_fdi, surface))` — CURRENT STATE only, overwritten on change
- `treatments(id, patient_id FK CASCADE, tooth_fdi, surface, condition_type, status CHECK IN ('planned','completed','referred'), date_performed, performed_by, notes, created_at)` — APPEND-ONLY, never updated or deleted

Current migration version: 1 (only `001_initial.sql` exists).

## IPC Channel Names (must match preload)

- `patients:list`, `patients:get`, `patients:create`, `patients:update`, `patients:archive`
- `teeth:getChart`, `teeth:setCondition`
- `treatments:listForTooth`, `treatments:listForPatient`, `treatments:add`

Note: The task spec used different channel names than what was implemented. The actual channels are as above (matching `preload.ts`).

## Key Types (shared/types.ts)

- Patient uses `fullName` (camelCase) mapped from DB column `full_name`
- `ToothCondition` is a union of 12 string literals, not a table
- `Treatment` uses `conditionType` (not `description`) and `datePerformed` (not `performed_at`)
- `AddTreatmentRequest` is `Omit<Treatment, 'id' | 'createdAt'>`
- `archivePatient` (not `deletePatient`) — soft delete via `archived_at` timestamp

## Architecture

- DB is a module-level singleton in `connection.ts`, accessed via `getDb()`
- `initDatabase()` called in `main.ts` before `registerIpcHandlers()`
- All DB calls are synchronous (better-sqlite3)
- `@shared/*` alias resolves to `./shared/` in both main and renderer builds
- Vite config: `electron.vite.config.ts` (not `vite.config.ts`)

**Why:** Standalone offline-first desktop app. No server. Patient data stays local.
**How to apply:** When adding features, keep IPC channels thin (validate in ipc/, logic in models/). Any new DB column needs a new numbered migration file.
