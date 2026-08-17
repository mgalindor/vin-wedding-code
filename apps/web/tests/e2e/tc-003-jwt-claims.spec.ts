/**
 * TC-003: User profile is embedded in the JWT claims.
 *
 * Verifies the payload contains: sub, fullName, email, role, tenantId.
 */

import { test, expect } from '@playwright/test';

import { decodeJwt, login } from './helpers/api';

test.describe('TC-003: User profile in JWT claims', () => {
  test('payload contains sub, fullName, email, role, tenantId', async () => {
    const { status, body } = await login();
    expect(status).toBe(200);

    const success = body as { access_token: string };
    const claims = decodeJwt(success.access_token);

    expect(claims).toHaveProperty('sub');
    expect(claims).toHaveProperty('fullName');
    expect(claims).toHaveProperty('email', 'admin@wendy');
    expect(claims).toHaveProperty('role', 'Administrator');
    expect(claims).toHaveProperty('tenantId');
    expect(claims).toHaveProperty('iss');
    expect(claims).toHaveProperty('aud');
  });
});