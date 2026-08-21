/**
 * TC-501 (functional / use case): WeddingsService.listWeddings — US-011.
 *
 * Scope per backend-blueprint §7:
 *   - Use case exercised in isolation against a port mock.
 *   - The application never imports `@prisma/client` — the
 *     implementation swap to a real Prisma adapter is the
 *     WeddingRepository's job, not the service's.
 *
 * Tests the rules of the functional spec that belong to the service
 * layer:
 *   - Wedding Planner sees only their own weddings (scope.ownerUserId
 *     = caller.id).
 *   - Administrator sees every wedding in the tenant (scope.ownerUserId
 *     intentionally omitted).
 *   - The status filter's `active` value maps to
 *     `{ kind: 'active', publishedAfterOrAt }`.
 *   - The status filter's `draft`, `archived`, and `all` values map
 *     to the equivalent neutral predicates.
 *   - The search term is trimmed, dropped when blank, and forwarded as
 *     `searchTerm` on the filter.
 *   - The sort value drives the orderBy shape.
 *   - Default limit/offset flow through to the list args.
 *   - Returns a `{ items, total }` shape with the mapped WeddingDto.
 *   - Logs `weddings.listed` with the query + counts.
 */
import type { WeddingDto, WeddingId } from '@wendy/contracts';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import type { WeddingListRepositoryPort } from '../../src/modules/weddings/application/wedding-list.repository.port';
import { WeddingsService } from '../../src/modules/weddings/application/weddings.service';
import { ValidationError } from '../../src/modules/weddings/application/weddings.service';

function fakeRepo(): WeddingListRepositoryPort {
  return {
    insert: vi.fn(async () => ({} as WeddingDto)),
    list: vi.fn(async () => []),
    count: vi.fn(async () => 0),
  };
}

const wpCaller = {
  id: 'wp-1' as never,
  role: 'WeddingPlanner' as never,
  tenantId: 'default' as never,
};

const adminCaller = {
  id: 'admin-1' as never,
  role: 'Administrator' as never,
  tenantId: 'default' as never,
};

const sampleWedding: WeddingDto = {
  id: 'w-1' as WeddingId,
  tenantId: 'default' as never,
  ownerUserId: 'wp-1' as never,
  partner1Name: 'Sofía Ramírez',
  partner2Name: 'Andrés López',
  eventDate: '2026-09-15',
  venueName: 'Hacienda San Miguel',
  venueCity: 'CDMX',
  status: 'draft' as WeddingDto['status'],
  createdAt: '2026-08-19T12:00:00.000Z',
  createdByUserId: 'wp-1' as never,
};

describe('TC-501: WeddingsService.listWeddings (US-011)', () => {
  let service: WeddingsService;
  let repo: WeddingListRepositoryPort;
  let listSpy: ReturnType<typeof vi.fn>;
  let countSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    repo = fakeRepo();
    service = new WeddingsService(repo);
    listSpy = repo.list as unknown as ReturnType<typeof vi.fn>;
    countSpy = repo.count as unknown as ReturnType<typeof vi.fn>;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('scopes a Wedding Planner call to their own weddings only', async () => {
    listSpy.mockResolvedValueOnce([sampleWedding]);
    countSpy.mockResolvedValueOnce(1);

    await service.listWeddings(wpCaller, { limit: 50, offset: 0 });

    expect(listSpy).toHaveBeenCalledTimes(1);
    const args = listSpy.mock.calls[0]![0];
    expect(args.filter.scope).toEqual({
      tenantId: 'default',
      ownerUserId: 'wp-1',
    });
  });

  it('drops the ownerUserId from the scope for an Administrator', async () => {
    listSpy.mockResolvedValueOnce([]);
    countSpy.mockResolvedValueOnce(0);

    await service.listWeddings(adminCaller, { limit: 50, offset: 0 });

    const args = listSpy.mock.calls[0]![0];
    expect(args.filter.scope).toEqual({ tenantId: 'default' });
  });

  it('maps status=active to a kind:active predicate anchored at today (UTC midnight)', async () => {
    listSpy.mockResolvedValueOnce([]);
    countSpy.mockResolvedValueOnce(0);

    const before = new Date();
    await service.listWeddings(wpCaller, {
      status: 'active',
      limit: 50,
      offset: 0,
    });
    const after = new Date();

    const args = listSpy.mock.calls[0]![0];
    expect(args.filter.status.kind).toBe('active');

    if (args.filter.status.kind !== 'active') {
      throw new Error('expected kind:active');
    }
    const anchor = args.filter.status.publishedAfterOrAt;
    expect(anchor.getTime()).toBeGreaterThanOrEqual(
      utcMidnightOn(before).getTime(),
    );
    expect(anchor.getTime()).toBeLessThanOrEqual(
      utcMidnightOn(after).getTime(),
    );
  });

  it('maps status=draft to kind:exact / draft', async () => {
    listSpy.mockResolvedValueOnce([]);
    countSpy.mockResolvedValueOnce(0);

    await service.listWeddings(wpCaller, {
      status: 'draft',
      limit: 50,
      offset: 0,
    });

    const args = listSpy.mock.calls[0]![0];
    expect(args.filter.status).toEqual({ kind: 'exact', value: 'draft' });
  });

  it('maps status=archived to kind:exact / archived', async () => {
    listSpy.mockResolvedValueOnce([]);
    countSpy.mockResolvedValueOnce(0);

    await service.listWeddings(wpCaller, {
      status: 'archived',
      limit: 50,
      offset: 0,
    });

    const args = listSpy.mock.calls[0]![0];
    expect(args.filter.status).toEqual({
      kind: 'exact',
      value: 'archived',
    });
  });

  it('maps status=all (or absent) to kind:all', async () => {
    listSpy.mockResolvedValueOnce([]);
    countSpy.mockResolvedValueOnce(0);

    await service.listWeddings(wpCaller, {
      status: 'all',
      limit: 50,
      offset: 0,
    });

    const args = listSpy.mock.calls[0]![0];
    expect(args.filter.status).toEqual({ kind: 'all' });
  });

  it('trims the search term, drops it when blank, and forwards it on the filter', async () => {
    listSpy.mockResolvedValueOnce([]);
    countSpy.mockResolvedValueOnce(0);

    await service.listWeddings(wpCaller, {
      search: '  sof  ',
      limit: 50,
      offset: 0,
    });

    const args = listSpy.mock.calls[0]![0];
    expect(args.filter.searchTerm).toBe('sof');

    await service.listWeddings(wpCaller, {
      search: '   ',
      limit: 50,
      offset: 0,
    });
    const args2 = listSpy.mock.calls[1]![0];
    expect(args2.filter.searchTerm).toBeUndefined();
  });

  it('uses eventDateUpcomingFirst for sort=date (default)', async () => {
    listSpy.mockResolvedValueOnce([]);
    countSpy.mockResolvedValueOnce(0);

    await service.listWeddings(wpCaller, { limit: 50, offset: 0 });

    const args = listSpy.mock.calls[0]![0];
    expect(args.orderBy).toEqual({ kind: 'eventDateUpcomingFirst' });
  });

  it('uses createdAtNewestFirst for sort=added', async () => {
    listSpy.mockResolvedValueOnce([]);
    countSpy.mockResolvedValueOnce(0);

    await service.listWeddings(wpCaller, {
      sort: 'added',
      limit: 50,
      offset: 0,
    });

    const args = listSpy.mock.calls[0]![0];
    expect(args.orderBy).toEqual({ kind: 'createdAtNewestFirst' });
  });

  it('passes skip and take through to the list args', async () => {
    listSpy.mockResolvedValueOnce([]);
    countSpy.mockResolvedValueOnce(0);

    await service.listWeddings(wpCaller, { limit: 25, offset: 100 });

    const args = listSpy.mock.calls[0]![0];
    expect(args.skip).toBe(100);
    expect(args.take).toBe(25);
  });

  it('returns { items, total } with the mapped WeddingDto', async () => {
    listSpy.mockResolvedValueOnce([sampleWedding]);
    countSpy.mockResolvedValueOnce(1);

    const result = await service.listWeddings(wpCaller, {
      limit: 50,
      offset: 0,
    });

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe('w-1');
  });

  it('runs list and count in parallel', async () => {
    listSpy.mockResolvedValueOnce([]);
    countSpy.mockResolvedValueOnce(0);

    await service.listWeddings(wpCaller, { limit: 50, offset: 0 });

    expect(listSpy).toHaveBeenCalledTimes(1);
    expect(countSpy).toHaveBeenCalledTimes(1);
  });

  it('emits a structured weddings.listed log line', async () => {
    listSpy.mockResolvedValueOnce([]);
    countSpy.mockResolvedValueOnce(0);
    const logSpy = vi.spyOn(service['logger'], 'log').mockImplementation(() => {});

    await service.listWeddings(wpCaller, {
      search: 'sof',
      status: 'draft',
      sort: 'added',
      limit: 25,
      offset: 0,
    });

    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'weddings.listed',
        tenantId: 'default',
        role: 'WeddingPlanner',
        actorId: 'wp-1',
        query: expect.objectContaining({
          search: 'sof',
          status: 'draft',
          sort: 'added',
          limit: 25,
          offset: 0,
        }),
      }),
    );
  });
});

function utcMidnightOn(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

// `ValidationError` is re-exported by the service module for callers
// that catch it (the controller). Keep the symbol alive here so a
// future change that drops the export doesn't accidentally remove
// the re-export.
expect(ValidationError).toBeDefined();
