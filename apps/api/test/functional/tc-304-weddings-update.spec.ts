/**
 * TC-304 (functional / use case): WeddingsService.updateWedding — US-010.
 *
 * Scope per backend-blueprint §7:
 *   - Use case exercised in isolation against a port mock.
 *   - The application never imports `@prisma/client` — the
 *     implementation swap to a real Prisma adapter is the
 *     WeddingRepository's job, not the service's.
 *
 * Tests the rules of the US-010 functional spec that belong to the
 * service layer:
 *   - Updates the row's five basic-detail fields and stamps
 *     `updatedAt` + `updatedByUserId` (Rule 19).
 *   - Trims whitespace on the four text fields (mirrors the create
 *     use case — same character-limit / required-field posture).
 *   - Refuses archived weddings with `WeddingNotFoundError` — same
 *     envelope a not-found row returns (no enumeration, Rule 17).
 *   - Refuses not-found / cross-WP rows with the same envelope
 *     (Rule 2).
 *   - Stamps `updatedAt` and `updatedByUserId` onto the call, then
 *     surfaces the post-mutation row.
 *   - Logs `wedding.updated` with the row id, tenant, owner, and
 *     actor.
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
  ValidationError,
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

const principal = {
  actorId: 'wp-actor-001' as never,
  tenantId: 'tenant-001' as never,
};

const existingWedding: WeddingDto = {
  id: 'w-1' as WeddingId,
  tenantId: 'tenant-001' as never,
  ownerUserId: 'wp-actor-001' as never,
  partner1Name: 'Old Partner 1',
  partner2Name: 'Old Partner 2',
  eventDate: '2026-08-21',
  venueName: 'Old Venue',
  venueCity: 'Old City',
  status: 'draft' as WeddingDto['status'],
  createdAt: '2026-08-19T12:00:00.000Z',
  createdByUserId: 'wp-actor-001' as never,
  updatedAt: '2026-08-19T12:00:00.000Z',
  updatedByUserId: 'wp-actor-001' as never,
};

const updatedWedding: WeddingDto = {
  ...existingWedding,
  partner1Name: 'Sofía Ramírez',
  partner2Name: 'Andrés López',
  eventDate: '2027-12-31',
  venueName: 'Hacienda San Miguel',
  venueCity: 'CDMX',
  updatedAt: '2026-08-21T18:00:00.000Z',
  updatedByUserId: 'wp-actor-001' as never,
};

describe('TC-304: WeddingsService.updateWedding (US-010)', () => {
  let service: WeddingsService;
  let repo: WeddingListRepositoryPort;
  let findByIdSpy: ReturnType<typeof vi.fn>;
  let updateByIdSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    repo = fakeRepo();
    service = new WeddingsService(repo);
    findByIdSpy = repo.findById as unknown as ReturnType<typeof vi.fn>;
    updateByIdSpy = repo.updateById as unknown as ReturnType<typeof vi.fn>;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('persists the trimmed fields, stamps updatedAt + updatedByUserId, and returns the row', async () => {
    findByIdSpy.mockResolvedValueOnce(existingWedding);
    updateByIdSpy.mockResolvedValueOnce(updatedWedding);

    const res = await service.updateWedding(principal, 'w-1', {
      partner1Name: '  Sofía Ramírez  ',
      partner2Name: '\tAndrés López\t',
      eventDate: '2027-12-31',
      venueName: ' Hacienda San Miguel ',
      venueCity: ' CDMX ',
    });

    expect(res).toEqual(updatedWedding);
    expect(findByIdSpy).toHaveBeenCalledTimes(1);
    expect(findByIdSpy.mock.calls[0]![0]).toEqual({
      scope: { tenantId: 'tenant-001', ownerUserId: 'wp-actor-001' },
      id: 'w-1',
    });

    const updateArgs = updateByIdSpy.mock.calls[0]![0];
    expect(updateArgs.scope).toEqual({
      tenantId: 'tenant-001',
      ownerUserId: 'wp-actor-001',
    });
    expect(updateArgs.id).toBe('w-1');
    expect(updateArgs.fields.partner1Name).toBe('Sofía Ramírez');
    expect(updateArgs.fields.partner2Name).toBe('Andrés López');
    expect(updateArgs.fields.venueName).toBe('Hacienda San Miguel');
    expect(updateArgs.fields.venueCity).toBe('CDMX');
    expect(updateArgs.fields.eventDate.toISOString()).toBe(
      '2027-12-31T00:00:00.000Z',
    );
    expect(updateArgs.fields.updatedByUserId).toBe('wp-actor-001');
    expect(updateArgs.fields.updatedAt).toBeInstanceOf(Date);
  });

  it('raises WeddingNotFoundError when the row does not match the scope (cross-WP)', async () => {
    findByIdSpy.mockResolvedValueOnce(null);

    await expect(
      service.updateWedding(principal, 'w-other', {
        partner1Name: 'A',
        partner2Name: 'B',
        eventDate: '2026-08-21',
        venueName: 'V',
        venueCity: 'C',
      }),
    ).rejects.toBeInstanceOf(WeddingNotFoundError);

    expect(updateByIdSpy).not.toHaveBeenCalled();
  });

  it('raises WeddingNotFoundError when the row is archived (Rule 17)', async () => {
    findByIdSpy.mockResolvedValueOnce({
      ...existingWedding,
      status: 'archived' as WeddingDto['status'],
    });

    await expect(
      service.updateWedding(principal, 'w-1', {
        partner1Name: 'A',
        partner2Name: 'B',
        eventDate: '2026-08-21',
        venueName: 'V',
        venueCity: 'C',
      }),
    ).rejects.toBeInstanceOf(WeddingNotFoundError);

    expect(updateByIdSpy).not.toHaveBeenCalled();
  });

  it('raises WeddingNotFoundError on a race (row deleted between find and update)', async () => {
    findByIdSpy.mockResolvedValueOnce(existingWedding);
    updateByIdSpy.mockResolvedValueOnce(null);

    await expect(
      service.updateWedding(principal, 'w-1', {
        partner1Name: 'A',
        partner2Name: 'B',
        eventDate: '2026-08-21',
        venueName: 'V',
        venueCity: 'C',
      }),
    ).rejects.toBeInstanceOf(WeddingNotFoundError);
  });

  it('throws ValidationError when a required field is blank after trim', async () => {
    await expect(
      service.updateWedding(principal, 'w-1', {
        partner1Name: '   ',
        partner2Name: 'Andrés',
        eventDate: '2026-08-21',
        venueName: 'Hacienda',
        venueCity: 'CDMX',
      }),
    ).rejects.toBeInstanceOf(ValidationError);

    expect(findByIdSpy).not.toHaveBeenCalled();
  });

  it('emits a structured wedding.updated log line', async () => {
    findByIdSpy.mockResolvedValueOnce(existingWedding);
    updateByIdSpy.mockResolvedValueOnce(updatedWedding);

    const logSpy = vi
      .spyOn(service['logger'], 'log')
      .mockImplementation(() => {});

    await service.updateWedding(principal, 'w-1', {
      partner1Name: 'A',
      partner2Name: 'B',
      eventDate: '2026-08-21',
      venueName: 'V',
      venueCity: 'C',
    });

    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'wedding.updated',
        weddingId: updatedWedding.id,
        tenantId: 'tenant-001',
        ownerUserId: 'wp-actor-001',
        actorId: 'wp-actor-001',
      }),
    );
  });
});