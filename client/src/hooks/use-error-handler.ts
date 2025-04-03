import { useState, useCallback } from 'react';
import { useToast } from './use-toast';

/**
 * Options for error handling behavior
 */
export interface ErrorOptions {
  /**
   * Whether to show a toast notification for this error
   */
  showToast?: boolean;
  /**
   * Custom title for the toast notification
   */
  toastTitle?: string;
  /**
   * Custom description for the toast notification
   */
  toastDescription?: string;
  /**
   * The intended UI variant for the error
   */
  variant?: 'error' | 'warning' | 'info';
  /**
   * Whether to log the error to the console
   */
  logToConsole?: boolean;
  /**
   * Custom error handler function
   */
  customHandler?: (error: Error) => void;
}

/**
 * Error handler function type
 */
export type ErrorHandler = (error: Error, options?: ErrorOptions) => void;

/**
 * Hook that provides standardized error handling functionality
 * 
 * @returns Object containing error handling utilities
 * 
 * @example
 * ```tsx
 * const { handleError, withErrorHandling, tryCatch } = useErrorHandler();
 * 
 * // Basic error handling
 * try {
 *   doSomething();
 * } catch (error) {
 *   handleError(error as Error);
 * }
 * 
 * // With a wrapped async function
 * const fetchData = withErrorHandling(async () => {
 *   const response = await fetch('/api/data');
 *   return response.json();
 * });
 * 
 * // With the tryCatch utility
 * const [result, error] = tryCatch(() => {
 *   return complexCalculation();
 * });
 * ```
 */
export function useErrorHandler() {
  const { toast } = useToast();
  const [lastError, setLastError] = useState<Error | null>(null);

  // Main error handling function
  const handleError: ErrorHandler = useCallback((error: Error, options?: ErrorOptions) => {
    const {
      showToast = true,
      toastTitle = 'Error',
      toastDescription,
      variant = 'error',
      logToConsole = true,
      customHandler
    } = options || {};

    // Update last error state
    setLastError(error);

    // Log to console if enabled
    if (logToConsole) {
      console.error('Error caught by useErrorHandler:', error);
    }

    // Show toast notification if enabled
    if (showToast) {
      toast({
        title: toastTitle,
        description: toastDescription || error.message,
        variant: variant
      });
    }

    // Call custom handler if provided
    if (customHandler) {
      customHandler(error);
    }
  }, [toast]);

  // Utility to handle errors in synchronous code
  const tryCatch = useCallback(<T>(fn: () => T, options?: ErrorOptions): [T | null, Error | null] => {
    try {
      return [fn(), null];
    } catch (error) {
      handleError(error as Error, options);
      return [null, error as Error];
    }
  }, [handleError]);

  // Utility to wrap async functions with error handling
  const withErrorHandling = useCallback(
    <T, Args extends any[]>(
      fn: (...args: Args) => Promise<T>,
      options?: ErrorOptions
    ) => {
      return async (...args: Args): Promise<T> => {
        try {
          return await fn(...args);
        } catch (error) {
          handleError(error as Error, options);
          throw error; // Re-throw to allow caller to handle if needed
        }
      };
    },
    [handleError]
  );

  // Clear the last error
  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  return {
    handleError,
    tryCatch,
    withErrorHandling,
    lastError,
    clearError
  };
}