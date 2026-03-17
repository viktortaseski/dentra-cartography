---
name: Dark mode and i18n implementation
description: Phase: dark mode (Tailwind class strategy) and trilingual i18n (en/mk/sq) added 2026-03-17
type: project
---

Dark mode and multilingual support were added on 2026-03-17.

**Why:** Clinic targets Macedonian/Albanian-speaking regions; dark mode requested for extended use comfort.

**Key files created:**
- `src/store/uiStore.ts` — Zustand store holding `theme` ('light'|'dark') and `language` ('en'|'mk'|'sq'), persisted to localStorage
- `src/locales/en.ts` — canonical translations + `Translations` type export
- `src/locales/mk.ts` — Macedonian translations satisfying `Translations` type
- `src/locales/sq.ts` — Albanian translations satisfying `Translations` type
- `src/locales/index.ts` — barrel re-export
- `src/lib/i18n.tsx` — `I18nProvider` context + `useTranslation()` hook

**Architecture decisions:**
- `darkMode: 'class'` in tailwind.config.js; `document.documentElement.classList` toggled in App.tsx `useEffect`
- Flash prevention: `src/main.tsx` reads localStorage before React hydrates and adds `dark` class immediately
- No external i18n library; `Translations` type enforces mk/sq parity with en at compile time
- `useUIStore` exported from `src/store/index.ts`
- `I18nProvider` wraps `<Dashboard />` in App.tsx
- Condition labels (12 conditions) come from `t.conditions[key]` in components; `CONDITION_CONFIG.label` kept as English fallback only
- SVG tooth condition colors (medically meaningful) are NOT changed in dark mode — only UI chrome gets dark variants
- `t.days` (7 short), `t.months` (12 full), `t.monthsShort` (12 short) used for calendar localisation
- AppointmentDetailCard derives full weekday names from a local constant rather than t.days to avoid coupling

**How to apply:** When adding new user-visible strings, add them to en.ts first (TypeScript will then error on mk.ts and sq.ts until updated). Always use `useTranslation()` hook in components.
