import { defineConfig } from 'vitest/config';

/**
 * Vitest config for the `@wendy/contracts` workspace.
 *
 * The package has no runtime code in Sprint 1 \u2014 only the branded ID types
 * and `nanoid` re-export. The only tests we run today are the decorator
 * pipeline sanity tests (per ARC-005 Rule 15), which lock in the
 * `experimentalDecorators` + `emitDecoratorMetadata` tsconfig flags before
 * Sprint 2 DTOs land.
 */
export default defineConfig({
  test: {
    include: ['test/**/*.spec.ts'],
    environment: 'node',
  },
});
