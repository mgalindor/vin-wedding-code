import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

/**
 * Vitest config for the ADAPTER (integration) test layer.
 *
 * Adapter tests live in apps/api/test/integration/ and bootstrap the
 * full NestJS application via Test.createTestingModule(AppModule). They
 * drive HTTP via supertest, hit a real Postgres (docker-compose on 5433),
 * and exercise only the primary inbound / outbound adapters.
 *
 * A setupFile loads the monorepo-root .env files into process.env before
 * Vitest loads any test module. This ensures NestJS ConfigModule and the
 * typed config useFactory functions see the env vars at module-compile time.
 *
 * The SWC plugin is required so that emitDecoratorMetadata is honoured at
 * test time - esbuild (Vitest's default) does not support it, which causes
 * NestJS constructor-injection to receive undefined for typed parameters.
 *
 * Prerequisites:
 *   pnpm docker:up                              # Postgres 17 on :5433
 *   pnpm --filter @wendy/api prisma migrate deploy
 *
 * Run:
 *   pnpm --filter @wendy/api test:integration
 */
export default defineConfig({
  plugins: [swc.vite()],
  test: {
    include: ['test/integration/**/*.spec.ts'],
    environment: 'node',
    testTimeout: 30_000,
    setupFiles: ['test/setup.e2e.ts'],
    // Adapter tests share a single Postgres instance. Running them in
    // parallel causes the resetDatabase() helper to truncate rows that
    // a sibling test is mid-way through seeding. Single-threaded by
    // file is enough to keep the suite deterministic.
    fileParallelism: false,
  },
});
