// ESLint flat config for the wendy-planner monorepo (ESLint v9+).
// Migrated from .eslintrc.cjs as part of the v9 flat-config transition.
//
// Per ADR-12: workspace boundary rules are enforced via `import/no-restricted-paths`
// (from eslint-plugin-import). The core `no-restricted-paths` rule has a
// bug in the v9 rule-validator that mis-attributes it to the
// `@typescript-eslint` plugin namespace when both plugins are loaded in
// the same config block. Using the import plugin's rule sidesteps that.
//
// The rule definitions live in ./tools/eslint/boundary-rules.cjs so they
// can be unit-tested in isolation and shared across ESLint invocations.

import boundaryRules from './tools/eslint/boundary-rules.cjs';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import prettierConfig from 'eslint-config-prettier';

const tsProjectFiles = [
  './apps/*/tsconfig.json',
  './packages/*/tsconfig.json',
  './tsconfig.base.json',
];

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/*.config.js',
      '**/*.config.cjs',
      '**/*.config.mjs',
      'pnpm-lock.yaml',
    ],
  },
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: tsParser,
      globals: {
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'writable',
        global: 'readonly',
        window: 'readonly',
        document: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: tsProjectFiles,
        },
        node: {
          extensions: ['.js', '.ts'],
        },
      },
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'import/order': [
        'warn',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      // Per ADR-12: workspace boundary rules.
      // apps/api -> apps/web, apps/web -> apps/api, packages/* -> apps/* are forbidden.
      'import/no-restricted-paths': ['error', boundaryRules],
    },
  },
  // Apply prettier compatibility last to disable conflicting stylistic rules.
  prettierConfig,
];


