import * as React from 'react';

import { cn } from '@/shared/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

/**
 * Form input field. Follows the design system: parchment-white surface,
 * parchment-amber border, gold focus ring.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', invalid, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'flex h-10 w-full rounded border bg-[var(--color-surface-container-lowest)] px-3 py-2 text-sm text-[var(--color-on-surface)]',
        'placeholder:text-[var(--color-secondary)]',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgb(115_92_0_/_12%)] focus-visible:border-[var(--color-primary)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        invalid &&
          'border-[var(--color-destructive)] focus-visible:ring-[rgb(186_26_26_/_12%)] focus-visible:border-[var(--color-destructive)]',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, rows = 3, ...props }, ref) => (
    <textarea
      rows={rows}
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'flex w-full rounded border bg-[var(--color-surface-container-lowest)] px-3 py-2 text-sm text-[var(--color-on-surface)]',
        'placeholder:text-[var(--color-secondary)] resize-y',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgb(115_92_0_/_12%)] focus-visible:border-[var(--color-primary)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        invalid &&
          'border-[var(--color-destructive)] focus-visible:ring-[rgb(186_26_26_/_12%)] focus-visible:border-[var(--color-destructive)]',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';
