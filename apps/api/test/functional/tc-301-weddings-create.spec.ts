/**
 * TC-301 (functional / use case): WeddingsService.createWedding.
 *
 * Scope per backend-blueprint §7:
 *   - Use case exercised in isolation (mocked repository).
 *   - No HTTP, no Prisma. The mapping helpers (`toWeddingDto`,
 *     `parseIsoDate`, `toIsoDate`) and the principal-driven defaults
 *     are verified directly.
 *
 * Tests the rules of US-009's functional spec that belong to the
 * service layer:
 *   - Creates the row with `status='draft'` (Rule 17 — no draft UI state).
 *   - Echoes `tenantId`, `ownerUserId`, `createdByUserId` from the
 *     principal — never from the request body (Rules 2, 3, 16).
 *   - Trims whitespace on the four text fields (Rules 5, 9).
 *   - Stores `eventDate` as calendar-day UTC midnight (tech-spec §Endpoint
 *     contract notes).
 *   - Returns a `WeddingDto` whose `eventDate` is the original
 *     `YYYY-MM-DD` (round-trip).
 *   - Logs `wedding.created` with the row id, tenant, owner, and actor.
 *   - ValidationError surfaces when a required field is empty after trim.
 */
import type { WeddingDto } from '@wendy/contracts';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  ValidationError,
  WeddingsService,
} from '../../src/modules/weddings/application/weddings.service';
import type { WeddingRepository } from '../../src/modules/weddings/outbound-adapters/wedding.repository';

// Returns a WeddingDto (camelCase) — mirrors the production adapter,
// which calls `toWeddingDto(row)` after every persist. The earlier
// snake_case fake was returning a row, not a DTO, so the assertions
// on `res.tenantId` etc. silently read undefined.
function fakeRepo(): WeddingRepository {
  return {
    insert: vi.fn(async (input): Promise<WeddingDto> => ({
      id: input.id as WeddingDto['id'],
      tenantId: input.tenantId as WeddingDto['tenantId'],
      ownerUserId: input.ownerUserId as WeddingDto['ownerUserId'],
      partner1Name: input.partner1Name,
      partner2Name: input.partner2Name,
      eventDate: input.eventDate.toISOString().slice(0, 10),
      venueName: input.venueName,
      venueCity: input.venueCity,
      status: input.status as WeddingDto['status'],
      createdAt: input.createdAt.toISOString(),
      createdByUserId: input.createdByUserId as WeddingDto['createdByUserId'],
      updatedAt: input.updatedAt.toISOString(),
      updatedByUserId: input.updatedByUserId as WeddingDto['updatedByUserId'],
    })),
  } as unknown as WeddingRepository;
}

const principal = {
  actorId: 'wp-actor-001' as never,
  tenantId: 'tenant-001' as never,
};

describe('TC-301: WeddingsService.createWedding (US-009)', () => {
  let service: WeddingsService;
  let repo: WeddingRepository;

  beforeEach(() => {
    repo = fakeRepo();
    service = new WeddingsService(repo);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('persists a wedding with status=draft and echoes principal ids', async () => {
    const res = await service.createWedding(principal, {
      partner1Name: 'Sofía Ramírez',
      partner2Name: 'Andrés López',
      eventDate: '2026-08-21',
      venueName: 'Hacienda San Miguel',
      venueCity: 'CDMX',
    });

    expect(res.status).toBe('draft');
    expect(res.tenantId).toBe('tenant-001');
    expect(res.ownerUserId).toBe('wp-actor-001');
    expect(res.createdByUserId).toBe('wp-actor-001');
    expect(res.partner1Name).toBe('Sofía Ramírez');
    expect(res.partner2Name).toBe('Andrés López');
    expect(res.venueName).toBe('Hacienda San Miguel');
    expect(res.venueCity).toBe('CDMX');
    expect(res.eventDate).toBe('2026-08-21');

    const createArgs = (repo.insert as ReturnType<typeof vi.fn>).mock
      .calls[0]![0];
    expect(createArgs.tenantId).toBe('tenant-001');
    expect(createArgs.ownerUserId).toBe('wp-actor-001');
    expect(createArgs.createdByUserId).toBe('wp-actor-001');
    expect(createArgs.updatedByUserId).toBe('wp-actor-001');
    expect(createArgs.status).toBe('draft');
  });

  it('round-trips the calendar-day event date through UTC midnight', async () => {
    const res = await service.createWedding(principal, {
      partner1Name: 'A',
      partner2Name: 'B',
      eventDate: '2027-12-31',
      venueName: 'V',
      venueCity: 'C',
    });

    expect(res.eventDate).toBe('2027-12-31');

    const createArgs = (repo.insert as ReturnType<typeof vi.fn>).mock
      .calls[0]![0];
    expect(createArgs.eventDate.toISOString()).toBe('2027-12-31T00:00:00.000Z');
  });

  it('trims whitespace on the four text fields', async () => {
    await service.createWedding(principal, {
      partner1Name: '  Sofía   Ramírez  ',
      partner2Name: '\tAndrés López\t',
      eventDate: '2026-08-21',
      venueName: ' Hacienda ',
      venueCity: ' CDMX ',
    });

    const createArgs = (repo.insert as ReturnType<typeof vi.fn>).mock
      .calls[0]![0];
    expect(createArgs.partner1Name).toBe('Sofía   Ramírez');
    expect(createArgs.partner2Name).toBe('Andrés López');
    expect(createArgs.venueName).toBe('Hacienda');
    expect(createArgs.venueCity).toBe('CDMX');
  });

  it('throws ValidationError when a required field is blank after trim', async () => {
    await expect(
      service.createWedding(principal, {
        partner1Name: '   ',
        partner2Name: 'Andrés',
        eventDate: '2026-08-21',
        venueName: 'Hacienda',
        venueCity: 'CDMX',
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('accepts a past event date without ceremony (FE warning concern)', async () => {
    const res = await service.createWedding(principal, {
      partner1Name: 'A',
      partner2Name: 'B',
      eventDate: '2025-06-14',
      venueName: 'V',
      venueCity: 'C',
    });

    expect(res.eventDate).toBe('2025-06-14');
  });

  it('mints a 10-char id and emits a structured log line', async () => {
    const logSpy = vi.spyOn(service['logger'], 'log').mockImplementation(() => {});

    const res = await service.createWedding(principal, {
      partner1Name: 'A',
      partner2Name: 'B',
      eventDate: '2026-08-21',
      venueName: 'V',
      venueCity: 'C',
    });

    expect(res.id).toMatch(/^[A-Za-z0-9_-]{10}$/);
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'wedding.created',
        weddingId: res.id,
        tenantId: 'tenant-001',
        ownerUserId: 'wp-actor-001',
        actorId: 'wp-actor-001',
      }),
    );
  });
});