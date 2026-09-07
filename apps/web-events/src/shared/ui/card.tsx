import * as React from 'react';

import { cn } from '@/shared/lib/utils';

/**
 * Surface-level wrapper that consumes the dashboard card recipe from
 * DESIGN.md: surface-container-lowest background, rounded.lg,
 * 24px padding, ambient shadow. Used by every dashboard card.
 */
export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] p-6 shadow-[var(--shadow-card)]',
      className,
    )}
    {...props}
  />
));
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('mb-4 flex items-start justify-between gap-2', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-base font-semibold leading-tight text-[var(--color-on-surface)]',
      className,
    )}
    style={{ fontFamily: 'var(--font-display)' }}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-[var(--color-secondary)]', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-sm', className)} {...props} />
));
CardContent.displayName = 'CardContent';
