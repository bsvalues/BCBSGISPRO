import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names and merges Tailwind classes efficiently
 * @param inputs Class names to combine
 * @returns Merged class names string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a unique ID with an optional prefix
 * @param prefix Optional prefix for the ID
 * @returns A unique string ID
 */
export function generateId(prefix: string = 'id-'): string {
  return `${prefix}${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Throttles a function to limit how often it can be called
 * @param func The function to throttle
 * @param limit Time in milliseconds between allowed calls
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let lastCall = 0;
  let lastResult: ReturnType<T>;
  
  return (...args: Parameters<T>): ReturnType<T> | undefined => {
    const now = Date.now();
    
    if (now - lastCall >= limit) {
      lastCall = now;
      lastResult = func(...args);
      return lastResult;
    }
    
    return lastResult;
  };
}

/**
 * Debounces a function to delay its execution until after a specified timeout
 * @param func The function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout;
  
  return (...args: Parameters<T>): void => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
}

/**
 * Formats a date with optional formatting options
 * @param date Date to format
 * @param options Date formatting options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}

/**
 * Truncates a string to a specified length with ellipsis
 * @param str String to truncate
 * @param length Maximum length before truncation
 * @returns Truncated string
 */
export function truncateString(str: string, length: number = 50): string {
  if (str.length <= length) return str;
  return str.substring(0, length - 3) + '...';
}

/**
 * Safely access nested object properties without errors
 * @param obj Object to access
 * @param path Path to the property as string or array
 * @param defaultValue Default value if property doesn't exist
 * @returns The value at path or defaultValue
 */
export function getNestedValue<T = any>(
  obj: Record<string, any> | null | undefined,
  path: string | string[],
  defaultValue: T | null = null
): T | null {
  if (!obj) return defaultValue;
  
  const keys = Array.isArray(path) ? path : path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined || typeof result !== 'object') {
      return defaultValue;
    }
    result = result[key];
  }
  
  return (result as unknown as T) ?? defaultValue;
}