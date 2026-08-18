/**
 * Playwright global setup — runs once before all test files.
 *
 * Responsibilities:
 *   1. Ensure the database has the seed admin (idempotent — exits silently
 *      if admin@wendy already exists).
 *   2. Surface seed failures as a Playwright-level error so tests don't
 *      run against an empty database.
 *
 * Why this lives here (not in a beforeEach hook): the seed is a side-effect
 * on the database, not a behaviour under test. TC-006/TC-008 specifically
 * exercise the seed CLI, but the rest of the suite assumes admin@wendy
 * already exists.
 */

import { execFileSync } from 'node:child_process';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const API_DIR = path.resolve(HERE, '../../../../apps/api');

export default async function globalSetup(): Promise<void> {
  console.log('[setup] Running db:seed (idempotent) in', API_DIR);

  // On Windows, .cmd batch files cannot be invoked without a shell. We
  // invoke `node` directly with the bundled ts-node entrypoint, which
  // works regardless of platform. ts-node ships its own JS entry in
  // node_modules/ts-node/dist/bin.js.
  const tsNodeEntry = path.join(
    API_DIR,
    'node_modules',
    'ts-node',
    'dist',
    'bin.js',
  );
  const nodeBin = process.execPath;

  // E2E_ADMIN_PASSWORD is the password the suite expects. Forward it
  // through SEED_ADMIN_PASSWORD so the seed writes a matching bcrypt
  // hash for `admin@wendy`. Without this, the seed would mint a fresh
  // random password on every run and tests would have to scrape stdout
  // — fragile, especially on Windows where stdout line endings vary.
  const seedEnv: NodeJS.ProcessEnv = {
    ...process.env,
    ...(process.env.E2E_ADMIN_PASSWORD
      ? { SEED_ADMIN_PASSWORD: process.env.E2E_ADMIN_PASSWORD }
      : {}),
  };

  // `--transpile-only` skips type-checking (the seed script doesn't need it).
  // We override the api tsconfig (which uses nodenext/nodenext for production)
  // to emit CommonJS — the seed script's `import { nanoid } from 'nanoid'`
  // is then resolved via Node's CommonJS interop without requiring `.js`
  // extensions on relative imports.
  execFileSync(
    nodeBin,
    [
      tsNodeEntry,
      '--transpile-only',
      '--compiler-options',
      '{"module":"commonjs","moduleResolution":"node10","esModuleInterop":true,"resolvePackageJsonExports":false}',
      'tools/db-seed.ts',
    ],
    {
      cwd: API_DIR,
      stdio: 'inherit',
      env: seedEnv,
    },
  );

  console.log('[setup] db:seed OK');
}