/* eslint-env node */
/**
 * ESLint boundary rules for the wendy-planner monorepo.
 *
 * Per ADR-12, the workspaces must respect these boundaries:
 *   - apps/api cannot import from apps/web
 *   - apps/web cannot import from apps/api
 *   - packages/* cannot import from apps/*
 *
 * The opposite direction is allowed (apps can import from packages).
 *
 * This file is a standalone CommonJS module so it can be tested in isolation
 * (see boundary-rules.test.cjs) and imported from the root eslint.config.mjs.
 *
 * IMPORTANT — we use `import/no-restricted-paths` (from eslint-plugin-import)
 * instead of the core `no-restricted-paths` rule. The core rule has a bug in
 * the ESLint v9 flat-config rule-validator that mis-attributes it to the
 * `@typescript-eslint` plugin namespace when both plugins are loaded in the
 * same config block. The import plugin's rule has the same semantics and
 * uses a `zones` array shape.
 *
 * @see https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-restricted-paths.md
 */

'use strict';

const APPS_DIR = 'apps';
const PACKAGES_DIR = 'packages';

const boundaryZones = [
  {
    // apps/api must not reach into apps/web (cross-app coupling forbidden)
    from: './apps/web/src/**',
    target: './apps/api/src/**',
    message:
      'Cross-app import is forbidden: apps/api may not import from apps/web. See ADR-12.',
  },
  {
    // apps/web must not reach into apps/api (cross-app coupling forbidden)
    from: './apps/api/src/**',
    target: './apps/web/src/**',
    message:
      'Cross-app import is forbidden: apps/web may not import from apps/api. See ADR-12.',
  },
  {
    // packages/* must not reach into apps/* (shared contracts must stay framework-agnostic)
    from: './packages/*/src/**',
    target: './apps/*/src/**',
    message:
      'Cross-workspace import is forbidden: packages/* may not import from apps/*. Shared packages must remain runtime-agnostic. See ADR-12 and ADR-14.',
  },
];

const boundaryRules = {
  zones: boundaryZones,
};

module.exports = boundaryRules;
