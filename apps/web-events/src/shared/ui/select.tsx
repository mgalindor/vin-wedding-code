import * as React from 'react';
import { cn } from '@/shared/lib/utils';

/**
 * Native `select` wrapper themed against the design system. Pairs with
 * `FieldShell` for consistent spacing and error display.
 */
export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, children, ...props }, ref) => (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'flex h-10 w-full appearance-none rounded border bg-[var(--color-surface-container-lowest)] px-3 py-2 pr-9 text-sm text-[var(--color-on-surface)]',
        'bg-[length:1rem] bg-[right_0.65rem_center] bg-no-repeat',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgb(115_92_0_/_12%)] focus-visible:border-[var(--color-primary)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        invalid &&
          'border-[var(--color-destructive)] focus-visible:ring-[rgb(186_26_26_/_12%)] focus-visible:border-[var(--color-destructive)]',
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none' stroke='%234d4635' stroke-width='1.5'><path d='M4 6l4 4 4-4'/></svg>\")",
      }}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = 'Select';

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => (
    <label
      htmlFor={id}
      className="inline-flex items-center gap-2 text-sm text-[var(--color-on-surface)] cursor-pointer select-none"
    >
      <input
        ref={ref}
        type="checkbox"
        id={id}
        className={cn(
          'h-4 w-4 rounded-sm border border-[var(--color-outline-variant)] accent-[var(--color-primary)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-1',
          className,
        )}
        {...props}
      />
      {label}
    </label>
  ),
);
Checkbox.displayName = 'Checkbox';
