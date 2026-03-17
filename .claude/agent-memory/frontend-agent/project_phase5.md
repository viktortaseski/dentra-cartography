---
name: Phase 5 — Frontend feature expansion
description: 6 new features implemented 2026-03-17: Settings page, Calendar view, PatientDetailCard, pricing in treatments, navigation updates
type: project
---

Settings page, CalendarView, PatientDetailCard, pricing in TreatmentForm/Row, Sidebar navigation links, and AppointmentStore all completed on 2026-03-17.

**Why:** Expanding from Phase 4 to build a more complete practice management UI — settings persistence, appointment scheduling, and richer patient context.

**How to apply:** These features are live. The Sidebar now has Calendar and Settings buttons; Dashboard manages `activeView: 'chart' | 'settings' | 'calendar'` state; TopBar accepts optional `viewTitle` prop instead of Edit/Archive buttons (those moved to PatientDetailCard).

Key patterns established:
- `activeView` discriminated union in Dashboard replaces multi-boolean routing
- `AppointmentStore` follows same slice pattern as PatientStore/TreatmentStore
- `AppointmentForm` uses `useAppointmentStore.getState().error` post-submit check (same as PatientForm/TreatmentForm)
- `MiniCalendar` pads day grid with prev/next month days so it always fills complete rows of 7
- `WeekView` derives week dates using `Date.getDay()` anchor from selectedDate (Sun=0 offset)
- `PatientDetailCard` computes age purely from dateOfBirth without storing derived data in state
- `TreatmentForm` price field: empty string = null, parsed float otherwise
- `TopBar` no longer has onEditPatient/onArchivePatient props — those live on PatientDetailCard
