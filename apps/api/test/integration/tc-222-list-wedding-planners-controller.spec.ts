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

describe('TC-222: GET /api/v1/wedding-planners — List Wedding Planners (US-008)', () => {
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

  it('returns the Wedding Planners in the calling tenant, ordered newest-first', async () => {
    await ctx.prisma.users.create({
      data: {
        id: 'wp-older',
        tenant_id: 'default',
        email: 'ada@wendy',
        full_name: 'Ada Lovelace',
        role: 'WeddingPlanner',
        is_disabled: false,
        password_hash: await hash('whatever', 4),
        created_at: new Date('2026-08-10T09:00:00.000Z'),
      },
    });
    await ctx.prisma.users.create({
      data: {
        id: 'wp-newer',
        tenant_id: 'default',
        email: 'grace@wendy',
        full_name: 'Grace Hopper',
        role: 'WeddingPlanner',
        is_disabled: false,
        password_hash: await hash('whatever', 4),
        created_at: new Date('2026-08-17T10:00:00.000Z'),
      },
    });

    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/wedding-planners')
      .set('Authorization', `Bearer ${adminToken()}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toMatchObject({
      id: 'wp-newer',
      fullName: 'Grace Hopper',
      email: 'grace@wendy',
      role: 'WeddingPlanner',
      isDisabled: false,
    });
    expect(res.body[1]).toMatchObject({
      id: 'wp-older',
      fullName: 'Ada Lovelace',
      email: 'ada@wendy',
    });
    expect(typeof res.body[0].createdAt).toBe('string');
  });

  it('returns an empty array when the tenant has no Wedding Planners', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/wedding-planners')
      .set('Authorization', `Bearer ${adminToken()}`)
      .expect(200);

    expect(res.body).toEqual([]);
  });

  it('excludes Administrator rows from the response', async () => {
    await ctx.prisma.users.create({
      data: {
        id: 'wp-1',
        tenant_id: 'default',
        email: 'wp@wendy',
        full_name: 'Sample Planner',
        role: 'WeddingPlanner',
        is_disabled: false,
        password_hash: await hash('whatever', 4),
      },
    });

    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/wedding-planners')
      .set('Authorization', `Bearer ${adminToken()}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe('wp-1');
    expect(res.body[0].role).toBe('WeddingPlanner');
  });

  it('excludes cross-tenant Wedding Planners (Rule 3)', async () => {
    await ctx.prisma.tenants.create({
      data: {
        id: 'other-tenant',
        email_suffix: 'acme',
        display_name: 'Acme Weddings',
      },
    });
    await ctx.prisma.users.create({
      data: {
        id: 'wp-other',
        tenant_id: 'other-tenant',
        email: 'wp@acme',
        full_name: 'Foreign WP',
        role: 'WeddingPlanner',
        is_disabled: false,
        password_hash: await hash('whatever', 4),
      },
    });
    await ctx.prisma.users.create({
      data: {
        id: 'wp-ours',
        tenant_id: 'default',
        email: 'wp@wendy',
        full_name: 'Our WP',
        role: 'WeddingPlanner',
        is_disabled: false,
        password_hash: await hash('whatever', 4),
      },
    });

    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/wedding-planners')
      .set('Authorization', `Bearer ${adminToken()}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe('wp-ours');
    expect(res.body[0].tenantId).toBeUndefined();
  });

  it('never returns password material (Rule 21)', async () => {
    await ctx.prisma.users.create({
      data: {
        id: 'wp-1',
        tenant_id: 'default',
        email: 'wp@wendy',
        full_name: 'Sample Planner',
        role: 'WeddingPlanner',
        is_disabled: false,
        password_hash: await hash('whatever', 4),
      },
    });

    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/wedding-planners')
      .set('Authorization', `Bearer ${adminToken()}`)
      .expect(200);

    const wire = JSON.stringify(res.body);
    expect(wire).not.toMatch(/password/i);
    expect(wire).not.toMatch(/bcrypt/i);
    expect(wire).not.toMatch(/\$2[aby]\$/);
  });

  it('returns 403 when called by a Wedding Planner', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/wedding-planners')
      .set('Authorization', `Bearer ${plannerToken()}`)
      .expect(403);

    expect(res.body.message).toMatch(/Insufficient role/);
  });

  it('returns 401 when no bearer token is supplied', async () => {
    await request(ctx.app.getHttpServer())
      .get('/api/v1/wedding-planners')
      .expect(401);
  });
});