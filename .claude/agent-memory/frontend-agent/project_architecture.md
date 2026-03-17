---
name: Project architecture overview
description: Electron + React + TypeScript + Tailwind dental cartography app — key structural facts for the frontend agent
type: project
---

This is an **Electron 31 + React 18 + TypeScript (strict) + Tailwind CSS** desktop app built with electron-vite.

**Why:** Standalone, offline-first dental charting tool for single-dentist practices. No server, no cloud.

**How to apply:** Never add network calls, cloud auth, or server-side logic to the frontend. All data goes through the Electron IPC bridge (`window.electron`).

## Path aliases (tsconfig.web.json + electron.vite.config.ts)
- `@/*` → `./src/*`
- `@shared/*` → `./shared/*`

## Key file locations
- Shared types: `shared/types.ts` — source of truth for all domain types
- Renderer type re-exports: `src/types/index.ts` — re-exports from `@shared/types`; components import from `@/types`
- IPC wrappers: `src/lib/ipc.ts` — all `window.electron.*` calls go here
- FDI conversion: `src/lib/numberingSystems.ts` — `fdiToUniversal`, `fdiToPalmer`, `toothLabel`
- Tooth definitions: `src/lib/toothDefinitions.ts` — `PERMANENT_TEETH`, `getToothDefinition`, `ToothDefinition` interface
- Condition config: `src/lib/conditionConfig.ts` — `CONDITION_CONFIG` record keyed on `ToothCondition`
- Patient store: `src/store/patientStore.ts` — Zustand slice pattern
- Layout components: `src/components/layout/` (Sidebar, TopBar)
- Patient components: `src/components/patients/` (PatientCard, PatientForm)
- Chart components: `src/components/chart/` (placeholder, Phase 2)
- Pages: `src/pages/` — Dashboard.tsx, ChartView.tsx, Settings.tsx
- Entry point: `src/main.tsx` → `src/App.tsx` (thin shell, renders Dashboard)
- Styles: `src/styles/globals.css` (Tailwind directives only)

## Page/routing pattern (Phase 1 — no router yet)
App.tsx renders Dashboard directly. Dashboard owns all layout, modal state, and patient selection logic. ChartView is rendered inside Dashboard when a patient is selected. If a router is added in future, App.tsx is the right place to add it.

## FDI numbering conventions
- FDI is always the internal canonical ID (stored in DB and state)
- Conversion to Universal/Palmer happens only at render time via `src/lib/numberingSystems.ts`
- Palmer format used: "UR1"–"UR8", "UL1"–"UL8", "LL1"–"LL8", "LR1"–"LR8"
- Universal mapping: Q1 (11–18) → 8–1, Q2 (21–28) → 9–16, Q3 (31–38) → 24–17, Q4 (41–48) → 25–32

## IPC bridge
The Electron preload exposes `window.electron` (typed as `ElectronAPI` in `shared/types.ts`).
All renderer code must call `src/lib/ipc.ts` wrappers — never `window.electron.*` directly in components.

## Zustand pattern
- Single store per domain using `create<StoreType>()`
- State and actions in the same `create()` call
- Selectors are plain functions outside the store (not stored as derived state)
- No immer middleware in Phase 1 (check before adding it)

## Type conventions
- `interface` for component props and API shapes
- `type` for unions and aliases
- `CreatePatientRequest` = `Omit<Patient, 'id' | 'archivedAt' | 'createdAt' | 'updatedAt'>`
- `UpdatePatientRequest` = `Partial<CreatePatientRequest>`
- `address`, `insuranceProvider`, `insurancePolicy` are NOT in the PatientForm yet — pass as `null` on create

## Styling
Tailwind only — no CSS modules, no inline styles. Clinical color scheme: white/gray bg, blue-600 accents, red-600 for alerts/destructive actions.
