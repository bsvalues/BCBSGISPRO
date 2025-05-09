/**
 * Query Client Configuration
 * 
 * This file configures the React Query client for data fetching.
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Default global query client configuration
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

/**
 * Default fetch options for API requests
 */
const defaultFetchOptions = {
  credentials: 'include' as RequestCredentials,
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Default query function for React Query
 * Automatically handles JSON parsing and error responses
 */
export const defaultQueryFn = async <T>({ queryKey }: { queryKey: string[] }): Promise<T> => {
  // Use the first element of the query key as the URL
  const url = Array.isArray(queryKey) ? queryKey[0] : queryKey;
  
  const response = await fetch(url, defaultFetchOptions);
  
  if (!response.ok) {
    // Try to parse error message from response
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || 'API request failed');
    } catch (e) {
      // If we can't parse JSON from the error, use status text
      throw new Error(response.statusText || 'API request failed');
    }
  }
  
  // Return empty object for 204 No Content responses
  if (response.status === 204) {
    return {} as T;
  }
  
  return response.json();
};