import { Link, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useEffect, useMemo, useState } from 'react';

import { useWeddingForTab } from '../hooks/use-wedding-for-tab';

import { DetailScreenShell } from './detail-screen-shell';
import { WeddingDetailLayout } from './wedding-detail-layout';

/**
 * Wedding Overview tab.
 *
 * Mirrors the mockup surface (`05-wedding-detail.html`):
 *   - Countdown banner (days/hours/minutes until the event, or days
 *     since if the wedding has happened, or "today is the day").
 *   - Two-column grid: setup checklist (left) + latest activity (right).
 *   - Public links section (invitation, photo album, private couple
 *     upload link).
 *
 * Data sourcing — the Wedding bounded context (US-009/010) only
 * carries the 5 captured fields + lifecycle status. Sections that
 * need data owned by future stories are seeded with deterministic
 * placeholders so the layout matches the mockup pixel-for-pixel
 * today; the seed comments mark where each future story will plug in:
 *
 *   - Countdown: uses `wedding.eventDate` (ISO YYYY-MM-DD) plus a
 *     hard-coded 18:00 ceremony time (US-022 will add eventTime).
 *   - Checklist: derives 3 items from real Wedding data + 1 pending
 *     item that will be wired to US-022/023.
 *   - Latest activity: seeds from `createdAt` / `updatedAt` /
 *     `status === 'published'` until US-014 ships.
 *   - Public links: shows the URL pattern the slug will resolve to;
 *     becomes live once US-022/023 publishes the invitation.
 */

const DEFAULT_START_HOUR = 18; // Default ceremony start time when unset.

interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  isPast: boolean;
  isToday: boolean;
}

function computeCountdown(eventDate: string, startTime: string | null): CountdownParts {
  // DTO carries YYYY-MM-DD; pair with the ceremony hour. Fall back
  // to 18:00 when the WP hasn't set a start time yet — keeps the
  // countdown meaningful for rows that pre-date the field.
  const [year, month, day] = eventDate.split('-').map(Number);
  const safeYear = year ?? 2000;
  const safeMonth = month ?? 1;
  const safeDay = day ?? 1;
  const hour = parseStartHour(startTime) ?? DEFAULT_START_HOUR;
  const target = new Date(safeYear, safeMonth - 1, safeDay, hour, 0, 0);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const isPast = diffMs < 0;
  const absMs = Math.abs(diffMs);
  const totalMinutes = Math.floor(absMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const isToday =
    now.getFullYear() === target.getFullYear() &&
    now.getMonth() === target.getMonth() &&
    now.getDate() === target.getDate();
  return { days, hours, minutes, isPast, isToday };
}

interface ChecklistItem {
  readonly id: string;
  readonly state: 'done' | 'warn' | 'todo';
  readonly labelKey: string;
  readonly dateLabel?: string;
  readonly progressKey?: string;
}

function buildChecklist(args: {
  isPublished: boolean;
  createdAtLabel: string;
}): ReadonlyArray<ChecklistItem> {
  // Three items derive from real Wedding data; the fourth is the
  // "remaining tasks" placeholder that US-022/023 will populate.
  return [
    {
      id: 'basics',
      state: 'done',
      labelKey: 'detail.overview.checklist.basics.label',
      dateLabel: args.createdAtLabel,
    },
    {
      id: 'published',
      state: args.isPublished ? 'done' : 'warn',
      labelKey: args.isPublished
        ? 'detail.overview.checklist.published.label'
        : 'detail.overview.checklist.published.pending',
      dateLabel: args.isPublished ? args.createdAtLabel : undefined,
    },
    {
      id: 'photos',
      state: 'todo',
      labelKey: 'detail.overview.checklist.photos.pending',
    },
    {
      id: 'remaining',
      state: 'warn',
      labelKey: 'detail.overview.checklist.remainingDetail',
      progressKey: 'detail.overview.checklist.remaining',
    },
  ];
}

interface ActivityItem {
  readonly id: string;
  readonly text: string;
  readonly timeLabel: string;
  readonly tone: 'primary' | 'tertiary' | 'neutral' | 'confirmed';
}

function buildActivity(args: {
  createdAtLabel: string;
  updatedAtLabel: string;
  isPublished: boolean;
  i18n: { created: string; updated: string; published: string };
}): ReadonlyArray<ActivityItem> {
  // Seed feed from real timestamps until US-014 (activity feed) lands.
  return [
    {
      id: 'updated',
      text: args.i18n.updated,
      timeLabel: args.updatedAtLabel,
      tone: 'primary',
    },
    {
      id: 'created',
      text: args.i18n.created,
      timeLabel: args.createdAtLabel,
      tone: 'neutral',
    },
    ...(args.isPublished
      ? [
          {
            id: 'published',
            text: args.i18n.published,
            timeLabel: args.createdAtLabel,
            tone: 'confirmed' as const,
          },
        ]
      : []),
  ];
}

function formatShortDate(iso: string): string {
  // Render as the active locale's short date format (e.g. "Aug 11").
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return iso;
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(year, month - 1, day));
  } catch {
    return iso;
  }
}

// Pull just the hour component from an HH:mm string. Returns null
// when the value is absent or malformed — the caller falls back to
// the 18:00 default.
function parseStartHour(value: string | null): number | null {
  if (!value) return null;
  const match = /^([01]\d|2[0-3]):[0-5]\d$/.exec(value.trim());
  return match ? Number(match[1]) : null;
}

// Render an HH:mm string for display, falling back to the default
// when unset so the countdown banner and the date row never show a
// blank.
function formatStartLabel(value: string | null): string {
  if (!value) return `${String(DEFAULT_START_HOUR).padStart(2, '0')}:00`;
  return value.trim();
}

function formatLongDate(iso: string, locale: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return iso;
  try {
    return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(year, month - 1, day));
  } catch {
    return iso;
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface CountdownProps {
  countdown: CountdownParts;
  weddingDateLong: string;
  ceremonyTimeLabel: string;
  venueLine: string;
  titleKey: string;
  daysLabel: string;
  hoursLabel: string;
  minutesLabel: string;
}

function CountdownBanner({
  countdown,
  weddingDateLong,
  ceremonyTimeLabel,
  venueLine,
  titleKey,
  daysLabel,
  hoursLabel,
  minutesLabel,
}: CountdownProps): React.ReactElement {
  return (
    <section
      data-testid="wedding-overview-countdown"
      className="mb-7 flex flex-wrap items-center gap-8 rounded-lg border px-8 py-6"
      style={{
        background:
          'linear-gradient(135deg, var(--color-primary-fixed) 0%, var(--color-surface-container-lowest) 70%)',
        borderColor: 'var(--color-primary-container)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="flex-1">
        <div
          className="mb-2 text-[12px] font-semibold uppercase tracking-[0.05em]"
          style={{ color: 'var(--color-on-primary-fixed-variant)' }}
        >
          {titleKey}
        </div>
        <div className="flex items-center gap-5">
          <CountdownUnit value={countdown.days} label={daysLabel} />
          <Sep />
          <CountdownUnit value={countdown.hours} label={hoursLabel} />
          <Sep />
          <CountdownUnit value={countdown.minutes} label={minutesLabel} />
        </div>
      </div>
      <div
        className="pl-8"
        style={{ borderLeft: '1px solid var(--color-outline-variant)' }}
      >
        <div
          className="text-[18px] font-semibold"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-on-surface)',
          }}
        >
          {weddingDateLong}
        </div>
        <div className="mt-1 text-[13px] text-[var(--color-secondary)]">
          {ceremonyTimeLabel} · {venueLine}
        </div>
      </div>
    </section>
  );
}

function CountdownUnit({
  value,
  label,
}: {
  value: number;
  label: string;
}): React.ReactElement {
  return (
    <div className="text-center">
      <div
        className="text-[36px] font-bold leading-none"
        style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--color-primary)',
        }}
      >
        {value}
      </div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--color-secondary)]">
        {label}
      </div>
    </div>
  );
}

function Sep(): React.ReactElement {
  return (
    <div
      className="text-[28px] font-light"
      style={{ color: 'var(--color-outline-variant)' }}
    >
      :
    </div>
  );
}

export function WeddingOverviewScreen(): React.ReactElement {
  const { t, i18n } = useTranslation('weddings');
  const params = useParams({ strict: false }) as { weddingId?: string };
  const weddingId = params.weddingId ?? '';

  const { wedding, loadError } = useWeddingForTab(weddingId);

  // Refresh the countdown every minute so the "minutes" digit keeps
  // ticking while the screen is open. Cheap interval — no fetch, just
  // a state bump to re-trigger the useMemo.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <DetailScreenShell
      wedding={wedding}
      loadError={loadError}
      loadingLabel={t('detailPlaceholder.loading')}
    >
      {(w) => {
        const countdown = computeCountdown(w.eventDate, w.startTime);
        const ceremonyTimeLabel = formatStartLabel(w.startTime);
        const weddingDateLong = formatLongDate(w.eventDate, i18n.language);
        const venueLine = `${w.venueName}, ${w.venueCity}`;
        const createdAtLabel = formatShortDate(w.createdAt.slice(0, 10));
        const updatedAtLabel = formatShortDate(w.updatedAt.slice(0, 10));
        const isPublished = w.status === 'published';
        const checklist = useMemo(
          () => buildChecklist({ isPublished, createdAtLabel }),
          [isPublished, createdAtLabel],
        );
        const activity = useMemo(
          () =>
            buildActivity({
              createdAtLabel,
              updatedAtLabel,
              isPublished,
              i18n: {
                created: t('detail.overview.activity.created'),
                updated: t('detail.overview.activity.updated'),
                published: t('detail.overview.activity.published'),
              },
            }),
          [createdAtLabel, updatedAtLabel, isPublished],
        );
        const slug = useMemo(
          () => slugify(`${w.partner1Name}-${w.partner2Name}`) || 'wedding',
          [w.partner1Name, w.partner2Name],
        );
        const publicLinks = useMemo(
          () =>
            [
              {
                id: 'invitation',
                icon: '💌',
                nameKey: 'detail.overview.publicLinks.invitation',
                detailKey: 'detail.overview.publicLinks.invitationDetail',
                url: `wendy.app/wedding/${slug}`,
                showPreview: true,
              },
              {
                id: 'album',
                icon: '📸',
                nameKey: 'detail.overview.publicLinks.album',
                detailKey: 'detail.overview.publicLinks.albumDetail',
                url: `wendy.app/album/${slug}`,
                showPreview: false,
              },
              {
                id: 'upload',
                icon: '💑',
                nameKey: 'detail.overview.publicLinks.upload',
                detailKey: 'detail.overview.publicLinks.uploadDetail',
                url: `wendy.app/upload/${slug}?token=…`,
                showPreview: true,
                private: true,
              },
            ] as const,
          [slug],
        );

        return (
          <WeddingDetailLayout wedding={w} activeTab="overview">
            <div className="space-y-6 px-10 py-8">
              <CountdownBanner
                countdown={countdown}
                weddingDateLong={weddingDateLong}
                ceremonyTimeLabel={ceremonyTimeLabel}
                venueLine={venueLine}
                titleKey={
                  countdown.isToday
                    ? t('detail.overview.countdown.today')
                    : countdown.isPast
                      ? t('detail.overview.countdown.happenedTitle')
                      : t('detail.overview.countdown.title')
                }
                daysLabel={t('detail.overview.countdown.days')}
                hoursLabel={t('detail.overview.countdown.hours')}
                minutesLabel={t('detail.overview.countdown.minutes')}
              />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <OverviewCard
                  testId="wedding-overview-checklist"
                  title={t('detail.overview.checklist.title')}
                >
                  <ul className="list-none">
                    {checklist.map((item) => (
                      <ChecklistRow key={item.id} item={item} t={t} />
                    ))}
                  </ul>
                </OverviewCard>

                <OverviewCard
                  testId="wedding-overview-activity"
                  title={t('detail.overview.activity.title')}
                >
                  {activity.length === 0 ? (
                    <p className="text-[13px] text-[var(--color-secondary)]">
                      {t('detail.overview.activity.empty')}
                    </p>
                  ) : (
                    <ul className="list-none">
                      {activity.map((entry) => (
                        <ActivityRow key={entry.id} entry={entry} />
                      ))}
                    </ul>
                  )}
                  <p className="mt-4 text-[11px] uppercase tracking-[0.05em] text-[var(--color-secondary)]">
                    {t('detail.overview.activity.seeded')}
                  </p>
                </OverviewCard>
              </div>

              <section
                data-testid="wedding-overview-public-links"
                className="overflow-hidden rounded-lg border bg-[var(--color-surface-container-lowest)]"
                style={{
                  borderColor: 'var(--color-outline-variant)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div
                  className="border-b px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.05em]"
                  style={{
                    background: 'var(--color-surface-container-low)',
                    borderColor: 'var(--color-outline-variant)',
                    color: 'var(--color-secondary)',
                  }}
                >
                  {t('detail.overview.publicLinks.title')}
                </div>
                <div
                  className="border-b px-5 py-2 text-[11px]"
                  style={{
                    borderColor: 'var(--color-outline-variant)',
                    color: 'var(--color-secondary)',
                  }}
                >
                  {t('detail.overview.publicLinks.comingIn')}
                </div>
                {publicLinks.map((link) => (
                  <PublicLinkRow key={link.id} link={link} t={t} />
                ))}
              </section>

              <div className="pt-2">
                <Link
                  to="/dashboard/weddings/$weddingId/data"
                  params={{ weddingId }}
                  data-testid="wedding-overview-go-to-data"
                  className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--color-primary)] no-underline hover:underline"
                >
                  {t('detail.overview.goToData')} →
                </Link>
              </div>
            </div>
          </WeddingDetailLayout>
        );
      }}
    </DetailScreenShell>
  );
}

function OverviewCard({
  testId,
  title,
  children,
}: {
  testId: string;
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section
      data-testid={testId}
      className="overflow-hidden rounded-lg border bg-[var(--color-surface-container-lowest)]"
      style={{
        borderColor: 'var(--color-outline-variant)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div
        className="border-b px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.05em]"
        style={{
          background: 'var(--color-surface-container-low)',
          borderColor: 'var(--color-outline-variant)',
          color: 'var(--color-secondary)',
        }}
      >
        {title}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function ChecklistRow({
  item,
  t,
}: {
  item: ChecklistItem;
  t: (key: string) => string;
}): React.ReactElement {
  const iconClass =
    item.state === 'done'
      ? 'bg-[var(--color-status-confirmed-bg)] text-[var(--color-status-confirmed-text)]'
      : item.state === 'warn'
        ? 'bg-[var(--color-status-pending-bg)] text-[var(--color-status-pending-text)]'
        : 'bg-[var(--color-surface-container-high)] text-[var(--color-secondary)]';
  const glyph = item.state === 'done' ? '✓' : item.state === 'warn' ? '!' : '○';
  return (
    <li
      className="flex items-center gap-3 border-b py-2.5 text-[13px] last:border-b-0"
      style={{ borderColor: 'var(--color-outline-variant)' }}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] ${iconClass}`}
      >
        {glyph}
      </span>
      <span className="flex-1 text-[var(--color-on-surface)]">
        {t(item.labelKey)}
      </span>
      {item.progressKey ? (
        <span
          className="whitespace-nowrap text-[11px] font-semibold"
          style={{ color: 'var(--color-status-pending-text)' }}
        >
          {t(item.progressKey)}
        </span>
      ) : item.dateLabel ? (
        <span className="whitespace-nowrap text-[11px] text-[var(--color-secondary)]">
          {item.dateLabel}
        </span>
      ) : null}
    </li>
  );
}

function ActivityRow({ entry }: { entry: ActivityItem }): React.ReactElement {
  const dotColor =
    entry.tone === 'tertiary'
      ? 'var(--color-tertiary-fixed-dim)'
      : entry.tone === 'neutral'
        ? 'var(--color-surface-container-high)'
        : entry.tone === 'confirmed'
          ? 'var(--color-status-confirmed-bg)'
          : 'var(--color-primary-container)';
  return (
    <li
      className="flex gap-2.5 border-b py-2.5 last:border-b-0"
      style={{ borderColor: 'var(--color-outline-variant)' }}
    >
      <span
        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
        style={{ background: dotColor }}
        aria-hidden="true"
      />
      <div>
        <div className="text-[13px] leading-snug text-[var(--color-on-surface)]">
          {entry.text}
        </div>
        <div className="mt-0.5 block text-[11px] text-[var(--color-secondary)]">
          {entry.timeLabel}
        </div>
      </div>
    </li>
  );
}

interface PublicLinkSpec {
  readonly id: string;
  readonly icon: string;
  readonly nameKey: string;
  readonly detailKey: string;
  readonly url: string;
  readonly showPreview: boolean;
  readonly private?: boolean;
}

function PublicLinkRow({
  link,
  t,
}: {
  link: PublicLinkSpec;
  t: (key: string) => string;
}): React.ReactElement {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(link.url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      // Clipboard may be unavailable (insecure context, denied
      // permission). Swallow — the row still renders the URL.
    }
  };
  return (
    <div
      className="flex items-center gap-3 border-b px-5 py-3.5 last:border-b-0"
      style={{ borderColor: 'var(--color-outline-variant)' }}
    >
      <span className="w-7 shrink-0 text-center text-base">{link.icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--color-on-surface)]">
          <span>{t(link.nameKey)}</span>
          {link.private ? (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em]"
              style={{
                background: 'var(--color-tertiary-fixed)',
                color: 'var(--color-on-tertiary-fixed-variant)',
              }}
            >
              {t('detail.overview.publicLinks.private')}
            </span>
          ) : null}
        </div>
        <div
          className="truncate font-mono text-[12px]"
          style={{ color: 'var(--color-primary)' }}
        >
          {link.url}
        </div>
        <div className="mt-0.5 text-[11px] text-[var(--color-secondary)]">
          {t(link.detailKey)}
        </div>
      </div>
      {link.showPreview ? (
        <span
          className="rounded px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em]"
          style={{
            background: 'var(--color-primary-fixed)',
            color: 'var(--color-primary)',
          }}
        >
          {t('detail.overview.publicLinks.preview')} ↗
        </span>
      ) : null}
      <button
        type="button"
        onClick={onCopy}
        className="rounded px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] transition-colors"
        style={{
          background: 'var(--color-primary-fixed)',
          color: 'var(--color-primary)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            'var(--color-primary-fixed-dim)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            'var(--color-primary-fixed)';
        }}
      >
        {copied
          ? t('detail.overview.publicLinks.copied')
          : t('detail.overview.publicLinks.copy')}
      </button>
    </div>
  );
}
