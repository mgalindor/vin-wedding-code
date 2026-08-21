/**
 * WeddingsListSection — dashboard orchestrator for the
 * "My Weddings" / "All Weddings" list (US-011). Composes the
 * chrome (`MyWeddingsSection`) with the data hook (`useWeddingsList`)
 * and the states (skeleton / empty-card / error / show-more).
 * Filter / sort / search state is held in component state and
 * intentionally NOT persisted: each mount of the dashboard
 * starts with the defaults (`all` / `date` / empty search).
 */
import { UserRole } from '@wendy/contracts';
import { useState } from 'react';

import {
  MyWeddingsSection,
  type FilterValue,
  type SortValue,
} from '@/features/dashboard/components/my-weddings-section';

import { useWeddingsList, type UseWeddingsListInput } from '../hooks/use-weddings-list';

import {
  ListErrorState,
  ShowMoreButton,
  WeddingCardSkeletonGrid,
} from './list-states';
import { ListStateCard, ListStateKind } from './list-state-card';
import { WeddingCardGrid } from './wedding-card-grid';

type ListStatus = 'all' | 'active' | 'draft' | 'archived';
type ListSort = 'date' | 'added';

export interface WeddingsListSectionProps {
  readonly callerRole: UserRole;
}

const DEFAULT_STATUS: ListStatus = 'all';
const DEFAULT_SORT: ListSort = 'date';
const DEFAULT_SEARCH = '';

export function WeddingsListSection({
  callerRole,
}: WeddingsListSectionProps): React.ReactElement {
  const [search, setSearch] = useState<string>(DEFAULT_SEARCH);
  const [status, setStatus] = useState<ListStatus>(DEFAULT_STATUS);
  const [sort, setSort] = useState<ListSort>(DEFAULT_SORT);

  const hookInput: UseWeddingsListInput = {
    search,
    status: status as unknown as UseWeddingsListInput['status'],
    sort: sort as unknown as UseWeddingsListInput['sort'],
  };
  const { items, total, hasMore, isLoading, isError, loadMore, refetch } =
    useWeddingsList(hookInput);

  const headingVariant: 'planner' | 'admin' =
    callerRole === UserRole.Administrator ? 'admin' : 'planner';

  const filter = statusToFilter(status);
  const sortValue = sort as SortValue;

  const headerProps = {
    hasWeddings: false,
    filter,
    sort: sortValue,
    search,
    filteredCount: total,
    headingVariant,
    onFilterChange: (next: FilterValue) => setStatus(next),
    onSortChange: (next: SortValue) => setSort(next as unknown as ListSort),
    onSearchChange: (next: string) => setSearch(next),
  };

  if (isError) {
    return (
      <div>
        <MyWeddingsSection {...headerProps} />
        <ListErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  const hasWeddings = total > 0;
  const listStateKind: ListStateKind | null =
    items.length > 0
      ? null
      : hasWeddings
        ? 'noMatches'
        : 'empty';

  return (
    <div>
      <MyWeddingsSection
        {...headerProps}
        hasWeddings={hasWeddings || items.length > 0}
      />
      {isLoading ? (
        <WeddingCardSkeletonGrid />
      ) : listStateKind ? (
        <ListStateCard kind={listStateKind} />
      ) : (
        <>
          <WeddingCardGrid weddings={items} />
          {hasMore && (
            <ShowMoreButton
              onClick={loadMore}
              isFetching={isLoading}
              disabled={isLoading}
            />
          )}
        </>
      )}
    </div>
  );
}

function statusToFilter(status: ListStatus): FilterValue {
  return (status === 'all' ? 'all' : status) as FilterValue;
}
