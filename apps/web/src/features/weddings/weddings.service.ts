import { useMemo } from 'react';
import {
  type CreateWeddingDto,
  type ListWeddingsResponseDto,
  type UpdateWeddingDto,
  type WeddingDto,
  type WeddingListSort,
  type WeddingListStatus,
} from '@wendy/contracts';

import { useApiClient } from '@/shared/api-client';

export interface ListWeddingsInput {
  search?: string;
  status?: WeddingListStatus;
  sort?: WeddingListSort;
  limit?: number;
  offset?: number;
}

/**
 * Feature-level wrapper around the api-client that exposes typed
 * wedding methods (create / list / get / update). Memoised on
 * `[api]` so consumers can safely put `service` in a `useEffect`
 * dep array (or in a React-Query `queryKey`) without triggering an
 * infinite re-render loop. Without the memo the returned object would
 * be a new reference on every render and any effect depending on
 * it would refire on every render — this is the bug US-010 shipped
 * before this fix landed (clicks on a wedding card caused the page
 * to spam GET /weddings/{id} until the browser gave up).
 */
export function useWeddingsService() {
  const api = useApiClient();

  return useMemo(() => {
    return {
      createWedding(dto: CreateWeddingDto) {
        return api.post<WeddingDto>('/weddings', dto);
      },

      listWeddings(
        input: ListWeddingsInput = {},
      ): Promise<ListWeddingsResponseDto> {
        const search = new URLSearchParams();
        if (input.search) search.set('search', input.search);
        if (input.status) search.set('status', input.status);
        if (input.sort) search.set('sort', input.sort);
        const limit = input.limit ?? 50;
        const offset = input.offset ?? 0;
        search.set('limit', String(limit));
        search.set('offset', String(offset));
        return api.get<ListWeddingsResponseDto>(
          `/weddings?${search.toString()}`,
        );
      },

      // US-010: single-wedding read used by the detail screen and the
      // edit screen. The detail screen fetches on mount to become the
      // live read surface; the edit screen fetches on mount to pre-
      // populate the form.
      getWedding(id: string): Promise<WeddingDto> {
        return api.get<WeddingDto>(`/weddings/${id}`);
      },

      // US-010: update the five basic-detail fields. PATCH is the right
      // verb here because the contract is "update the whole row" (every
      // field is required) but the resource is partial-update-friendly
      // — a future iteration can switch to true partial updates by
      // making the DTO fields optional without changing the endpoint
      // shape.
      updateWedding(id: string, dto: UpdateWeddingDto): Promise<WeddingDto> {
        return api.patch<WeddingDto>(`/weddings/${id}`, dto);
      },
    };
  }, [api]);
}
