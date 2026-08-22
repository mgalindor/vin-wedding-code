/**
 * WeddingCard — one row in the dashboard's "My Weddings" grid (US-011).
 *
 * The whole card is clickable (open the wedding detail), with a
 * footer of action buttons that target specific sub-pages or
 * resources. Per the mockup (`02-dashboard.html`), the footer carries:
 *   - "Open Wedding" (primary action → wedding detail)
 *   - "Guests (N)" — placeholder link to the disabled Guests tab
 *   - "Invitation ↗" — placeholder link to the disabled Invitation tab
 *
 * The Guests / Invitation buttons stay in the card because the
 * mockup's `Guests (142)` callout surfaces the count as a card-level
 * affordance. They navigate to the (disabled) tabs so the WP gets
 * the "coming soon" message when the underlying stories land.
 */
import { useNavigate } from '@tanstack/react-router';
import { type WeddingDto } from '@wendy/contracts';
import { useTranslation } from 'react-i18next';

type DerivedStatus = 'active' | 'draft' | 'archived';

export interface WeddingCardProps {
  readonly wedding: WeddingDto;
}

export function WeddingCard({ wedding }: WeddingCardProps): React.ReactElement {
  const { t, i18n } = useTranslation('dashboard');
  const navigate = useNavigate();

  const derived = deriveStatus(wedding.status, wedding.eventDate);
  const statusLabel = t(
    derived === 'active'
      ? 'list.card.statusActive'
      : derived === 'draft'
        ? 'list.card.statusDraft'
        : 'list.card.statusArchived',
  );
  const statusStyle =
    derived === 'active'
      ? badgeColors('status-confirmed')
      : derived === 'draft'
        ? badgeColors('status-pending')
        : badgeColors('secondary');

  const dateLabel = formatDate(wedding.eventDate, i18n.language);
  const coupleLabel = `${wedding.partner1Name}${t('list.card.coupleSeparator')}${wedding.partner2Name}`;

  const open = () => {
    void navigate({
      to: '/dashboard/weddings/$weddingId',
      params: { weddingId: wedding.id },
      state: { wedding } as never,
    });
  };

  // Action buttons stop propagation so they don't trigger the card's
  // own onClick (which navigates to the wedding detail).
  const stop = (e: React.MouseEvent | React.KeyboardEvent) => e.stopPropagation();

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={coupleLabel}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
      className="flex flex-col overflow-hidden rounded-xl border bg-[var(--color-surface-container-lowest)] transition-shadow hover:shadow-md"
      style={{ borderColor: 'var(--color-outline-variant)' }}
    >
      <div
        className="flex items-center justify-between border-b px-5 py-3"
        style={{ borderColor: 'var(--color-outline-variant)' }}
      >
        <span
          className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.05em]"
          style={statusStyle}
        >
          {statusLabel}
        </span>
        <span
          aria-hidden="true"
          className="text-[18px]"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-primary)',
          }}
        >
          ♡
        </span>
      </div>
      <div className="flex-1 space-y-2 px-5 py-4">
        <h3
          className="text-[18px] font-semibold leading-tight"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-on-surface)',
          }}
        >
          {coupleLabel}
        </h3>
        <p className="text-[13px]" style={{ color: 'var(--color-secondary)' }}>
          {dateLabel}
        </p>
        <p
          className="text-[13px]"
          style={{ color: 'var(--color-on-surface-variant)' }}
        >
          {wedding.venueName}, {wedding.venueCity}
        </p>
      </div>
      <div
        className="flex flex-wrap items-center gap-2 border-t px-5 py-3"
        style={{
          borderColor: 'var(--color-outline-variant)',
          background: 'var(--color-surface-container-low)',
        }}
        data-testid="wedding-card-footer"
      >
        <button
          type="button"
          data-testid="wedding-card-open-wedding"
          onClick={(e) => {
            stop(e);
            open();
          }}
          className="rounded border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] transition-colors hover:bg-[#c89500] hover:border-[#c89500] hover:text-white"
          style={{
            background: 'var(--color-primary)',
            color: 'var(--color-primary-foreground)',
            borderColor: 'var(--color-primary)',
          }}
        >
          {t('list.card.openWedding')}
        </button>
        <button
          type="button"
          disabled
          aria-disabled="true"
          title={t('list.card.actionComingSoon')}
          data-testid="wedding-card-guests"
          onClick={stop}
          className="rounded border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] opacity-50"
          style={{
            color: 'var(--color-primary)',
            background: 'none',
            borderColor: 'var(--color-outline-variant)',
            cursor: 'not-allowed',
          }}
        >
          {t('list.card.guests')}
        </button>
        <button
          type="button"
          disabled
          aria-disabled="true"
          title={t('list.card.actionComingSoon')}
          data-testid="wedding-card-invitation"
          onClick={stop}
          className="rounded border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] opacity-50"
          style={{
            color: 'var(--color-primary)',
            background: 'none',
            borderColor: 'var(--color-outline-variant)',
            cursor: 'not-allowed',
          }}
        >
          {t('list.card.invitation')}
        </button>
      </div>
    </div>
  );
}

// `active` is the derived state — published AND the date hasn't passed.
function deriveStatus(status: WeddingDto['status'], eventDate: string): DerivedStatus {
  if (status === 'published') {
    const eventTime = Date.parse(`${eventDate}T00:00:00.000Z`);
    const todayUtc = Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate(),
    );
    return eventTime >= todayUtc ? 'active' : 'archived';
  }
  return status === 'archived' ? 'archived' : 'draft';
}

function formatDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale === 'es' ? 'es' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${iso}T00:00:00.000Z`));
  } catch {
    return iso;
  }
}

function badgeColors(
  palette: 'status-confirmed' | 'status-pending' | 'secondary',
): { background: string; color: string } {
  if (palette === 'status-confirmed') {
    return {
      background: 'var(--color-status-confirmed-bg)',
      color: 'var(--color-status-confirmed-text)',
    };
  }
  if (palette === 'status-pending') {
    return {
      background: 'var(--color-status-pending-bg)',
      color: 'var(--color-status-pending-text)',
    };
  }
  return {
    background: 'var(--color-surface-container-high)',
    color: 'var(--color-secondary)',
  };
}
