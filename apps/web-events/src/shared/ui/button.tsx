import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/shared/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-xs font-semibold uppercase tracking-[0.05em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-container)] hover:text-[var(--color-on-primary-container)]',
        secondary:
          'bg-transparent text-[var(--color-primary)] border border-[var(--color-primary)] hover:bg-[var(--color-secondary-container)]',
        outline:
          'border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)]',
        ghost:
          'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-on-surface)]',
        destructive:
          'bg-[var(--color-destructive)] text-white hover:bg-[var(--color-destructive)]/90',
      },
      size: {
        sm: 'h-8 px-3',
        default: 'h-10 px-4 py-2',
        lg: 'h-11 px-6',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
