/**
 * TC-305 (functional / use case): WeddingsService.putLocations — US-014a.
 *
 * Scope per backend-blueprint §7:
 *   - Use case exercised in isolation against a port mock.
 *   - The application never imports `@prisma/client` — the
 *     implementation swap to a real Prisma adapter is the
 *     WeddingRepository's job, not the service's.
 *
 * Tests the rules of the US-014a functional spec that belong to the
 * service layer:
 *   - The service mints a fresh WeddingLocationId per row before
 *     persisting (the platform, not the client, owns ID minting —
 *     the FE never sends an `id` field in the request body).
 *   - Trims whitespace on the three free-text fields per row
 *     (mirrors create / update).
 *   - Refuses archived weddings with `WeddingNotFoundError` — same
 *     envelope a not-found row returns (Rule 28).
 *   - Refuses not-found / cross-WP rows with the same envelope
 *     (Rule 1 + Rule 2).
 *   - Stamps `updatedAt` and `updatedByUserId` onto the call, then
 *     surfaces the post-mutation row.
 *   - Logs `wedding.locationsUpdated` with the row id, tenant,
 *     owner, actor, and the count of rows persisted.
 */
import type {
  WeddingDto,
  WeddingId,
  WeddingLocationDto,
  WeddingLocationId,
} from '@wendy/contracts';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import type {
  UpdateLocationsArgs,
  WeddingListRepositoryPort,
} from '../../src/modules/weddings/application/wedding-list.repository.port';
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
    updateLocations: vi.fn(async () => null),
  };
}

const principal = {
  actorId: 'wp-actor-001' as never,
  tenantId: 'tenant-001' as never,
};

const existingWedding: WeddingDto = {
  id: 'w-1' as WeddingId,
  tenantId: 'tenant-001' as never,
  ownerUserId: 'wp-actor-001' as never,
  partner1Name: 'Sofía Ramírez',
  partner2Name: 'Andrés López',
  eventDate: '2026-08-21',
  venueName: 'Hacienda',
  venueCity: 'CDMX',
  status: 'draft' as WeddingDto['status'],
  createdAt: '2026-08-19T12:00:00.000Z',
  createdByUserId: 'wp-actor-001' as never,
  updatedAt: '2026-08-19T12:00:00.000Z',
  updatedByUserId: 'wp-actor-001' as never,
  locations: [],
};

const sampleInput = {
  type: 'reception' as WeddingLocationDto['type'],
  venueName: 'Hacienda San Miguel',
  address: 'Av. Principal 123',
  city: 'CDMX',
  eventDate: '2026-08-21',
  startTime: '18:00',
  googleMapsLink: 'https://maps.google.com/?q=Hacienda',
  notes: 'Valet parking available',
};

describe('TC-305: WeddingsService.putLocations (US-014a)', () => {
  let service: WeddingsService;
  let repo: WeddingListRepositoryPort;
  let findByIdSpy: ReturnType<typeof vi.fn>;
  let updateLocationsSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    repo = fakeRepo();
    service = new WeddingsService(repo);
    findByIdSpy = repo.findById as unknown as ReturnType<typeof vi.fn>;
    updateLocationsSpy = repo.updateLocations as unknown as ReturnType<typeof vi.fn>;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('mints a fresh WeddingLocationId per row before persisting', async () => {
    findByIdSpy.mockResolvedValueOnce(existingWedding);
    updateLocationsSpy.mockImplementationOnce(async (args: UpdateLocationsArgs) => ({
      ...existingWedding,
      locations: args.locations,
      updatedAt: args.updatedAt.toISOString(),
      updatedByUserId: args.updatedByUserId as never,
    }));

    const res = await service.putLocations(principal, 'w-1', {
      locations: [sampleInput, { ...sampleInput, venueName: 'Plaza Norte' }],
    });

    expect(updateLocationsSpy).toHaveBeenCalledTimes(1);
    const persisted = updateLocationsSpy.mock.calls[0]![0].locations as WeddingLocationDto[];
    expect(persisted).toHaveLength(2);
    // Server mints ids — every row gets a unique WeddingLocationId.
    expect(persisted[0]!.id).toMatch(/^[A-Za-z0-9_-]{10}$/);
    expect(persisted[1]!.id).toMatch(/^[A-Za-z0-9_-]{10}$/);
    expect(persisted[0]!.id).not.toBe(persisted[1]!.id);
    // The returned dto reflects the canonical stamped ids.
    expect(res.locations).toHaveLength(2);
    expect((res.locations[0] as WeddingLocationDto).id).toBe(persisted[0]!.id);
    expect((res.locations[1] as WeddingLocationDto).id).toBe(persisted[1]!.id);
  });

  it('trims whitespace on the three free-text fields per row', async () => {
    findByIdSpy.mockResolvedValueOnce(existingWedding);
    updateLocationsSpy.mockResolvedValueOnce(existingWedding);

    await service.putLocations(principal, 'w-1', {
      locations: [
        {
          ...sampleInput,
          venueName: '   Hacienda San Miguel   ',
          address: '   Av. Principal 123   ',
          city: '   CDMX   ',
        },
      ],
    });

    const persisted = updateLocationsSpy.mock.calls[0]![0]
      .locations as WeddingLocationDto[];
    expect(persisted[0]!.venueName).toBe('Hacienda San Miguel');
    expect(persisted[0]!.address).toBe('Av. Principal 123');
    expect(persisted[0]!.city).toBe('CDMX');
  });

  it('stamps updatedAt + updatedByUserId onto the call (Rule 19 parity)', async () => {
    findByIdSpy.mockResolvedValueOnce(existingWedding);
    updateLocationsSpy.mockResolvedValueOnce(existingWedding);

    await service.putLocations(principal, 'w-1', {
      locations: [sampleInput],
    });

    const args = updateLocationsSpy.mock.calls[0]![0];
    expect(args.updatedByUserId).toBe(principal.actorId);
    expect(args.updatedAt).toBeInstanceOf(Date);
  });

  it('refuses archived weddings with WeddingNotFoundError (Rule 28)', async () => {
    findByIdSpy.mockResolvedValueOnce({
      ...existingWedding,
      status: 'archived' as WeddingDto['status'],
    });

    await expect(
      service.putLocations(principal, 'w-1', { locations: [sampleInput] }),
    ).rejects.toBeInstanceOf(WeddingNotFoundError);
    expect(updateLocationsSpy).not.toHaveBeenCalled();
  });

  it('refuses not-found rows with WeddingNotFoundError (Rule 1)', async () => {
    findByIdSpy.mockResolvedValueOnce(null);

    await expect(
      service.putLocations(principal, 'missing', { locations: [sampleInput] }),
    ).rejects.toBeInstanceOf(WeddingNotFoundError);
    expect(updateLocationsSpy).not.toHaveBeenCalled();
  });

  it('accepts an empty array (Rule 23) and stamps zero ids', async () => {
    findByIdSpy.mockResolvedValueOnce(existingWedding);
    updateLocationsSpy.mockResolvedValueOnce(existingWedding);

    const res = await service.putLocations(principal, 'w-1', {
      locations: [],
    });

    const args = updateLocationsSpy.mock.calls[0]![0];
    expect(args.locations).toEqual([]);
    expect(res.locations).toEqual([]);
  });

  it('raises WeddingNotFoundError on the race between findById and updateLocations', async () => {
    findByIdSpy.mockResolvedValueOnce(existingWedding);
    updateLocationsSpy.mockResolvedValueOnce(null);

    await expect(
      service.putLocations(principal, 'w-1', { locations: [sampleInput] }),
    ).rejects.toBeInstanceOf(WeddingNotFoundError);
  });

  it('preserves the FE-supplied array order verbatim (Rule 16)', async () => {
    findByIdSpy.mockResolvedValueOnce(existingWedding);
    updateLocationsSpy.mockResolvedValueOnce(existingWedding);

    await service.putLocations(principal, 'w-1', {
      locations: [
        { ...sampleInput, venueName: 'B' },
        { ...sampleInput, venueName: 'A' },
      ],
    });

    const persisted = updateLocationsSpy.mock.calls[0]![0]
      .locations as WeddingLocationDto[];
    // Service never re-sorts — order is the FE's responsibility.
    expect(persisted[0]!.venueName).toBe('B');
    expect(persisted[1]!.venueName).toBe('A');
  });

  it('returns ids on the response dto so the FE can reconcile local state', async () => {
    const stampedRow: WeddingLocationDto = {
      ...sampleInput,
      id: 'fresh-id-001' as WeddingLocationId,
    };
    findByIdSpy.mockResolvedValueOnce(existingWedding);
    updateLocationsSpy.mockResolvedValueOnce({
      ...existingWedding,
      locations: [stampedRow],
    });

    const res = await service.putLocations(principal, 'w-1', {
      locations: [sampleInput],
    });

    expect(res.locations[0]!.id).toBe('fresh-id-001');
  });
});