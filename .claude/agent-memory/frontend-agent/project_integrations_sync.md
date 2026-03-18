---
name: Integrations + Sync feature
description: Integrations Settings tab, Calendar Sync button, and EXT badge on AppointmentBlock — completed 2026-03-18
type: project
---

Implemented the external appointment service integration feature across three areas.

**Why:** Clinic needs to sync appointments from an online booking service into the local calendar.

**How to apply:** When touching appointment, calendar, or settings code, be aware of the `source` field on `Appointment` and the integration IPC wrappers.

## Changes made

### shared/types.ts
- `Appointment` now has `source?: 'local' | 'external'`
- Added `IntegrationConfig { apiUrl, clinicName, username, password }` and `SyncResult { synced, errors }`
- `ElectronAPI` extended with: `getIntegrationConfig`, `saveIntegrationConfig`, `testIntegrationConnection`, `syncExternalAppointments`

### src/lib/ipc.ts
- Imports `IntegrationConfig` and `SyncResult` from `@shared/types`
- Exports: `getIntegrationConfig`, `saveIntegrationConfig`, `testIntegrationConnection`, `syncExternalAppointments`

### src/locales/en.ts + mk.ts + sq.ts
- New keys: `integrations`, `integrationDesc`, `apiUrl`, `clinicNameIntegration`, `usernameField`, `passwordField`, `testConnection`, `connectionSuccess`, `saveConfiguration`, `configSaved`, `sync`, `synced` (function: `(n: number) => string`)

### src/pages/Settings.tsx
- `Tab` type extended to `'clinic' | 'appearance' | 'data' | 'integrations'`
- New `EMPTY_INTEGRATION` constant and `intConfig/intLoading/intSaving/intTesting/intTestResult/intSaved` state
- `useEffect` loads integration config when tab becomes active
- Handlers: `handleIntChange`, `handleTestConnection`, `handleSaveIntegration`
- New Integrations tab panel with API URL, Clinic Name, Username, Password fields + Test Connection + Save buttons

### src/pages/CalendarView.tsx
- Imports `syncExternalAppointments` from `@/lib/ipc` and `useTranslation`
- `SyncStatus` discriminated union: `idle | syncing | success | error`
- `handleSync` calls `syncExternalAppointments()` then `loadAppointments()`, auto-clears after 3–4s
- Sync button bar rendered above WeekView (right-aligned, border-b separated)

### src/components/appointments/AppointmentBlock.tsx
- Shows `<span class="...text-[9px] px-1 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 font-bold">EXT</span>` when `appointment.source === 'external'`
