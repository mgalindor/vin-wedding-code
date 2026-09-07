import { Link, Outlet, useLocation, useNavigate, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, CalendarHeart, ChevronLeft, Users2, Wand2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useEventsService, type EventDto } from '@/features/events/events.service';
import { EventCountdown } from '@/features/events/components/event-countdown';
import { Badge, Button } from '@/shared/ui';
import { Spinner } from '@/shared/ui';
import { formatDateLong } from '@/shared/lib/format';

/**
 * Map of tab id → path the tab's `<Link>` navigates to. Only routes
 * that actually exist in the router (`src/router.tsx`) appear here;
 * adding a tab that doesn't have a route is the easiest way to get
 * TypeScript + a runtime 404.
 */
const TAB_PATH = {
  overview: (id: string) => `/dashboard/events/${id}`,
  wedding: (id: string) => `/dashboard/events/${id}/wedding`,
  guests: (id: string) => `/dashboard/events/${id}/guests`,
  invitation: (id: string) => `/dashboard/events/${id}/invitation`,
} as const;

type TabId = keyof typeof TAB_PATH;

const TABS: ReadonlyArray<{ id: TabId; labelKey: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'overview', labelKey: 'events:detail.tabs.overview', icon: CalendarHeart },
  { id: 'wedding', labelKey: 'events:detail.tabs.weddings', icon: Wand2 },
  { id: 'guests', labelKey: 'events:detail.tabs.guests', icon: Users2 },
  { id: 'invitation', labelKey: 'events:detail.tabs.invitation', icon: CalendarHeart },
];

/**
 * Detail layout — header with breadcrumb back, event meta, countdown,
 * and a horizontal tab strip. Renders the matched tab via React Router's
 * `<Outlet />`. Mounted as the parent of every `/dashboard/events/$eventId*`
 * route in `src/router.tsx` so the header is always visible regardless of
 * which tab the user is on.
 */
export function EventDetailLayout(): React.ReactElement {
  const params = useParams({ strict: false }) as { eventId?: string };
  const eventId = params.eventId ?? '';
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation(['events', 'common']);
  const service = useEventsService();

  const { data, isLoading, error } = useQuery({
    queryKey: ['events', 'detail', eventId],
    queryFn: () => service.getEvent(eventId),
    enabled: Boolean(eventId),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!data || error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <h2
          className="text-2xl font-bold text-[var(--color-on-surface)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('common:actions.empty')}
        </h2>
        <p className="mt-2 text-sm text-[var(--color-secondary)]">
          {error instanceof Error ? error.message : 'Event not found'}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate({ to: '/dashboard' })}
        >
          <ChevronLeft className="h-4 w-4" /> {t('common:actions.back')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col" data-testid="event-detail">
      {/* Header */}
      <EventDetailHeader event={data} />

      {/* Tabs */}
      <div className="sticky top-0 z-10 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface)]">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-8">
          {TABS.map((tab) => {
            // "Active" = URL ends with the tab's exact path segment OR
            // is exactly the base `/dashboard/events/$id` (overview).
            const tabPath = TAB_PATH[tab.id](eventId);
            const active =
              location.pathname === tabPath ||
              (tab.id === 'overview' &&
                location.pathname === `/dashboard/events/${eventId}`);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.id}
                to={tabPath}
                aria-current={active ? 'page' : undefined}
                className={
                  'relative flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider no-underline transition-colors ' +
                  (active
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'border-transparent text-[var(--color-secondary)] hover:text-[var(--color-primary)]')
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {t(tab.labelKey)}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="w-full">
        <Outlet />
      </div>
    </div>
  );
}

function EventDetailHeader({ event }: { event: EventDto }) {
  const { t, i18n } = useTranslation(['events', 'common']);
  const locale = i18n.language?.startsWith('es') ? 'es' : 'en';
  return (
    <div className="border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)]">
      <div className="mx-auto max-w-6xl px-8 py-8">
        <div className="grow min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-secondary)]">
            <Badge tone="neutral">
              {t(`events:eventType.${event.eventType}`, { defaultValue: event.eventType })}
            </Badge>
            <Badge tone={event.status === 'published' ? 'gold' : 'neutral'}>
              {t(`events:status.${event.status}`)}
            </Badge>
          </div>
          <h1
            className="text-3xl font-bold leading-tight text-[var(--color-on-surface)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {event.title}
          </h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-[var(--color-secondary)]">
            <CalendarDays className="h-4 w-4" />
            {formatDateLong(event.eventDate, locale)}
          </p>
          <div className="mt-5">
            <EventCountdown iso={event.eventDate} />
          </div>
        </div>
      </div>
    </div>
  );
}
