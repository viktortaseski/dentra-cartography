---
name: Phase 4 PDF report generation
description: PatientReport PDF document, ReportButton download trigger, TopBar integration — completed 2026-03-17
type: project
---

Phase 4 (PDF/PNG Report Generation) was implemented on 2026-03-17.

**Why:** Clinicians need a printable patient record summarising chart conditions and full treatment history. @react-pdf/renderer was already in the package.json.

**How to apply:** When extending reports in future phases, build new PDF components in `src/components/reports/` using only @react-pdf/renderer primitives (no HTML, no Tailwind). Export everything from the barrel index.

Key design decisions:
- `PatientReport` is a pure PDF document component — it receives `patient`, `chartEntries`, and `treatments` as props. It has no hooks or store access so it stays composable.
- Chart summary rows are derived at render time from `chartEntries` by flattening surfaces and filtering out `condition === 'healthy'`, sorted ascending by FDI number. This is a pure computation; no selector in the store.
- `ReportButton` uses a discriminated union `GenerationState` (`idle | generating | error`) to manage button state cleanly.
- The download is triggered by dynamically creating an `<a>` element and calling `.click()` — standard browser pattern; no Electron-specific API needed for basic file save.
- `URL.createObjectURL` blob URL is revoked after 10 seconds to avoid memory leaks.
- `TopBar` reads `chartEntries` and `treatments` directly from their Zustand stores — no prop drilling. Both slices are already loaded by the time the patient is selected.
- The `ReportButton` is placed between Edit and Archive in the TopBar actions row.
- All styles inside `PatientReport` use `StyleSheet.create({})` — no inline style objects.
- Fonts: Helvetica (built-in) only — no external font loading needed.
- Brand color `#1d4ed8` (Tailwind blue-700) is used for section headers and table header backgrounds.
- Treatment rows in the history table are sorted newest-first (`datePerformed` desc).
