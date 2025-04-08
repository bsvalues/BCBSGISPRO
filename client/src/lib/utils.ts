import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using clsx and tailwind-merge
 * 
 * @param inputs - Class values to be combined
 * @returns A merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as a currency string
 * 
 * @param value - Number to format
 * @param options - Intl.NumberFormat options
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  options: Intl.NumberFormatOptions = { style: 'currency', currency: 'USD' }
): string {
  return new Intl.NumberFormat('en-US', options).format(value);
}

/**
 * Truncates text with ellipsis after specified length
 * 
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text string
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Formats a date into a readable string
 * 
 * @param date - Date to format
 * @param format - Format style: 'short', 'medium', 'long', or 'full'
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number,
  format: 'short' | 'medium' | 'long' | 'full' = 'medium'
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat('en-US', { dateStyle: format }).format(dateObj);
}

/**
 * Creates a debounced function that delays invoking the provided function
 * 
 * @param fn - Function to debounce
 * @param wait - Milliseconds to delay
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      fn(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

/**
 * Downloads data as a file
 * 
 * @param data - Data to download
 * @param filename - Name for the downloaded file
 * @param type - MIME type of the file
 */
export function downloadFile(data: string, filename: string, type: string): void {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

/**
 * Gets contrast text color (black or white) based on background color
 * 
 * @param hexColor - Hex color code (e.g., #FFFFFF)
 * @returns '#000000' for light backgrounds, '#FFFFFF' for dark
 */
export function getContrastColor(hexColor: string): '#000000' | '#FFFFFF' {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate luminance using the relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black for light backgrounds, white for dark
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}