/**
 * TC-002: Token lifetime is 1 hour (3600 seconds).
 *
 * Decodes the JWT issued on a successful login and asserts that
 * exp - iat === 3600.
 */

import { test, expect } from '@playwright/test';

import { decodeJwt, login } from './helpers/api';

test.describe('TC-002: Token lifetime is 1 hour', () => {
  test('exp - iat equals 3600 seconds (1 hour)', async () => {
    const { status, body } = await login();
    expect(status).toBe(200);

    const success = body as { access_token: string };
    const claims = decodeJwt(success.access_token);

    const iat = claims.iat as number;
    const exp = claims.exp as number;

    expect(typeof iat).toBe('number');
    expect(typeof exp).toBe('number');
    expect(exp - iat).toBe(3600);
  });
});