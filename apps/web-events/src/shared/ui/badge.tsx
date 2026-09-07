import * as React from 'react';

import { cn } from '@/shared/lib/utils';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'gold';

const toneStyles: Record<Tone, string> = {
  neutral: 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]',
  success: 'bg-[var(--color-status-confirmed-bg)] text-[var(--color-status-confirmed-text)]',
  warning: 'bg-[var(--color-status-pending-bg)] text-[var(--color-status-pending-text)]',
  danger: 'bg-[var(--color-status-declined-bg)] text-[var(--color-status-declined-text)]',
  gold: 'bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed-variant)]',
};

/**
 * Pill-shaped status / label badge. Used for RSVP status, event
 * status chips, role badges, etc.
 */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({
  className,
  tone = 'neutral',
  ...props
}: BadgeProps): React.ReactElement {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.05em]',
        toneStyles[tone],
        className,
      )}
      {...props}
    />
  );
}
