# UNAIDS LMS — Frontend

Vue 3 + TypeScript npm workspace for the "OIV va gender" learning platform.

Project-wide architecture, tech-stack and plan documents live in the main
project repository (`docs/`). Backend lives in its own repository (`lms-backend`).

## Layout

```
apps/learner       Learner SPA (Vite + Vue 3 + Pinia + vue-router + vue-i18n)
apps/admin         Admin SPA — arrives in Sprint 2
packages/ui        Design tokens (contractual module palette §8.1) + shared components
packages/i18n      Locale files and helpers: uz, kaa, en, ru
packages/api-client  Generated from the backend OpenAPI spec — arrives in Sprint 1
```

## Development

```bash
npm install
npm run dev        # http://localhost:5173, proxies /api to backend :5141
npm run build      # typecheck (vue-tsc) + production build
```

## Non-negotiables

- Every UI string goes through vue-i18n — no hardcoded text in components (§7).
- Module palette HEX values in `packages/ui/src/tokens.css` are contractual
  (§8.1/§32); mirrored in the backend repo (`Lms.Domain/Design/ModulePalette.cs`).
- Module identity is never conveyed by color alone — pair with number/title/icon (§8.3).
- WCAG 2.2 AA: keyboard operability, visible focus, 4.5:1 contrast (§8.3, §21).
- Low bandwidth (§13): initial JS ≤ 170 KB gzipped — CI fails over budget;
  currently ~56 KB.
