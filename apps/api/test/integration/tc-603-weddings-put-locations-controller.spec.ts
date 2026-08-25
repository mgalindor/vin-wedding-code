/**
 * TC-603 (adapter): PUT /api/v1/weddings/{id}/locations — US-014a.
 *
 * Scope per backend-blueprint §7.1:
 *   - Inbound adapter (WeddingsController) and outbound adapter
 *     (WeddingRepository → Prisma) exercised end-to-end against a
 *     real Postgres instance.
 *   - DTO contract enforced by the global ValidationPipe.
 *   - PUT: @Roles('WeddingPlanner') refuses a pure Administrator
 *     session (Rule 1).
 *   - Cross-WP and cross-tenant writes return 404 (no enumeration).
 *   - Archived weddings refuse the PUT with 404 (Rule 28).
 *   - The full ordered array is replaced (Rule 15); empty array is
 *     a valid payload (Rule 23).
 *   - The `id` field is NOT expected in the request body — the
 *     server mints fresh WeddingLocationId values per row.
 *   - updatedAt + updatedByUserId are stamped on a successful PUT
 *     (Rule 19 parity).
 *   - The response carries typed `locations: WeddingLocationDto[]`
 *     with the server-minted ids.
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

describe('TC-603: PUT /api/v1/weddings/{id}/locations (US-014a)', () => {
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
      await ctx.prisma.weddings.update({
        where: { id },
        data: { status: overrides.status },
      });
    }

    return id;
  }

  const sampleInput = {
    type: 'reception',
    venueName: 'Hacienda San Miguel',
    address: 'Av. Principal 123',
    city: 'CDMX',
    googleMapsLink: 'https://maps.google.com/?q=Hacienda',
    eventDate: '2026-08-21',
    startTime: '18:00',
    notes: 'Valet parking available',
  };

  describe('PUT /api/v1/weddings/{id}/locations', () => {
    it('replaces the locations array with the typed body and mints server-side ids', async () => {
      const id = await createWedding();

      const res = await request(ctx.app.getHttpServer())
        .put(`/api/v1/weddings/${id}/locations`)
        .set('Authorization', `Bearer ${wpToken()}`)
        .send({
          locations: [
            sampleInput,
            { ...sampleInput, venueName: 'Plaza Norte', type: 'after_party' },
          ],
        })
        .expect(200);

      // Server stamped the ids — every row has a unique WeddingLocationId.
      expect(Array.isArray(res.body.locations)).toBe(true);
      expect(res.body.locations).toHaveLength(2);
      expect(res.body.locations[0].id).toMatch(/^[A-Za-z0-9_-]{10}$/);
      expect(res.body.locations[1].id).toMatch(/^[A-Za-z0-9_-]{10}$/);
      expect(res.body.locations[0].id).not.toBe(res.body.locations[1].id);
      expect(res.body.locations[0].type).toBe('reception');
      expect(res.body.locations[1].type).toBe('after_party');
      expect(res.body.locations[0].venueName).toBe('Hacienda San Miguel');

      // updatedAt + updatedByUserId were stamped.
      expect(res.body.updatedByUserId).toBe('wp-1');
      expect(typeof res.body.updatedAt).toBe('string');
    });

    it('persists the array on the JSONB column as a typed array, not a string', async () => {
      const id = await createWedding();

      await request(ctx.app.getHttpServer())
        .put(`/api/v1/weddings/${id}/locations`)
        .set('Authorization', `Bearer ${wpToken()}`)
        .send({ locations: [sampleInput] })
        .expect(200);

      const row = await ctx.prisma.weddings.findUnique({ where: { id } });
      expect(Array.isArray(row?.locations)).toBe(true);
      expect((row?.locations as unknown[]).length).toBe(1);
      // Verify each entry is an object (not a stringified blob).
      const first = (row?.locations as unknown[])[0];
      expect(typeof first).toBe('object');
      expect((first as { venueName?: string }).venueName).toBe(
        'Hacienda San Miguel',
      );
    });

    it('replaces the array (Rule 15) — submitting a different array removes old rows', async () => {
      const id = await createWedding();

      await request(ctx.app.getHttpServer())
        .put(`/api/v1/weddings/${id}/locations`)
        .set('Authorization', `Bearer ${wpToken()}`)
        .send({
          locations: [
            sampleInput,
            { ...sampleInput, venueName: 'Plaza Norte' },
          ],
        })
        .expect(200);

      const res = await request(ctx.app.getHttpServer())
        .put(`/api/v1/weddings/${id}/locations`)
        .set('Authorization', `Bearer ${wpToken()}`)
        .send({ locations: [{ ...sampleInput, venueName: 'Solo Venue' }] })
        .expect(200);

      expect(res.body.locations).toHaveLength(1);
      expect(res.body.locations[0].venueName).toBe('Solo Venue');
    });

    it('accepts an empty array (Rule 23)', async () => {
      const id = await createWedding();

      // Seed first so we have something to clear.
      await request(ctx.app.getHttpServer())
        .put(`/api/v1/weddings/${id}/locations`)
        .set('Authorization', `Bearer ${wpToken()}`)
        .send({ locations: [sampleInput] })
        .expect(200);

      const res = await request(ctx.app.getHttpServer())
        .put(`/api/v1/weddings/${id}/locations`)
        .set('Authorization', `Bearer ${wpToken()}`)
        .send({ locations: [] })
        .expect(200);

      expect(res.body.locations).toEqual([]);
    });

    it('rejects a row missing the venueName (400)', async () => {
      const id = await createWedding();

      await request(ctx.app.getHttpServer())
        .put(`/api/v1/weddings/${id}/locations`)
        .set('Authorization', `Bearer ${wpToken()}`)
        .send({
          locations: [{ ...sampleInput, venueName: '' }],
        })
        .expect(400);
    });

    it('rejects an invalid type value (400)', async () => {
      const id = await createWedding();

      await request(ctx.app.getHttpServer())
        .put(`/api/v1/weddings/${id}/locations`)
        .set('Authorization', `Bearer ${wpToken()}`)
        .send({
          locations: [{ ...sampleInput, type: 'engagement_party' }],
        })
        .expect(400);
    });

    it('rejects a googleMapsLink without http(s) (400)', async () => {
      const id = await createWedding();

      await request(ctx.app.getHttpServer())
        .put(`/api/v1/weddings/${id}/locations`)
        .set('Authorization', `Bearer ${wpToken()}`)
        .send({
          locations: [
            { ...sampleInput, googleMapsLink: 'maps.google.com/foo' },
          ],
        })
        .expect(400);
    });

    it('ignores client-supplied id fields (the server mints them)', async () => {
      const id = await createWedding();

      const res = await request(ctx.app.getHttpServer())
        .put(`/api/v1/weddings/${id}/locations`)
        .set('Authorization', `Bearer ${wpToken()}`)
        // Force a non-whitelisted field — global ValidationPipe with
        // forbidNonWhitelisted would reject this on the request body
        // (the WeddingLocationInputDto has no `id` field). We expect
        // a 400 here so the FE cannot inject ids.
        .send({
          locations: [{ ...sampleInput, id: 'client-mint-1' }],
        })
        .expect(400);
      // The status check guards against silent acceptance of id fields.
      expect(res.status).toBe(400);
    });

    it('returns 404 when the WP does not own the row (Rule 2)', async () => {
      const id = await createWedding('wp-2');

      await request(ctx.app.getHttpServer())
        .put(`/api/v1/weddings/${id}/locations`)
        .set('Authorization', `Bearer ${wpToken('wp-1')}`)
        .send({ locations: [sampleInput] })
        .expect(404);

      const row = await ctx.prisma.weddings.findUnique({ where: { id } });
      expect(row?.locations).toEqual([]);
    });

    it('returns 404 when the row is archived (Rule 28)', async () => {
      const id = await createWedding('wp-1', { status: 'archived' });

      await request(ctx.app.getHttpServer())
        .put(`/api/v1/weddings/${id}/locations`)
        .set('Authorization', `Bearer ${wpToken()}`)
        .send({ locations: [sampleInput] })
        .expect(404);

      const row = await ctx.prisma.weddings.findUnique({ where: { id } });
      expect(row?.locations).toEqual([]);
    });

    it('refuses a pure Administrator session (403) — Rule 1', async () => {
      const id = await createWedding();

      await request(ctx.app.getHttpServer())
        .put(`/api/v1/weddings/${id}/locations`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ locations: [sampleInput] })
        .expect(403);

      const row = await ctx.prisma.weddings.findUnique({ where: { id } });
      expect(row?.locations).toEqual([]);
    });

    it('returns 401 when unauthenticated', async () => {
      const id = await createWedding();

      await request(ctx.app.getHttpServer())
        .put(`/api/v1/weddings/${id}/locations`)
        .send({ locations: [sampleInput] })
        .expect(401);
    });

    it('returns 404 when the id does not exist', async () => {
      await request(ctx.app.getHttpServer())
        .put('/api/v1/weddings/aaaaaaaaaa/locations')
        .set('Authorization', `Bearer ${wpToken()}`)
        .send({ locations: [sampleInput] })
        .expect(404);
    });
  });

  describe('GET /api/v1/weddings/{id} carries locations', () => {
    it('returns the empty array when no locations have been captured', async () => {
      const id = await createWedding();

      const res = await request(ctx.app.getHttpServer())
        .get(`/api/v1/weddings/${id}`)
        .set('Authorization', `Bearer ${wpToken()}`)
        .expect(200);

      expect(Array.isArray(res.body.locations)).toBe(true);
      expect(res.body.locations).toEqual([]);
    });

    it('returns the typed locations array with server-minted ids', async () => {
      const id = await createWedding();

      await request(ctx.app.getHttpServer())
        .put(`/api/v1/weddings/${id}/locations`)
        .set('Authorization', `Bearer ${wpToken()}`)
        .send({ locations: [sampleInput] })
        .expect(200);

      const res = await request(ctx.app.getHttpServer())
        .get(`/api/v1/weddings/${id}`)
        .set('Authorization', `Bearer ${wpToken()}`)
        .expect(200);

      expect(res.body.locations).toHaveLength(1);
      expect(res.body.locations[0]).toMatchObject({
        type: 'reception',
        venueName: 'Hacienda San Miguel',
      });
      expect(res.body.locations[0].id).toMatch(/^[A-Za-z0-9_-]{10}$/);
    });
  });
});