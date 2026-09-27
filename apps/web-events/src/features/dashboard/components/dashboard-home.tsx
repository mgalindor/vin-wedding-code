import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { CalendarHeart, CalendarRange, CircleCheck, Users2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EventCard } from '@/features/events/components/event-card';
import { useApiClient, type EventSummary } from '@/shared/api';
import { useIsAdmin } from '@/shared/auth';
import { Button } from '@/shared/ui';

const eventsDashboardKey = (scope: 'all' | 'mine') =>
  ['dashboard', 'events', scope] as const;

/**
 * Dashboard home — surfaces the most relevant entry points based on the
 * user's role:
 *
 *  - EventOrganizer: a gentle welcome + "Your events" + summary stats.
 *  - Administrator: everything the organizer sees PLUS a callout to the
 *    user management section.
 *
 * No data is loaded on mount in a "blocking" way; we use React Query so
 * the page is interactive while counts stream in.
 */
export function DashboardHome(): React.ReactElement {
  const { t } = useTranslation(['dashboard', 'common']);
  const api = useApiClient();
  const isAdmin = useIsAdmin();

  // Organizer scope (owned events).
  // Sorted by `createdAt desc` — this widget shows the most *recently
  // created/touched* events, not the soonest upcoming ones (that's what
  // the events list page's "closest event" sort is for).
  const myEvents = useQuery({
    queryKey: eventsDashboardKey('mine'),
    queryFn: async () => {
      const res = await api.get<{ page: { items: EventSummary[] } }>(
        '/events?size=3&sort=createdAt,desc',
      );
      return res.page.items;
    },
  });

  // Aggregate counts — admins see "all events", organizers see "their events".
  const allEvents = useQuery({
    enabled: isAdmin,
    queryKey: eventsDashboardKey('all'),
    queryFn: async () => {
      const res = await api.get<{ page: { total: number; items: EventSummary[] } }>(
        '/events?size=1',
      );
      return res.page;
    },
  });

  // Real count of future events — filtered server-side so it isn't capped by
  // the 3-item "recent" fetch above (which is sorted by creation, not date).
  const upcomingEvents = useQuery({
    queryKey: ['dashboard', 'events', 'upcoming'] as const,
    queryFn: async () => {
      const now = new Date();
      const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const res = await api.get<{ page: { total: number } }>(
        `/events?size=1&eventDateFrom=${todayIso}`,
      );
      return res.page.total;
    },
  });

  const firstName = (() => {
    const name = ''; // userinfo is fetched separately; we keep this header neutral
    return name;
  })();

  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-10">
      {/* Greeting */}
      <header className="flex flex-wrap items-end justify-between gap-4 pb-8">
        <div>
          <h1
            className="text-3xl font-bold tracking-tight text-[var(--color-on-surface)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('dashboard:home.greeting', { firstName })}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--color-secondary)]">
            {t('dashboard:home.subtitle')}
          </p>
        </div>
        <Link to="/dashboard/events/new">
          <Button size="lg" className="h-11">
            <CalendarHeart className="h-4 w-4" aria-hidden /> {t('dashboard:home.cta')}
          </Button>
        </Link>
      </header>

      {/* Stats row */}
      <section className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label={t('dashboard:home.stats.events')}
          value={isAdmin ? allEvents.data?.total : (myEvents.data ?? []).length}
          helper={t('dashboard:home.stats.eventsHelper')}
          icon={CalendarRange}
        />
        <StatCard
          label={t('dashboard:home.stats.upcoming')}
          value={upcomingEvents.data}
          helper={t('dashboard:home.stats.upcomingHelper')}
          icon={CalendarHeart}
        />
        <StatCard
          label={t('dashboard:home.stats.role')}
          value={isAdmin ? t('dashboard:home.stats.roleAdmin') : t('dashboard:home.stats.roleOrganizer')}
          helper={isAdmin ? t('dashboard:home.stats.roleAdminHelper') : t('dashboard:home.stats.roleOrganizerHelper')}
          icon={isAdmin ? CircleCheck : Users2}
          tone={isAdmin ? 'gold' : 'default'}
        />
      </section>

      {/* Your events list preview */}
      <section className="rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] shadow-[var(--shadow-card)]">
        <header className="flex items-center justify-between border-b border-[var(--color-outline-variant)] px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-on-surface)]">
              {t('dashboard:home.recent')}
            </h2>
            <p className="text-xs text-[var(--color-secondary)]">
              {t('dashboard:home.recentHelper')}
            </p>
          </div>
          <Link to="/dashboard/events" className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)] no-underline hover:underline">
            {t('dashboard:home.viewAll')}
          </Link>
        </header>

        <div
          className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2 xl:grid-cols-3"
          data-testid="dashboard-recent-events-grid"
        >
          {(myEvents.data ?? []).slice(0, 3).map((event) => (
            <EventCard
              key={event.id}
              id={event.id}
              title={event.title}
              eventType={event.eventType}
              eventDate={event.eventDate}
              status={event.status}
              templateCode={event.templateCode}
              updatedAt={event.updatedAt}
            />
          ))}
          {(myEvents.data ?? []).length === 0 && !myEvents.isLoading && (
            <div className="col-span-full rounded-md border border-dashed border-[var(--color-outline-variant)] px-6 py-12 text-center text-sm text-[var(--color-secondary)]">
              {t('dashboard:home.empty')}
            </div>
          )}
        </div>
      </section>

      {isAdmin && (
        <section className="mt-8 rounded-lg border border-[var(--color-primary-fixed-dim)] bg-[var(--color-primary-fixed)]/40 p-6">
          <h3 className="text-base font-semibold text-[var(--color-on-primary-fixed-variant)]">
            {t('dashboard:home.adminCallout.title')}
          </h3>
          <p className="mt-1.5 max-w-2xl text-sm text-[var(--color-on-primary-fixed-variant)]">
            {t('dashboard:home.adminCallout.body')}
          </p>
          <Link
            to="/dashboard/users"
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-on-primary-fixed-variant)] no-underline hover:underline"
          >
            {t('dashboard:home.adminCallout.cta')} →
          </Link>
        </section>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  helper?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'default' | 'gold';
}

function StatCard({ label, value, helper, icon: Icon, tone = 'default' }: StatCardProps): React.ReactElement {
  return (
    <div
      className={
        'rounded-lg border bg-[var(--color-surface-container-lowest)] p-5 shadow-[var(--shadow-card)] ' +
        (tone === 'gold'
          ? 'border-[var(--color-primary-fixed-dim)]'
          : 'border-[var(--color-outline-variant)]')
      }
    >
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-secondary)]">
          {label}
        </span>
        <div className="rounded-full bg-[var(--color-surface-container-low)] p-1.5 text-[var(--color-primary)]">
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div
        className="mt-2 text-3xl font-bold leading-none text-[var(--color-on-surface)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {value}
      </div>
      {helper && (
        <p className="mt-2 text-xs text-[var(--color-secondary)]">{helper}</p>
      )}
    </div>
  );
}
