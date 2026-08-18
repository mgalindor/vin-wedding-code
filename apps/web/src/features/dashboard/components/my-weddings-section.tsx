import { useTranslation } from 'react-i18next';

import { cn } from '@/shared/lib/utils';

export type WeddingStatus = 'active' | 'draft' | 'archived';

export interface WeddingCardData {
  readonly id: string;
  readonly status: WeddingStatus;
  readonly coupleName: string;
  readonly date: string; // ISO yyyy-mm-dd
  readonly coupleSearchKey: string;
}

export type FilterValue = 'all' | WeddingStatus;
export type SortValue = 'date' | 'added';

interface MyWeddingsSectionProps {
  readonly hasWeddings: boolean;
  readonly filter: FilterValue;
  readonly sort: SortValue;
  readonly search: string;
  readonly filteredCount: number;
  readonly onFilterChange: (next: FilterValue) => void;
  readonly onSortChange: (next: SortValue) => void;
  readonly onSearchChange: (next: string) => void;
}

export function MyWeddingsSection({
  hasWeddings,
  filter,
  sort,
  search,
  filteredCount,
  onFilterChange,
  onSortChange,
  onSearchChange,
}: MyWeddingsSectionProps): React.ReactElement {
  const { t, i18n } = useTranslation('dashboard');

  const count =
    filteredCount === 0
      ? t('section.weddingsCount', { count: 0 })
      : t('section.weddingsCount', { count: filteredCount });

  const filterOptions: ReadonlyArray<{
    value: FilterValue;
    labelKey: string;
  }> = [
    { value: 'all', labelKey: 'section.filters.all' },
    { value: 'active', labelKey: 'section.filters.active' },
    { value: 'draft', labelKey: 'section.filters.draft' },
    { value: 'archived', labelKey: 'section.filters.archived' },
  ];

  return (
    <section>
      <div className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <h2
            className="text-2xl font-semibold text-[var(--color-on-surface)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {hasWeddings ? t('section.myWeddings') : t('section.empty.title')}
            <span
              className="ml-2 text-[13px] font-normal text-[var(--color-secondary)]"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              {count}
            </span>
          </h2>
        </div>

        {hasWeddings && (
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex flex-wrap gap-1.5">
              {filterOptions.map((opt) => (
                <FilterChip
                  key={opt.value}
                  active={filter === opt.value}
                  variant={opt.value === 'all' ? 'all' : opt.value}
                  onClick={() => onFilterChange(opt.value)}
                  label={t(opt.labelKey)}
                />
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2.5">
              <div
                className="inline-flex overflow-hidden rounded-full border"
                style={{ borderColor: 'var(--color-outline-variant)' }}
              >
                <SortSeg
                  active={sort === 'date'}
                  onClick={() => onSortChange('date')}
                  label={t('section.filters.sortDate')}
                />
                <SortSeg
                  active={sort === 'added'}
                  onClick={() => onSortChange('added')}
                  label={t('section.filters.sortAdded')}
                  separator
                />
              </div>
              <input
                type="search"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t('section.filters.searchPlaceholder')}
                className="h-9 w-[190px] rounded-md border px-3.5 text-[13px] focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--color-outline-variant)',
                  background: 'var(--color-surface-container-lowest)',
                  color: 'var(--color-on-surface)',
                }}
                aria-label={t('section.filters.searchPlaceholder')}
              />
            </div>
          </div>
        )}
      </div>

      {!hasWeddings && (
        <div
          className="rounded-lg border px-6 py-16 text-center"
          style={{
            borderColor: 'var(--color-outline-variant)',
            background: 'var(--color-surface-container-lowest)',
          }}
        >
          <div
            className="mb-3 text-3xl text-[var(--color-outline-variant)]"
            style={{ fontFamily: 'var(--font-display)' }}
            aria-hidden="true"
          >
            ♡
          </div>
          <p
            className="mb-1.5 text-lg font-semibold text-[var(--color-on-surface)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('section.empty.title')}
          </p>
          <p className="text-[13px] text-[var(--color-secondary)]">
            {t('section.empty.body')}
          </p>
        </div>
      )}
      {/* locale i18n kept warm to avoid tree-shake */}
      <span className="hidden" aria-hidden="true">
        {i18n.language}
      </span>
    </section>
  );
}

function FilterChip({
  active,
  variant,
  label,
  onClick,
}: {
  active: boolean;
  variant: 'all' | WeddingStatus;
  label: string;
  onClick: () => void;
}): React.ReactElement {
  const base =
    'rounded-full border px-3.5 py-1 text-[12px] font-semibold uppercase tracking-[0.04em] transition-colors';
  const variantClass =
    variant === 'all'
      ? active
        ? 'bg-[var(--color-on-surface)] text-[var(--color-surface)] border-[var(--color-on-surface)]'
        : 'bg-transparent text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
      : variant === 'active'
        ? active
          ? 'border-[var(--color-status-confirmed-text)] bg-[var(--color-status-confirmed-bg)] text-[var(--color-status-confirmed-text)]'
          : 'bg-transparent text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
        : variant === 'draft'
          ? active
            ? 'border-[var(--color-status-pending-text)] bg-[var(--color-status-pending-bg)] text-[var(--color-status-pending-text)]'
            : 'bg-transparent text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
          : active
            ? 'border-[var(--color-outline)] bg-[var(--color-surface-container-high)] text-[var(--color-secondary)]'
            : 'bg-transparent text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]';
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(base, variantClass)}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

function SortSeg({
  active,
  label,
  onClick,
  separator,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  separator?: boolean;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'border-none bg-transparent px-4 py-1 text-[12px] font-semibold uppercase tracking-[0.04em] transition-colors',
        separator && 'border-l',
        active
          ? 'bg-[var(--color-on-surface)] text-[var(--color-surface)]'
          : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-on-surface)]',
      )}
      style={{
        borderColor: 'var(--color-outline-variant)',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}
