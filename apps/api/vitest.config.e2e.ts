import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

/**
 * Vitest config for the E2E test layer.
 *
 * E2E tests live in the test directory under apps/api/test and bootstrap
 * the full NestJS application via Test.createTestingModule(AppModule).
 *
 * A setupFile loads the monorepo-root .env files into process.env before
 * Vitest loads any test module. This ensures NestJS ConfigModule and the
 * typed config useFactory functions see the env vars at module-compile time.
 *
 * The SWC plugin is required so that emitDecoratorMetadata is honoured at
 * test time — esbuild (Vitest's default) does not support it, which causes
 * NestJS constructor-injection to receive undefined for typed parameters.
 *
 * Prerequisites:
 *   pnpm docker:up                              # Postgres 17 on :5433
 *   pnpm --filter @wendy/api prisma migrate deploy
 *
 * Run:
 *   pnpm --filter @wendy/api test:e2e
 */
export default defineConfig({
  plugins: [swc.vite()],
  test: {
    include: ['test/**/*.e2e-spec.ts'],
    environment: 'node',
    testTimeout: 30_000,
    setupFiles: ['test/setup.e2e.ts'],
  },
});
