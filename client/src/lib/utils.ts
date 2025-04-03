import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names using clsx and tailwind-merge
 * This utility helps prevent class name conflicts and enables 
 * conditional class application.
 *
 * @param inputs - Class values to be merged
 * @returns Merged class string
 *
 * @example
 * // Basic usage:
 * <div className={cn('text-red-500', 'bg-blue-500')}>
 *
 * // With conditionals:
 * <div className={cn('base-class', isActive && 'active-class')}>
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a unique ID
 * 
 * @returns A string ID
 */
export function generateId(): string {
  // Implementation uses a combination of timestamp and random numbers
  return Math.random().toString(36).substring(2, 9) + 
         '_' + 
         Date.now().toString(36);
}

/**
 * Formats a date string or Date object into a human-readable format
 * 
 * @param date - Date string or Date object
 * @param options - Intl.DateTimeFormatOptions for formatting
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', options).format(d);
}

/**
 * Safely truncates a string to a given length and adds an ellipsis
 * 
 * @param str - The string to truncate
 * @param length - Maximum length before truncation
 * @returns Truncated string with ellipsis if needed
 */
export function truncateString(str: string, length: number): string {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
}

/**
 * Debounces a function call
 * 
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return function(this: any, ...args: Parameters<T>): void {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Makes the first letter of a string uppercase
 * 
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Formats a number with commas as thousands separators
 * 
 * @param num - Number to format
 * @returns Formatted number string
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Safely access nested object properties without throwing errors
 * 
 * @param obj - Object to access
 * @param path - Path to the property (e.g., 'user.address.city')
 * @param defaultValue - Default value if property doesn't exist
 * @returns The property value or defaultValue
 */
export function getNestedValue<T>(
  obj: Record<string, any>,
  path: string,
  defaultValue: T
): T {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === undefined || result === null || !Object.prototype.hasOwnProperty.call(result, key)) {
      return defaultValue;
    }
    result = result[key];
  }
  
  return (result === undefined) ? defaultValue : result as T;
}

/**
 * Checks if a value is empty (null, undefined, empty string, empty array, or empty object)
 * 
 * @param value - Value to check
 * @returns True if empty, false otherwise
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}