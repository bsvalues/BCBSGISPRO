/**
 * Environment variables and configuration
 */

/**
 * Cache for the Mapbox token to avoid repeated API calls
 */
let cachedMapboxToken: string = '';

/**
 * Get the Mapbox access token from environment or API
 */
export async function getMapboxTokenAsync(): Promise<string> {
  // Return cached token if available
  if (cachedMapboxToken) {
    return cachedMapboxToken;
  }
  
  // First try to get from environment variable
  const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  
  if (token) {
    cachedMapboxToken = token as string;
    return cachedMapboxToken;
  }
  
  // If not in environment, try to fetch from API
  console.log('VITE_MAPBOX_ACCESS_TOKEN not available, trying API endpoint');
  
  try {
    const response = await fetch('/api/mapbox-token');
    if (!response.ok) {
      throw new Error(`Failed to fetch Mapbox token: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (data && typeof data.token === 'string') {
      cachedMapboxToken = data.token as string;
      return cachedMapboxToken;
    } else {
      throw new Error('No token found in API response');
    }
  } catch (error) {
    console.error('Error fetching Mapbox token:', error);
    return '';
  }
}

/**
 * Get the Mapbox access token from environment (synchronous version)
 * This is used for initial setup where async isn't possible
 */
export function getMapboxToken(): string {
  // Return cached token if available
  if (cachedMapboxToken) {
    return cachedMapboxToken;
  }
  
  const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  if (!token) {
    console.warn('Mapbox access token not found in environment');
    // Return empty string, the component should handle token fetching via API
    return '';
  }
  
  cachedMapboxToken = token as string;
  return cachedMapboxToken;
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return import.meta.env.DEV === true;
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return import.meta.env.PROD === true;
}

/**
 * Get the base URL for API requests
 */
export function getApiBaseUrl(): string {
  return '/api';
}

/**
 * Get the base URL for WebSocket connections
 */
export function getWebSocketUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}