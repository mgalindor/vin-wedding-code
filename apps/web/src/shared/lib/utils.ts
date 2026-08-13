import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Combines clsx (conditional class strings) with tailwind-merge (last class
// wins on conflicts). The standard shadcn helper.
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}