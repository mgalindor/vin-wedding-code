import * as React from 'react';

import { cn } from '@/shared/lib/utils';

/**
 * Form field label (label-caps style — Inter, 12px, 600, tracked).
 * Pair with an Input or Textarea via the `htmlFor` prop or wrap
 * them in `<FieldShell>` to handle the label + hint + error trio.
 */
export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      'mb-1 block text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-on-surface)]',
      className,
    )}
    {...props}
  />
));
Label.displayName = 'Label';

interface FieldShellProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Three-piece form field: label (top), control (middle), hint or error (bottom).
 * Keeps spacing/markup consistent and makes rendering forms by hand painless.
 */
export function FieldShell({
  label,
  hint,
  error,
  required,
  htmlFor,
  className,
  children,
}: FieldShellProps): React.ReactElement {
  return (
    <div className={cn('mb-5', className)}>
      {label && (
        <Label htmlFor={htmlFor}>
          {label}
          {required && (
            <span className="ml-1 text-[var(--color-destructive)]" aria-hidden>
              *
            </span>
          )}
        </Label>
      )}
      {children}
      {error ? (
        <p className="mt-1 text-xs text-[var(--color-destructive)]">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-[var(--color-secondary)]">{hint}</p>
      ) : null}
    </div>
  );
}
