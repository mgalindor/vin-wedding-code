import { Link, useParams } from '@tanstack/react-router';
import type { WeddingDto } from '@wendy/contracts';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Shared chrome for every wedding-detail tab (Overview, Wedding Data,
 * Guests, Photos, Invitation). Renders the breadcrumb + couple title
 * + wedding metadata + tab bar; the active tab content is rendered
 * as `children` (so the layout stays a thin shared concern and each
 * tab screen owns its own data fetch + read/edit posture).
 *
 * US-010 scope: the header mirrors the mockup
 * (`05-wedding-detail.html`) visually but only carries data the
 * Wedding bounded context already has (the status badges for RSVP %
 * and "Public Link Active" need US-018/021 and US-022 — out of
 * scope here). Archive (US-013) is the only header action in the
 * mockup and is intentionally omitted (no implementation behind it).
 */

export type WeddingTabKey =
  | 'overview'
  | 'data'
  | 'guests'
  | 'photos'
  | 'invitation';

interface WeddingDetailLayoutProps {
  wedding: WeddingDto;
  activeTab: WeddingTabKey;
  children: ReactNode;
}

function formatDateLong(iso: string): string {
  // DTO carries YYYY-MM-DD; parse as local-midnight to avoid TZ drift.
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return iso;
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface TabSpec {
  readonly key: WeddingTabKey;
  readonly labelKey: string;
  readonly path: string;
  readonly disabled?: boolean;
  readonly badge?: string;
}

export function WeddingDetailLayout({
  wedding,
  activeTab,
  children,
}: WeddingDetailLayoutProps): React.ReactElement {
  const { t } = useTranslation('weddings');
  const params = useParams({ strict: false }) as { weddingId?: string };
  const weddingId = params.weddingId ?? wedding.id;

  const tabs: ReadonlyArray<TabSpec> = [
    { key: 'overview', labelKey: 'detail.tabs.overview', path: `/dashboard/weddings/${weddingId}` },
    { key: 'data', labelKey: 'detail.tabs.data', path: `/dashboard/weddings/${weddingId}/data` },
    {
      key: 'guests',
      labelKey: 'detail.tabs.guests',
      path: `/dashboard/weddings/${weddingId}/guests`,
      disabled: true,
    },
    {
      key: 'photos',
      labelKey: 'detail.tabs.photos',
      path: `/dashboard/weddings/${weddingId}/photos`,
      disabled: true,
    },
    {
      key: 'invitation',
      labelKey: 'detail.tabs.invitation',
      path: `/dashboard/weddings/${weddingId}/invitation`,
      disabled: true,
    },
  ];

  return (
    <div className="flex w-full flex-col">
      <header className="border-b bg-[var(--color-surface-container-lowest)] px-10 py-5">
        <nav
          aria-label={t('detail.breadcrumb.dashboard')}
          className="mb-3 flex items-center gap-2 text-sm text-[var(--color-secondary)]"
        >
          <Link
            to="/dashboard"
            className="text-[var(--color-secondary)] no-underline hover:text-[var(--color-primary)]"
          >
            {t('detail.breadcrumb.dashboard')}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-[var(--color-on-surface)]">
            {wedding.partner1Name} &amp; {wedding.partner2Name}
          </span>
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1
              className="text-[28px] font-bold leading-tight text-[var(--color-on-surface)]"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              {wedding.partner1Name} &amp; {wedding.partner2Name}
            </h1>
            <p className="text-sm text-[var(--color-secondary)]">
              {formatDateLong(wedding.eventDate)} · {wedding.venueName},{' '}
              {wedding.venueCity}
            </p>
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone={wedding.status}>{wedding.status}</StatusBadge>
            </div>
          </div>
        </div>
      </header>

      <WeddingStatsBar />

      <nav
        role="tablist"
        aria-label={t('detail.tabs.label')}
        className="flex gap-0 border-b bg-[var(--color-surface-container-lowest)] px-10"
      >
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          const baseClasses =
            'border-b-2 px-5 py-3.5 text-[13px] font-semibold uppercase tracking-[0.03em] transition-colors';
          if (tab.disabled) {
            return (
              <span
                key={tab.key}
                role="tab"
                aria-disabled="true"
                className={`${baseClasses} cursor-not-allowed border-b-2 border-transparent text-[var(--color-secondary)] opacity-50`}
                title={t('detail.tabs.comingSoon')}
              >
                {t(tab.labelKey)}
                {tab.badge ? (
                  <span
                    aria-hidden="true"
                    className="ml-2 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--color-secondary-container)] px-1.5 text-[10px] font-bold text-[var(--color-secondary)]"
                  >
                    {tab.badge}
                  </span>
                ) : null}
              </span>
            );
          }
          return (
            <Link
              key={tab.key}
              to={tab.path}
              role="tab"
              aria-selected={isActive}
              aria-current={isActive ? 'page' : undefined}
              className={`${baseClasses} no-underline ${
                isActive
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-secondary)] hover:text-[var(--color-on-surface)]'
              }`}
            >
              {t(tab.labelKey)}
            </Link>
          );
        })}
      </nav>

      <main className="flex-1">{children}</main>
    </div>
  );
}

/**
 * Stats bar — sits between the wedding header and the tab bar so it
 * is visible on every detail tab (Overview / Wedding Data / Guests /
 * Photos / Invitation), matching the mockup surface.
 *
 * Data sourcing — the four cards need metrics owned by future
 * stories (US-021 guest metrics, US-022 invitation progress,
 * US-030 official photos, US-031 guest albums). Today the values
 * are seeded with the mockup's reference numbers so the layout
 * matches pixel-for-pixel; once the metrics APIs ship, replace the
 * seed values with the live counters (and remove the `seeded` note
 * per card).
 */
function WeddingStatsBar(): React.ReactElement {
  const { t } = useTranslation('weddings');

  return (
    <section
      data-testid="wedding-stats-bar"
      aria-label={t('detail.tabs.label')}
      className="grid grid-cols-2 border-b bg-[var(--color-surface-container-lowest)] lg:grid-cols-4"
      style={{ borderColor: 'var(--color-outline-variant)' }}
    >
      <StatsCard
        label={t('detail.stats.guests.label')}
        value="112"
        sub={t('detail.stats.guests.sub', {
          confirmed: 93,
          declined: 12,
          pending: 7,
        })}
        footnote={t('detail.stats.guests.seeded')}
      />
      <StatsCard
        label={t('detail.stats.invitation.label')}
        value={t('detail.stats.invitation.value', { filled: 14, total: 14 })}
        valueStyle="compact"
        sub={t('detail.stats.invitation.sub')}
        footnote={t('detail.stats.invitation.seeded')}
      />
      <StatsCard
        label={t('detail.stats.officialPhotos.label')}
        value={t('detail.stats.officialPhotos.value', { count: 47, quota: 200 })}
        sub={t('detail.stats.officialPhotos.sub')}
        footnote={t('detail.stats.officialPhotos.seeded')}
      />
      <StatsCard
        label={t('detail.stats.guestPhotos.label')}
        value={t('detail.stats.guestPhotos.value', { count: 12 })}
        sub={t('detail.stats.guestPhotos.sub', { pending: 8 })}
        footnote={t('detail.stats.guestPhotos.seeded')}
      />
    </section>
  );
}

function StatsCard({
  label,
  value,
  valueStyle,
  sub,
  footnote,
}: {
  label: string;
  value: string;
  valueStyle?: 'compact';
  sub: string;
  footnote: string;
}): React.ReactElement {
  return (
    <div
      data-testid={`wedding-stats-card-${label.toLowerCase().replace(/\s+/g, '-')}`}
      className="border-b px-6 py-5 last:border-b-0 lg:border-b-0 lg:border-r"
      style={{ borderColor: 'var(--color-outline-variant)' }}
    >
      <span
        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.05em]"
        style={{ color: 'var(--color-secondary)' }}
      >
        {label}
      </span>
      <div
        className="font-bold leading-none"
        style={{
          fontFamily: 'Playfair Display, serif',
          color: 'var(--color-primary)',
          fontSize: valueStyle === 'compact' ? '26px' : '32px',
        }}
      >
        {value}
      </div>
      <div
        className="mt-1.5 text-[12px] leading-snug"
        style={{ color: 'var(--color-secondary)' }}
      >
        {sub}
      </div>
      <div
        className="mt-2 text-[10px] uppercase tracking-[0.05em]"
        style={{ color: 'var(--color-secondary)', opacity: 0.7 }}
      >
        {footnote}
      </div>
    </div>
  );
}

function StatusBadge({
  tone,
  children,
}: {
  tone: WeddingDto['status'];
  children: ReactNode;
}): React.ReactElement {
  // The mockup ships three pills (Published / RSVP % / Public Link
  // Active). Only the status pill is supported in US-010 — the other
  // two land with US-022 (publish) and US-018/021 (RSVP metrics).
  // Tone maps the WeddingStatus enum to the design-system tokens.
  const className =
    tone === 'published'
      ? 'border-transparent bg-[var(--status-confirmed-bg)] text-[var(--status-confirmed-text)]'
      : tone === 'archived'
        ? 'border-transparent bg-[var(--color-surface-container-high)] text-[var(--color-secondary)]'
        : 'border-transparent bg-[var(--status-pending-bg)] text-[var(--status-pending-text)]';
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] ${className}`}
    >
      {children}
    </span>
  );
}
