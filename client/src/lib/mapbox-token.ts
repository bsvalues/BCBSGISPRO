/**
 * Utility for fetching the Mapbox access token from the server
 */

// Caching mechanism to avoid multiple fetches
let cachedToken: string | null = null;

/**
 * Get the Mapbox access token from the server
 * 
 * This function will fetch the token from the server the first time,
 * then cache it for subsequent calls.
 * 
 * @returns A promise that resolves to the Mapbox access token
 */
export async function getMapboxToken(): Promise<string> {
  // Return cached token if available
  if (cachedToken) {
    return cachedToken;
  }
  
  try {
    // Fetch token from server endpoint
    const response = await fetch('/api/mapbox-token', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching Mapbox token: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Cache the token for future use
    cachedToken = data.token;
    
    return data.token;
  } catch (error) {
    console.error('Failed to fetch Mapbox token:', error);
    throw new Error('Unable to load Mapbox token. Please try again later.');
  }
}

/**
 * Clear the cached token
 * 
 * This can be useful if the token needs to be refreshed
 */
export function clearCachedToken(): void {
  cachedToken = null;
}