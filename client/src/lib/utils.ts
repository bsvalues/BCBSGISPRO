import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and tailwind-merge
 * for a clean, optimized approach to conditional styling
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a random numeric ID with a specified length
 * @param length The length of the ID to generate
 * @returns A string containing the randomly generated ID
 */
export function generateId(length: number = 8): string {
  return Math.random().toString().substring(2, 2 + length);
}

/**
 * Debounces a function call, useful for expensive operations
 * that shouldn't be called too frequently (e.g., searches)
 * @param func The function to debounce
 * @param wait The wait time in milliseconds
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>): void => {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttles a function call, ensuring it's not called more frequently than the specified interval
 * Useful for events that fire rapidly (e.g., mouse movements, scrolling)
 * @param func The function to throttle
 * @param wait The minimum time between function calls in milliseconds
 * @returns A throttled version of the function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  
  return (...args: Parameters<T>): void => {
    const now = Date.now();
    const remaining = wait - (now - lastCall);
    
    // Store the latest arguments
    lastArgs = args;
    
    // If it's been longer than the wait time since last call, execute immediately
    if (remaining <= 0) {
      if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
      }
      lastCall = now;
      func(...args);
    } 
    // Otherwise, schedule execution at the end of the wait period
    else if (timeout === null) {
      timeout = setTimeout(() => {
        lastCall = Date.now();
        timeout = null;
        if (lastArgs) {
          func(...lastArgs);
        }
      }, remaining);
    }
  };
}

/**
 * Standard button variants for consistency across the app
 */
export const ButtonVariant = {
  DEFAULT: "default",
  DESTRUCTIVE: "destructive",
  OUTLINE: "outline",
  SECONDARY: "secondary",
  GHOST: "ghost",
  LINK: "link",
} as const;

/**
 * Define button sizes for consistency across the app
 */
export const ButtonSize = {
  DEFAULT: "default",
  SM: "sm",
  LG: "lg",
  ICON: "icon",
} as const;

/**
 * Format a date in a localized, human-readable format
 * @param date The date to format
 * @param format The format to use (short, medium, long)
 * @returns A formatted date string
 */
export function formatDate(date: Date, format: 'short' | 'medium' | 'long' = 'medium'): string {
  try {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    switch (format) {
      case 'short':
        return date.toLocaleDateString();
      case 'medium':
        return date.toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      case 'long':
        return date.toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          weekday: 'long'
        });
      default:
        return date.toLocaleDateString();
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Formats a number as currency
 * @param value The number to format
 * @param currencyCode The currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, currencyCode: string = 'USD'): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
    }).format(value);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${value}`;
  }
}