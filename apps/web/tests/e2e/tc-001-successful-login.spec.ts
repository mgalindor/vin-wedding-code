/**
 * TC-001: Successful login returns access token.
 *
 * Preconditions:
 *   - Backend listening on :3000
 *   - admin@wendy seeded (pnpm db:seed)
 *
 * Verifies:
 *   - HTTP 200
 *   - Response shape: access_token, token_type, expires_in, user
 *   - user.role is 'Administrator'
 */

import { test, expect } from '@playwright/test';

import { login } from './helpers/api';

test.describe('TC-001: Successful login returns access token', () => {
  test('POST /api/v1/oauth/token with valid credentials → 200 + JWT + user profile', async () => {
    const { status, body } = await login();

    expect(status).toBe(200);
    expect(body).toHaveProperty('access_token');
    expect(body).toHaveProperty('token_type', 'Bearer');
    expect(body).toHaveProperty('expires_in');
    expect(body).toHaveProperty('user');

    const success = body as {
      access_token: string;
      token_type: string;
      expires_in: number;
      user: { role: string; email: string };
    };

    expect(success.access_token.split('.').length).toBe(3); // valid JWT
    expect(success.user.role).toBe('Administrator');
    expect(success.user.email).toBe('admin@wendy');
  });
});