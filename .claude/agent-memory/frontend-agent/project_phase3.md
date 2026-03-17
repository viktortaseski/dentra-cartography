---
name: Phase 3 treatment history tracking
description: Treatment store, components, and chart-side auto-create integration — completed 2026-03-17
type: project
---

Phase 3 (Treatment History Tracking) was implemented on 2026-03-17.

**Why:** Dentists need an append-only audit log of every procedure, separate from tooth_conditions (which is the current visual state). Two separate writes per condition change — one to tooth_conditions, one to treatments — was an explicit domain rule.

**How to apply:** When extending treatments in Phase 4 (PDF reports), read from `useTreatmentStore` which holds `Treatment[]` fetched via IPC. The store does client-side filtering for tooth-scoped views rather than making extra IPC calls.

Key design decisions:
- `chartStore.setCondition` uses a dynamic `import('@/store/treatmentStore')` for the refresh call to avoid a circular module dependency (chartStore → treatmentStore → ipc, but treatmentStore also imports from ipc which chartStore already imports).
- Treatment auto-creation from chart is best-effort: failure is silently swallowed so chart writes are not blocked.
- `selectedToothFdi` comes from `useChartStore` in Dashboard; note that `closeConditionPicker` resets `selectedToothFdi` to null — the treatment panel's filter badge will revert to "All Teeth" after the picker closes.
- `TreatmentPanel` has `max-h-64` on its scroll container — appropriate for the v1 layout below the chart.
