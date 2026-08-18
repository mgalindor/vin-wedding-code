/**
 * TC-220 (adapter): POST /api/v1/wedding-planners — WeddingPlannersController.
 *
 * Scope per backend-blueprint §7.1:
 *   - Inbound adapter (WeddingPlannersController) and outbound
 *     adapters (UserRepository, PrismaTenantEmailSuffixProvider)
 *     exercised end-to-end against a real Postgres instance.
 *   - DTO contract enforced by the global ValidationPipe.
 *   - Auth/Roles guard returns 403 for Wedding Planner callers.
 *   - Field-level 409 conflicts on duplicate email/username.
 *   - The slug is composed server-side; the FE never sees the full
 *     address until the response.
 *   - The cleartext password appears exactly once in the response.
 *   - Other Wedding Planners cannot reach the endpoint.
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

describe('TC-220: POST /api/v1/wedding-planners — Onboard Wedding Planner', () => {
  let ctx: IntegrationTestContext;

  beforeAll(async () => {
    ctx = await buildTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    // Seed the default tenant row + an Administrator that signs the JWTs.
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

  function adminToken(): string {
    const jwt = ctx.app.get(JwtService);
    return jwt.signAccessToken({
      sub: 'admin-1' as any,
      role: 'Administrator' as any,
      tenantId: 'default' as any,
      fullName: 'Site Admin',
      email: 'admin@wendy',
    });
  }

  function plannerToken(): string {
    const jwt = ctx.app.get(JwtService);
    return jwt.signAccessToken({
      sub: 'wp-1' as any,
      role: 'WeddingPlanner' as any,
      tenantId: 'default' as any,
      fullName: 'Sample Planner',
      email: 'wp@wendy',
    });
  }

  it('creates a Wedding Planner and returns the cleartext password once', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/wedding-planners')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada.lovelace@example.com',
        username: 'ada',
        password: 'a-strong-passphrase',
      })
      .expect(201);

    expect(res.body).toMatchObject({
      username: 'ada@wendy',
      initialPassword: 'a-strong-passphrase',
      onboardedByAdminId: 'admin-1',
    });
    expect(res.body.id).toMatch(/^[A-Za-z0-9_-]{10}$/);
    expect(typeof res.body.createdAt).toBe('string');

    // Row was persisted with the composed full address.
    const row = await ctx.prisma.users.findUnique({
      where: { email: 'ada@wendy' },
    });
    expect(row).toBeTruthy();
    expect(row?.full_name).toBe('Ada Lovelace');
    expect(row?.role).toBe('WeddingPlanner');
    expect(row?.tenant_id).toBe('default');
    expect(row?.onboarded_by_admin_id).toBe('admin-1');
    expect(row?.password_hash).not.toBe('a-strong-passphrase');
  });

  it('rejects missing required fields with 400', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/wedding-planners')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({
        firstName: 'Ada',
        // lastName missing
        email: 'ada.lovelace@example.com',
        username: 'ada',
        password: 'a-strong-passphrase',
      })
      .expect(400);

    // The ValidationPipe returns messages either as a string or as an
    // array depending on whether it surfaces a single constraint or
    // many — assert by string-content either way.
    const body = JSON.stringify(res.body);
    expect(body).toMatch(/lastName/);
  });

  it('rejects slug with non-lowercase characters with 400', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/wedding-planners')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada.lovelace@example.com',
        username: 'Ada-Lovelace', // uppercase + hyphen must fail
        password: 'a-strong-passphrase',
      })
      .expect(400);

    expect(JSON.stringify(res.body)).toMatch(/username/i);
  });

  it('accepts a slug with lowercase letters and digits', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/wedding-planners')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({
        firstName: 'Grace',
        lastName: 'Hopper',
        email: 'grace.hopper@example.com',
        username: 'grace2026',
        password: 'a-strong-passphrase',
      })
      .expect(201);

    expect(res.body.username).toBe('grace2026@wendy');
  });

  it('rejects a slug that contains an @ symbol', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/wedding-planners')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada.lovelace@example.com',
        username: 'ada@wendy', // already suffixed — must fail
        password: 'a-strong-passphrase',
      })
      .expect(400);

    expect(JSON.stringify(res.body)).toMatch(/username/i);
  });

  it('rejects a too-short password with 400', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/wedding-planners')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada.lovelace@example.com',
        username: 'ada',
        password: 'short',
      })
      .expect(400);

    expect(JSON.stringify(res.body)).toMatch(/password/i);
  });

  it('rejects a duplicate email with 409', async () => {
    await ctx.prisma.users.create({
      data: {
        id: 'wp-existing',
        tenant_id: 'default',
        email: 'taken@example.com',
        full_name: 'Existing',
        role: 'WeddingPlanner',
        is_disabled: false,
        password_hash: await hash('whatever', 4),
      },
    });

    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/wedding-planners')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'taken@example.com',
        username: 'ada',
        password: 'a-strong-passphrase',
      })
      .expect(409);

    expect(JSON.stringify(res.body)).toMatch(/email/i);
  });

  it('rejects a duplicate composed username with 409', async () => {
    await ctx.prisma.users.create({
      data: {
        id: 'wp-existing',
        tenant_id: 'default',
        email: 'ada@wendy',
        full_name: 'Existing',
        role: 'WeddingPlanner',
        is_disabled: false,
        password_hash: await hash('whatever', 4),
      },
    });

    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/wedding-planners')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada.lovelace@example.com',
        username: 'ada',
        password: 'a-strong-passphrase',
      })
      .expect(409);

    expect(JSON.stringify(res.body)).toMatch(/username/i);
  });

  it('returns 403 when called by a Wedding Planner', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/wedding-planners')
      .set('Authorization', `Bearer ${plannerToken()}`)
      .send({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada.lovelace@example.com',
        username: 'ada',
        password: 'a-strong-passphrase',
      })
      .expect(403);

    expect(res.body.message).toMatch(/Insufficient role/);
  });

  it('returns 401 when no bearer token is supplied', async () => {
    await request(ctx.app.getHttpServer())
      .post('/api/v1/wedding-planners')
      .send({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada.lovelace@example.com',
        username: 'ada',
        password: 'a-strong-passphrase',
      })
      .expect(401);
  });
});