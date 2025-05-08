import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names with Tailwind CSS optimization
 * 
 * This function uses clsx to combine class names and twMerge to merge
 * Tailwind CSS classes properly, avoiding duplicates and conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}