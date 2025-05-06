import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names with Tailwind CSS classes
 * 
 * @param inputs Class names to combine
 * @returns Combined class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date as a human-readable string
 * 
 * @param date Date to format 
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

/**
 * Format currency values
 * 
 * @param amount Amount to format
 * @param currency Currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

/**
 * Create a range of numbers
 * 
 * @param start Start of range (inclusive)
 * @param end End of range (inclusive)
 * @returns Array of numbers
 */
export function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, or empty object)
 * 
 * @param value Value to check
 * @returns True if the value is empty
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Truncate a string to a specified length
 * 
 * @param str String to truncate
 * @param length Maximum length (default: 100)
 * @param suffix Suffix to add when truncated (default: "...")
 * @returns Truncated string
 */
export function truncate(str: string, length: number = 100, suffix: string = "..."): string {
  if (!str) return "";
  if (str.length <= length) return str;
  return str.substring(0, length).trim() + suffix;
}

/**
 * Capitalize the first letter of a string
 * 
 * @param str String to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Group items in an array by a key
 * 
 * @param items Array of items to group
 * @param keyGetter Function to extract the key from an item
 * @returns Map of grouped items
 */
export function groupBy<T>(items: T[], keyGetter: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  items.forEach((item) => {
    const key = keyGetter(item);
    const collection = map.get(key);
    if (!collection) {
      map.set(key, [item]);
    } else {
      collection.push(item);
    }
  });
  return map;
}

/**
 * Determine the color scheme for a given status
 * 
 * @param status Status value
 * @returns Color scheme class name
 */
export function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    critical: "text-red-500 bg-red-50",
    error: "text-red-500 bg-red-50",
    warning: "text-amber-500 bg-amber-50",
    success: "text-green-500 bg-green-50",
    info: "text-blue-500 bg-blue-50",
    implemented: "text-green-500 bg-green-50",
    missing: "text-red-500 bg-red-50",
    partial: "text-amber-500 bg-amber-50"
  };
  
  return statusMap[status.toLowerCase()] || "text-gray-500 bg-gray-50";
}

/**
 * Calculate percentage representation
 * 
 * @param value Current value
 * @param total Total value
 * @returns Percentage value (0-100)
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.max(0, Math.round((value / total) * 100)));
}