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

/**
 * Formats a number as a currency string
 * 
 * @param value The number to format as currency
 * @param currency The currency code (default: 'USD')
 * @param locale The locale to use for formatting (default: 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}