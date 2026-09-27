import {
  AlertCircle,
  History,
  Search,
  X,
} from 'lucide-react';
import { useId, useMemo } from 'react';

import {
  ACTIVITY_PAGE_SIZES,
  ACTIVITY_RESOURCE_TYPES,
  categoryForAction,
} from '@/features/audit/audit.service';
import type {
  ActivityActionCategory,
  ActivityPageSize,
  AuditEntry,
} from '@/features/audit/audit.service';
import { Spinner } from '@/shared/ui';

/**
 * Possible client-side action-category filters. `null` means "all".
 * Kept here (vs. exported from the service) so the UI control owns
 * the "no filter" sentinel — the service module is pure data + math.
 */
export type CategoryFilter = ActivityActionCategory | null;

/**
 * Possible client-side resource-type filters. `null` means "all".
 */
export type ResourceFilter = (typeof ACTIVITY_RESOURCE_TYPES)[number]['value'];

/**
 * Renders the recent-activity timeline for the event overview. Owns:
 *
 *   - the loading / error / empty / populated states,
 *   - the page-size selector (default 10),
 *   - the resource-type chip filter (BE-side filter),
 *   - the action-category chip filter (client-side filter),
 *   - the free-text search box (client-side filter),
 *   - relative-time formatting via Intl.
 *
 * Filters that change the BE request (`size`, `resourceType`) flow back
 * up to the parent via the `on*` callbacks. The action-category and
 * text filters are local projections over the page the parent already
 * has — sending them to the BE would double the round-trips without
 * saving any work.
 */
export function ActivityList({
  entries,
  isPending,
  isError,
  language,
  emptyLabel,
  errorLabel,
  actionLabel,
  resourceLabel,
  actorBylineTemplate,
  relativeTimeFormatter,
  size,
  onSizeChange,
  resourceFilter,
  onResourceFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  searchTerm,
  onSearchTermChange,
  searchPlaceholder,
  sizeLabel,
  sizeOptionLabels,
  resourceFilterLabels,
  categoryFilterLabels,
  clearFiltersLabel,
}: {
  entries: AuditEntry[];
  isPending: boolean;
  isError: boolean;
  emptyLabel: string;
  errorLabel: string;
  actionLabel: (action: string) => string;
  resourceLabel: (resourceType: string) => string;
  actorBylineTemplate: string;
  relativeTimeFormatter: (occurredAt: string) => string;
  language: string;

  /** Currently-selected page size (the BE will only return this many rows). */
  size: ActivityPageSize;
  /** Notify parent when the user picks a different page size. */
  onSizeChange: (size: ActivityPageSize) => void;
  /** Label template for the size selector, e.g. "Mostrando {{size}}". */
  sizeLabel: (size: ActivityPageSize) => string;
  /** Per-bucket label for the size dropdown options (e.g. "5 eventos", "10 eventos"). */
  sizeOptionLabels: Record<ActivityPageSize, string>;

  /** Currently-selected resource-type filter. `null` = all. */
  resourceFilter: ResourceFilter;
  onResourceFilterChange: (next: ResourceFilter) => void;
  /**
   * Labels for each resource chip. Must include `_all` for the "all"
   * chip and one entry per known resource-type value.
   */
  resourceFilterLabels: Record<string, string>;

  /** Currently-selected action-category filter. `null` = all. */
  categoryFilter: CategoryFilter;
  onCategoryFilterChange: (next: CategoryFilter) => void;
  /** Labels for each category chip. Must include `_all`. */
  categoryFilterLabels: Record<string, string>;

  /** Free-text filter applied client-side over action + resource labels. */
  searchTerm: string;
  onSearchTermChange: (next: string) => void;
  searchPlaceholder: string;

  /** Label for the "clear all filters" button. */
  clearFiltersLabel: string;
}): React.ReactElement {
  const searchInputId = useId();

  // Project entries through the category + text filters. Done in this
  // component so the parent doesn't have to know the filter rules.
  const visibleEntries = useMemo(() => {
    const term = (searchTerm ?? '').trim().toLowerCase();
    return entries.filter((entry) => {
      if (categoryFilter && categoryForAction(entry.action) !== categoryFilter) {
        return false;
      }
      if (term.length > 0) {
        const hayAction = actionLabel(entry.action).toLowerCase();
        const hayResource = resourceLabel(entry.resourceType).toLowerCase();
        const hayActor = (entry.actorUserName ?? '').toLowerCase();
        if (!hayAction.includes(term) && !hayResource.includes(term) && !hayActor.includes(term)) {
          return false;
        }
      }
      return true;
    });
  }, [entries, categoryFilter, searchTerm, actionLabel, resourceLabel]);

  const hasActiveFilter =
    resourceFilter !== null ||
    categoryFilter !== null ||
    (searchTerm ?? '').trim().length > 0;

  function resetFilters(): void {
    onResourceFilterChange(null);
    onCategoryFilterChange(null);
    onSearchTermChange('');
  }

  return (
    <div className="space-y-3">
      {/* Filter row — kept above the list so the user always sees controls. */}
      <div className="flex flex-wrap items-center gap-2">
        <PageSizeSelect
          size={size}
          onChange={onSizeChange}
          sizeLabel={sizeLabel}
          sizeOptionLabels={sizeOptionLabels}
        />

        <div className="flex flex-wrap gap-1" data-testid="event-overview-resource-filters">
          {ACTIVITY_RESOURCE_TYPES.map((rt) => {
            const isActive = resourceFilter === rt.value;
            const label =
              rt.value === null
                ? (resourceFilterLabels._all ?? 'all')
                : (resourceFilterLabels[rt.value] ?? rt.key);
            return (
              <FilterChip
                key={rt.key}
                label={label}
                active={isActive}
                onClick={() => onResourceFilterChange(rt.value)}
                testId={`event-overview-resource-filter-${rt.key}`}
              />
            );
          })}
        </div>

        <div className="flex flex-wrap gap-1" data-testid="event-overview-category-filters">
          <FilterChip
            label={categoryFilterLabels._all ?? 'all'}
            active={categoryFilter === null}
            onClick={() => onCategoryFilterChange(null)}
            testId="event-overview-category-filter-all"
          />
          {(['lifecycle', 'content', 'rsvp', 'guest'] as const).map((cat) => (
            <FilterChip
              key={cat}
              label={categoryFilterLabels[cat] ?? cat}
              active={categoryFilter === cat}
              onClick={() => onCategoryFilterChange(cat)}
              testId={`event-overview-category-filter-${cat}`}
            />
          ))}
        </div>

        <div className="relative ml-auto min-w-[160px] grow">
          <Search
            className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-secondary)]"
            aria-hidden
          />
          <input
            id={searchInputId}
            type="search"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            placeholder={searchPlaceholder}
            data-testid="event-overview-activity-search"
            className="w-full rounded-md border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] py-1.5 pl-7 pr-7 text-sm text-[var(--color-on-surface)] outline-none transition-colors focus:border-[var(--color-primary)]"
          />
          {searchTerm ? (
            <button
              type="button"
              onClick={() => onSearchTermChange('')}
              aria-label="clear search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-[var(--color-secondary)] hover:text-[var(--color-on-surface)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {hasActiveFilter ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={resetFilters}
            data-testid="event-overview-activity-clear-filters"
            className="text-xs font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
          >
            {clearFiltersLabel}
          </button>
        </div>
      ) : null}

      {/* Body — loading / error / empty / populated. */}
      {isPending ? (
        <div className="flex items-center justify-center py-6" data-testid="event-overview-activity-loading">
          <Spinner className="h-5 w-5" />
        </div>
      ) : isError ? (
        <div
          className="flex items-start gap-2 rounded-md border border-[var(--color-error-container)] bg-[var(--color-error-container)]/30 p-3 text-sm text-[var(--color-on-error-container)]"
          data-testid="event-overview-activity-error"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorLabel}</span>
        </div>
      ) : entries.length === 0 ? (
        <div
          className="flex items-center gap-2 rounded-md border border-dashed border-[var(--color-outline-variant)] p-4 text-sm text-[var(--color-secondary)]"
          data-testid="event-overview-activity-empty"
        >
          <History className="h-4 w-4 shrink-0 opacity-60" />
          <span>{emptyLabel}</span>
        </div>
      ) : visibleEntries.length === 0 ? (
        <div
          className="flex items-center gap-2 rounded-md border border-dashed border-[var(--color-outline-variant)] p-4 text-sm text-[var(--color-secondary)]"
          data-testid="event-overview-activity-empty-filtered"
        >
          <Search className="h-4 w-4 shrink-0 opacity-60" />
          <span>{emptyLabel}</span>
        </div>
      ) : (
        <ol
          className="divide-y divide-[var(--color-outline-variant)]"
          data-testid="event-overview-activity-list"
          lang={language}
        >
          {visibleEntries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
              data-testid="event-overview-activity-row"
            >
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--color-primary)]" aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate text-sm font-medium text-[var(--color-on-surface)]">
                    {actionLabel(entry.action)}
                    {' · '}
                    <span className="font-normal text-[var(--color-secondary)]">
                      {resourceLabel(entry.resourceType)}
                    </span>
                  </p>
                  <time
                    dateTime={entry.occurredAt}
                    title={entry.occurredAt}
                    className="shrink-0 text-xs text-[var(--color-secondary)] tabular-nums"
                  >
                    {relativeTimeFormatter(entry.occurredAt)}
                  </time>
                </div>
                {(entry.actorUserName || entry.actorUserId) ? (
                  <p className="mt-0.5 text-xs text-[var(--color-secondary)]">
                    {actorBylineTemplate.replace(
                      '{{actor}}',
                      entry.actorUserName || entry.actorUserId || '',
                    )}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  testId,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  testId: string;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-testid={testId}
      className={
        'rounded-full border px-3 py-1 text-xs font-medium transition-colors ' +
        (active
          ? 'border-[var(--color-primary)] bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]'
          : 'border-[var(--color-outline-variant)] bg-transparent text-[var(--color-secondary)] hover:bg-[var(--color-surface-container-low)]')
      }
    >
      {label}
    </button>
  );
}

function PageSizeSelect({
  size,
  onChange,
  sizeLabel,
  sizeOptionLabels,
}: {
  size: ActivityPageSize;
  onChange: (size: ActivityPageSize) => void;
  sizeLabel: (size: ActivityPageSize) => string;
  sizeOptionLabels: Record<ActivityPageSize, string>;
}): React.ReactElement {
  return (
    <label className="flex items-center gap-2 text-xs text-[var(--color-secondary)]">
      <span className="font-medium">{sizeLabel(size)}</span>
      <select
        value={size}
        onChange={(e) => onChange(Number(e.target.value) as ActivityPageSize)}
        data-testid="event-overview-activity-size"
        className="rounded-md border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] py-1 pl-2 pr-7 text-xs font-medium text-[var(--color-on-surface)] outline-none focus:border-[var(--color-primary)]"
      >
        {ACTIVITY_PAGE_SIZES.map((s) => (
          <option key={s} value={s}>
            {sizeOptionLabels[s]}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Returns a function that renders an ISO instant as a short relative
 * string in the user's locale (e.g. "hace 5 min", "ayer", "hace 3 d").
 * Uses `Intl.RelativeTimeFormat` — supported in every evergreen
 * browser — so we avoid pulling in date-fns/dayjs just for the
 * overview card.
 */
export function createRelativeTimeFormatter(language: string): (iso: string) => string {
  let formatter: Intl.RelativeTimeFormat | null = null;
  try {
    formatter = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
  } catch {
    // Some test environments lack full ICU data; fall back to en-US.
    formatter = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });
  }
  const rt = formatter;

  // Pick the largest unit that yields ≥1 — keeps the output compact.
  // Anything older than 14 days collapses to a localised date.
  const UNITS: Array<{ unit: Intl.RelativeTimeFormatUnit; ms: number }> = [
    { unit: 'year', ms: 365 * 24 * 60 * 60 * 1000 },
    { unit: 'month', ms: 30 * 24 * 60 * 60 * 1000 },
    { unit: 'week', ms: 7 * 24 * 60 * 60 * 1000 },
    { unit: 'day', ms: 24 * 60 * 60 * 1000 },
    { unit: 'hour', ms: 60 * 60 * 1000 },
    { unit: 'minute', ms: 60 * 1000 },
    { unit: 'second', ms: 1000 },
  ];

  return (iso: string): string => {
    const then = Date.parse(iso);
    if (Number.isNaN(then)) return iso;
    const diffMs = then - Date.now();
    const absDiff = Math.abs(diffMs);

    if (absDiff > 14 * 24 * 60 * 60 * 1000) {
      // Far enough in the past (or future) that relative units read
      // awkwardly — show a short calendar date instead. Locale-aware
      // via Intl.DateTimeFormat.
      try {
        return new Intl.DateTimeFormat(language, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }).format(new Date(then));
      } catch {
        return new Date(then).toISOString().slice(0, 10);
      }
    }

    for (const { unit, ms } of UNITS) {
      if (absDiff >= ms) {
        return rt.format(Math.round(diffMs / ms), unit);
      }
    }
    return rt.format(0, 'second');
  };
}
