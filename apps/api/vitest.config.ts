import { defineConfig } from 'vitest/config';

/**
 * Vitest config for the @wendy/api workspace.
 *
 * We keep two test layers (per backend blueprint §7):
 *   - Unit tests:   source files matching spec.ts under src/   (run with pnpm test)
 *   - E2E tests:    files matching e2e-spec.ts under test/      (run with pnpm test:e2e)
 *
 * The default pnpm test runs unit tests because they should be fast and
 * dependency-free. The E2E layer bootstraps the full NestJS app via
 * Test.createTestingModule(AppModule) and is run separately so the
 * developer can iterate on unit tests without the AppModule compile cost.
 */
export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts', 'test/functional/**/*.spec.ts'],
    environment: 'node',
  },
});
