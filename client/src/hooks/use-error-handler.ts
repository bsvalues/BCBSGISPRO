import { useState, useCallback } from 'react';

/**
 * ErrorDetails interface for additional error context
 */
interface ErrorDetails {
  context?: string;
  timestamp?: string;
  [key: string]: unknown;
}

/**
 * ErrorState interface to manage error state
 */
interface ErrorState {
  hasError: boolean;
  message: string;
  details?: ErrorDetails;
  stack?: string;
}

/**
 * ErrorHandlerHook interface defining the shape of the hook return value
 */
interface ErrorHandlerHook {
  error: ErrorState;
  setError: (error: Error | unknown, details?: ErrorDetails) => void;
  clearError: () => void;
  withErrorHandling: <T extends (...args: any[]) => Promise<any>>(fn: T) => T;
}

/**
 * Default error state
 */
const defaultErrorState: ErrorState = {
  hasError: false,
  message: '',
};

/**
 * Custom hook for standardized error handling throughout the application
 * 
 * @returns Object containing error state and error handling functions
 */
export const useErrorHandler = (): ErrorHandlerHook => {
  const [error, setErrorState] = useState<ErrorState>(defaultErrorState);

  /**
   * Set an error with additional context details
   */
  const setError = useCallback((err: Error | unknown, details?: ErrorDetails) => {
    console.error('Error handled by useErrorHandler:', err);
    
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : undefined;
    
    setErrorState({
      hasError: true,
      message: errorMessage,
      stack: errorStack,
      details: {
        ...details,
        timestamp: details?.timestamp || new Date().toISOString(),
      },
    });
  }, []);

  /**
   * Clear the current error state
   */
  const clearError = useCallback(() => {
    setErrorState(defaultErrorState);
  }, []);

  /**
   * Higher-order function that wraps an async function with error handling
   */
  const withErrorHandling = useCallback(<T extends (...args: any[]) => Promise<any>>(
    fn: T
  ): T => {
    return (async (...args: Parameters<T>) => {
      try {
        return await fn(...args);
      } catch (err) {
        setError(err);
        return undefined as any; // The return type is not used when an error occurs
      }
    }) as T;
  }, [setError]);

  return {
    error,
    setError,
    clearError,
    withErrorHandling,
  };
};