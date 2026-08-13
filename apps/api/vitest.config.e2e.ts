import { defineConfig } from 'vitest/config';

/**
 * Vitest config for the E2E test layer.
 *
 * E2E tests live in the test directory under apps/api/test and bootstrap
 * the full NestJS application via Test.createTestingModule(AppModule).
 * This is slower than the unit layer, so it runs separately via
 * pnpm test:e2e.
 */
export default defineConfig({
  test: {
    include: ['test/**/*.e2e-spec.ts'],
    environment: 'node',
    // E2E tests share a single NestJS app across `it(...)` blocks via
    // `beforeAll`/`afterAll`. The default `testTimeout` of 5 s is enough
    // for the current scenarios; ARC-036 may need to bump it for the
    // real Terminus indicators.
    testTimeout: 15_000,
  },
});
