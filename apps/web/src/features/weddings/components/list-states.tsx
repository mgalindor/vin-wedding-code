/**
 * Skeleton / error / show-more states (US-011).
 *
 * Empty and no-matches states were moved to `list-state-card.tsx`
 * so they render INSIDE the wedding-card grid (a single placeholder
 * card) instead of replacing the grid with a full-width panel.
 */
import { useTranslation } from 'react-i18next';

export function WeddingCardSkeleton(): React.ReactElement {
  return (
    <div
      className="flex flex-col rounded-lg border bg-[var(--color-surface-container-lowest)]"
      style={{ borderColor: 'var(--color-outline-variant)' }}
      aria-hidden="true"
    >
      <div
        className="h-9 rounded-t-lg border-b"
        style={{
          borderColor: 'var(--color-outline-variant)',
          background: 'var(--color-surface-container-low)',
        }}
      />
      <div className="space-y-2 px-5 py-4">
        <div
          className="h-5 w-3/4 rounded"
          style={{ background: 'var(--color-surface-container)' }}
        />
        <div
          className="h-3 w-1/2 rounded"
          style={{ background: 'var(--color-surface-container)' }}
        />
        <div
          className="h-3 w-2/3 rounded"
          style={{ background: 'var(--color-surface-container)' }}
        />
      </div>
    </div>
  );
}

export function WeddingCardSkeletonGrid(): React.ReactElement {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <WeddingCardSkeleton />
      <WeddingCardSkeleton />
      <WeddingCardSkeleton />
    </div>
  );
}

export interface ListErrorStateProps {
  readonly onRetry: () => void;
}

export function ListErrorState({
  onRetry,
}: ListErrorStateProps): React.ReactElement {
  const { t } = useTranslation('dashboard');
  return (
    <div
      className="rounded-lg border px-6 py-12 text-center"
      style={{
        borderColor: 'var(--color-outline-variant)',
        background: 'var(--color-surface-container-lowest)',
      }}
      data-testid="list-error-state"
      role="alert"
    >
      <p
        className="mb-1.5 text-lg font-semibold"
        style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--color-on-surface)',
        }}
      >
        {t('list.error.title')}
      </p>
      <p
        className="mb-6 text-[13px]"
        style={{ color: 'var(--color-secondary)' }}
      >
        {t('list.error.body')}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded border px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.04em] transition-colors hover:bg-[var(--color-secondary-container)]"
        style={{
          borderColor: 'var(--color-outline-variant)',
          color: 'var(--color-on-surface)',
        }}
        data-testid="list-error-retry"
      >
        {t('list.error.action')}
      </button>
    </div>
  );
}

export interface ShowMoreButtonProps {
  readonly onClick: () => void;
  readonly isFetching?: boolean;
  readonly disabled?: boolean;
}

export function ShowMoreButton({
  onClick,
  isFetching,
  disabled,
}: ShowMoreButtonProps): React.ReactElement {
  const { t } = useTranslation('dashboard');
  return (
    <div className="mt-6 flex justify-center">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || isFetching}
        className="rounded-full border px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.04em] transition-colors hover:bg-[var(--color-secondary-container)] disabled:opacity-50"
        style={{
          borderColor: 'var(--color-outline-variant)',
          color: 'var(--color-on-surface)',
        }}
        data-testid="list-show-more"
      >
        {isFetching ? '…' : t('list.showMore')}
      </button>
    </div>
  );
}
