/**
 * TC-504 (component / hook): useWeddingsList — US-011.
 *
 * Verifies the FE TanStack Query hook correctly translates the
 * dashboard's filter/sort/search inputs into paginated GETs, returns
 * a flat items list, and surfaces `isLoading` / `isError` / `hasMore`.
 *
 * Network calls are stubbed at the service boundary; the test does
 * not exercise the real api-client.
 */
// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../weddings.service', () => ({
  useWeddingsService: vi.fn(),
}));

import { useWeddingsService } from '../weddings.service';

import { useWeddingsList } from './use-weddings-list';

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe('TC-504: useWeddingsList — US-011', () => {
  it('returns a flat items array from the first page', async () => {
    const listWeddings = vi.fn().mockResolvedValue({
      items: [
        {
          id: 'w-1',
          tenantId: 'default',
          ownerUserId: 'wp-1',
          partner1Name: 'A',
          partner2Name: 'B',
          eventDate: '2026-09-15',
          venueName: 'V',
          venueCity: 'C',
          status: 'draft',
          createdAt: '2026-08-19T12:00:00.000Z',
          createdByUserId: 'wp-1',
        },
        {
          id: 'w-2',
          tenantId: 'default',
          ownerUserId: 'wp-1',
          partner1Name: 'C',
          partner2Name: 'D',
          eventDate: '2026-12-15',
          venueName: 'V',
          venueCity: 'C',
          status: 'draft',
          createdAt: '2026-08-19T13:00:00.000Z',
          createdByUserId: 'wp-1',
        },
      ],
      total: 2,
      hasMore: 'false',
    });

    vi.mocked(useWeddingsService).mockReturnValue({
      createWedding: vi.fn(),
      listWeddings,
    } as unknown as ReturnType<typeof useWeddingsService>);

    const { result } = renderHook(
      () => useWeddingsList({ search: '', status: 'all', sort: 'date' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[0]!.id).toBe('w-1');
    expect(result.current.total).toBe(2);
    expect(result.current.hasMore).toBe(false);
    expect(listWeddings).toHaveBeenCalledTimes(1);
  });

  it('forwards search / status / sort to the service', async () => {
    const listWeddings = vi.fn().mockResolvedValue({
      items: [],
      total: 0,
      hasMore: 'false',
    });

    vi.mocked(useWeddingsService).mockReturnValue({
      createWedding: vi.fn(),
      listWeddings,
    } as unknown as ReturnType<typeof useWeddingsService>);

    const { result } = renderHook(
      () =>
        useWeddingsList({
          search: 'sof',
          status: 'draft',
          sort: 'added',
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(listWeddings).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'sof',
        status: 'draft',
        sort: 'added',
        limit: 50,
        offset: 0,
      }),
    );
  });

  it('reports hasMore=true when the server says so', async () => {
    const listWeddings = vi.fn().mockResolvedValue({
      items: [
        {
          id: 'w-1',
          tenantId: 'default',
          ownerUserId: 'wp-1',
          partner1Name: 'A',
          partner2Name: 'B',
          eventDate: '2026-09-15',
          venueName: 'V',
          venueCity: 'C',
          status: 'draft',
          createdAt: '2026-08-19T12:00:00.000Z',
          createdByUserId: 'wp-1',
        },
      ],
      total: 51,
      hasMore: 'true',
    });

    vi.mocked(useWeddingsService).mockReturnValue({
      createWedding: vi.fn(),
      listWeddings,
    } as unknown as ReturnType<typeof useWeddingsService>);

    const { result } = renderHook(
      () =>
        useWeddingsList({
          search: '',
          status: 'all',
          sort: 'date',
          pageSize: 50,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasMore).toBe(true);
    expect(result.current.total).toBe(51);
  });

  it('reports isError when the service rejects', async () => {
    const listWeddings = vi.fn().mockRejectedValue(new Error('boom'));

    vi.mocked(useWeddingsService).mockReturnValue({
      createWedding: vi.fn(),
      listWeddings,
    } as unknown as ReturnType<typeof useWeddingsService>);

    const { result } = renderHook(
      () => useWeddingsList({ search: '', status: 'all', sort: 'date' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
  });
});