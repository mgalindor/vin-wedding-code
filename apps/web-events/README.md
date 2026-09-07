# Deer Planner — Admin Portal (`@deer/web-events`)

> The Organizer + Administrator SPA for the multi-event invitation platform.
> Built to the [Web Frontend Tier Blueprint v2.0.0](../../3-architecture/3.2-blueprints/web-frontend-blueprint.md).

## What this app is

A bilingual (EN/ES) admin portal where two roles coexist:

| Role | What they can do |
|---|---|
| **Administrator** | Create and manage event organizers, observe and audit every event in the organization, override ownership on any event. |
| **Event Organizer** | Create events (wedding, birthday, anniversary, corporate, other), capture every data point, manage guests and RSVP, pick a template and turn on the invitation. Can edit their own profile. |

A guest-facing invitation is reachable through the public micro-frontend (`/i/:token`); this app currently shows a placeholder placeholder there so the round-trip can be tested end-to-end.

The value proposition, per [`README.md`](../../../README.md), is **the online invitation itself**: capture your event once, share a beautiful link with every guest, let the platform handle the RSVP and the post-event album.

---

## Stack

| Library / Tool | Purpose |
|---|---|
| React 19 + TypeScript 5 | UI runtime |
| Vite 5 | Build + dev server (sub-second HMR) |
| TanStack Router | Type-safe routing with two lazy route groups |
| TanStack Query | Server state caching + optimistic updates |
| React Hook Form | Form state and validation |
| TailwindCSS 4 (CSS-first) | Utility-first styling against design tokens |
| Lucide React | Icons |
| i18next + react-i18next | Bilingual (EN default, ES auto-detected) |
| Vitest + Testing Library | Component + integration tests |

The full stack rationale is documented in the blueprint. Each choice was made to keep the team of 2 productive without incurring rework later.

---

## Folder layout

```
apps/web-events/
├── src/
│   ├── main.tsx                  # bootstrap
│   ├── router.tsx                # route tree + lazy boundaries
│   ├── index.css                 # Tailwind + design tokens (@theme block)
│   ├── test-setup.ts
│   │
│   ├── routes/
│   │   ├── (public)/             # guest invitation placeholder
│   │   │   └── invitation.$token.tsx
│   │   └── not-found.tsx         # 404
│   │
│   ├── features/                 # one folder per business capability
│   │   ├── auth/                 # login screen
│   │   ├── dashboard/            # layout, sidebar, home
│   │   ├── events/               # list, create, edit, detail,
│   │   │                         # wedding-data, locations, program, contacts
│   │   ├── guests/               # groups, guests, RSVP
│   │   ├── invitations/          # template picker + invitation config
│   │   ├── users/                # admin-only: list + create
│   │   ├── profile/              # self-edit (any role)
│   │   └── locale-switcher/      # sidebar footer EN/ES toggle
│   │
│   ├── i18n/
│   │   ├── config.ts             # i18next + detector wiring
│   │   └── locales/
│   │       ├── en/{common,auth,dashboard,events,guests,invitations,users,profile,errors}.json
│   │       └── es/(same)
│   │
│   └── shared/
│       ├── api/                  # api-client, types, errors
│       ├── auth/                 # store + hooks (login, logout, role guard)
│       ├── lib/                  # cn() utility + date/count formatters
│       └── ui/                   # design-system primitives (button, input, card, …)
│
├── index.html
├── package.json
├── vite.config.ts                # dev server + API proxy
├── vitest.config.ts
└── tsconfig.json                 # extends /code/tsconfig.base.json
```

---

## Running locally

The portal expects the Spring Boot backend on `http://localhost:8080`. Vite proxies `/api` and `/oauth` to it so the FE and BE can run side-by-side.

```bash
cd code
pnpm install                          # one-shot monorepo install
pnpm --filter @deer/web-events dev    # runs on http://localhost:5174
```

If you only need this app:

```bash
cd code/apps/web-events
pnpm install
pnpm dev
```

### Initial credentials (from `java-api`)

The Spring Boot seed creates a default admin. Look at `src/main/resources/db/changelog` for the seed files; for the Vineyards MVP the canonical pair is:

```
username: admin@deer
password: <see java-api seed>
```

---

## What works end-to-end

| Flow | Status |
|---|---|
| Login (username + password → JWT in localStorage + memory) | ✓ |
| Logout (revokes cookie, clears store) | ✓ |
| Bilingual toggle (EN/ES, persisted in cookie) | ✓ |
| Events: list with search/status/type filter | ✓ |
| Events: 3-step create wizard (type → title → date) | ✓ |
| Events: edit basics (title, date) | ✓ |
| Events: archive + delete | ✓ |
| Wedding-data: couple names, landing, story, dress-code, gift, parents, accommodation | ✓ |
| Generic JSONB: locations, program, contacts | ✓ |
| Guest groups: create, edit, regenerate token, copy invite link, delete | ✓ |
| Guests: list with RSVP filter, optimistic RSVP update, add guest, change group | ✓ |
| Invitation: template picker, toggle active/RSVP, slug preview | ✓ |
| Users (admin): list, role filter, search, create, enable/disable | ✓ |
| Profile (any role): change display name/email/phone, change password, language | ✓ |
| Public `/i/:token` placeholder | ✓ (renderer in a follow-up milestone) |

---

## What is intentionally **not** in this MVP

- A per-event custom invitation layout editor (templates are fixed per `eventType`).
- Self-service password recovery.
- Mobile-first layout (PC + tablet, per ADR-02).
- Photo album UI (BE endpoint is implemented but the FE feature ships in a follow-up).
- A rendered public invitation page — the placeholder at `/i/:token` proves the link works; the visual renderer is the public micro-frontend's job.

---

## Design language

The portal uses the dual-surface system described in `2-product/2.1-discovery/2.1.6-design/DESIGN.md`:

- **B2B organizer dashboard** — Modern Professional / Editorial Minimalist: parchment backgrounds, restrained gold accents, generous whitespace, `Inter` for data, `Playfair Display` for headlines.
- **B2C guest invitation** — Emotional / Ceremonial: serif display, full-bleed imagery, generous vertical breathing room.

All tokens live inside the `@theme` block in `src/index.css` — no JavaScript theming, just CSS variables that Tailwind reads through `bg-[var(--color-primary)]` style utilities. Adding a new tone (e.g. an "RSVP needs-nudge" amber) means one line in `@theme`, one optional primitive wrapper.

---

## i18n workflow

- Catalogs live under `src/i18n/locales/{en,es}/<namespace>.json`. Namespaces map 1:1 to feature folders.
- The login screen has an inline EN/ES pill; the sidebar footer has a permanent switch.
- The language preference is persisted to the `i18next` cookie (set by the detector) so a hard refresh keeps the user's choice.
- **Do not ship a string without its Spanish equivalent.** The CI step (TODO) fails the build if `i18next-fs-backend --uses-keys-as-default-fallback` reports missing keys — see ADR-08 for the architecture.

---

## Security checklist (FE)

- [x] Access token kept in memory + localStorage **mirror only**; clear on tab close (see `auth-store.tsx`).
- [x] Role-gated UI: only Administrator sees `/dashboard/users`; the sidebar hides the section instead of mounting hidden DOM.
- [x] The api-client bounces the user to `/login` on any 401 from the BE.
- [x] No PII in logs. The only thing sent to Sentry/console is the API `traceId`.
- [x] All HTML generated from user input goes through React's default escaping; we never use `dangerouslySetInnerHTML` on invitation data.

---

## Testing

```bash
pnpm test            # vitest
pnpm test:watch      # vitest watch mode
pnpm typecheck       # tsc --noEmit
pnpm lint            # ESLint
```

Component specs live next to their components (`*.spec.tsx`). The biggest coverage gains come from:
- the events service (`events.service.spec.ts`)
- the auth hooks (`use-login.spec.ts`, `use-protected-route.spec.ts`)
- the form validation paths on the create-event wizard

The E2E suite (Playwright + Chromium/Firefox/WebKit) lives in a sibling package (skipped here — bring it back when FE QA bandwidth exists).

---

## Operational notes

- **Dev server proxy** — Vite forwards `/api/*` and `/oauth/*` to `localhost:8080` (Spring Boot). No CORS dance, no token stripping.
- **PWA / offline** — out of scope for MVP (no service worker).
- **Bundle splitting** — every screen is `lazy()`'d at the route tree, so the initial chunk is just the auth/login screen. The dashboard sections ship as separate bundles and only download after login.
