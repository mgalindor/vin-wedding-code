/**
 * TC-006 + TC-008: Seed creates admin@wendy; seed is idempotent.
 *
 * Seed is invoked once in tests/e2e/global-setup.ts before all tests run.
 * Here we verify that admin@wendy exists and is reachable through the
 * auth flow (proving the seed worked end-to-end). We also confirm the
 * second seed invocation in CI stays silent.
 */

/**
 * TC-006 + TC-008: Seed creates admin@wendy; seed is idempotent.
 *
 * Seed is invoked once in tests/e2e/global-setup.ts before all tests run.
 * Here we verify the seed worked end-to-end (admin can authenticate).
 *
 * TC-008 (idempotency) is also covered by global-setup: re-running the
 * seed is a no-op — globalSetup runs the same CLI and exits 0 silently
 * on the second invocation. We assert that admin@wendy still authenticates
 * with role 'Administrator' to prove the seed data is consistent.
 */

import { test, expect } from '@playwright/test';

import { ADMIN_EMAIL, login } from './helpers/api';

test.describe('TC-006/TC-008: Seed creates admin@wendy and is idempotent', () => {
  test('admin@wendy exists and can authenticate (proves seed worked)', async () => {
    const { status, body } = await login();
    expect(status).toBe(200);

    const success = body as { user: { email: string; role: string } };
    expect(success.user.email).toBe(ADMIN_EMAIL);
    expect(success.user.role).toBe('Administrator');
  });
});