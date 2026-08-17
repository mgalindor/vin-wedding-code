/**
 * TC-002: Token lifetime is 7 days (604800 seconds).
 *
 * Decodes the JWT issued on a successful login and asserts that
 * exp - iat === 604800.
 */

import { test, expect } from '@playwright/test';

import { decodeJwt, login } from './helpers/api';

test.describe('TC-002: Token lifetime is 7 days', () => {
  test('exp - iat equals 604800 seconds (7 days)', async () => {
    const { status, body } = await login();
    expect(status).toBe(200);

    const success = body as { access_token: string };
    const claims = decodeJwt(success.access_token);

    const iat = claims.iat as number;
    const exp = claims.exp as number;

    expect(typeof iat).toBe('number');
    expect(typeof exp).toBe('number');
    expect(exp - iat).toBe(604800);
  });
});