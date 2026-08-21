/**
 * useWeddingsList — TanStack Query infinite query that powers the
 * dashboard's "My Weddings" section (US-011).
 *
 * Cache key = `['weddings', { search, status, sort }]`. Pagination is
 * a useInfiniteQuery `pageParam` (offset, 50 rows per page).
 */
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  type ListWeddingsResponseDto,
  type WeddingDto,
  type WeddingListSort,
  type WeddingListStatus,
} from '@wendy/contracts';

import { useWeddingsService } from '../weddings.service';

const DEFAULT_PAGE_SIZE = 50;

export interface UseWeddingsListInput {
  search: string;
  status: WeddingListStatus;
  sort: WeddingListSort;
  pageSize?: number;
}

export interface UseWeddingsListResult {
  items: readonly WeddingDto[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  loadMore: () => void;
  refetch: () => void;
}

export function useWeddingsList(
  input: UseWeddingsListInput,
): UseWeddingsListResult {
  const service = useWeddingsService();
  const pageSize = input.pageSize ?? DEFAULT_PAGE_SIZE;

  const query = useInfiniteQuery<
    ListWeddingsResponseDto,
    Error,
    { pages: ListWeddingsResponseDto[]; pageParams: number[] },
    readonly [string, UseWeddingsListInput],
    number
  >({
    queryKey: [
      'weddings',
      { search: input.search, status: input.status, sort: input.sort },
    ] as const,
    queryFn: ({ pageParam }) =>
      service.listWeddings({
        search: input.search || undefined,
        status: input.status,
        sort: input.sort,
        limit: pageSize,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore !== 'true'
        ? undefined
        : allPages.length * pageSize,
    staleTime: 30_000,
  });

  const items = (query.data?.pages ?? []).flatMap((page) => page.items);
  const latestPage = query.data?.pages[query.data?.pages.length - 1];
  const total = query.data?.pages[0]?.total ?? 0;

  return {
    items,
    total,
    hasMore: latestPage?.hasMore === 'true',
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    loadMore: () => {
      void query.fetchNextPage();
    },
    refetch: () => {
      void query.refetch();
    },
  };
}
