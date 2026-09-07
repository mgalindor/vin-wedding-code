import * as React from 'react';

import { cn } from '@/shared/lib/utils';

/**
 * Simple inline loader (three shrinking rectangles). Replace any
 * animated spinner with this so the dashboard keeps its calm,
 * parchment palette. Auto-centered in its container.
 */
export function Spinner({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex items-center justify-center gap-1', className)}
      {...props}
    >
      <span className="sr-only">Loading…</span>
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-primary)] [animation-delay:-200ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-primary)] [animation-delay:-100ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-primary)]" />
    </div>
  );
}

/**
 * Page-level "empty card" — used by every list screen for the
 * empty/zero-rows state. Keeps the empty surface feeling on-brand.
 */
export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: React.ReactNode;
  body?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}): React.ReactElement {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] px-6 py-12 text-center"
    >
      {icon && (
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-container-low)] text-[var(--color-secondary)]">
          {icon}
        </div>
      )}
      <h3
        className="text-lg font-semibold text-[var(--color-on-surface)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h3>
      {body && (
        <p className="mt-1.5 max-w-sm text-sm text-[var(--color-secondary)]">
          {body}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Inline error display, used at the top of forms. */
export function ErrorBanner({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div
      role="alert"
      className="rounded border-l-4 border-[var(--color-destructive)] bg-[var(--color-error-container)] px-4 py-3 text-sm text-[var(--color-on-error-container)]"
    >
      {children}
    </div>
  );
}
