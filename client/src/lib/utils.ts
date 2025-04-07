import { type ClassValue, clsx } from "clsx";
import { format, formatDistance, formatRelative, isValid, parseISO, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names into a single string
 * Uses clsx and tailwind-merge for proper handling
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date with a specified format string
 * Defaults to "MMM d, yyyy" (e.g., Jan 1, 2023)
 */
export function formatDate(date: Date, formatStr: string = "MMM d, yyyy"): string {
  try {
    return format(date, formatStr);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
}

/**
 * Formats a date with time
 * Uses format "MMM d, yyyy h:mm a" (e.g., Jan 1, 2023 3:30 PM)
 */
export function formatDateTime(date: Date): string {
  return formatDate(date, "MMM d, yyyy h:mm a");
}

/**
 * Truncates a string to a specified length
 * Adds ellipsis if truncated
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Capitalizes the first letter of each word in a string
 */
export function capitalizeWords(text: string): string {
  if (!text) return '';
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Formats a number as currency (USD)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

/**
 * Formats a number with commas for thousands separators
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Generates a random ID string
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * Debounces a function call
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): void {
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
 * Gets a value from local storage with type safety
 */
export function getLocalStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
}

/**
 * Sets a value in local storage
 */
export function setLocalStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
}

/**
 * Removes a value from local storage
 */
export function removeLocalStorageItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
  }
}

/**
 * Sleep utility for async functions
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates a URL with query parameters
 */
export function createUrl(baseUrl: string, params: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(baseUrl, window.location.origin);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });
  
  return url.toString();
}

/**
 * Extracts query parameters from a URL
 */
export function getQueryParams(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const result: Record<string, string> = {};
  
  params.forEach((value, key) => {
    result[key] = value;
  });
  
  return result;
}

/**
 * Formats a date as a relative time (e.g., "3 days ago", "in 5 minutes")
 */
export function formatRelativeTime(date: Date): string {
  try {
    return formatDistance(date, new Date(), { addSuffix: true });
  } catch (error) {
    console.error("Error formatting relative time:", error);
    return "Invalid date";
  }
}

/**
 * Parses a date string in ISO format safely
 */
export function parseISODate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  
  try {
    const date = parseISO(dateString);
    return isValid(date) ? date : null;
  } catch (error) {
    console.error("Error parsing ISO date:", error);
    return null;
  }
}

/**
 * Creates a human-readable time difference in the most appropriate unit
 */
export function getTimeDifference(startDate: Date, endDate: Date = new Date()): string {
  try {
    const days = differenceInDays(endDate, startDate);
    if (days > 0) return `${days} day${days !== 1 ? 's' : ''}`;
    
    const hours = differenceInHours(endDate, startDate);
    if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
    
    const minutes = differenceInMinutes(endDate, startDate);
    if (minutes > 0) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    
    return 'Less than a minute';
  } catch (error) {
    console.error("Error calculating time difference:", error);
    return "Unknown duration";
  }
}

/**
 * Formats a document size in bytes to a human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Slugifies a string (converts to lowercase, replaces spaces with hyphens)
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with hyphens
    .replace(/&/g, '-and-')      // Replace & with 'and'
    .replace(/[^\w\-]+/g, '')    // Remove all non-word characters
    .replace(/\-\-+/g, '-');     // Replace multiple hyphens with single hyphen
}

/**
 * Extracts initials from a name (e.g., "John Doe" -> "JD")
 */
export function getInitials(name: string): string {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Highlights search terms in a text string
 * Returns an array of text parts and whether they should be highlighted
 */
export function highlightSearchTerms(text: string, searchTerm: string): Array<{ text: string, highlight: boolean }> {
  if (!searchTerm || !text) {
    return [{ text, highlight: false }];
  }
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, i) => ({
    text: part,
    highlight: i % 2 === 1
  }));
}

/**
 * Sanitizes a string for safe use in HTML
 */
export function sanitizeString(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Extracts text content from HTML
 */
export function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || '';
}

/**
 * Formats a coordinate pair as a string
 */
export function formatCoordinates(lat: number, lng: number, decimals: number = 6): string {
  return `${lat.toFixed(decimals)}, ${lng.toFixed(decimals)}`;
}

/**
 * Deep clones an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Generates a random color
 */
export function getRandomColor(): string {
  return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
}

/**
 * Gets a contrasting text color (black or white) based on background color
 */
export function getContrastColor(hexColor: string): 'black' | 'white' {
  // Remove the # if present
  const color = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  
  // Calculate luminance (perceived brightness)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black for bright colors, white for dark ones
  return luminance > 0.5 ? 'black' : 'white';
}