/**
 * TC-502 (adapter): GET /api/v1/weddings — WeddingsController.list — US-011.
 *
 * Scope per backend-blueprint §7.1:
 *   - Inbound adapter (WeddingsController) and outbound adapters
 *     (WeddingRepository → Prisma) exercised end-to-end against a
 *     real Postgres instance.
 *   - DTO contract enforced by the global ValidationPipe.
 *   - Auth/JwtAuthGuard returns 401 for an unauthenticated request.
 *   - Wedding Planner sees only their own weddings (Rule 1 of the
 *     functional spec + tech-spec v1.1.0).
 *   - Administrator sees every wedding in their tenant
 *     (tech-spec v1.1.0).
 *   - Cross-tenant weddings are never returned (Rule 3).
 *   - The status filter maps `active` to
 *     status='published' AND event_date >= today.
 *   - The search filter trims and matches against partner name.
 *   - The sort value drives orderBy.
 *   - Pagination: `total`, `hasMore`, and `limit`/`offset` are
 *     honoured.
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

const TODAY_ISO = '2026-08-19';

async function seedTenant(
  ctx: IntegrationTestContext,
  tenantId: string,
  suffix: string,
) {
  await ctx.prisma.tenants.create({
    data: {
      id: tenantId,
      email_suffix: suffix,
      display_name: tenantId,
    },
  });
}

async function seedUser(
  ctx: IntegrationTestContext,
  args: {
    id: string;
    tenantId: string;
    email: string;
    fullName: string;
    role: 'WeddingPlanner' | 'Administrator';
  },
) {
  await ctx.prisma.users.create({
    data: {
      id: args.id,
      tenant_id: args.tenantId,
      email: args.email,
      full_name: args.fullName,
      role: args.role,
      is_disabled: false,
      password_hash: await hash('whatever', 4),
    },
  });
}

async function seedWedding(
  ctx: IntegrationTestContext,
  args: {
    id: string;
    tenantId: string;
    ownerUserId: string;
    partner1Name: string;
    partner2Name: string;
    eventDate: string;
    status?: 'draft' | 'published' | 'archived';
  },
) {
  await ctx.prisma.weddings.create({
    data: {
      id: args.id,
      tenant_id: args.tenantId,
      owner_user_id: args.ownerUserId,
      partner_1_name: args.partner1Name,
      partner_2_name: args.partner2Name,
      event_date: new Date(args.eventDate + 'T00:00:00.000Z'),
      venue_name: 'Venue',
      venue_city: 'CDMX',
      status: args.status ?? 'draft',
      created_by_user_id: args.ownerUserId,
      updated_by_user_id: args.ownerUserId,
    },
  });
}

function token(
  ctx: IntegrationTestContext,
  args: {
    sub: string;
    role: 'WeddingPlanner' | 'Administrator';
    tenantId: string;
  },
): string {
  const jwt = ctx.app.get(JwtService);
  return jwt.signAccessToken({
    sub: args.sub as any,
    role: args.role as any,
    tenantId: args.tenantId as any,
    fullName: args.sub,
    email: `${args.sub}@wendy`,
  });
}

describe('TC-502: GET /api/v1/weddings — Find a wedding quickly (US-011)', () => {
  let ctx: IntegrationTestContext;

  beforeAll(async () => {
    ctx = await buildTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    await seedTenant(ctx, 'default', 'wendy');
    await seedTenant(ctx, 'other', 'acme');
    await seedUser(ctx, {
      id: 'wp-1',
      tenantId: 'default',
      email: 'wp@wendy',
      fullName: 'WP One',
      role: 'WeddingPlanner',
    });
    await seedUser(ctx, {
      id: 'wp-2',
      tenantId: 'default',
      email: 'wp2@wendy',
      fullName: 'WP Two',
      role: 'WeddingPlanner',
    });
    await seedUser(ctx, {
      id: 'admin-1',
      tenantId: 'default',
      email: 'admin@wendy',
      fullName: 'Site Admin',
      role: 'Administrator',
    });
    await seedUser(ctx, {
      id: 'wp-other',
      tenantId: 'other',
      email: 'wp@acme',
      fullName: 'Foreign WP',
      role: 'WeddingPlanner',
    });
  });

  it('returns the calling Wedding Planner\'s own weddings', async () => {
    await seedWedding(ctx, {
      id: 'w-mine-1',
      tenantId: 'default',
      ownerUserId: 'wp-1',
      partner1Name: 'Sofía',
      partner2Name: 'Andrés',
      eventDate: '2026-09-15',
    });
    await seedWedding(ctx, {
      id: 'w-other',
      tenantId: 'default',
      ownerUserId: 'wp-2',
      partner1Name: 'Ada',
      partner2Name: 'Grace',
      eventDate: '2026-09-15',
    });

    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/weddings')
      .set(
        'Authorization',
        `Bearer ${token(ctx, { sub: 'wp-1', role: 'WeddingPlanner', tenantId: 'default' })}`,
      )
      .expect(200);

    expect(res.body.total).toBe(1);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].id).toBe('w-mine-1');
    expect(res.body.hasMore).toBe('false');
  });

  it('returns every wedding in the tenant when the caller is an Administrator', async () => {
    await seedWedding(ctx, {
      id: 'w-mine-1',
      tenantId: 'default',
      ownerUserId: 'wp-1',
      partner1Name: 'Sofía',
      partner2Name: 'Andrés',
      eventDate: '2026-09-15',
    });
    await seedWedding(ctx, {
      id: 'w-mine-2',
      tenantId: 'default',
      ownerUserId: 'wp-2',
      partner1Name: 'Ada',
      partner2Name: 'Grace',
      eventDate: '2026-09-15',
    });

    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/weddings')
      .set(
        'Authorization',
        `Bearer ${token(ctx, { sub: 'admin-1', role: 'Administrator', tenantId: 'default' })}`,
      )
      .expect(200);

    expect(res.body.total).toBe(2);
    expect(res.body.items.map((w: { id: string }) => w.id).sort()).toEqual([
      'w-mine-1',
      'w-mine-2',
    ]);
  });

  it('never returns a wedding from another tenant', async () => {
    await seedWedding(ctx, {
      id: 'w-foreign',
      tenantId: 'other',
      ownerUserId: 'wp-other',
      partner1Name: 'Sofía',
      partner2Name: 'Andrés',
      eventDate: '2026-09-15',
    });
    await seedWedding(ctx, {
      id: 'w-mine',
      tenantId: 'default',
      ownerUserId: 'wp-1',
      partner1Name: 'Ada',
      partner2Name: 'Grace',
      eventDate: '2026-09-15',
    });

    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/weddings')
      .set(
        'Authorization',
        `Bearer ${token(ctx, { sub: 'admin-1', role: 'Administrator', tenantId: 'default' })}`,
      )
      .expect(200);

    expect(res.body.total).toBe(1);
    expect(res.body.items[0].id).toBe('w-mine');
  });

  it('filters by status=active to status=published AND event_date >= today', async () => {
    // Future published — included by `active`
    await seedWedding(ctx, {
      id: 'w-future-published',
      tenantId: 'default',
      ownerUserId: 'wp-1',
      partner1Name: 'Future P',
      partner2Name: 'P',
      eventDate: '2027-01-01',
      status: 'published',
    });
    // Past published — excluded by `active` (event_date < today)
    await seedWedding(ctx, {
      id: 'w-past-published',
      tenantId: 'default',
      ownerUserId: 'wp-1',
      partner1Name: 'Past P',
      partner2Name: 'P',
      eventDate: '2026-01-01',
      status: 'published',
    });
    // Future draft — excluded by `active` (status != published)
    await seedWedding(ctx, {
      id: 'w-future-draft',
      tenantId: 'default',
      ownerUserId: 'wp-1',
      partner1Name: 'Future D',
      partner2Name: 'D',
      eventDate: '2027-01-01',
      status: 'draft',
    });

    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/weddings?status=active')
      .set(
        'Authorization',
        `Bearer ${token(ctx, { sub: 'wp-1', role: 'WeddingPlanner', tenantId: 'default' })}`,
      )
      .expect(200);

    expect(res.body.total).toBe(1);
    expect(res.body.items[0].id).toBe('w-future-published');
  });

  it('filters by status=draft and status=archived', async () => {
    await seedWedding(ctx, {
      id: 'w-draft',
      tenantId: 'default',
      ownerUserId: 'wp-1',
      partner1Name: 'D',
      partner2Name: 'D',
      eventDate: '2026-09-15',
      status: 'draft',
    });
    await seedWedding(ctx, {
      id: 'w-archived',
      tenantId: 'default',
      ownerUserId: 'wp-1',
      partner1Name: 'A',
      partner2Name: 'A',
      eventDate: '2025-01-01',
      status: 'archived',
    });

    const draftRes = await request(ctx.app.getHttpServer())
      .get('/api/v1/weddings?status=draft')
      .set(
        'Authorization',
        `Bearer ${token(ctx, { sub: 'wp-1', role: 'WeddingPlanner', tenantId: 'default' })}`,
      )
      .expect(200);
    expect(draftRes.body.items.map((w: { id: string }) => w.id)).toEqual([
      'w-draft',
    ]);

    const archivedRes = await request(ctx.app.getHttpServer())
      .get('/api/v1/weddings?status=archived')
      .set(
        'Authorization',
        `Bearer ${token(ctx, { sub: 'wp-1', role: 'WeddingPlanner', tenantId: 'default' })}`,
      )
      .expect(200);
    expect(archivedRes.body.items.map((w: { id: string }) => w.id)).toEqual([
      'w-archived',
    ]);
  });

  it('searches case-insensitively against partner_1_name or partner_2_name', async () => {
    await seedWedding(ctx, {
      id: 'w-sofia',
      tenantId: 'default',
      ownerUserId: 'wp-1',
      partner1Name: 'Sofía Ramírez',
      partner2Name: 'Andrés López',
      eventDate: '2026-09-15',
    });
    await seedWedding(ctx, {
      id: 'w-andres',
      tenantId: 'default',
      ownerUserId: 'wp-1',
      partner1Name: 'Ada',
      partner2Name: 'Andrés',
      eventDate: '2026-09-15',
    });
    await seedWedding(ctx, {
      id: 'w-other',
      tenantId: 'default',
      ownerUserId: 'wp-1',
      partner1Name: 'Mengano',
      partner2Name: 'Fulano',
      eventDate: '2026-09-15',
    });

    // Lower-case "andrés" should match the first two rows (case
    // insensitive). Trim is applied by the service.
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/weddings?search=  andr%C3%A9s  ')
      .set(
        'Authorization',
        `Bearer ${token(ctx, { sub: 'wp-1', role: 'WeddingPlanner', tenantId: 'default' })}`,
      )
      .expect(200);

    expect(res.body.total).toBe(2);
    expect(res.body.items.map((w: { id: string }) => w.id).sort()).toEqual([
      'w-andres',
      'w-sofia',
    ]);
  });

  it('sort=date orders upcoming first by event_date ascending', async () => {
    await seedWedding(ctx, {
      id: 'w-past',
      tenantId: 'default',
      ownerUserId: 'wp-1',
      partner1Name: 'P',
      partner2Name: 'P',
      eventDate: '2025-01-01',
    });
    await seedWedding(ctx, {
      id: 'w-soon',
      tenantId: 'default',
      ownerUserId: 'wp-1',
      partner1Name: 'S',
      partner2Name: 'S',
      eventDate: '2026-12-01',
    });
    await seedWedding(ctx, {
      id: 'w-sooner',
      tenantId: 'default',
      ownerUserId: 'wp-1',
      partner1Name: 'M',
      partner2Name: 'M',
      eventDate: '2026-09-15',
    });

    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/weddings?sort=date')
      .set(
        'Authorization',
        `Bearer ${token(ctx, { sub: 'wp-1', role: 'WeddingPlanner', tenantId: 'default' })}`,
      )
      .expect(200);

    expect(res.body.items.map((w: { id: string }) => w.id)).toEqual([
      'w-sooner',
      'w-soon',
      'w-past',
    ]);
  });

  it('sort=added orders by created_at DESC', async () => {
    await ctx.prisma.weddings.create({
      data: {
        id: 'w-old',
        tenant_id: 'default',
        owner_user_id: 'wp-1',
        partner_1_name: 'Old',
        partner_2_name: 'Old',
        event_date: new Date('2026-09-15T00:00:00.000Z'),
        venue_name: 'V',
        venue_city: 'C',
        status: 'draft',
        created_at: new Date('2026-08-01T10:00:00.000Z'),
        created_by_user_id: 'wp-1',
        updated_at: new Date('2026-08-01T10:00:00.000Z'),
        updated_by_user_id: 'wp-1',
      },
    });
    await ctx.prisma.weddings.create({
      data: {
        id: 'w-new',
        tenant_id: 'default',
        owner_user_id: 'wp-1',
        partner_1_name: 'New',
        partner_2_name: 'New',
        event_date: new Date('2026-09-15T00:00:00.000Z'),
        venue_name: 'V',
        venue_city: 'C',
        status: 'draft',
        created_at: new Date('2026-08-19T10:00:00.000Z'),
        created_by_user_id: 'wp-1',
        updated_at: new Date('2026-08-19T10:00:00.000Z'),
        updated_by_user_id: 'wp-1',
      },
    });

    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/weddings?sort=added')
      .set(
        'Authorization',
        `Bearer ${token(ctx, { sub: 'wp-1', role: 'WeddingPlanner', tenantId: 'default' })}`,
      )
      .expect(200);

    expect(res.body.items.map((w: { id: string }) => w.id)).toEqual([
      'w-new',
      'w-old',
    ]);
  });

  it('returns hasMore=true when more rows exist beyond the page', async () => {
    for (let i = 1; i <= 3; i += 1) {
      await seedWedding(ctx, {
        id: `w-page-${i}`,
        tenantId: 'default',
        ownerUserId: 'wp-1',
        partner1Name: 'P',
        partner2Name: `P-${i}`,
        eventDate: `2026-0${i}-15`,
      });
    }

    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/weddings?limit=2&offset=0')
      .set(
        'Authorization',
        `Bearer ${token(ctx, { sub: 'wp-1', role: 'WeddingPlanner', tenantId: 'default' })}`,
      )
      .expect(200);

    expect(res.body.total).toBe(3);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.hasMore).toBe('true');
  });

  it('returns hasMore=false on the last page', async () => {
    await seedWedding(ctx, {
      id: 'w-only',
      tenantId: 'default',
      ownerUserId: 'wp-1',
      partner1Name: 'P',
      partner2Name: 'P',
      eventDate: '2026-09-15',
    });

    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/weddings')
      .set(
        'Authorization',
        `Bearer ${token(ctx, { sub: 'wp-1', role: 'WeddingPlanner', tenantId: 'default' })}`,
      )
      .expect(200);

    expect(res.body.hasMore).toBe('false');
  });

  it('returns empty items + total=0 when the WP has no weddings', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/weddings')
      .set(
        'Authorization',
        `Bearer ${token(ctx, { sub: 'wp-1', role: 'WeddingPlanner', tenantId: 'default' })}`,
      )
      .expect(200);

    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(0);
    expect(res.body.hasMore).toBe('false');
  });

  it('rejects an invalid status enum (400)', async () => {
    await request(ctx.app.getHttpServer())
      .get('/api/v1/weddings?status=invalid')
      .set(
        'Authorization',
        `Bearer ${token(ctx, { sub: 'wp-1', role: 'WeddingPlanner', tenantId: 'default' })}`,
      )
      .expect(400);
  });

  it('rejects a limit > 100 (400)', async () => {
    await request(ctx.app.getHttpServer())
      .get('/api/v1/weddings?limit=500')
      .set(
        'Authorization',
        `Bearer ${token(ctx, { sub: 'wp-1', role: 'WeddingPlanner', tenantId: 'default' })}`,
      )
      .expect(400);
  });

  it('accepts numeric-string limit / offset (200) — regression guard for @Type(() => Number)', async () => {
    // Query strings arrive as strings ("50", "0"). The ValidationPipe
    // must coerce them to numbers before `@IsInt` runs — otherwise
    // every call from the FE returns 400 with "limit must be an
    // integer". TC-501b asserts the same DTO-coercion contract at the
    // unit level; this case guards it at the HTTP boundary.
    await request(ctx.app.getHttpServer())
      .get('/api/v1/weddings?limit=50&offset=0')
      .set(
        'Authorization',
        `Bearer ${token(ctx, { sub: 'wp-1', role: 'WeddingPlanner', tenantId: 'default' })}`,
      )
      .expect(200);
  });

  it('rejects an unauthenticated request (401)', async () => {
    await request(ctx.app.getHttpServer())
      .get('/api/v1/weddings')
      .expect(401);
  });

  it('echoes the WeddingDto shape (id, tenantId, ownerUserId, names, venue, status, createdAt, createdByUserId)', async () => {
    await seedWedding(ctx, {
      id: 'w-dto',
      tenantId: 'default',
      ownerUserId: 'wp-1',
      partner1Name: 'Sofía',
      partner2Name: 'Andrés',
      eventDate: '2026-09-15',
    });

    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/weddings')
      .set(
        'Authorization',
        `Bearer ${token(ctx, { sub: 'wp-1', role: 'WeddingPlanner', tenantId: 'default' })}`,
      )
      .expect(200);

    expect(res.body.items[0]).toMatchObject({
      id: 'w-dto',
      tenantId: 'default',
      ownerUserId: 'wp-1',
      partner1Name: 'Sofía',
      partner2Name: 'Andrés',
      eventDate: '2026-09-15',
      venueName: 'Venue',
      venueCity: 'CDMX',
      status: 'draft',
      createdByUserId: 'wp-1',
    });
    expect(res.body.items[0].id).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(typeof res.body.items[0].createdAt).toBe('string');
  });
});

// Helper reference to keep TODAY_ISO reachable inside the file.
// Suppress unused-var warning if not consumed by a future test.
void TODAY_ISO;
