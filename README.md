# Wendy Planner — monorepo

Wedding management platform for Vineyards. Modular monolith (NestJS API) + static SPA (Vite + React) + shared TypeScript contracts, deployed to AWS ECS Fargate and S3/CloudFront.

## Repository structure

```
code/
├── apps/
│   ├── api/                  # NestJS API (per ADR-01, ADR-09)
│   └── web/                  # Vite + React SPA (per ADR-02)
├── packages/
│   └── contracts/            # Shared DTOs + ID types (per ADR-13, ADR-14)
├── tools/                    # Build / lint helpers (boundary-rule tests live here)
├── package.json              # Workspace root
├── pnpm-workspace.yaml       # Workspace declarations
├── tsconfig.base.json        # Shared TS compiler options
└── eslint.config.mjs         # Root ESLint flat config (boundary rules enforced here)
```

---

## Prerequisites

| Tool               | Version | Notes                                                  |
| ------------------ | ------- | ------------------------------------------------------ |
| **Node.js**        | 22 LTS  | Pinned via `.nvmrc`; use `nvm use`.                    |
| **pnpm**           | 9.x     | Enable via `corepack enable pnpm` or install globally. |
| **Docker Desktop** | latest  | Only required for the Postgres dev stack.              |

---

## First-time setup (zero → running app)

```bash
# 1. Clone the repo
git clone https://github.com/mgalindor/vin-wedding-code.git
cd code

# 2. Install all workspace dependencies (single resolution, all workspaces)
pnpm install

# 3. Start the local Postgres (OPS-023) — Postgres 17 on localhost:5432
pnpm docker:up
#   ↳ user: wendy  /  password: wendy  /  db: wendy  /  port: 5432

# 4. Generate the Prisma client + apply migrations (creates schema from prisma/schema.prisma)
pnpm --filter @wendy/api prisma:generate
pnpm --filter @wendy/api prisma migrate dev

# 5. (Optional but recommended) Seed the database with the default Administrator.
#    The seed prints a one-time random password on stdout — copy it now.
pnpm --filter @wendy/api db:seed

# 6. Generate the local RS256 keypair for JWT signing (one-time per clone).
#    Writes JWT_PRIVATE_KEY_PEM / JWT_PUBLIC_KEY_PEM into apps/api/.env.local.
pnpm --filter @wendy/api gen:keys

# 7. Start API + Web in parallel (both in watch mode).
pnpm dev
#   ↳ API → http://localhost:3000  (NestJS, hot reload)
#   ↳ Web → http://localhost:5173  (Vite, hot reload)
```

### Verify everything is up

```http
# 200 — Terminus liveness (process up)
GET http://localhost:3000/health/live

# 200 — Prisma + memory + disk OK
GET http://localhost:3000/health/ready   
# Open http://localhost:5173 in the browser — you should see the SPA.
```

---

## Running only one tier

Sometimes you want to work on just the API or just the Web:

```bash
# Backend only (terminal 1)
pnpm docker:up
pnpm --filter @wendy/api prisma migrate dev
pnpm --filter @wendy/api start:dev      # http://localhost:3000

# Frontend only (terminal 2)
pnpm --filter @wendy/web dev            # http://localhost:5173
```

The Web app reads `VITE_API_BASE_URL` from `apps/web/.env.local` (default `http://localhost:3000`).

---

## Database operations

All commands live in the `@wendy/api` workspace and are forwarded through pnpm.

| Command                                          | What it does                                                                                                                                                                                                      |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm --filter @wendy/api prisma migrate dev`    | Apply pending migrations + create the DB if missing. Interactive: prompts for a migration name when `schema.prisma` has changed.                                                                                  |
| `pnpm --filter @wendy/api prisma migrate deploy` | Apply migrations non-interactively (CI / production-like).                                                                                                                                                        |
| `pnpm --filter @wendy/api prisma:generate`       | Regenerate the typed `@prisma/client` (run after editing `schema.prisma`).                                                                                                                                        |
| `pnpm --filter @wendy/api prisma studio`         | Open Prisma Studio at `http://localhost:5555` to browse/edit data.                                                                                                                                                |
| `pnpm --filter @wendy/api prisma migrate reset`  | **Destructive** — drops the DB, re-runs all migrations, re-runs seed. Use when migrations diverge.                                                                                                                |
| `pnpm --filter @wendy/api db:seed`               | Idempotent. Upserts tenant `Vineyards` (`id='default'`) and creates the default Administrator (`admin@wendy`) with a random 24-byte password printed once to stdout. Re-running is a no-op once the admin exists. |

### When do I need to run a migration?

- After `git pull` if `apps/api/prisma/migrations/` changed → `pnpm --filter @wendy/api prisma migrate dev`.
- After editing `schema.prisma` → `prisma:generate` first, then `prisma migrate dev` (Prisma will prompt for a migration name).
- After a fresh `pnpm docker:up` (DB is ephemeral — see "Local stack" below) → `prisma migrate dev` + `db:seed`.

### When do I need to run the seed?

- First time you boot a fresh DB (mandatory if you want a login).
- After `prisma migrate reset` (the script does not auto-seed).

> The seed prints the admin password **once**. If you lose it, run `prisma migrate reset` followed by `db:seed`.

---

## Local stack (docker-compose)

```bash
pnpm docker:up        # start Postgres 17 in the background
pnpm docker:down      # stop and remove containers (DATA IS LOST — see below)
pnpm docker:logs      # tail Postgres logs
```

> **No volumes.** Postgres data is ephemeral — `pnpm docker:down` deletes it. This is intentional: a fresh DB on every `docker:up` keeps local dev reproducible and prevents stale data from leaking between sessions. For stateful data, use a snapshot script or run `pg_dump` against the container before tearing it down.

---

## Environment files

Two layers, on purpose:

| File             | Committed?         | Purpose                                                                                                                                                                                  |
| ---------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`.env`**       | ✅ yes              | Non-sensitive defaults that externalize configuration out of source code (host names, ports, issuer names, TTLs, dev credentials matching docker-compose). **Edit via PR**, not locally. |
| **`.env.local`** | ❌ no (git-ignored) | Per-developer overrides for sensitive values: private keys (`JWT_PRIVATE_KEY_PEM`), real credentials, third-party tokens. Created only when needed (see step 6 of the setup above).      |

NestJS `ConfigModule` loads the chain (first hit wins):

1. `<monorepo-root>/.env.local`
2. `<monorepo-root>/.env`
3. `apps/api/.env.local`
4. `apps/api/.env`

See the header comment in each file for the contract.

The Web tier reads only `apps/web/.env.local` — only `VITE_API_BASE_URL` is needed today.

---

## Useful root scripts

| Script                                                     | What it does                                                                                               |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `pnpm install`                                             | Resolves all workspace dependencies in one go.                                                             |
| `pnpm dev`                                                 | Runs every workspace's `start:dev` script in parallel (API + Web).                                         |
| `pnpm build`                                               | Runs the `build` script in every workspace (`nest build`, `vite build`).                                   |
| `pnpm lint`                                                | Runs ESLint across every workspace that defines a `lint` script. Boundary rules (per ADR-12) are enforced. |
| `pnpm typecheck`                                           | Runs `tsc --noEmit` across every workspace that defines a `typecheck` script.                              |
| `pnpm format`                                              | Runs Prettier in write mode across the repo.                                                               |
| `pnpm format:check`                                        | Runs Prettier in check mode (used in CI).                                                                  |
| `pnpm test`                                                | Runs the unit tests in every workspace (see "Testing" below).                                              |
| `pnpm test:rules`                                          | Runs the boundary rules unit tests in `tools/eslint/boundary-rules.test.cjs`.                              |
| `pnpm docker:up` / `pnpm docker:down` / `pnpm docker:logs` | Manages the local Postgres stack.                                                                          |
| `pnpm clean`                                               | Removes every workspace's `dist/` and `node_modules/`.                                                     |

---

## Testing

The repo follows the testing strategy defined in [backend blueprint §7](../3-architecture/3.2-blueprints/backend-blueprint.md#7-testing-strategy) and [web frontend blueprint §7](../3-architecture/3.2-blueprints/web-frontend-blueprint.md#7-testing-strategy). The directory is the layer; the file name carries the TC ID from the spec's `verification-summary.md`.

### Backend — `@wendy/api`

| Layer                               | Where files live                             | Command                                           | What it does                                                                                                                      |
| ----------------------------------- | -------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Unit** (alongside code)           | `apps/api/src/**/*.spec.ts`                  | `pnpm --filter @wendy/api test`                   | Pure unit tests of use cases, services, config-class validation. No HTTP.                                                         |
| **Functional / cross-cutting unit** | `apps/api/test/functional/tc-NNN-*.spec.ts`  | `pnpm --filter @wendy/api test:unit`              | Same runner, narrower path.                                                                                                       |
| **Integration (adapter)**           | `apps/api/test/integration/tc-NNN-*.spec.ts` | `pnpm --filter @wendy/api test:integration`       | Bootstraps the NestJS app, drives HTTP via supertest against a real Postgres (testcontainers). For controller + repository tests. |
| **Integration watch**               | same as above                                | `pnpm --filter @wendy/api test:integration:watch` | Watch mode for adapter tests.                                                                                                     |
| **Integration verbose**             | same as above                                | `pnpm --filter @wendy/api test:integration:debug` | Same as integration with the verbose reporter.                                                                                    |
| **All layers**                      | both                                         | `pnpm --filter @wendy/api test:all`               | Runs `test` (unit + functional) **then** `test:integration`. Use this in CI or before opening a PR.                               |

> **Note:** the backend `test:e2e` script was renamed to `test:integration` in commit `f8e9b3a` — it runs *adapter* tests (NestJS bootstrap + Postgres, no browser), not end-to-end. The frontend `test:e2e` (below) remains — that one IS end-to-end via Playwright.

**One-off convenience scripts**

| Script                                                  | Purpose                                  |
| ------------------------------------------------------- | ---------------------------------------- |
| `pnpm --filter @wendy/api test -- path/to/file.spec.ts` | Run a single unit test file.             |
| `pnpm --filter @wendy/api test:watch`                   | Vitest watch mode for unit + functional. |

### Frontend — `@wendy/web`

| Layer                             | Where files live                      | Command                                     | What it does                                                                      |
| --------------------------------- | ------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------- |
| **Unit / Component**              | `apps/web/src/**/*.spec.ts(x)`        | `pnpm --filter @wendy/web test`             | Components in isolation (RTL), hooks, utilities.                                  |
| **Watch**                         | same as above                         | `pnpm --filter @wendy/web test:watch`       | Vitest watch mode.                                                                |
| **E2E (Playwright)**              | `apps/web/tests/e2e/tc-NNN-*.spec.ts` | `pnpm --filter @wendy/web test:e2e`         | Multi-browser end-to-end against the live API + Web stack. PC + tablet viewports. |
| **E2E UI mode**                   | same as above                         | `pnpm --filter @wendy/web test:e2e:ui`      | Playwright Inspector — interactive.                                               |
| **E2E report**                    | same as above                         | `pnpm --filter @wendy/web test:e2e:report`  | Open the last HTML report.                                                        |
| **First-time Playwright install** | —                                     | `pnpm --filter @wendy/web test:e2e:install` | Downloads Chromium (run once after `pnpm install`).                               |

### Cross-cutting

| Layer                     | Where files live                       | Command           | What it does                                                                                                |
| ------------------------- | -------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------- |
| **ESLint boundary rules** | `tools/eslint/boundary-rules.test.cjs` | `pnpm test:rules` | Unit-tests the no-cross-workspace / no-cross-context-internal import rules. Pure Node test runner, no deps. |

### Before opening a PR

```bash
pnpm typecheck                                          # all workspaces
pnpm lint                                               # all workspaces (boundary rules included)
pnpm test                                               # unit tests in all workspaces
pnpm --filter @wendy/api test:integration               # adapter tests against real Postgres
pnpm --filter @wendy/web test:e2e                       # only if your change touches FE flows
```

---

## ESLint configuration

The repo uses ESLint v9 with the **flat config** format (`eslint.config.mjs` at the root). The boundary rules per ADR-12 are defined in `tools/eslint/boundary-rules.cjs` and wired into the flat config via `eslint-plugin-import`'s `no-restricted-paths` rule. The plugin's rule uses a `zones` shape — see the helper for the three forbidden directions.

Run `pnpm test:rules` after editing the helper to make sure the forbidden-direction logic still holds.

---

## Architecture references

The implementation follows the architecture documents in `../3-architecture/`:

- `3-architecture/3.1-architecture/architecture.md` — the overall architecture document.
- `3-architecture/3.2-blueprints/backend-blueprint.md` — backend tier conventions (modules, layers, testing).
- `3-architecture/3.2-blueprints/web-frontend-blueprint.md` — web frontend tier conventions (routes, features, testing).
- `3-architecture/3.3-decision-record/adr-12-monorepo-pnpm-workspaces.md` — the ADR that produced this layout.
- `3-architecture/3.3-decision-record/adr-09-modular-monolith-organization.md` — the bounded-context module structure.

---

## Status

This repository is the implementation of:

- **ARC-001** — Bootstrap monorepo with pnpm workspaces ✓
- **ARC-002** — Enforce ESLint boundary rules ✓
- **ARC-003** — Bootstrap NestJS API skeleton with module layout ✓
- **ARC-004 / ARC-005 / ARC-008** — Web SPA skeleton + shared contracts + Prisma users ✓

Subsequent stories (ARC-013 auth, ARC-015 RBAC, US-001 onboarding, …) fill in the actual application features.
