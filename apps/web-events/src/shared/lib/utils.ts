import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Standard class name combiner used across UI primitives.
 * `clsx` resolves conditionals; `tailwind-merge` deduplicates conflicting
 * tailwind utilities so consumers can override defaults cleanly.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
