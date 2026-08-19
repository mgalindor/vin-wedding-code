import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

/**
 * Vitest config for the ADAPTER (integration) test layer.
 *
 * Adapter tests live in apps/api/test/integration/ and bootstrap the
 * full NestJS application via Test.createTestingModule(AppModule). They
 * drive HTTP via supertest and exercise only the primary inbound /
 * outbound adapters.
 *
 * The DB is provisioned by the `globalSetup` script below — it spins
 * up a fresh Postgres container via @testcontainers/postgresql, applies
 * the Prisma migrations, and sets DATABASE_URL before any worker
 * spawns. The container is destroyed on teardown. The developer's
 * local Postgres (and any data they have on it) is never touched.
 *
 * The SWC plugin is required so that emitDecoratorMetadata is honoured
 * at test time — esbuild (Vitest's default) does not support it,
 * which causes NestJS constructor-injection to receive undefined for
 * typed parameters.
 *
 * Prerequisites:
 *   - Docker running on the host (testcontainers needs the daemon).
 *
 * Run:
 *   pnpm --filter @wendy/api test:integration
 */
export default defineConfig({
  plugins: [swc.vite()],
  test: {
    include: ['test/integration/**/*.spec.ts'],
    environment: 'node',
    testTimeout: 60_000, // give the container boot + migrate room
    setupFiles: ['test/setup.e2e.ts'],
    globalSetup: ['test/global-setup.e2e.ts'],
    // Adapter tests share a single Postgres container (started by
    // globalSetup). Running them in parallel would cause
    // resetDatabase() to truncate rows a sibling test is mid-way
    // through seeding. Single-threaded by file is enough to keep the
    // suite deterministic.
    fileParallelism: false,
  },
});