import { Link } from '@tanstack/react-router';
import {
  Building2,
  Cake,
  CircleEllipsis,
  Clock,
  Gift,
  Heart,
  History,
  PartyPopper,
  Sparkles,
  Wine,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { createRelativeTimeFormatter } from '@/features/events/components/event-overview-activity-list';
import type { EventStatus, EventType } from '@/shared/api';
import { daysFromToday, formatCount, formatDateShort, getCountdown, highlightMatch } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';
import { Badge, Button } from '@/shared/ui';

/** Badge shown on the card: derived from the event date rather than the raw workflow status. */
type CardBadgeStatus = 'active' | 'closed' | 'archived';

function getCardBadgeStatus(status: EventStatus, eventDate: string): CardBadgeStatus {
  if (status === 'archived') return 'archived';
  return getCountdown(eventDate).isPast ? 'closed' : 'active';
}

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
  /** ISO instant of the last write to the event. Renders as a relative "updated X ago" hint. */
  updatedAt?: string;
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

const CARD_BADGE_TONE: Record<CardBadgeStatus, 'gold' | 'neutral'> = {
  active: 'gold',
  closed: 'neutral',
  archived: 'neutral',
};

/** Header gradient per event type — fallback when an event has no id to derive a decorative gradient from. */
const EVENT_TYPE_GRADIENT: Record<EventType, string> = {
  wedding: 'linear-gradient(135deg, #f7e3d8 0%, #f3c9c9 45%, #e9c349 100%)',
  birthday: 'linear-gradient(135deg, #bfe3f5 0%, #f8d7da 50%, #fff3b0 100%)',
  anniversary: 'linear-gradient(135deg, #4e6073 0%, #a2b5cb 55%, #e9c349 100%)',
  corporate: 'linear-gradient(135deg, #1f2937 0%, #374151 55%, #3b82f6 100%)',
  other: 'linear-gradient(135deg, #a8e6cf 0%, #bfe3f5 50%, #c9b8e0 100%)',
};

/**
 * Pool of decorative header gradients, carried over from the former per-invitation-template
 * palettes. Assigning one per card by {@link hashHeaderGradient} gives each event a distinct,
 * stable look instead of all cards of the same {@link EventType} sharing one flat color.
 */
const DECORATIVE_GRADIENTS: string[] = [
  'linear-gradient(135deg, #2F4A3A 0%, #C9A961 100%)',
  'linear-gradient(135deg, #0E0E10 0%, #E8B872 100%)',
  'linear-gradient(135deg, #E8DFCE 0%, #C19A6B 100%)',
  'linear-gradient(135deg, #0A0A0A 0%, #D4AF37 100%)',
  'linear-gradient(135deg, #E8EDE5 0%, #7A9B76 100%)',
  'linear-gradient(135deg, #F7E1B5 0%, #F4A261 55%, #264653 100%)',
  'linear-gradient(135deg, #FFD6E0 0%, #C7E9FF 50%, #FFF3B0 100%)',
  'linear-gradient(135deg, #1A1410 0%, #C9A961 100%)',
  'linear-gradient(135deg, #0F0F1A 0%, #00F0FF 50%, #FF2EC4 100%)',
  'linear-gradient(135deg, #F0EBE3 0%, #E8C5C5 100%)',
  'linear-gradient(135deg, #FFB997 0%, #A8DADC 100%)',
  'linear-gradient(135deg, #BFE3F5 0%, #F8D7DA 55%, #FFE9B0 100%)',
  'linear-gradient(135deg, #6BCBEF 0%, #FFD93D 100%)',
  'linear-gradient(135deg, #E8B4BC 0%, #D4AF37 100%)',
  'linear-gradient(135deg, #0B2545 0%, #C9A961 100%)',
  'linear-gradient(135deg, #1F2937 0%, #3B82F6 100%)',
  'linear-gradient(135deg, #0A0E27 0%, #06B6D4 50%, #8B5CF6 100%)',
  'linear-gradient(135deg, #F8FAFC 0%, #2563EB 100%)',
  'linear-gradient(135deg, #2D5016 0%, #D4A574 100%)',
  'linear-gradient(135deg, #722F37 0%, #D4AF37 100%)',
  'linear-gradient(135deg, #2C3E2D 0%, #D4A5A5 100%)',
  'linear-gradient(135deg, #3E2C1C 0%, #C19A6B 100%)',
  'linear-gradient(135deg, #0B1A3D 0%, #D4AF37 100%)',
];

/** djb2 string hash, kept non-negative for safe modulo indexing. */
function hashString(value: string): number {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return hash >>> 0;
}

/** Deterministic per-event gradient: same event id always maps to the same pool entry. */
function getHeaderGradient(eventType: EventType, id: string): string {
  if (!id) return EVENT_TYPE_GRADIENT[eventType];
  return DECORATIVE_GRADIENTS[hashString(id) % DECORATIVE_GRADIENTS.length];
}

export function EventCard(props: EventCardProps): React.ReactElement {
  const { t, i18n } = useTranslation('events');
  const Icon = TYPE_ICON[props.eventType] ?? TYPE_ICON_FALLBACK[props.eventType] ?? CircleEllipsis;
  const locale = props.locale ?? i18n.language ?? 'en';
  const dateLabel = formatDateShort(props.eventDate, locale);
  const stats = props.stats;
  const showStats = Boolean(stats);
  const showProgress = typeof props.rsvpProgress === 'number';
  const progressPct = showProgress ? Math.max(0, Math.min(100, props.rsvpProgress as number)) : 0;
  const badgeStatus = getCardBadgeStatus(props.status, props.eventDate);

  const daysUntil = daysFromToday(props.eventDate);
  const countdownLabel =
    daysUntil === 0
      ? t('card.countdown.today')
      : daysUntil > 0
        ? t('card.countdown.upcoming', { count: daysUntil })
        : t('card.countdown.past', { count: Math.abs(daysUntil) });

  const updatedLabel = props.updatedAt
    ? t('card.updated', { relative: createRelativeTimeFormatter(i18n.language)(props.updatedAt) })
    : null;

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
        data-testid="event-card-header"
        className={cn('relative flex h-24 items-center justify-center', badgeStatus === 'archived' && 'grayscale')}
        style={{ background: getHeaderGradient(props.eventType, props.id) }}
        aria-hidden
      >
        <Icon className={cn('h-9 w-9 text-white/90 drop-shadow-sm', badgeStatus === 'archived' && 'opacity-60')} />
      </div>

      <div className="pointer-events-none absolute right-3 top-3 z-20">
        <Badge tone={CARD_BADGE_TONE[badgeStatus]} className="shadow-sm">
          {t(`status.${badgeStatus}`)}
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

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--color-secondary)]">
          <span>{dateLabel}</span>
          <span className="inline-flex items-center gap-1 text-xs text-[var(--color-secondary)]">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {countdownLabel}
          </span>
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
            {t('card.draftMessageNoTemplate')}
          </div>
        )}

        {updatedLabel && (
          <div className="mt-3 flex items-center gap-1 text-xs text-[var(--color-secondary)]">
            <History className="h-3.5 w-3.5" aria-hidden />
            {updatedLabel}
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
