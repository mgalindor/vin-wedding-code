import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';

import type { GuestViewMode } from '../hooks/use-guest-view-mode';

interface SegmentedViewProps {
  value: GuestViewMode;
  onChange: (mode: GuestViewMode) => void;
  className?: string;
}

/**
 * Two-option toggle for the guest management view (`simple` / `groups`).
 * Pure presentational — the parent owns the state and persists it
 * (see `useGuestViewPersistence`). Keyboard accessible via standard
 * radio-group semantics.
 */
export function SegmentedView({ value, onChange, className }: SegmentedViewProps): React.ReactElement {
  const { t } = useTranslation('guests');
  const options: Array<{ id: GuestViewMode; label: string; helpKey: string }> = [
    { id: 'simple', label: t('views.simple'), helpKey: 'views.simpleHelp' },
    { id: 'groups', label: t('views.groups'), helpKey: 'views.groupsHelp' },
  ];

  return (
    <div
      role="radiogroup"
      aria-label={t('views.switchLabel')}
      className={cn(
        'inline-flex items-center rounded-md border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] p-1 text-xs font-semibold uppercase tracking-[0.05em]',
        className,
      )}
      data-testid="guest-view-toggle"
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            title={t(opt.helpKey)}
            onClick={() => onChange(opt.id)}
            data-testid={`guest-view-${opt.id}`}
            className={cn(
              'rounded px-3 py-1.5 transition-colors',
              active
                ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                : 'text-[var(--color-secondary)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-on-surface)]',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
