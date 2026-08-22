/**
 * TC-303 (functional / use case): WeddingsService.getWedding — US-010.
 *
 * Scope per backend-blueprint §7:
 *   - Use case exercised in isolation against a port mock.
 *   - The application never imports `@prisma/client` — the
 *     implementation swap to a real Prisma adapter is the
 *     WeddingRepository's job, not the service's.
 *
 * Tests the rules of the US-010 functional spec that belong to the
 * service layer:
 *   - Wedding Planner scope narrows to the caller's own weddings
 *     (scope = { tenantId, ownerUserId: caller.id }).
 *   - Administrator scope covers the whole tenant
 *     (scope = { tenantId } only).
 *   - Missing or unauthorized rows raise `WeddingNotFoundError` — same
 *     envelope for both cases (no enumeration).
 *   - The returned row is whatever the repository hands back.
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
import {
  WeddingsService,
  WeddingNotFoundError,
} from '../../src/modules/weddings/application/weddings.service';

function fakeRepo(): WeddingListRepositoryPort {
  return {
    insert: vi.fn(async () => ({} as WeddingDto)),
    list: vi.fn(async () => []),
    count: vi.fn(async () => 0),
    findById: vi.fn(async () => null),
    updateById: vi.fn(async () => null),
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
  updatedAt: '2026-08-19T12:00:00.000Z',
  updatedByUserId: 'wp-1' as never,
};

describe('TC-303: WeddingsService.getWedding (US-010)', () => {
  let service: WeddingsService;
  let repo: WeddingListRepositoryPort;
  let findByIdSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    repo = fakeRepo();
    service = new WeddingsService(repo);
    findByIdSpy = repo.findById as unknown as ReturnType<typeof vi.fn>;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the wedding and scopes the read to caller.tenantId + caller.id (WP)', async () => {
    findByIdSpy.mockResolvedValueOnce(sampleWedding);

    const res = await service.getWedding(wpCaller, 'w-1');

    expect(res).toEqual(sampleWedding);
    expect(findByIdSpy).toHaveBeenCalledTimes(1);
    expect(findByIdSpy.mock.calls[0]![0]).toEqual({
      scope: { tenantId: 'default', ownerUserId: 'wp-1' },
      id: 'w-1',
    });
  });

  it('drops the owner predicate for an Administrator (tenant scope only)', async () => {
    findByIdSpy.mockResolvedValueOnce({
      ...sampleWedding,
      ownerUserId: 'wp-2' as never,
    });

    await service.getWedding(adminCaller, 'w-1');

    expect(findByIdSpy.mock.calls[0]![0]).toEqual({
      scope: { tenantId: 'default' },
      id: 'w-1',
    });
  });

  it('raises WeddingNotFoundError when the row does not match the scope', async () => {
    findByIdSpy.mockResolvedValueOnce(null);

    await expect(service.getWedding(wpCaller, 'w-1')).rejects.toBeInstanceOf(
      WeddingNotFoundError,
    );
  });

  it('raises WeddingNotFoundError when the row does not exist at all', async () => {
    findByIdSpy.mockResolvedValueOnce(null);

    await expect(service.getWedding(adminCaller, 'w-1')).rejects.toBeInstanceOf(
      WeddingNotFoundError,
    );
  });
});