/**
 * TC-221 (adapter): GET /oauth/userinfo — server-authenticated profile.
 *
 * Scope per backend-blueprint §7.1:
 *   - Returns the caller's profile shape (id, fullName, email, role, tenantId).
 *   - Requires a valid bearer token (Rule 28 — server-authenticated source).
 *   - Does NOT leak password_hash.
 *   - Returns 401 without a bearer token; 401 for an unknown user id
 *     after token verification (because the row is missing).
 */
import { hash } from 'bcrypt';
import request from 'supertest';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { JwtService } from '../../src/shared/jwt/jwt.service';

import { buildTestApp, resetDatabase } from './helpers/test-app.factory';
import type { IntegrationTestContext } from './helpers/test-app.factory';

describe('TC-221: GET /oauth/userinfo — AuthController userinfo', () => {
  let ctx: IntegrationTestContext;

  beforeAll(async () => {
    ctx = await buildTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    await ctx.prisma.tenants.create({
      data: {
        id: 'default',
        email_suffix: 'wendy',
        display_name: 'Vineyards',
      },
    });
    await ctx.prisma.users.create({
      data: {
        id: 'admin-1',
        tenant_id: 'default',
        email: 'admin@wendy',
        full_name: 'Site Admin',
        role: 'Administrator',
        is_disabled: false,
        password_hash: await hash('whatever', 4),
      },
    });
  });

  function tokenFor(role: 'Administrator' | 'WeddingPlanner'): string {
    const jwt = ctx.app.get(JwtService);
    return jwt.signAccessToken({
      sub: 'admin-1' as any,
      role,
      tenantId: 'default' as any,
      fullName: 'Site Admin',
      email: 'admin@wendy',
    });
  }

  it('returns the profile shape for an authenticated caller', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/oauth/userinfo')
      .set('Authorization', `Bearer ${tokenFor('Administrator')}`)
      .expect(200);

    expect(res.body).toEqual({
      id: 'admin-1',
      fullName: 'Site Admin',
      email: 'admin@wendy',
      role: 'Administrator',
      tenantId: 'default',
    });
    expect(res.body).not.toHaveProperty('password_hash');
  });

  it('returns 401 when no bearer token is supplied', async () => {
    await request(ctx.app.getHttpServer())
      .get('/oauth/userinfo')
      .expect(401);
  });

  it('returns 404 when the JWT subject does not match a user row', async () => {
    // Build a token whose subject is a row id that does not exist.
    const jwt = ctx.app.get(JwtService);
    const token = jwt.signAccessToken({
      sub: 'ghost-user' as any,
      role: 'Administrator',
      tenantId: 'default' as any,
      fullName: 'Ghost',
      email: 'ghost@wendy',
    });

    await request(ctx.app.getHttpServer())
      .get('/oauth/userinfo')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });
});