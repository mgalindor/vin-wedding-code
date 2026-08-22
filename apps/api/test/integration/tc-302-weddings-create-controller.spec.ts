/**
 * TC-302 (adapter): POST /api/v1/weddings — WeddingsController.
 *
 * Scope per backend-blueprint §7.1:
 *   - Inbound adapter (WeddingsController) and outbound adapters
 *     (WeddingRepository → Prisma) exercised end-to-end against a
 *     real Postgres instance.
 *   - DTO contract enforced by the global ValidationPipe.
 *   - Auth/Roles guard returns 403 for an unauthenticated request and
 *     for an Administrator-only session (Rule 1 of the functional
 *     spec).
 *   - Past dates are accepted (FE warning concern only).
 *   - The five required fields are enforced — empty/whitespace values
 *     return 400.
 *   - The created row carries status='draft' and the principal's
 *     tenantId / ownerUserId / createdByUserId — never values from
 *     the request body (Rules 2, 3, 16).
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

describe('TC-302: POST /api/v1/weddings — Register a new wedding (US-009)', () => {
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
        id: 'wp-1',
        tenant_id: 'default',
        email: 'wp@wendy',
        full_name: 'Sample Planner',
        role: 'WeddingPlanner',
        is_disabled: false,
        password_hash: await hash('whatever', 4),
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

  function wpToken(): string {
    const jwt = ctx.app.get(JwtService);
    return jwt.signAccessToken({
      sub: 'wp-1' as any,
      role: 'WeddingPlanner' as any,
      tenantId: 'default' as any,
      fullName: 'Sample Planner',
      email: 'wp@wendy',
    });
  }

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

  it('creates a wedding row and returns status=draft with principal ids echoed', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/weddings')
      .set('Authorization', `Bearer ${wpToken()}`)
      .send({
        partner1Name: 'Sofía Ramírez',
        partner2Name: 'Andrés López',
        eventDate: '2026-08-21',
        venueName: 'Hacienda San Miguel',
        venueCity: 'CDMX',
      })
      .expect(201);

    expect(res.body).toMatchObject({
      tenantId: 'default',
      ownerUserId: 'wp-1',
      createdByUserId: 'wp-1',
      partner1Name: 'Sofía Ramírez',
      partner2Name: 'Andrés López',
      venueName: 'Hacienda San Miguel',
      venueCity: 'CDMX',
      eventDate: '2026-08-21',
      status: 'draft',
    });
    expect(res.body.id).toMatch(/^[A-Za-z0-9_-]{10}$/);
    expect(typeof res.body.createdAt).toBe('string');

    const row = await ctx.prisma.weddings.findUnique({
      where: { id: res.body.id },
    });
    expect(row).toBeTruthy();
    expect(row?.status).toBe('draft');
    expect(row?.tenant_id).toBe('default');
    expect(row?.owner_user_id).toBe('wp-1');
    expect(row?.created_by_user_id).toBe('wp-1');
    expect(row?.updated_by_user_id).toBe('wp-1');
  });

  it('ignores tenantId / ownerUserId / createdByUserId from the body', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/weddings')
      .set('Authorization', `Bearer ${wpToken()}`)
      .send({
        partner1Name: 'A',
        partner2Name: 'B',
        eventDate: '2026-08-21',
        venueName: 'V',
        venueCity: 'C',
        tenantId: 'attacker-tenant',
        ownerUserId: 'attacker-wp',
        createdByUserId: 'attacker',
        status: 'published',
      })
      .expect(400);

    // The DTO is whitelisted by ValidationPipe (`forbidNonWhitelisted:
    // true` in main.ts), so extra fields are rejected with 400 before
    // the controller runs. That's the actual behaviour we want — the
    // BE never reads these from the body, and an attacker who tries to
    // smuggle in `status='published'` is refused at the validation
    // boundary instead of being silently ignored.
    expect(res.body.message).toBeDefined();
  });

  it('rejects the request when any required field is missing (400)', async () => {
    await request(ctx.app.getHttpServer())
      .post('/api/v1/weddings')
      .set('Authorization', `Bearer ${wpToken()}`)
      .send({
        partner1Name: 'Sofía',
        // partner2Name omitted
        eventDate: '2026-08-21',
        venueName: 'Hacienda',
        venueCity: 'CDMX',
      })
      .expect(400);
  });

  it('accepts a past event date (warning is a FE-only concern)', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/weddings')
      .set('Authorization', `Bearer ${wpToken()}`)
      .send({
        partner1Name: 'A',
        partner2Name: 'B',
        eventDate: '2025-06-14',
        venueName: 'V',
        venueCity: 'C',
      })
      .expect(201);

    expect(res.body.eventDate).toBe('2025-06-14');
  });

  it('refuses an Administrator-only session (403) — Rule 1', async () => {
    await request(ctx.app.getHttpServer())
      .post('/api/v1/weddings')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({
        partner1Name: 'A',
        partner2Name: 'B',
        eventDate: '2026-08-21',
        venueName: 'V',
        venueCity: 'C',
      })
      .expect(403);
  });

  it('refuses an unauthenticated request (401)', async () => {
    await request(ctx.app.getHttpServer())
      .post('/api/v1/weddings')
      .send({
        partner1Name: 'A',
        partner2Name: 'B',
        eventDate: '2026-08-21',
        venueName: 'V',
        venueCity: 'C',
      })
      .expect(401);
  });

  it('rejects an invalid date format (400)', async () => {
    await request(ctx.app.getHttpServer())
      .post('/api/v1/weddings')
      .set('Authorization', `Bearer ${wpToken()}`)
      .send({
        partner1Name: 'A',
        partner2Name: 'B',
        eventDate: 'not-a-date',
        venueName: 'V',
        venueCity: 'C',
      })
      .expect(400);
  });

  it('rejects whitespace-only text fields (400)', async () => {
    await request(ctx.app.getHttpServer())
      .post('/api/v1/weddings')
      .set('Authorization', `Bearer ${wpToken()}`)
      .send({
        partner1Name: '   ',
        partner2Name: 'B',
        eventDate: '2026-08-21',
        venueName: 'V',
        venueCity: 'C',
      })
      .expect(400);
  });
});