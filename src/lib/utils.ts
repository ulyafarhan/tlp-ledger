import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility: Kombinasi clsx dan tailwind-merge
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}