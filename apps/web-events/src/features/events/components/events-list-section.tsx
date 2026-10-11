import { useQuery } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import {
  Building2,
  Cake,
  CalendarHeart,
  Check,
  ChevronDown,
  Filter,
  Gift,
  Heart,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  useEventsService,
  type ListEventsSortField,
  type ListEventsSortDir,
} from '@/features/events/events.service';
import { type EventSummary, type EventType } from '@/shared/api';
import { Button, EmptyState, Spinner } from '@/shared/ui';

import { EventCard } from './event-card';

type StatusFilter = 'all' | 'active' | 'draft' | 'archived';

type SortKey = 'closest' | 'farthest' | 'recentCreated' | 'oldestCreated';

const STATUS_PILLS: ReadonlyArray<{ value: StatusFilter; labelKey: string }> = [
  { value: 'all', labelKey: 'events:filters.all' },
  { value: 'active', labelKey: 'events:filters.active' },
  { value: 'draft', labelKey: 'events:filters.draft' },
  { value: 'archived', labelKey: 'events:filters.archived' },
];

interface SortOption {
  value: SortKey;
  labelKey: string;
  sortField: ListEventsSortField;
  sortDir: ListEventsSortDir;
}

const SORT_OPTIONS: ReadonlyArray<SortOption> = [
  { value: 'closest', labelKey: 'events:list.sort.options.closest', sortField: 'eventDate', sortDir: 'asc' },
  { value: 'farthest', labelKey: 'events:list.sort.options.farthest', sortField: 'eventDate', sortDir: 'desc' },
  { value: 'recentCreated', labelKey: 'events:list.sort.options.recentCreated', sortField: 'createdAt', sortDir: 'desc' },
  { value: 'oldestCreated', labelKey: 'events:list.sort.options.oldestCreated', sortField: 'createdAt', sortDir: 'asc' },
];

const ALL_EVENT_TYPES: ReadonlyArray<EventType> = ['wedding', 'birthday', 'anniversary', 'corporate', 'other'];

const TYPE_ICON: Record<EventType, React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>> = {
  wedding: Heart,
  birthday: Cake,
  anniversary: Gift,
  corporate: Building2,
  other: Sparkles,
};

const DEFAULT_SORT: SortKey = 'closest';

const isStatusFilter = (v: unknown): v is StatusFilter =>
  v === 'all' || v === 'active' || v === 'draft' || v === 'archived';

const isEventType = (v: unknown): v is EventType =>
  v === 'wedding' || v === 'birthday' || v === 'anniversary' || v === 'corporate' || v === 'other';

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 30;

function parseSortString(value: string | undefined): SortKey | null {
  if (!value) return null;
  const [field, dir] = value.split(',');
  if (field === 'eventDate' && dir === 'desc') return 'farthest';
  if (field === 'eventDate' && dir === 'asc') return 'closest';
  if (field === 'createdAt' && dir === 'desc') return 'recentCreated';
  if (field === 'createdAt' && dir === 'asc') return 'oldestCreated';
  return null;
}

function sortKeyToString(key: SortKey): string {
  const opt = SORT_OPTIONS.find((o) => o.value === key) ?? SORT_OPTIONS[0]!;
  return `${opt.sortField},${opt.sortDir}`;
}

export function EventsListSection(): React.ReactElement {
  const { t } = useTranslation(['events', 'common']);
  const service = useEventsService();
  const navigate = useNavigate();
  const location = useLocation();

  const hydratedRef = useRef(false);
  const didInitialSyncRef = useRef(false);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilters, setTypeFilters] = useState<EventType[]>([]);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortKey>(DEFAULT_SORT);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);

  const sortMenuRef = useRef<HTMLDivElement>(null);
  const typeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const raw = location.search as Record<string, unknown>;
    const q = typeof raw.q === 'string' ? raw.q : '';
    setSearchInput(q);
    setDebouncedSearch(q);
    if (typeof raw.status === 'string' && isStatusFilter(raw.status)) setStatus(raw.status);
    if (typeof raw.sort === 'string') {
      const parsed = parseSortString(raw.sort);
      if (parsed) setSort(parsed);
    }
    if (typeof raw.type === 'string' && raw.type.length > 0) {
      const types = raw.type.split(',').filter(isEventType);
      setTypeFilters(types);
    }
  }, [location.search]);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    if (!sortMenuOpen && !typeMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (sortMenuOpen && sortMenuRef.current && !sortMenuRef.current.contains(target)) {
        setSortMenuOpen(false);
      }
      if (typeMenuOpen && typeMenuRef.current && !typeMenuRef.current.contains(target)) {
        setTypeMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSortMenuOpen(false);
        setTypeMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [sortMenuOpen, typeMenuOpen]);

  const activeSort = useMemo<SortOption>(
    () => SORT_OPTIONS.find((o) => o.value === sort) ?? SORT_OPTIONS[0]!,
    [sort],
  );

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (!didInitialSyncRef.current) {
      didInitialSyncRef.current = true;
      return;
    }
    const sortString = sortKeyToString(sort);
    const defaultSortString = sortKeyToString(DEFAULT_SORT);
    const next: Record<string, string | undefined> = {
      q: debouncedSearch ? debouncedSearch : undefined,
      type: typeFilters.length > 0 ? typeFilters.join(',') : undefined,
      status: status !== 'all' ? status : undefined,
      sort: sortString === defaultSortString ? undefined : sortString,
    };
    navigate({
      to: '/dashboard/events',
      search: next as unknown as Record<string, unknown>,
      replace: true,
    });
  }, [debouncedSearch, typeFilters, status, sort, navigate]);

  const hasActiveFilters =
    debouncedSearch.trim().length > 0 ||
    typeFilters.length > 0 ||
    status !== 'all' ||
    sort !== DEFAULT_SORT;

  const availableTypes = useMemo(
    () => ALL_EVENT_TYPES.filter((t) => !typeFilters.includes(t)),
    [typeFilters],
  );

  const query = useQuery({
    queryKey: ['events', { search: debouncedSearch, status, sort, typeFilters }] as const,
    queryFn: async () => {
      const baseInput = {
        search: debouncedSearch ? debouncedSearch : undefined,
        status,
        sort: activeSort.sortField,
        sortDir: activeSort.sortDir,
        size: PAGE_SIZE,
      };
      const typesToFetch: Array<EventType | undefined> =
        typeFilters.length === 0 ? [undefined] : typeFilters;
      const pages = await Promise.all(
        typesToFetch.map((t) =>
          t === undefined ? service.listEvents(baseInput) : service.listEvents({ ...baseInput, eventType: t }),
        ),
      );
      const seen = new Set<string>();
      const merged: EventSummary[] = [];
      let total = 0;
      for (const page of pages) {
        total += page.total;
        for (const item of page.items) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            merged.push(item);
          }
        }
      }
      if (activeSort.sortField === 'eventDate') {
        merged.sort((a, b) =>
          activeSort.sortDir === 'asc'
            ? a.eventDate.localeCompare(b.eventDate)
            : b.eventDate.localeCompare(a.eventDate),
        );
      }
      return {
        items: merged.slice(0, PAGE_SIZE),
        total,
        page: 0,
        size: PAGE_SIZE,
        totalPages: 1,
        hasMore: merged.length > PAGE_SIZE,
      };
    },
  });

  const items = query.data?.items ?? [];
  const total = query.data?.total ?? items.length;
  const showNoMatches =
    !query.isLoading && items.length === 0 && (hasActiveFilters || debouncedSearch.length > 0);

  const onTypeAdd = (t: EventType) => {
    setTypeFilters((prev) => (prev.includes(t) ? prev : [...prev, t]));
    setTypeMenuOpen(false);
  };
  const onTypeRemove = (t: EventType) => {
    setTypeFilters((prev) => prev.filter((x) => x !== t));
  };

  const onResetAll = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setTypeFilters([]);
    setStatus('all');
    setSort(DEFAULT_SORT);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-10" data-testid="events-list">
      <header className="mb-8 flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-3">
              <h1
                className="text-3xl font-bold tracking-tight text-[var(--color-on-surface)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {t('events:title')}
              </h1>
              <span className="text-sm text-[var(--color-secondary)]" data-testid="events-list-count">
                {t('events:list.count', { count: total })}
              </span>
            </div>
            <p className="mt-2 max-w-xl text-sm text-[var(--color-secondary)]">
              {t('events:subtitle')}
            </p>
          </div>
          <Link to="/dashboard/events/new">
            <Button size="lg" className="h-11">
              <CalendarHeart className="h-4 w-4" aria-hidden /> {t('events:create')}
            </Button>
          </Link>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full flex-col gap-2 md:w-auto md:grow">
            <div className="relative w-full md:max-w-md">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-secondary)]"
                aria-hidden
              />
              <InputSearchLike
                placeholder={t('events:search.placeholder')}
                value={searchInput}
                onChange={setSearchInput}
                onClear={() => setSearchInput('')}
                clearAria={t('events:search.clearAria')}
              />
            </div>
            {debouncedSearch.trim().length > 0 && (
              <p
                className="text-xs text-[var(--color-secondary)]"
                data-testid="events-results-match"
              >
                {t('events:list.resultsMatch', {
                  count: total,
                  total: total,
                  query: debouncedSearch,
                })}
              </p>
            )}
          </div>

          <div ref={sortMenuRef} className="relative shrink-0">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={sortMenuOpen}
              onClick={() => setSortMenuOpen((v) => !v)}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-on-surface)] shadow-[var(--shadow-card)] transition-colors hover:bg-[var(--color-surface-container-low)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2"
              data-testid="events-sort-trigger"
            >
              <span className="text-[var(--color-secondary)]">{t('events:list.sort.label')}</span>
              <span>{t(activeSort.labelKey)}</span>
              <ChevronDown
                className={'h-3.5 w-3.5 transition-transform ' + (sortMenuOpen ? 'rotate-180' : '')}
                aria-hidden
              />
            </button>
            {sortMenuOpen && (
              <div
                role="menu"
                aria-label={t('events:list.sort.label')}
                data-testid="events-sort-menu"
                className="absolute right-0 z-30 mt-2 min-w-[14rem] overflow-hidden rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] py-1 shadow-[var(--shadow-card-hover)]"
              >
                {SORT_OPTIONS.map((opt) => {
                  const active = opt.value === sort;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="menuitem"
                      aria-current={active ? 'true' : undefined}
                      onClick={() => {
                        setSort(opt.value);
                        setSortMenuOpen(false);
                      }}
                      data-testid={`events-sort-option-${opt.value}`}
                      className={
                        'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors ' +
                        (active
                          ? 'bg-[var(--color-primary-fixed)]/40 text-[var(--color-on-surface)]'
                          : 'text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)]')
                      }
                    >
                      <span>{t(opt.labelKey)}</span>
                      {active && <Check className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
            <div className="flex flex-wrap items-center gap-2" data-testid="events-type-chips">
              {typeFilters.map((type) => {
                const Icon = TYPE_ICON[type];
                const label = t(`events:eventType.${type}`);
                return (
                  <span
                    key={type}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-primary-container)] bg-[var(--color-primary-fixed)]/30 py-1 pl-2.5 pr-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-on-surface)]"
                    data-testid={`events-type-chip-${type}`}
                  >
                    <Icon className="h-3.5 w-3.5 text-[var(--color-on-primary-fixed-variant)]" aria-hidden />
                    <span>{label}</span>
                    <button
                      type="button"
                      aria-label={t('events:list.removeTypeAria', { type: label })}
                      onClick={() => onTypeRemove(type)}
                      className="ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[var(--color-on-primary-fixed-variant)] hover:bg-[var(--color-primary-fixed-dim)]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                      data-testid={`events-type-remove-${type}`}
                    >
                      <X className="h-3 w-3" aria-hidden />
                    </button>
                  </span>
                );
              })}

              <div ref={typeMenuRef} className="relative">
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={typeMenuOpen}
                  onClick={() => setTypeMenuOpen((v) => !v)}
                  className="inline-flex h-7 items-center gap-1 rounded-full border border-dashed border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-secondary)] transition-colors hover:border-[var(--color-primary-container)] hover:text-[var(--color-on-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2"
                  data-testid="events-type-trigger"
                >
                  <Plus className="h-3 w-3" aria-hidden /> {t('events:list.typeFilter.label')}
                </button>
                {typeMenuOpen && (
                  <div
                    role="menu"
                    aria-label={t('events:list.typeFilter.add')}
                    data-testid="events-type-menu"
                    className="absolute left-0 z-30 mt-2 min-w-[14rem] overflow-hidden rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] py-1 shadow-[var(--shadow-card-hover)]"
                  >
                    {availableTypes.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-[var(--color-secondary)]">
                        {t('events:list.typeFilter.allAdded')}
                      </p>
                    ) : (
                      availableTypes.map((type) => {
                        const Icon = TYPE_ICON[type];
                        return (
                          <button
                            key={type}
                            type="button"
                            role="menuitem"
                            onClick={() => onTypeAdd(type)}
                            data-testid={`events-type-option-${type}`}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)]"
                          >
                            <Icon className="h-4 w-4 text-[var(--color-secondary)]" aria-hidden />
                            <span>{t(`events:eventType.${type}`)}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            <div
              role="tablist"
              aria-label={t('events:filters.all')}
              className="inline-flex flex-wrap items-center gap-1 rounded-full border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] p-1 shadow-[var(--shadow-card)]"
            >
              {STATUS_PILLS.map((p) => {
                const active = status === p.value;
                return (
                  <button
                    key={p.value}
                    role="tab"
                    type="button"
                    aria-selected={active}
                    onClick={() => setStatus(p.value)}
                    className={
                      'rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 ' +
                      (active
                        ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-sm'
                        : 'bg-transparent text-[var(--color-secondary)] hover:text-[var(--color-on-surface)]')
                    }
                    data-testid={`events-filter-${p.value}`}
                  >
                    {t(p.labelKey)}
                  </button>
                );
              })}
            </div>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetAll}
              data-testid="events-reset"
              className="self-start text-[var(--color-secondary)]"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden /> {t('events:list.reset')}
            </Button>
          )}
        </div>
      </header>

      {query.isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={showNoMatches ? <Filter className="h-6 w-6" /> : <CalendarHeart className="h-6 w-6" />}
          title={showNoMatches ? t('events:noMatches.title') : t('events:empty.title')}
          body={showNoMatches ? t('events:noMatches.body') : t('events:empty.body')}
          action={
            showNoMatches ? (
              <Button onClick={onResetAll} data-testid="events-clear-all">
                {t('events:list.clearAll')}
              </Button>
            ) : (
              <Link to="/dashboard/events/new">
                <Button data-testid="events-empty-create">{t('events:empty.action')}</Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3" data-testid="events-grid">
          {items.map((event) => (
            <EventCard
              key={event.id}
              id={event.id}
              title={event.title}
              eventType={event.eventType}
              eventDate={event.eventDate}
              status={event.status}
              updatedAt={event.updatedAt}
              searchQuery={debouncedSearch}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface InputSearchLikeProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  clearAria: string;
}

function InputSearchLike({
  placeholder,
  value,
  onChange,
  onClear,
  clearAria,
}: InputSearchLikeProps): React.ReactElement {
  return (
    <div className="relative w-full">
      <input
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid="events-search-input"
        className="h-10 w-full rounded border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] pl-9 pr-9 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-secondary)] focus-visible:border-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgb(115_92_0_/_12%)]"
      />
      {value.length > 0 && (
        <button
          type="button"
          aria-label={clearAria}
          onClick={onClear}
          data-testid="events-search-clear"
          className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[var(--color-secondary)] transition-colors hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-on-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}
    </div>
  );
}
