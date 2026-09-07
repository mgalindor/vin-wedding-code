import { Link } from '@tanstack/react-router';
import {
  Building2,
  Cake,
  CircleEllipsis,
  Gift,
  Heart,
  PartyPopper,
  Sparkles,
  Wine,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { EventStatus, EventType } from '@/shared/api';
import { formatCount, formatDateShort, highlightMatch } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';
import { Badge, Button } from '@/shared/ui';

interface EventCardStats {
  total: number;
  confirmed: number;
  pending: number;
  declined?: number;
}

export interface EventCardProps {
  id: string;
  title: string;
  eventType: EventType;
  eventDate: string;
  status: EventStatus;
  venue?: string;
  stats?: EventCardStats;
  rsvpProgress?: number;
  photos?: { current: number; cap: number };
  locale?: string;
  /**
   * When set, the rendered title highlights the first case-insensitive match
   * with a subtle gold `<mark>` so the user can see why an event matched
   * their search query. Empty / whitespace queries render the title
   * unchanged.
   */
  searchQuery?: string;
}

const TYPE_ICON: Record<EventType, React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>> = {
  wedding: Heart,
  birthday: Cake,
  anniversary: Gift,
  corporate: Building2,
  other: Sparkles,
};

const TYPE_ICON_FALLBACK: Record<EventType, React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>> = {
  wedding: Heart,
  birthday: PartyPopper,
  anniversary: Wine,
  corporate: Building2,
  other: Sparkles,
};

const STATUS_TONE: Record<EventStatus, 'gold' | 'neutral'> = {
  draft: 'neutral',
  published: 'gold',
  archived: 'neutral',
};

const HEADER_GRADIENT: Record<EventStatus, string> = {
  published:
    'linear-gradient(135deg, var(--color-primary-fixed) 0%, var(--color-primary-fixed-dim) 55%, var(--color-primary-container) 100%)',
  draft:
    'linear-gradient(135deg, var(--color-surface-container-low) 0%, var(--color-surface-container) 60%, var(--color-surface-container-high) 100%)',
  archived:
    'linear-gradient(135deg, color-mix(in oklab, var(--color-tertiary-container) 35%, var(--color-surface-container-low)) 0%, var(--color-surface-container) 100%)',
};

const HEADER_ICON_TONE: Record<EventStatus, string> = {
  published: 'text-[var(--color-on-primary-fixed-variant)] opacity-90',
  draft: 'text-[var(--color-secondary)] opacity-50',
  archived: 'text-[var(--color-tertiary)] opacity-55',
};

export function EventCard(props: EventCardProps): React.ReactElement {
  const { t, i18n } = useTranslation('events');
  const Icon = TYPE_ICON[props.eventType] ?? TYPE_ICON_FALLBACK[props.eventType] ?? CircleEllipsis;
  const locale = props.locale ?? i18n.language ?? 'en';
  const dateLabel = formatDateShort(props.eventDate, locale);
  const venueLabel = props.venue?.trim() ? props.venue : t('card.tba');
  const stats = props.stats;
  const showStats = Boolean(stats);
  const showProgress = typeof props.rsvpProgress === 'number';
  const progressPct = showProgress ? Math.max(0, Math.min(100, props.rsvpProgress as number)) : 0;

  return (
    <article
      data-testid={`event-card-${props.id}`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-lg border bg-[var(--color-surface-container-lowest)]',
        'border-[var(--color-outline-variant)] shadow-[var(--shadow-card)]',
        'transition-all duration-200',
        'hover:border-[var(--color-primary-container)] hover:shadow-[var(--shadow-card-hover)]',
      )}
    >
      <div
        className="relative flex h-24 items-center justify-center"
        style={{ background: HEADER_GRADIENT[props.status] }}
        aria-hidden
      >
        <Icon className={cn('h-9 w-9', HEADER_ICON_TONE[props.status])} />
      </div>

      <div className="pointer-events-none absolute right-3 top-3 z-20">
        <Badge tone={STATUS_TONE[props.status]} className="shadow-sm">
          {t(`status.${props.status}`)}
        </Badge>
      </div>

      <div className="relative flex grow flex-col p-5">
        <Link
          to="/dashboard/events/$eventId"
          params={{ eventId: props.id }}
          aria-label={props.title}
          className="before:absolute before:inset-0 before:z-10 before:rounded-lg before:content-[''] focus-visible:outline-none focus-visible:before:ring-2 focus-visible:before:ring-[var(--color-ring)]"
        />

        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-secondary)]">
          {t(`eventType.${props.eventType}`, { defaultValue: props.eventType })}
        </div>

        <h3
          className="line-clamp-2 text-2xl font-semibold leading-tight text-[var(--color-on-surface)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {highlightMatch(props.title, props.searchQuery ?? '').map((seg, i) =>
            seg.match ? (
              <mark
                key={i}
                className="rounded-sm bg-[var(--color-primary-fixed)]/60 px-0.5 text-[var(--color-on-primary-fixed-variant)]"
              >
                {seg.text}
              </mark>
            ) : (
              <span key={i}>{seg.text}</span>
            ),
          )}
        </h3>

        <div className="mt-2 flex items-center gap-1.5 text-sm text-[var(--color-secondary)]">
          <span>{dateLabel}</span>
          <span aria-hidden>·</span>
          <span className="truncate">{venueLabel}</span>
        </div>

        {showStats && stats && (
          <dl className="mt-4 grid grid-cols-3 gap-2 rounded-md border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)]/60 p-3">
            <StatCell
              label={t('card.stats.guests')}
              value={formatCount(stats.total, locale)}
              tone="default"
            />
            <StatCell
              label={t('card.stats.confirmed')}
              value={formatCount(stats.confirmed, locale)}
              tone="confirmed"
            />
            <StatCell
              label={
                typeof stats.declined === 'number' && props.status !== 'published'
                  ? t('card.stats.declined')
                  : t('card.stats.pending')
              }
              value={formatCount(
                typeof stats.declined === 'number' && props.status !== 'published'
                  ? stats.declined
                  : stats.pending,
                locale,
              )}
              tone={
                typeof stats.declined === 'number' && props.status !== 'published'
                  ? 'declined'
                  : 'pending'
              }
            />
          </dl>
        )}

        {showProgress && (
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-secondary)]">
              <span>{t('card.progressLabel')}</span>
              <span className="text-[var(--color-primary)]">{progressPct}%</span>
            </div>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-container)]"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('card.progressLabel')}
            >
              <div
                className="h-full rounded-full bg-[var(--color-primary)] transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {props.status === 'draft' && (
          <div className="mt-4 rounded-md border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] px-3 py-2 text-xs text-[var(--color-secondary)]">
            {t('card.draftMessage')}
          </div>
        )}
      </div>

      <div className="relative z-20 flex flex-wrap items-center gap-2 border-t border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] px-5 py-4">
        <FooterActions
          eventId={props.id}
          status={props.status}
          stats={stats}
          photos={props.photos}
          labels={{
            openEvent: t('card.actions.openEvent'),
            continueSetup: t('card.actions.continueSetup'),
            guestList: t('card.actions.guestList'),
            guestsWithCount: t('card.actions.guestsWithCount', {
              count: stats?.total ?? 0,
            }),
            invitation: t('card.actions.invitation'),
            downloadPhotos: t('card.actions.downloadPhotos'),
          }}
        />
      </div>
    </article>
  );
}

interface FooterLabels {
  openEvent: string;
  continueSetup: string;
  guestList: string;
  guestsWithCount: string;
  invitation: string;
  downloadPhotos: string;
}

function FooterActions({
  eventId,
  status,
  stats,
  photos,
  labels,
}: {
  eventId: string;
  status: EventStatus;
  stats?: EventCardStats;
  photos?: { current: number; cap: number };
  labels: FooterLabels;
}): React.ReactElement {
  if (status === 'published') {
    return (
      <>
        <Link to="/dashboard/events/$eventId" params={{ eventId }}>
          <Button size="sm">{labels.openEvent}</Button>
        </Link>
        <Link
          to={
            typeof stats?.total === 'number'
              ? '/dashboard/events/$eventId/guests'
              : '/dashboard/events/$eventId/invitation'
          }
          params={{ eventId }}
        >
          <Button size="sm" variant="outline">
            {typeof stats?.total === 'number' ? labels.guestsWithCount : labels.invitation}
          </Button>
        </Link>
      </>
    );
  }

  if (status === 'draft') {
    return (
      <>
        <Link to="/dashboard/events/$eventId" params={{ eventId }}>
          <Button size="sm" variant="secondary">
            {labels.continueSetup}
          </Button>
        </Link>
        <Link to="/dashboard/events/$eventId/guests" params={{ eventId }}>
          <Button size="sm" variant="outline">
            {labels.guestList}
          </Button>
        </Link>
      </>
    );
  }

  return (
    <>
      <Link to="/dashboard/events/$eventId/guests" params={{ eventId }}>
        <Button size="sm" variant="outline">
          {labels.guestList}
        </Button>
      </Link>
      {photos && (
        <Link to="/dashboard/events/$eventId" params={{ eventId }}>
          <Button size="sm" variant="outline">
            {labels.downloadPhotos}
          </Button>
        </Link>
      )}
    </>
  );
}

interface StatCellProps {
  label: string;
  value: string;
  tone: 'default' | 'confirmed' | 'pending' | 'declined';
}

function StatCell({ label, value, tone }: StatCellProps): React.ReactElement {
  const valueClass =
    tone === 'confirmed'
      ? 'text-[var(--color-status-confirmed-text)]'
      : tone === 'pending'
        ? 'text-[var(--color-status-pending-text)]'
        : tone === 'declined'
          ? 'text-[var(--color-status-declined-text)]'
          : 'text-[var(--color-on-surface)]';

  return (
    <div className="flex flex-col items-start">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-secondary)]">
        {label}
      </dt>
      <dd className={cn('text-lg font-semibold leading-tight', valueClass)}>{value}</dd>
    </div>
  );
}
