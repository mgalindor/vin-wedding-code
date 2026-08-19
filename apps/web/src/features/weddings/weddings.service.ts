import { type CreateWeddingDto, type WeddingDto } from '@wendy/contracts';

import { useApiClient } from '@/shared/api-client';

/**
 * Weddings feature service (US-009).
 *
 * US-009 ships only the create operation. Subsequent stories extend
 * this service with read (US-010), search/list (US-011/012), archive
 * (US-013), and publish (US-022) operations — same shape, same
 * service, no cross-feature imports.
 */
export function useWeddingsService() {
  const api = useApiClient();

  return {
    createWedding(dto: CreateWeddingDto) {
      return api.post<WeddingDto>('/weddings', dto);
    },
  };
}