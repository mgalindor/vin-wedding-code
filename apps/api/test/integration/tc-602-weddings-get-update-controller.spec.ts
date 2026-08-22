/**
 * TC-602 (adapter): GET /api/v1/weddings/{id} + PATCH /api/v1/weddings/{id} — US-010.
 *
 * Scope per backend-blueprint §7.1:
 *   - Inbound adapter (WeddingsController) and outbound adapter
 *     (WeddingRepository → Prisma) exercised end-to-end against a
 *     real Postgres instance.
 *   - DTO contract enforced by the global ValidationPipe.
 *   - GET: no @Roles — the service applies the role-aware scope
 *     (WP→own rows, Admin→whole tenant).
 *   - PATCH: @Roles('WeddingPlanner') refuses a pure Administrator
 *     session (Rule 1).
 *   - Cross-WP and cross-tenant reads/updates return 404 (no
 *     enumeration) per Rules 2 and 3.
 *   - Archived weddings refuse the PATCH with 404 (Rule 17).
 *   - The five required fields are enforced — empty/whitespace values
 *     return 400 on PATCH.
 *   - Past dates are accepted (FE warning concern only).
 *   - updatedAt + updatedByUserId are stamped on a successful PATCH
 *     (Rule 19).
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

describe('TC-602: GET /api/v1/weddings/{id} + PATCH /api/v1/weddings/{id} (US-010)', () => {
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
        id: 'wp-2',
        tenant_id: 'default',
        email: 'wp2@wendy',
        full_name: 'Other Planner',
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

  function wpToken(wpId = 'wp-1'): string {
    const jwt = ctx.app.get(JwtService);
    return jwt.signAccessToken({
      sub: wpId as any,
      role: 'WeddingPlanner' as any,
      tenantId: 'default' as any,
      fullName: 'Sample Planner',
      email: `${wpId}@wendy`,
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

  async function createWedding(
    ownerId = 'wp-1',
    overrides: Partial<{
      partner1Name: string;
      partner2Name: string;
      eventDate: string;
      venueName: string;
      venueCity: string;
      status: string;
    }> = {},
  ): Promise<string> {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/weddings')
      .set('Authorization', `Bearer ${wpToken(ownerId)}`)
      .send({
        partner1Name: overrides.partner1Name ?? 'Sofía Ramírez',
        partner2Name: overrides.partner2Name ?? 'Andrés López',
        eventDate: overrides.eventDate ?? '2026-08-21',
        venueName: overrides.venueName ?? 'Hacienda San Miguel',
        venueCity: overrides.venueCity ?? 'CDMX',
      })
      .expect(201);

    const id = res.body.id as string;

    if (overrides.status && overrides.status !== 'draft') {
      // Test fixture needs to bypass the API (no archive endpoint yet).
      await ctx.prisma.weddings.update({
        where: { id },
        data: { status: overrides.status },
      });
    }

    return id;
  }

  describe('GET /api/v1/weddings/{id}', () => {
    it('returns the wedding the caller owns (WP) with updatedAt + updatedByUserId', async () => {
      const id = await createWedding();

      const res = await request(ctx.app.getHttpServer())
        .get(`/api/v1/weddings/${id}`)
        .set('Authorization', `Bearer ${wpToken()}`)
        .expect(200);

      expect(res.body).toMatchObject({
        id,
        tenantId: 'default',
        ownerUserId: 'wp-1',
        partner1Name: 'Sofía Ramírez',
        partner2Name: 'Andrés López',
        eventDate: '2026-08-21',
        venueName: 'Hacienda San Miguel',
        venueCity: 'CDMX',
        status: 'draft',
        createdByUserId: 'wp-1',
        updatedByUserId: 'wp-1',
      });
      expect(typeof res.body.createdAt).toBe('string');
      expect(typeof res.body.updatedAt).toBe('string');
    });

    it('returns the wedding to an Administrator session (tenant scope)', async () => {
      const id = await createWedding('wp-2');

      const res = await request(ctx.app.getHttpServer())
        .get(`/api/v1/weddings/${id}`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .expect(200);

      expect(res.body.ownerUserId).toBe('wp-2');
    });

    it('returns 404 to a Wedding Planner session that does not own the row (Rule 2)', async () => {
      const id = await createWedding('wp-2');

      await request(ctx.app.getHttpServer())
        .get(`/api/v1/weddings/${id}`)
        .set('Authorization', `Bearer ${wpToken('wp-1')}`)
        .expect(404);
    });

    it('returns 404 when the id does not exist', async () => {
      await request(ctx.app.getHttpServer())
        .get('/api/v1/weddings/aaaaaaaaaa')
        .set('Authorization', `Bearer ${wpToken()}`)
        .expect(404);
    });

    it('returns 401 when unauthenticated', async () => {
      await request(ctx.app.getHttpServer())
        .get('/api/v1/weddings/aaaaaaaaaa')
        .expect(401);
    });
  });

  describe('PATCH /api/v1/weddings/{id}', () => {
    it('updates the five basic-detail fields and stamps updatedAt + updatedByUserId (Rule 19)', async () => {
      const id = await createWedding();

      const before = await ctx.prisma.weddings.findUnique({ where: { id } });

      const res = await request(ctx.app.getHttpServer())
        .patch(`/api/v1/weddings/${id}`)
        .set('Authorization', `Bearer ${wpToken()}`)
        .send({
          partner1Name: 'María Sánchez',
          partner2Name: 'Carlos Ruiz',
          eventDate: '2027-03-15',
          venueName: 'Nuevo Venue',
          venueCity: 'Guadalajara',
        })
        .expect(200);

      expect(res.body).toMatchObject({
        id,
        partner1Name: 'María Sánchez',
        partner2Name: 'Carlos Ruiz',
        eventDate: '2027-03-15',
        venueName: 'Nuevo Venue',
        venueCity: 'Guadalajara',
        status: 'draft', // unchanged
        createdByUserId: 'wp-1', // unchanged
        updatedByUserId: 'wp-1',
      });
      expect(res.body.updatedAt).not.toBe(before?.updated_at.toISOString());

      const row = await ctx.prisma.weddings.findUnique({ where: { id } });
      expect(row).toMatchObject({
        partner_1_name: 'María Sánchez',
        partner_2_name: 'Carlos Ruiz',
        venue_name: 'Nuevo Venue',
        venue_city: 'Guadalajara',
        status: 'draft',
        created_by_user_id: 'wp-1',
        updated_by_user_id: 'wp-1',
      });
    });

    it('accepts a past event date (FE warning concern only)', async () => {
      const id = await createWedding();

      const res = await request(ctx.app.getHttpServer())
        .patch(`/api/v1/weddings/${id}`)
        .set('Authorization', `Bearer ${wpToken()}`)
        .send({
          partner1Name: 'A',
          partner2Name: 'B',
          eventDate: '2025-06-14',
          venueName: 'V',
          venueCity: 'C',
        })
        .expect(200);

      expect(res.body.eventDate).toBe('2025-06-14');
    });

    it('rejects the request when any required field is missing (400)', async () => {
      const id = await createWedding();

      await request(ctx.app.getHttpServer())
        .patch(`/api/v1/weddings/${id}`)
        .set('Authorization', `Bearer ${wpToken()}`)
        .send({
          partner1Name: 'A',
          // partner2Name omitted
          eventDate: '2026-08-21',
          venueName: 'V',
          venueCity: 'C',
        })
        .expect(400);
    });

    it('rejects whitespace-only text fields (400)', async () => {
      const id = await createWedding();

      await request(ctx.app.getHttpServer())
        .patch(`/api/v1/weddings/${id}`)
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

    it('returns 404 when the WP does not own the row (Rule 2)', async () => {
      const id = await createWedding('wp-2');

      await request(ctx.app.getHttpServer())
        .patch(`/api/v1/weddings/${id}`)
        .set('Authorization', `Bearer ${wpToken('wp-1')}`)
        .send({
          partner1Name: 'A',
          partner2Name: 'B',
          eventDate: '2026-08-21',
          venueName: 'V',
          venueCity: 'C',
        })
        .expect(404);

      const row = await ctx.prisma.weddings.findUnique({ where: { id } });
      expect(row?.partner_1_name).not.toBe('A');
    });

    it('returns 404 when the row is archived (Rule 17)', async () => {
      const id = await createWedding('wp-1', { status: 'archived' });

      await request(ctx.app.getHttpServer())
        .patch(`/api/v1/weddings/${id}`)
        .set('Authorization', `Bearer ${wpToken()}`)
        .send({
          partner1Name: 'A',
          partner2Name: 'B',
          eventDate: '2026-08-21',
          venueName: 'V',
          venueCity: 'C',
        })
        .expect(404);

      const row = await ctx.prisma.weddings.findUnique({ where: { id } });
      expect(row?.partner_1_name).toBe('Sofía Ramírez'); // unchanged
    });

    it('refuses a pure Administrator session (403) — Rule 1', async () => {
      const id = await createWedding();

      await request(ctx.app.getHttpServer())
        .patch(`/api/v1/weddings/${id}`)
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

    it('returns 401 when unauthenticated', async () => {
      const id = await createWedding();

      await request(ctx.app.getHttpServer())
        .patch(`/api/v1/weddings/${id}`)
        .send({
          partner1Name: 'A',
          partner2Name: 'B',
          eventDate: '2026-08-21',
          venueName: 'V',
          venueCity: 'C',
        })
        .expect(401);
    });

    it('returns 404 when the id does not exist', async () => {
      await request(ctx.app.getHttpServer())
        .patch('/api/v1/weddings/aaaaaaaaaa')
        .set('Authorization', `Bearer ${wpToken()}`)
        .send({
          partner1Name: 'A',
          partner2Name: 'B',
          eventDate: '2026-08-21',
          venueName: 'V',
          venueCity: 'C',
        })
        .expect(404);
    });
  });
});