/**
 * TC-004: Wrong credentials return a generic error.
 *
 * Rule 14 — the same generic error message must be returned for
 * wrong username, wrong password, and disabled account.
 */

import { test, expect } from '@playwright/test';

import { login } from './helpers/api';

test.describe('TC-004: Wrong credentials generic error', () => {
  test('wrong password returns 401 with generic error', async () => {
    const { status, body } = await login({ password: 'definitely-wrong' });
    expect(status).toBe(401);

    const err = body as { message?: string; statusCode?: number };
    expect(err.message?.toLowerCase()).toContain('invalid');
  });

  test('unknown username returns 401 with generic error', async () => {
    const { status, body } = await login({ username: 'nobody@wendy' });
    expect(status).toBe(401);

    const err = body as { message?: string };
    expect(err.message?.toLowerCase()).toContain('invalid');
  });
});