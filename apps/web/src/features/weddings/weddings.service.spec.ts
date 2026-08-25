/**
 * TC-305 / TC-503 (component / service): useWeddingsService.
 *
 * US-009 — verifies the `createWedding` call delegates to
 * `POST /weddings` and returns the typed `WeddingDto` payload.
 *
 * US-011 — verifies the `listWeddings` call delegates to
 * `GET /weddings` with the canonical query string, returns the
 * paged response shape, and respects the optional inputs (search,
 * status, sort, limit, offset).
 *
 * US-010 — verifies the `getWedding` call delegates to
 * `GET /weddings/{id}` and the `updateWedding` call delegates to
 * `PATCH /weddings/{id}` with the `UpdateWeddingDto` body.
 *
 * US-014a — verifies the `putLocations` call delegates to
 * `PUT /weddings/{id}/locations` with a body that excludes an
 * `id` field per row (the server mints ids server-side).
 */
// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { WeddingLocationType } from '@wendy/contracts';
import { describe, expect, it, vi } from 'vitest';

import { useApiClient } from '@/shared/api-client';
import { useAuth } from '@/shared/auth';

import { useWeddingsService } from './weddings.service';

vi.mock('@/shared/auth', () => ({ useAuth: vi.fn() }));
vi.mock('@/shared/api-client', () => ({ useApiClient: vi.fn() }));

function buildClient() {
  const post = vi.fn();
  const get = vi.fn();
  const patch = vi.fn();
  return {
    request: vi.fn(),
    get,
    post,
    put: vi.fn(),
    patch,
    delete: vi.fn(),
  };
}

const baseAuth = (): ReturnType<typeof useAuth> =>
  ({
    state: { accessToken: 'tok' },
    dispatch: vi.fn(),
  } as unknown as ReturnType<typeof useAuth>);

describe('TC-305: useWeddingsService.createWedding — US-009', () => {
  it('calls POST /weddings with the create dto and returns the typed response', async () => {
    const client = buildClient();
    client.post.mockResolvedValue({
      id: 'abcd1234ef',
      tenantId: 'default',
      ownerUserId: 'wp-1',
      partner1Name: 'Sofía Ramírez',
      partner2Name: 'Andrés López',
      eventDate: '2026-08-21',
      venueName: 'Hacienda',
      venueCity: 'CDMX',
      status: 'draft',
      createdAt: '2026-08-19T12:00:00.000Z',
      createdByUserId: 'wp-1',
    });

    vi.mocked(useAuth).mockReturnValue(baseAuth());
    vi.mocked(useApiClient).mockReturnValue(
      client as unknown as ReturnType<typeof useApiClient>,
    );

    const { result } = renderHook(() => useWeddingsService());

    const dto = {
      partner1Name: 'Sofía Ramírez',
      partner2Name: 'Andrés López',
      eventDate: '2026-08-21',
      venueName: 'Hacienda',
      venueCity: 'CDMX',
    };

    const response = await result.current.createWedding(dto);

    expect(client.post).toHaveBeenCalledWith('/weddings', dto);
    expect(response.id).toBe('abcd1234ef');
    expect(response.status).toBe('draft');
  });
});

describe('TC-503: useWeddingsService.listWeddings — US-011', () => {
  it('calls GET /weddings with the canonical query string and returns the paged response', async () => {
    const client = buildClient();
    const page = {
      items: [
        {
          id: 'w-1',
          tenantId: 'default',
          ownerUserId: 'wp-1',
          partner1Name: 'Sofía Ramírez',
          partner2Name: 'Andrés López',
          eventDate: '2026-09-15',
          venueName: 'Hacienda',
          venueCity: 'CDMX',
          status: 'draft',
          createdAt: '2026-08-19T12:00:00.000Z',
          createdByUserId: 'wp-1',
        },
      ],
      total: 1,
      hasMore: 'false',
    };
    client.get.mockResolvedValue(page);

    vi.mocked(useAuth).mockReturnValue(baseAuth());
    vi.mocked(useApiClient).mockReturnValue(
      client as unknown as ReturnType<typeof useApiClient>,
    );

    const { result } = renderHook(() => useWeddingsService());

    const response = await result.current.listWeddings({
      search: 'sof',
      status: 'draft',
      sort: 'date',
      limit: 50,
      offset: 0,
    });

    expect(client.get).toHaveBeenCalledWith(
      '/weddings?search=sof&status=draft&sort=date&limit=50&offset=0',
    );
    expect(response.total).toBe(1);
    expect(response.hasMore).toBe('false');
  });

  it('omits the search query param when the search string is empty', async () => {
    const client = buildClient();
    client.get.mockResolvedValue({
      items: [],
      total: 0,
      hasMore: 'false',
    });

    vi.mocked(useAuth).mockReturnValue(baseAuth());
    vi.mocked(useApiClient).mockReturnValue(
      client as unknown as ReturnType<typeof useApiClient>,
    );

    const { result } = renderHook(() => useWeddingsService());
    await result.current.listWeddings({
      search: '',
      status: 'all',
      sort: 'date',
      limit: 50,
      offset: 0,
    });

    const calledWith = client.get.mock.calls[0]![0] as string;
    expect(calledWith).not.toMatch(/search=/);
    // Default limit + offset should always be present so the URL is
    // self-describing.
    expect(calledWith).toContain('limit=50');
    expect(calledWith).toContain('offset=0');
  });

  it('applies the default limit + offset when no input is supplied', async () => {
    const client = buildClient();
    client.get.mockResolvedValue({
      items: [],
      total: 0,
      hasMore: 'false',
    });

    vi.mocked(useAuth).mockReturnValue(baseAuth());
    vi.mocked(useApiClient).mockReturnValue(
      client as unknown as ReturnType<typeof useApiClient>,
    );

    const { result } = renderHook(() => useWeddingsService());
    await result.current.listWeddings();

    expect(client.get).toHaveBeenCalledWith(
      '/weddings?limit=50&offset=0',
    );
  });
});

describe('TC-305b: useWeddingsService.getWedding / updateWedding — US-010', () => {
  it('calls GET /weddings/{id} for getWedding', async () => {
    const client = buildClient();
    client.get.mockResolvedValue({
      id: 'abcd1234ef',
      tenantId: 'default',
      ownerUserId: 'wp-1',
      partner1Name: 'Sofía Ramírez',
      partner2Name: 'Andrés López',
      eventDate: '2026-08-21',
      venueName: 'Hacienda',
      venueCity: 'CDMX',
      status: 'draft',
      createdAt: '2026-08-19T12:00:00.000Z',
      createdByUserId: 'wp-1',
      updatedAt: '2026-08-19T12:00:00.000Z',
      updatedByUserId: 'wp-1',
    });

    vi.mocked(useAuth).mockReturnValue(baseAuth());
    vi.mocked(useApiClient).mockReturnValue(
      client as unknown as ReturnType<typeof useApiClient>,
    );

    const { result } = renderHook(() => useWeddingsService());

    const response = await result.current.getWedding('abcd1234ef');

    expect(client.get).toHaveBeenCalledWith('/weddings/abcd1234ef');
    expect(response.id).toBe('abcd1234ef');
    expect(response.status).toBe('draft');
  });

  it('calls PATCH /weddings/{id} with the UpdateWeddingDto body', async () => {
    const client = buildClient();
    client.patch.mockResolvedValue({
      id: 'abcd1234ef',
      tenantId: 'default',
      ownerUserId: 'wp-1',
      partner1Name: 'María Sánchez',
      partner2Name: 'Carlos Ruiz',
      eventDate: '2027-03-15',
      venueName: 'Nuevo Venue',
      venueCity: 'Guadalajara',
      status: 'draft',
      createdAt: '2026-08-19T12:00:00.000Z',
      createdByUserId: 'wp-1',
      updatedAt: '2026-08-21T18:00:00.000Z',
      updatedByUserId: 'wp-1',
    });

    vi.mocked(useAuth).mockReturnValue(baseAuth());
    vi.mocked(useApiClient).mockReturnValue(
      client as unknown as ReturnType<typeof useApiClient>,
    );

    const { result } = renderHook(() => useWeddingsService());

    const dto = {
      partner1Name: 'María Sánchez',
      partner2Name: 'Carlos Ruiz',
      eventDate: '2027-03-15',
      venueName: 'Nuevo Venue',
      venueCity: 'Guadalajara',
    };

    const response = await result.current.updateWedding('abcd1234ef', dto);

    expect(client.patch).toHaveBeenCalledWith('/weddings/abcd1234ef', dto);
    expect(response.partner1Name).toBe('María Sánchez');
    expect(response.partner1Name).not.toBe('Sofía Ramírez');
  });
});

describe('TC-305c: useWeddingsService.putLocations — US-014a', () => {
  it('calls PUT /weddings/{id}/locations with the body that excludes an id field per row', async () => {
    const client = buildClient();
    const serverEcho = {
      id: 'abcd1234ef',
      tenantId: 'default',
      ownerUserId: 'wp-1',
      partner1Name: 'Sofía',
      partner2Name: 'Andrés',
      eventDate: '2027-03-15',
      venueName: 'Hacienda',
      venueCity: 'CDMX',
      status: 'draft',
      createdAt: '2026-08-19T12:00:00.000Z',
      createdByUserId: 'wp-1',
      updatedAt: '2026-08-21T18:00:00.000Z',
      updatedByUserId: 'wp-1',
      locations: [
        {
          id: 'server-fresh-1',
          type: 'reception',
          venueName: 'Hacienda',
          address: 'Av. Principal 123',
          city: 'CDMX',
          eventDate: '2027-03-15',
          startTime: '20:00',
          googleMapsLink: null,
          notes: null,
        },
      ],
    };
    client.put.mockResolvedValue(serverEcho);

    vi.mocked(useAuth).mockReturnValue(baseAuth());
    vi.mocked(useApiClient).mockReturnValue(
      client as unknown as ReturnType<typeof useApiClient>,
    );

    const { result } = renderHook(() => useWeddingsService());

    const dto = {
      locations: [
        {
          type: WeddingLocationType.Reception,
          venueName: 'Hacienda',
          address: 'Av. Principal 123',
          city: 'CDMX',
          eventDate: '2027-03-15',
          startTime: '20:00',
          googleMapsLink: null,
          notes: null,
        },
      ],
    };

    const response = await result.current.putLocations('abcd1234ef', dto);

    expect(client.put).toHaveBeenCalledWith(
      '/weddings/abcd1234ef/locations',
      dto,
    );
    // Verify the body the FE sends has no id field per row.
    const sentBody = client.put.mock.calls[0]![1] as {
      locations: Array<Record<string, unknown>>;
    };
    for (const row of sentBody.locations) {
      expect(row).not.toHaveProperty('id');
    }
    // Verify the response carries the server-minted id.
    expect(response.locations).toHaveLength(1);
    expect(response.locations[0]!.id).toBe('server-fresh-1');
  });
});