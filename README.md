# Wendy Planner — monorepo

Wedding management platform for Vineyards. Modular monolith (NestJS API) + static SPA (Vite + React) + shared TypeScript contracts, deployed to AWS ECS Fargate and S3/CloudFront.

This is the bootstrapped monorepo (per ADR-12). The application code lands in subsequent stories; this repo currently contains the scaffolding only.

## Repository structure

```
code/
├── apps/
│   ├── api/                  # NestJS API (per ADR-01, ADR-09) — bootstrapped in ARC-001+003
│   └── web/                  # Vite + React SPA (per ADR-02) — placeholder until ARC-004
├── packages/
│   └── contracts/            # Shared DTOs + ID types (per ADR-13, ADR-14) — placeholder until ARC-005
├── tools/                    # Build / lint helpers (boundary-rule tests live here)
├── scripts/                  # Local dev scripts (smoke.sh)
├── package.json              # Workspace root
├── pnpm-workspace.yaml       # Workspace declarations
├── tsconfig.base.json        # Shared TS compiler options
├── .eslintrc.cjs             # Root ESLint config (boundary rules enforced here)
└── .prettierrc               # Shared Prettier formatting
```

## Prerequisites

- **Node.js 22 LTS** (`.nvmrc` pins this; use `nvm use`)
- **pnpm 9.x** (enable via `corepack enable pnpm` or install globally)

## Local setup

```bash
# 1. clone the repo
git clone https://github.com/mgalindor/vin-wedding-code.git
cd code

# 2. install all workspace dependencies
pnpm install

# 3. verify the tooling is wired correctly
pnpm lint               # runs ESLint across all workspaces (with boundary rules)
pnpm typecheck          # runs tsc --noEmit across all workspaces
pnpm test:rules         # runs the boundary-rules unit tests (Node's built-in test runner)
pnpm --filter @wendy/api test:e2e  # runs the versioned E2E smoke spec

# 4. start the API in dev mode (watch + hot reload)
pnpm --filter @wendy/api start:dev

# 5. verify the API responds
curl http://localhost:3000/health/live
```

## Useful root scripts

| Script | What it does |
|---|---|
| `pnpm install` | Resolves all workspace dependencies in one go. |
| `pnpm lint` | Runs ESLint across every workspace that defines a `lint` script. Boundary rules (per ADR-12) are enforced. |
| `pnpm typecheck` | Runs `tsc --noEmit` across every workspace that defines a `typecheck` script. |
| `pnpm format` | Runs Prettier in write mode across the repo. |
| `pnpm format:check` | Runs Prettier in check mode (used in CI). |
| `pnpm build` | Runs the `build` script in every workspace. |
| `pnpm test` | Runs the unit tests in every workspace. |
| `pnpm test:rules` | Runs the boundary rules unit tests in `tools/eslint/boundary-rules.test.cjs`. |
| `pnpm dev` | Runs every workspace's `start:dev` script in parallel. |
| `pnpm clean` | Removes every workspace's `dist/` and `node_modules/`. |

## API test layers

The `@wendy/api` workspace has two test layers (per backend blueprint §7):

| Layer | Where | Run with | Purpose |
|---|---|---|---|
| **Unit** | `apps/api/src/**/*.spec.ts` | `pnpm --filter @wendy/api test` | Pure unit tests of use cases, services, config-class validation. No HTTP. |
| **E2E** | `apps/api/test/**/*.e2e-spec.ts` | `pnpm --filter @wendy/api test:e2e` | Bootstraps the full NestJS app via `Test.createTestingModule(AppModule)` and drives HTTP calls with supertest. Used for the smoke scenarios and (later) for every primary journey in §6 of the architecture document. |

To run both layers:

```bash
pnpm --filter @wendy/api test:all
```

The E2E file `apps/api/test/smoke.e2e-spec.ts` is the canonical template for future E2E specs. Each `it(...)` block is a versioned scenario that lives in git, runs headless, and is structured by Vitest's reporter. There is no shell script — the scenarios are the source of truth (per backend blueprint §7).

## ESLint configuration

The repo uses ESLint v9 with the **flat config** format (`eslint.config.mjs` at the root). The boundary rules per ADR-12 are defined in `tools/eslint/boundary-rules.cjs` and wired into the flat config via `eslint-plugin-import`'s `no-restricted-paths` rule. The plugin's rule uses a `zones` shape — see the helper for the three forbidden directions.

## Architecture references

The implementation follows the architecture documents in `3-architecture/`:

- `3-architecture/3.1-architecture/architecture.md` — the overall architecture document.
- `3-architecture/3.2-blueprints/backend-blueprint.md` — backend tier conventions.
- `3-architecture/3.2-blueprints/web-frontend-blueprint.md` — web frontend tier conventions.
- `3-architecture/3.3-decision-record/adr-12-monorepo-pnpm-workspaces.md` — the ADR that produced this layout.
- `3-architecture/3.3-decision-record/adr-09-modular-monolith-organization.md` — the bounded-context module structure.

## Status

This repository is the implementation of:

- **ARC-001** — Bootstrap monorepo with pnpm workspaces ✓
- **ARC-002** — Enforce ESLint boundary rules ✓
- **ARC-003** — Bootstrap NestJS API skeleton with module layout ✓

Subsequent stories (ARC-004, ARC-005, ARC-006, …) fill in the actual application code.

## Detailed local-dev documentation

The detailed step-by-step local-dev guide (docker-compose for Postgres + MinIO, etc.) is delivered by **OPS-024**. Until then, this README is the entry point.
