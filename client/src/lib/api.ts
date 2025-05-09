/**
 * API Utility Functions
 * 
 * Utility functions for interacting with the API and handling secrets.
 */

import { queryClient } from './query-client';

/**
 * API request function for use with react-query
 * 
 * @param url The API URL to request
 * @param options Request options
 * @returns Promise with the API response
 */
export async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

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
}

/**
 * Check if certain secrets are configured in the system
 * 
 * @param secretKeys Array of secret keys to check
 * @returns Object with boolean values indicating presence of each secret
 */
export async function check_secrets(secretKeys: string[]): Promise<Record<string, boolean>> {
  try {
    const response = await apiRequest<Record<string, boolean>>('/api/check-secrets', {
      method: 'POST',
      body: JSON.stringify({ secretKeys }),
    });
    
    return response;
  } catch (error) {
    console.error('Error checking secrets:', error);
    // Return object with all secrets marked as false
    return secretKeys.reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {} as Record<string, boolean>);
  }
}

/**
 * Force a refresh of all application data
 */
export function refreshAllData(): void {
  queryClient.invalidateQueries();
}