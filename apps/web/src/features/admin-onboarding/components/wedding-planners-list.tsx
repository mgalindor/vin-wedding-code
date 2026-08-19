import type { WeddingPlannerSummaryDto } from '@wendy/contracts';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/ui/button';

interface WeddingPlannersListProps {
  rows: WeddingPlannerSummaryDto[];
  onOnboardClick: () => void;
}

/**
 * The Wedding Planners directory list view (US-008).
 *
 * Renders one row per WP, newest-first (Rule 10), in a proper HTML
 * table (the structure the mockup shows in 16-admin-wp-list.html).
 *
 * Includes:
 *   - Page header with title + subtitle (mockup layout).
 *   - Secondary "+ Onboard Wedding Planner" action at the top right.
 *   - Real <table> with thead + tbody; row data matches the
 *     functional spec (full name, email, status, onboarding date).
 *
 * Out of scope for this story (US-003, US-004+005, future metrics):
 *   - Stats cards above the table (requires aggregate data).
 *   - Search input + status filter (US-003).
 *   - Disable / Restore action buttons per row (US-004 + US-005).
 *
 * This component is purely presentational. The fetch lifecycle
 * lives in `WeddingPlannersLandingCard` (the smart wrapper) so
 * loading / success / error / empty branches are decided in one
 * place.
 */
export function WeddingPlannersList({
  rows,
  onOnboardClick,
}: WeddingPlannersListProps): React.ReactElement {
  const { t } = useTranslation('admin-onboarding');

  return (
    <div data-testid="wedding-planners-list" className="w-full">
      {/* Page header — matches the mockup layout (page-title + page-subtitle). */}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-[28px] font-bold text-[#1c1b1a]"
            style={{
              fontFamily: 'Playfair Display, serif',
              letterSpacing: '-0.02em',
            }}
          >
            {t('directory.sectionTitle')}
          </h1>
          <p className="mt-1 text-sm text-[#605e5c]">
            {t('directory.subtitle')}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onOnboardClick}
          data-testid="wedding-planners-list-onboard-cta"
          className="text-xs"
        >
          + {t('directory.onboardCta')}
        </Button>
      </header>

      {/* Table wrapper — full width of the dashboard content area. */}
      <div
        className="overflow-x-auto rounded-lg border bg-white shadow-sm"
        style={{ borderColor: '#e3e1e0' }}
      >
        <table
          className="w-full border-collapse"
          style={{ minWidth: '640px' }}
          data-testid="wedding-planners-list-items"
        >
          <thead>
            <tr
              style={{
                background: 'var(--color-surface-container-low, #f9f8f7)',
              }}
            >
              <th
                scope="col"
                className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#605e5c]"
                style={{ borderBottom: '1px solid #e3e1e0' }}
              >
                {t('directory.columns.planner')}
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#605e5c]"
                style={{ borderBottom: '1px solid #e3e1e0' }}
              >
                {t('directory.columns.onboardedAt')}
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#605e5c]"
                style={{ borderBottom: '1px solid #e3e1e0' }}
              >
                {t('directory.columns.status')}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <WeddingPlannersTableRow key={row.id} row={row} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WeddingPlannersTableRow({
  row,
}: {
  row: WeddingPlannerSummaryDto;
}): React.ReactElement {
  const { t, i18n } = useTranslation('admin-onboarding');

  const onboardedAt = new Intl.DateTimeFormat(
    i18n.language.startsWith('es') ? 'es' : 'en-US',
    { day: 'numeric', month: 'short', year: 'numeric' },
  ).format(new Date(row.createdAt));

  return (
    <tr
      data-testid="wedding-planner-row"
      data-wp-id={row.id}
      data-wp-disabled={row.isDisabled ? 'true' : 'false'}
      className={
        row.isDisabled
          ? 'h-[60px] opacity-55 hover:bg-[#f9f8f7]'
          : 'h-[60px] hover:bg-[#f9f8f7]'
      }
      style={{ borderBottom: '1px solid #e3e1e0' }}
    >
      {/* Planner (full name + email, per Rules 5 + 6) */}
      <td className="whitespace-nowrap px-4 align-middle">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
            style={{
              background: 'var(--color-primary-fixed, #cdb486)',
              color: 'var(--color-on-primary-fixed-variant, #735c00)',
            }}
          >
            {getInitials(row.fullName)}
          </div>
          <div className="min-w-0">
            <div
              className="truncate text-sm font-semibold text-[#1c1b1a]"
              data-testid="wedding-planner-row-name"
            >
              {row.fullName}
            </div>
            <div
              className="truncate font-mono text-[11px] text-[#605e5c]"
              data-testid="wedding-planner-row-email"
            >
              {row.email}
            </div>
          </div>
        </div>
      </td>

      {/* Onboarded date (Rule 8) */}
      <td className="whitespace-nowrap px-4 align-middle text-sm text-[#605e5c]">
        <span data-testid="wedding-planner-row-onboarded-at">
          {t('directory.onboardedAtLabel', { date: onboardedAt })}
        </span>
      </td>

      {/* Status (Rule 7) */}
      <td className="whitespace-nowrap px-4 align-middle">
        <span
          data-testid="wedding-planner-row-status"
          className={
            row.isDisabled
              ? 'inline-flex items-center rounded-full border border-[#b4aca4] bg-[#f9f8f7] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#605e5c]'
              : 'inline-flex items-center rounded-full border border-[#cdb486] bg-[#fff5d6] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#735c00]'
          }
        >
          {row.isDisabled
            ? t('directory.status.disabled')
            : t('directory.status.active')}
        </span>
      </td>
    </tr>
  );
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    const first = parts[0] ?? '';
    return first.slice(0, 2).toUpperCase();
  }
  const first = parts[0]?.[0] ?? '';
  const last = parts[parts.length - 1]?.[0] ?? '';
  return `${first}${last}`.toUpperCase();
}