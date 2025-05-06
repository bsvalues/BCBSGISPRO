import { QueryClient } from '@tanstack/react-query';

/**
 * Default options for the query client
 */
const defaultQueryOptions = {
  queries: {
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  },
};

/**
 * Create a new query client instance
 */
export const queryClient = new QueryClient({
  defaultOptions: defaultQueryOptions,
});

/**
 * API request function for mutations
 * 
 * @param input Request URL or object
 * @param init Request options
 * @returns Fetch promise
 */
export const apiRequest = async <T = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> => {
  const response = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = new Error(
      `API request failed: ${response.status} ${response.statusText}`
    );
    try {
      const errorData = await response.json();
      Object.assign(error, { data: errorData });
    } catch {
      // If response is not JSON, ignore
    }
    throw error;
  }

  // For 204 No Content responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
};