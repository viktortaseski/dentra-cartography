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
| Desktop framework | Electron 31+ |
| Backend (main process) | Node.js + TypeScript |
| Frontend (renderer) | React 18 + TypeScript (strict mode) |
| Build tool | Vite + electron-vite |
| Styling | Tailwind CSS + shadcn/ui |
| State management | Zustand (slice pattern) |
| Database | SQLite via better-sqlite3 |
| IPC | Electron ipcMain / ipcRenderer |
| PDF generation | @react-pdf/renderer |
| Testing — frontend | Vitest + React Testing Library + Playwright |
| Testing — backend | Vitest (Node.js) |
| Packaging | electron-builder (NSIS for Windows, DMG for macOS) |

---

## Project Structure

```
dental/
├── CLAUDE.md
├── electron/                        # Main process (Node.js backend)
│   ├── main.ts                      # Electron app entry, window creation
│   ├── ipc/
│   │   ├── patients.ts
│   │   ├── teeth.ts
│   │   ├── treatments.ts
│   │   └── index.ts
│   ├── db/
│   │   ├── connection.ts            # better-sqlite3 setup + migration runner
│   │   └── migrations/              # 001_initial.sql, 002_*.sql ...
│   ├── models/
│   │   ├── patient.ts
│   │   ├── tooth.ts
│   │   └── treatment.ts
│   └── preload.ts                   # Exposes typed IPC bridge to renderer
│
├── src/                             # Renderer process (React frontend)
│   ├── main.tsx
│   ├── App.tsx
│   ├── types/
│   ├── store/
│   ├── hooks/
│   ├── components/
│   │   ├── chart/
│   │   ├── patients/
│   │   ├── treatments/
│   │   ├── toolbar/
│   │   ├── reports/
│   │   └── layout/
│   ├── lib/
│   │   ├── ipc.ts                   # Typed wrappers around window.electron.*
│   │   ├── toothDefinitions.ts
│   │   ├── conditionConfig.ts
│   │   └── numberingSystems.ts
│   └── pages/
│       ├── Dashboard.tsx
│       ├── ChartView.tsx
│       └── Settings.tsx
│
├── shared/
│   └── types.ts                     # Types shared between main and renderer
│
├── electron-builder.yml
├── vite.config.ts
└── package.json
```

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

---

## Implementation Phases

| Phase | Focus | Status |
|---|---|---|
| 1 | Electron scaffold + Patient CRUD + SQLite | Not started |
| 2 | Interactive SVG dental chart | Not started |
| 3 | Treatment history tracking | Not started |
| 4 | PDF/PNG report generation | Not started |
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
