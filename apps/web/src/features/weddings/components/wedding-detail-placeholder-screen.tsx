import { useLocation, useParams } from '@tanstack/react-router';
import type { WeddingDto } from '@wendy/contracts';
import { useTranslation } from 'react-i18next';

/**
 * Wedding Detail Placeholder (US-009).
 *
 * Minimal read-only landing rendered after a successful create. Shows
 * the five captured fields and two disabled placeholder entry points
 * ("Configure invitation" — US-022, "Add guests" — US-015) so the WP
 * sees the next-step direction. No edit affordance, no archive
 * affordance, no invitation configuration surface — those land in
 * later stories.
 *
 * The placeholder consumes the create response via navigation state
 * (passed by `NewWeddingScreen`) — no re-fetch on mount. US-010 ships
 * the dedicated `GET /api/v1/weddings/{id}` and this surface evolves
 * into the full detail screen.
 */

interface DetailState {
  wedding?: WeddingDto;
}

function formatDate(iso: string): string {
  // Render as the active locale's short date format. The DTO carries
  // YYYY-MM-DD so a Date parse is timezone-safe.
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return iso;
  return new Date(year, month - 1, day).toLocaleDateString();
}

export function WeddingDetailPlaceholderScreen(): React.ReactElement {
  const { t } = useTranslation('weddings');
  const params = useParams({ strict: false }) as { weddingId?: string };
  const location = useLocation();
  const state = (location.state as DetailState | undefined) ?? {};
  const wedding = state.wedding;

  return (
    <main className="mx-auto w-full max-w-3xl px-10 py-12">
      <header className="mb-8 space-y-2">
        <h1
          className="text-3xl font-semibold leading-tight text-[var(--color-foreground)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('detailPlaceholder.pageTitle')}
        </h1>
        <p className="text-sm leading-relaxed text-[var(--color-secondary)]">
          {params.weddingId ?? ''}
        </p>
      </header>

      {wedding ? (
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] p-8">
          <h2 className="mb-6 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-secondary)]">
            {t('detailPlaceholder.summary')}
          </h2>
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field
              label={t('detailPlaceholder.fields.partner1Name')}
              value={wedding.partner1Name}
            />
            <Field
              label={t('detailPlaceholder.fields.partner2Name')}
              value={wedding.partner2Name}
            />
            <Field
              label={t('detailPlaceholder.fields.eventDate')}
              value={formatDate(wedding.eventDate)}
            />
            <Field
              label={t('detailPlaceholder.fields.venueName')}
              value={wedding.venueName}
            />
            <Field
              label={t('detailPlaceholder.fields.venueCity')}
              value={wedding.venueCity}
            />
          </dl>
        </section>
      ) : (
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] p-8 text-sm text-[var(--color-secondary)]">
          {t('detailPlaceholder.comingSoon')}
        </section>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PlaceholderAction
          label={t('detailPlaceholder.actions.configureInvitation')}
          hint={t('detailPlaceholder.comingSoon')}
        />
        <PlaceholderAction
          label={t('detailPlaceholder.actions.addGuests')}
          hint={t('detailPlaceholder.comingSoon')}
        />
      </div>
    </main>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-secondary)]">
        {label}
      </dt>
      <dd className="mt-1 text-base text-[var(--color-foreground)]">
        {value}
      </dd>
    </div>
  );
}

function PlaceholderAction({
  label,
  hint,
}: {
  label: string;
  hint: string;
}): React.ReactElement {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      className="cursor-not-allowed rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-muted)] p-6 text-left transition-colors"
    >
      <span className="block text-sm font-semibold uppercase tracking-[0.05em] text-[var(--color-secondary)]">
        {label}
      </span>
      <span className="mt-1 block text-xs text-[var(--color-secondary)]">
        {hint}
      </span>
    </button>
  );
}