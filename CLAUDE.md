# Dental Cartography — CLAUDE.md

Desktop dental charting application for Windows and macOS.
Built with Electron (Node.js main process) + React + TypeScript (renderer).

---

## Deployment Model: Standalone Desktop App

This is a **fully standalone, offline-first desktop application**. There is no server, no network dependency, and no cloud backend.

- All data is stored locally on the machine running the app
- The app works without an internet connection
- One installation = one clinic workstation
- Multi-workstation / clinic network sync is explicitly out of scope for v1

### Why Standalone (v1)
- Simplest architecture — no server to deploy or maintain
- No patient data leaves the local machine (privacy/compliance benefit)
- Appropriate for single-dentist practices, which are the primary v1 target

### Future: Multi-Workstation (v2 consideration)
If a clinic needs multiple workstations sharing data, v2 options are:
1. **Shared SQLite over LAN** — mount the DB file on a network drive (simple, fragile under concurrent writes)
2. **Embedded sync server** — one workstation runs a local Node.js HTTP server; others connect on the LAN
3. **Cloud backend** — Supabase or self-hosted Postgres replaces SQLite (requires schema migration)

The v1 schema is designed to make any of these migrations additive, not destructive.

---

## Database: Location and Initialization

### Storage Location
The SQLite database file is stored in the **OS user data directory**, resolved at runtime via Electron's `app.getPath('userData')`:

| Platform | Path |
|---|---|
| macOS | `~/Library/Application Support/dental-cartography/dental.db` |
| Windows | `%APPDATA%\dental-cartography\dental.db` |

This path is managed by Electron — never hardcode it. Always use:
```ts
import { app } from 'electron'
const dbPath = path.join(app.getPath('userData'), 'dental.db')
```

### First Launch
On first launch the `userData` directory and `dental.db` file are created automatically by `better-sqlite3` if they don't exist. No manual setup is required by the user.

### Migrations
Every time the app starts, the migration runner in `electron/db/connection.ts`:
1. Opens (or creates) the database file
2. Reads the current `schema_version` from a `meta` table
3. Applies any unapplied numbered migration files in order (`001_initial.sql`, `002_*.sql`, ...)
4. Updates `schema_version`

Migrations run synchronously at startup before any IPC handlers are registered.

### Backup
v1 ships a **"Export Database"** menu item that copies `dental.db` to a user-chosen location. This is the only backup mechanism in v1. Automated backup to a folder is a v2 feature.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop framework | Electron 31.7.7 |
| Backend (main process) | Node.js + TypeScript |
| Frontend (renderer) | React 18 + TypeScript (strict mode) |
| Build tool | Vite 5 + electron-vite 2 |
| Styling | Tailwind CSS 3 |
| State management | Zustand 4 (slice pattern) |
| Database | SQLite via better-sqlite3 11 |
| IPC | Electron ipcMain / ipcRenderer |
| PDF generation | @react-pdf/renderer 3 |
| i18n | Custom context provider (EN, MK, SQ) |
| Testing | Vitest 2 |
| Packaging | electron-builder 24 (NSIS for Windows, DMG for macOS) |

---

## Project Structure

```
dental/
├── CLAUDE.md
├── electron/                          # Main process (Node.js backend)
│   ├── main.ts                        # Electron app entry, window creation
│   ├── preload.ts                     # Exposes typed IPC bridge to renderer
│   ├── ipc/
│   │   ├── index.ts                   # Handler registry
│   │   ├── patients.ts                # Patient CRUD + validation
│   │   ├── teeth.ts                   # Tooth condition handlers + validation
│   │   ├── treatments.ts              # Treatment handlers + validation
│   │   ├── appointments.ts            # Appointment handlers + validation
│   │   └── clinicSettings.ts          # Clinic settings handlers + validation
│   ├── db/
│   │   ├── connection.ts              # better-sqlite3 setup + migration runner
│   │   └── migrations/
│   │       ├── 001_initial.sql        # patients, tooth_conditions, treatments, meta
│   │       └── 002_appointments_pricing_clinic.sql  # appointments, clinic_settings
│   └── models/
│       ├── patient.ts
│       ├── tooth.ts
│       ├── treatment.ts
│       ├── appointment.ts
│       └── clinicSettings.ts
│
├── src/                               # Renderer process (React frontend)
│   ├── main.tsx
│   ├── App.tsx                        # Root component with theme provider
│   ├── types/
│   │   └── index.ts                   # Re-exports shared types for renderer
│   ├── store/
│   │   ├── index.ts
│   │   ├── patientStore.ts            # Patient CRUD + selection state
│   │   ├── chartStore.ts              # Dental chart state + condition picker
│   │   ├── treatmentStore.ts          # Treatment list state
│   │   ├── appointmentStore.ts        # Appointment list + selected date
│   │   └── uiStore.ts                 # Theme + language (persisted to localStorage)
│   ├── pages/
│   │   ├── Dashboard.tsx              # Root layout; manages view routing
│   │   ├── ChartView.tsx              # Dental chart page wrapper
│   │   ├── CalendarView.tsx           # Appointments calendar page
│   │   └── Settings.tsx               # Clinic settings editor
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx            # Left nav with patient list
│   │   │   └── TopBar.tsx             # Top bar with view title + menu
│   │   ├── chart/
│   │   │   ├── DentalChart.tsx        # Main chart (32 teeth, two arches)
│   │   │   ├── ToothSVG.tsx           # Individual tooth SVG (5-6 surfaces)
│   │   │   └── ConditionPicker.tsx    # Condition selection modal
│   │   ├── patients/
│   │   │   ├── PatientCard.tsx        # Sidebar list item
│   │   │   ├── PatientDetailCard.tsx  # Header card for selected patient
│   │   │   └── PatientForm.tsx        # Create/edit patient modal
│   │   ├── treatments/
│   │   │   ├── TreatmentPanel.tsx     # Treatment history panel
│   │   │   ├── TreatmentRow.tsx       # Single treatment row
│   │   │   └── TreatmentForm.tsx      # Add treatment modal
│   │   ├── appointments/
│   │   │   ├── WeekView.tsx           # 7-day calendar grid
│   │   │   ├── MiniCalendar.tsx       # Month picker sidebar
│   │   │   ├── DaySidebar.tsx         # Daily appointment list
│   │   │   ├── AppointmentForm.tsx    # Create/edit appointment modal
│   │   │   ├── AppointmentBlock.tsx   # Block in week grid
│   │   │   └── AppointmentDetailCard.tsx
│   │   ├── reports/
│   │   │   ├── PatientReport.tsx      # Report layout (not fully wired)
│   │   │   ├── ReportButton.tsx       # Trigger (not fully wired)
│   │   │   └── index.ts
│   │   └── toolbar/
│   │       └── index.ts
│   ├── lib/
│   │   ├── ipc.ts                     # Typed wrappers around window.electron.*
│   │   ├── i18n.tsx                   # i18n provider + useTranslation hook
│   │   ├── toothDefinitions.ts        # FDI metadata for all 32 teeth
│   │   ├── conditionConfig.ts         # Condition types + colors
│   │   └── numberingSystems.ts        # FDI ↔ Universal/Palmer conversions
│   ├── locales/
│   │   ├── en.ts                      # English
│   │   ├── mk.ts                      # Macedonian
│   │   ├── sq.ts                      # Albanian
│   │   └── index.ts
│   └── hooks/
│       └── index.ts
│
├── shared/
│   └── types.ts                       # Types shared between main and renderer
│
├── electron.vite.config.ts
├── electron-builder.yml
├── tailwind.config.js
└── package.json
```

---

## Database Schema

### Migration 001 — Initial

| Table | Purpose | Key Details |
|---|---|---|
| `meta` | Schema versioning | `key` (PK), `value` |
| `patients` | Patient demographics | id, full_name, dob, sex, contact, insurance, notes, archived_at, timestamps |
| `tooth_conditions` | Current tooth state | UPSERT on (patient_id, tooth_fdi, surface); latest condition only |
| `treatments` | Audit log | Append-only; includes status, date, price, performed_by (free text), notes |

### Migration 002 — Appointments + Pricing + Clinic

| Table | Purpose | Key Details |
|---|---|---|
| `appointments` | Scheduling | patient_id (FK), title, date (YYYY-MM-DD), start_time, end_time (HH:MM), status, notes |
| `clinic_settings` | Key-value config | clinic_name, address, phone, email, website, dentist_name |

---

## IPC Channels

| Module | Channel | Description |
|---|---|---|
| Patients | `patients:list` | All non-archived patients |
| | `patients:get` | Single patient by ID |
| | `patients:create` | Create new patient |
| | `patients:update` | Partial update |
| | `patients:archive` | Soft-delete |
| Teeth | `teeth:getChart` | All conditions for patient |
| | `teeth:setCondition` | UPSERT tooth surface condition |
| Treatments | `treatments:listForTooth` | Treatments for a tooth |
| | `treatments:listForPatient` | All treatments for patient |
| | `treatments:add` | Append treatment record |
| Appointments | `appointments:list` | All (optionally by date) |
| | `appointments:listForPatient` | Patient's appointments |
| | `appointments:create` | Create appointment |
| | `appointments:update` | Update appointment |
| | `appointments:delete` | Delete appointment |
| Clinic | `clinic:getSettings` | All clinic settings |
| | `clinic:updateSettings` | Partial settings update |

---

## IPC Pattern

Renderer never accesses Node.js APIs directly. All backend calls go through the typed preload bridge.

**Preload** (`electron/preload.ts`):
```ts
contextBridge.exposeInMainWorld('electron', {
  getPatients: () => ipcRenderer.invoke('patients:list'),
  createPatient: (data) => ipcRenderer.invoke('patients:create', data),
})
```

**Main process handler**:
```ts
ipcMain.handle('patients:create', async (_event, data: CreatePatientRequest) => {
  validate(data)
  return db.createPatient(data)
})
```

**Renderer** via `src/lib/ipc.ts`:
```ts
export const getPatients = (): Promise<Patient[]> => window.electron.getPatients()
```

Never use `nodeIntegration: true`. The contextBridge security boundary must be maintained.

---

## Core Domain Rules

### Tooth Numbering
- **Always store FDI numbers internally** (11–18, 21–28, 31–38, 41–48; primary: 51–85)
- Convert to Universal/Palmer **only at render time** using `numberingSystems.ts`

### Two Separate Data Concepts

| Table | Purpose | Mutability |
|---|---|---|
| `tooth_conditions` | Current visual state of each surface | Overwritten on change |
| `treatments` | Full audit log of every procedure | Append-only, never deleted |

When a dentist applies a condition: update `tooth_conditions` AND insert into `treatments`. Two separate writes, never combined.

### Database Migrations
- Never modify an existing migration — always add a new numbered file
- Migrations run synchronously at app startup before IPC handlers are registered

---

## Zustand Stores

| Store | Key State | Key Actions |
|---|---|---|
| `patientStore` | patients[], selectedPatientId | loadPatients, createPatient, updatePatient, archivePatient, selectPatient |
| `chartStore` | chartEntries[], conditionPickerOpen, selectedToothFdi/Surface | loadChart, setCondition, openConditionPicker, closeConditionPicker |
| `treatmentStore` | treatments[] | loadTreatmentsForPatient, loadTreatmentsForTooth, addTreatment |
| `appointmentStore` | appointments[], selectedDate | loadAppointments, createAppointment, updateAppointment, deleteAppointment |
| `uiStore` | theme, language | setTheme, setLanguage (both persisted to localStorage) |

`chartStore.setCondition` automatically creates a `treatments` record (two writes for one user action).

---

## Agents

### `frontend-agent`
React components, SVG dental chart, Zustand stores, IPC calls from renderer, PDF generation.

### `backend-agent`
Electron main process, IPC handlers, SQLite schema/migrations, Node.js business logic, validation.

### Main Claude
Architecture, planning, cross-cutting concerns, CLAUDE.md updates.

---

## Backend Rules (Node.js / Main Process)

- Validate all renderer input before any DB or business logic
- Use `better-sqlite3` synchronously — no async/await in DB layer
- Use parameterized queries — never concatenate SQL strings
- Keep IPC handlers thin — business logic in `models/`, not `ipc/`

---

## Frontend Rules

- No `any` — all props and signatures fully typed
- All IPC calls go through `src/lib/ipc.ts` — never call `window.electron.*` directly in components
- Wrap all IPC calls in try/catch; propagate errors to UI state
- SVG: `aria-label`/`title` on interactive elements, `viewBox` scaling only
- Zustand: no derived data in store, use selectors
- Translations: always use `useTranslation()` hook — no hardcoded English strings

---

## Implementation Phases

| Phase | Focus | Status |
|---|---|---|
| 1 | Electron scaffold + Patient CRUD + SQLite | **Complete** |
| 2 | Interactive SVG dental chart | **Complete** |
| 3 | Treatment history tracking | **Complete** |
| 3b | Appointment scheduling (calendar + week view) | **Complete** |
| 3c | Clinic settings + multi-language (EN/MK/SQ) + dark/light theme | **Complete** |
| 4 | PDF/PNG report generation | **In progress** — components exist, not fully wired |
| 5 | Code signing, installers, auto-update | Not started |

---

## Running the App

```bash
npm install          # Install dependencies
npm run dev          # Dev mode (Vite + Electron)
npx tsc --noEmit     # Type check
npm run test         # All tests
npm run build        # Production build
npm run dist         # Package installer
```

---

## Key Decisions Log

- **Standalone, no server**: Simplest architecture; patient data stays local; multi-workstation is v2
- **SQLite in userData**: OS-appropriate path via `app.getPath('userData')`; auto-created on first launch
- **Electron over Tauri**: No Rust required — main process is Node.js/TypeScript
- **better-sqlite3**: Synchronous API, no async complexity in DB layer
- **FDI as canonical ID**: Stored internally, converted at render
- **contextBridge + preload**: `nodeIntegration: false` always — security boundary maintained
- **`performed_by` as free text in v1**: Column exists for v2 FK migration without data loss
- **Custom i18n over a library**: Lightweight context provider; supports EN, MK (Macedonian), SQ (Albanian)
- **Theme in uiStore + localStorage**: Dark/light toggle persisted across sessions without a DB column
- **Appointments as a separate table**: Keeps scheduling orthogonal to tooth_conditions/treatments; price column in treatments supports future invoicing
