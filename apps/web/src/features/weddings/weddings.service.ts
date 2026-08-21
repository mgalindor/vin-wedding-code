import {
  type CreateWeddingDto,
  type ListWeddingsResponseDto,
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

export function useWeddingsService() {
  const api = useApiClient();

  return {
    createWedding(dto: CreateWeddingDto) {
      return api.post<WeddingDto>('/weddings', dto);
    },

    listWeddings(input: ListWeddingsInput = {}): Promise<ListWeddingsResponseDto> {
      const search = new URLSearchParams();
      if (input.search) search.set('search', input.search);
      if (input.status) search.set('status', input.status);
      if (input.sort) search.set('sort', input.sort);
      const limit = input.limit ?? 50;
      const offset = input.offset ?? 0;
      search.set('limit', String(limit));
      search.set('offset', String(offset));
      return api.get<ListWeddingsResponseDto>(`/weddings?${search.toString()}`);
    },
  };
}
