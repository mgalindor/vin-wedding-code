import { useQuery } from '@tanstack/react-query';
import { Link, useParams, useRouter } from '@tanstack/react-router';
import {
  Archive,
  ArchiveRestore,
  ChevronRight,
  ExternalLink,
  Trash2,
  Users2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  type ActivityPageSize,
  useAuditService,
} from '@/features/audit/audit.service';
import {
  ActivityList,
  createRelativeTimeFormatter,
  type CategoryFilter,
  type ResourceFilter,
} from '@/features/events/components/event-overview-activity-list';
import {
  useEventsService,
  type EventDto,
} from '@/features/events/events.service';
import { useGuestsService } from '@/features/guests/guests.service';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Spinner } from '@/shared/ui';

/**
 * Default page size for the activity panel — also matches the BE
 * controller's `@PageableDefault(size = 10)`. We keep them in sync so
 * the first request shape matches what the user sees.
 */
const ACTIVITY_DEFAULT_SIZE = 10 as const satisfies ActivityPageSize;

export function EventOverviewScreen(): React.ReactElement {
  const params = useParams({ strict: false }) as { eventId?: string };
  const eventId = params.eventId ?? '';
  const service = useEventsService();

  const event = useQuery({
    queryKey: ['events', 'detail', eventId],
    queryFn: () => service.getEvent(eventId),
    enabled: Boolean(eventId),
  });

  if (!event.data) return <></>;

  return <Overview event={event.data} />;
}

function Overview({ event }: { event: EventDto }) {
  const { t, i18n } = useTranslation('events');
  const guestsService = useGuestsService();
  const auditService = useAuditService();

  // Filter state for the activity panel. `size` and `resourceFilter`
  // are BE-side filters and refetch the query; `categoryFilter` and
  // `searchTerm` are pure client-side projections over the page we
  // already have, so they live in local state only.
  const [size, setSize] = useState<ActivityPageSize>(ACTIVITY_DEFAULT_SIZE);
  const [resourceFilter, setResourceFilter] = useState<ResourceFilter>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Walk the first page of guests to compute overview stats. The
  // guest-management screen already does the same; we keep this
  // query independent so the overview renders even when the user
  // never visits the guests tab. Capped at 200 because real events
  // are <500 and 200 covers >95% of the cases — we surface "—"
  // for the totals while the request is in-flight or if it fails.
  const guests = useQuery({
    queryKey: ['guests', 'overview', event.id],
    queryFn: () =>
      guestsService.listGuests(event.id, { size: 200 }).then((p) => p.items ?? []),
    enabled: Boolean(event.id),
  });

  const guestCounts = useMemo(() => {
    const c: Record<'pending' | 'confirmed' | 'declined', number> = {
      pending: 0,
      confirmed: 0,
      declined: 0,
    };
    for (const g of guests.data ?? []) {
      c[g.rsvpStatus] += 1;
    }
    return c;
  }, [guests.data]);

  const totalGuests = guests.data?.length ?? 0;

  // Pull the most-recent N audit entries for this event. Sorted
  // server-side by `occurredAt` DESC, so the first page *is* the
  // timeline. The query key includes `size` and `resourceFilter` so
  // any change to either refetches; `categoryFilter` and `searchTerm`
  // do NOT belong here because they're applied client-side and don't
  // change the wire request.
  const activity = useQuery({
    queryKey: ['audit', 'overview', event.id, size, resourceFilter],
    queryFn: () =>
      auditService.listActivity(event.id, {
        size,
        resourceType: resourceFilter ?? undefined,
      }),
    enabled: Boolean(event.id),
  });

  const activityEntries = activity.data?.items ?? [];

  // Memoised on the locale so re-renders triggered by unrelated state
  // (guests fetching, etc.) don't allocate a fresh formatter.
  const relativeTimeFormatter = useMemo(
    () => createRelativeTimeFormatter(i18n.language),
    [i18n.language],
  );

  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-8 py-8 lg:grid-cols-3">
      {/* Left: next steps */}
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t('events:detail.overview.next')}</CardTitle>
              <p className="text-xs text-[var(--color-secondary)]">
                {t('events:statuses.title')}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <NextStepRow
              number={1}
              title={t('events:detail.weddings.title')}
              description={t('events:detail.weddings.subtitle')}
              to="/dashboard/events/$eventId/wedding"
              eventId={event.id}
            />
            <NextStepRow
              number={2}
              title={t('events:detail.tabs.guests')}
              description={t('events:title')}
              to="/dashboard/events/$eventId/guests"
              eventId={event.id}
            />
            <NextStepRow
              number={3}
              title={t('events:detail.tabs.invitation')}
              description={
                event.status === 'published'
                  ? t('events:detail.overview.invitationInactive')
                  : t('events:detail.overview.invitationInactive')
              }
              to="/dashboard/events/$eventId/invitation"
              eventId={event.id}
            />
          </CardContent>
        </Card>

        <Card data-testid="event-overview-activity-card">
          <CardHeader>
            <div>
              <CardTitle>{t('events:detail.overview.data')}</CardTitle>
              <p className="text-xs text-[var(--color-secondary)]">
                {t('events:detail.overview.dataSubtitle')}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <ActivityList
              entries={activityEntries}
              isPending={activity.isPending}
              isError={activity.isError}
              language={i18n.language}
              emptyLabel={t('events:detail.overview.dataEmpty')}
              errorLabel={t('events:detail.overview.dataLoadError')}
              actionLabel={(action) =>
                t(`events:detail.overview.dataActions.${action}`, {
                  defaultValue: t('events:detail.overview.dataActions._default'),
                })
              }
              resourceLabel={(resourceType) =>
                t(`events:detail.overview.dataResources.${resourceType}`, {
                  defaultValue: t('events:detail.overview.dataResources._default'),
                })
              }
              actorBylineTemplate={t('events:detail.overview.dataActorLabel')}
              relativeTimeFormatter={relativeTimeFormatter}
              size={size}
              onSizeChange={setSize}
              sizeLabel={(s) => t('events:detail.overview.dataSize', { size: s })}
              sizeOptionLabels={{
                5: t('events:detail.overview.dataSizeOption', { count: 5 }),
                10: t('events:detail.overview.dataSizeOption', { count: 10 }),
                15: t('events:detail.overview.dataSizeOption', { count: 15 }),
                30: t('events:detail.overview.dataSizeOption', { count: 30 }),
                50: t('events:detail.overview.dataSizeOption', { count: 50 }),
              }}
              resourceFilter={resourceFilter}
              onResourceFilterChange={setResourceFilter}
              resourceFilterLabels={{
                _all: t('events:detail.overview.dataResources._all'),
                event: t('events:detail.overview.dataResources.event'),
                wedding_event: t('events:detail.overview.dataResources.wedding_event'),
                guest: t('events:detail.overview.dataResources.guest'),
                guest_group: t('events:detail.overview.dataResources.guest_group'),
              }}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              categoryFilterLabels={{
                _all: t('events:detail.overview.dataCategories._all'),
                lifecycle: t('events:detail.overview.dataCategories.lifecycle'),
                content: t('events:detail.overview.dataCategories.content'),
                rsvp: t('events:detail.overview.dataCategories.rsvp'),
                guest: t('events:detail.overview.dataCategories.guest'),
              }}
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              searchPlaceholder={t('events:detail.overview.dataSearchPlaceholder')}
              clearFiltersLabel={t('events:detail.overview.dataClearFilters')}
            />
          </CardContent>
        </Card>
      </div>

      {/* Right: stats + actions */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('events:detail.overview.stats.guests')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              to="/dashboard/events/$eventId/guests"
              params={{ eventId: event.id }}
              className="block rounded-md border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-4 no-underline transition-colors hover:bg-[var(--color-surface-container-high)]"
              data-testid="event-overview-guests-link"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users2 className="h-5 w-5 text-[var(--color-primary)]" />
                  <div>
                    {guests.isPending ? (
                      <Spinner className="h-5 w-5" />
                    ) : (
                      <div
                        className="text-2xl font-bold text-[var(--color-on-surface)]"
                        data-testid="event-overview-guests-total"
                      >
                        {totalGuests}
                      </div>
                    )}
                    <div className="text-xs text-[var(--color-secondary)]">
                      {t('events:detail.overview.openInvitation')}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[var(--color-secondary)]" />
              </div>
              {!guests.isPending && totalGuests > 0 ? (
                <div
                  className="mt-3 flex flex-wrap gap-2"
                  data-testid="event-overview-guests-breakdown"
                >
                  <Badge tone="success">
                    {guestCounts.confirmed} {t('events:detail.overview.stats.confirmed')}
                  </Badge>
                  <Badge tone="warning">
                    {guestCounts.pending} {t('events:detail.overview.stats.pending')}
                  </Badge>
                  <Badge tone="danger">
                    {guestCounts.declined} {t('events:detail.overview.stats.declined')}
                  </Badge>
                </div>
              ) : null}
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('events:detail.overview.actions.editBasics')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              to="/dashboard/events/$eventId/edit"
              params={{ eventId: event.id }}
              className="block"
            >
              <Button variant="outline" className="w-full justify-start">
                <ExternalLink className="h-4 w-4" /> {t('events:detail.overview.actions.editBasics')}
              </Button>
            </Link>
            <ArchiveButton eventId={event.id} status={event.status} />
            <DangerButton eventId={event.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function NextStepRow({
  number,
  title,
  description,
  to,
  eventId,
}: {
  number: number;
  title: string;
  description: string;
  to: string;
  eventId: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.navigate({ to: to as never, params: { eventId } as never })}
      className="flex w-full items-start gap-3 rounded-md border border-transparent p-3 text-left transition-colors hover:border-[var(--color-primary-container)] hover:bg-[var(--color-surface-container-low)]"
    >
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-fixed-dim)] text-xs font-bold text-[var(--color-on-primary-fixed-variant)]"
      >
        {number}
      </span>
      <div className="grow">
        <div className="text-sm font-semibold text-[var(--color-on-surface)]">{title}</div>
        <div className="text-xs text-[var(--color-secondary)]">{description}</div>
      </div>
      <ChevronRight className="mt-1 h-4 w-4 text-[var(--color-secondary)]" />
    </button>
  );
}

/**
 * Renders the recent-activity timeline for the overview. Kept in
 * `event-overview-activity-list.tsx` so it can be unit-tested without
 * mounting the full screen (router + i18n + query-client wiring).
 */

function ArchiveButton({ eventId, status }: { eventId: string; status: EventDto['status'] }) {
  const { t } = useTranslation('events');
  const service = useEventsService();
  const isArchived = status === 'archived';

  const onClick = async () => {
    const confirmKey = isArchived
      ? 'detail.overview.warnings.restoreConfirm'
      : 'detail.overview.warnings.archiveConfirm';
    if (!window.confirm(t(confirmKey))) return;
    await (isArchived ? service.restoreEvent(eventId) : service.archiveEvent(eventId));
    location.reload();
  };

  const Icon = isArchived ? ArchiveRestore : Archive;
  const labelKey = isArchived
    ? 'events:detail.overview.actions.restore'
    : 'events:detail.overview.actions.archive';

  return (
    <Button
      variant="ghost"
      className="w-full justify-start text-[var(--color-secondary)]"
      onClick={onClick}
      data-testid={isArchived ? 'event-restore' : 'event-archive'}
    >
      <Icon className="h-4 w-4" /> {t(labelKey)}
    </Button>
  );
}

function DangerButton({ eventId }: { eventId: string }) {
  const { t } = useTranslation(['events', 'common']);
  const service = useEventsService();

  const onDelete = async () => {
    if (window.confirm(t('common:actions.deleteConfirm'))) {
      await service.deleteEvent(eventId);
      location.href = '/dashboard';
    }
  };

  return (
    <Button
      variant="ghost"
      className="w-full justify-start text-[var(--color-destructive)]"
      onClick={onDelete}
      data-testid="event-delete"
    >
      <Trash2 className="h-4 w-4" /> {t('events:detail.overview.actions.delete')}
    </Button>
  );
}

/* Reserved for future use — placeholder for a future "hide preview" toggle. */
const _EyeOffPlaceholder: null = null;
void _EyeOffPlaceholder;
