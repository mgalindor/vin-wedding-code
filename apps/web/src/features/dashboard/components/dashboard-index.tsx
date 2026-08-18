import { useTranslation } from 'react-i18next';

import { WeddingPlannersLandingCard } from '@/features/admin-onboarding/components/wedding-planners-landing-card';

import { MyWeddingsSection, type FilterValue, type SortValue } from './my-weddings-section';
import { StatsRow, type WeddingStats } from './stats-row';

const ZERO_STATS: WeddingStats = {
  activeWeddings: 0,
  activeWeddingsSubCount: 0,
  totalGuests: 0,
  totalGuestsSubCount: 0,
  confirmedRsvps: 0,
  confirmedRsvpsRate: 0,
  daysToNext: null,
  daysToNextCouple: null,
  daysToNextDate: null,
};

export function DashboardIndex({
  isAdmin,
}: {
  isAdmin: boolean;
}): React.ReactElement {
  const { t } = useTranslation('dashboard');

  // Sprint 1: no weddings yet — render zero stats + the empty state.
  // The filter/sort controls are wired through and the empty state
  // itself acts as the section body, so the UI is fully interactive.
  const handleFilter = (_next: FilterValue) => undefined;
  const handleSort = (_next: SortValue) => undefined;
  const handleSearch = (_next: string) => undefined;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10">
      <section aria-label={t('section.myWeddings')}>
        <StatsRow stats={ZERO_STATS} />
        <MyWeddingsSection
          hasWeddings={false}
          filter="all"
          sort="date"
          search=""
          filteredCount={0}
          onFilterChange={handleFilter}
          onSortChange={handleSort}
          onSearchChange={handleSearch}
        />
      </section>

      {isAdmin && (
        <section aria-label={t('sidebar.weddingPlanners')}>
          <WeddingPlannersLandingCard />
        </section>
      )}
    </div>
  );
}
