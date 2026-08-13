# @wendy/web

Vite 5 + React 19 + TypeScript SPA. The Web tier of Wendy Planner (per ADR-02, ARC-004).

## Quick start

```bash
# from the monorepo root
pnpm install
pnpm --filter @wendy/web dev          # http://localhost:5173
pnpm --filter @wendy/web build        # static dist/
pnpm --filter @wendy/web preview      # serve dist/
pnpm --filter @wendy/web typecheck    # tsc --noEmit
pnpm --filter @wendy/web lint
```

## Stack

- **Vite 5** — build tool, dev server on port 5173.
- **React 19** + **TypeScript 5** (`experimentalDecorators` per ADR-14).
- **TanStack Router** — code-based routing, two lazy route groups: `(dashboard)` and `(public)`.
- **TanStack Query** — provider wired in `main.tsx`; no network calls in Sprint 1.
- **Tailwind CSS 4** — CSS-first config (`@theme` in `src/index.css`).
- **shadcn/ui** — one primitive today (`Button`); more added as features need them.
- **i18next** + **react-i18next** + **i18next-browser-languagedetector** — `en` / `es`, cookie → `Accept-Language` → fallback.
- **@wendy/contracts** — shared DTOs and branded ID types.

## Folder layout

```
src/
  features/         # vertical features (one folder per feature)
    locale-switcher/
  i18n/             # i18next config + locale JSON files
    locales/{en,es}/common.json
  routes/
    (dashboard)/    # authenticated screens, lazy chunk
    (public)/       # guest invitation at /i/:token, lazy chunk
  shared/
    auth/           # Sprint 2+ (ARC-013)
    api-client/     # Sprint 2+ (Sprint 2)
    ui/             # shadcn primitives
    lib/            # cross-cutting helpers (cn, etc.)
  index.css         # Tailwind 4 + shadcn CSS variables
  main.tsx          # bootstrap
  router.tsx        # route tree (TanStack Router)
```

## Locale switcher

`features/locale-switcher/locale-switcher.tsx` toggles `en` ↔ `es` and writes a `wendy_locale` cookie (1-year max-age). The `LanguageDetector` reads it on next visit.

## Where things go

- A new feature → `src/features/<feature-name>/`.
- A new shadcn primitive → `src/shared/ui/<component>.tsx`.
- A new screen → `src/routes/<group>/<screen>.tsx`, then register it in `src/router.tsx`.
- A new locale namespace → `src/i18n/locales/<lng>/<namespace>.json`.

## Defer to later stories

- Auth gate on `(dashboard)` — ARC-013.
- Public token validation on `(public)` — ARC-016.
- First real API call (HTTP client, React Query) — Sprint 2.