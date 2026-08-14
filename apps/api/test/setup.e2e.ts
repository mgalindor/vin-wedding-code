/**
 * E2E global setup — runs once before any test file is loaded.
 *
 * Loads .env files from the monorepo root into process.env so NestJS
 * ConfigModule and the typed config useFactory functions see DATABASE_URL
 * and other vars at module-compile time.
 *
 * Priority chain (first hit wins, same as ConfigModule envFilePath order):
 *   1. <monorepo-root>/.env.local  (gitignored, developer secrets)
 *   2. <monorepo-root>/.env        (committed, non-sensitive defaults)
 */
import { generateKeyPairSync } from 'node:crypto';
import { resolve } from 'node:path';

import { config as dotenv } from 'dotenv';

const root = resolve(__dirname, '..', '..', '..', '..');
dotenv({ path: resolve(root, '.env.local'), override: false });
dotenv({ path: resolve(root, '.env'), override: false });

// Generate a fresh RS256 key pair for this test run so tests are
// independent of any real key in .env.local.
const { privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

process.env.NODE_ENV = 'test';
process.env.PORT = '3002';
process.env.LOG_LEVEL = 'error';
process.env.JWT_PRIVATE_KEY_PEM = privateKey;
process.env.JWT_KEY_ID = '00000000-0000-4000-a000-000000000001';
process.env.JWT_ISSUER = 'wendy-planner';
process.env.JWT_AUDIENCE = 'wendy';
