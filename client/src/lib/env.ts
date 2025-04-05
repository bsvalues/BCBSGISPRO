/**
 * Environment variables and configuration
 */
import mapboxgl from 'mapbox-gl';

/**
 * Cache for the Mapbox token to avoid repeated API calls
 */
let cachedMapboxToken: string = '';

/**
 * Set the global Mapbox token for all components
 */
export function setGlobalMapboxToken(token: string): void {
  if (token && typeof token === 'string') {
    console.log('Setting global Mapbox token');
    // Set token in our cache
    cachedMapboxToken = token;
    
    // Set the global token for mapbox-gl
    mapboxgl.accessToken = token;
    
    // Store in localStorage for persistence across page refreshes
    try {
      localStorage.setItem('mapbox_token', token);
    } catch (err) {
      console.warn('Could not store Mapbox token in localStorage:', err);
    }
  }
}

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
    setGlobalMapboxToken(cachedMapboxToken);
    return cachedMapboxToken;
  }
  
  // If not in environment, try to fetch from API
  console.log('VITE_MAPBOX_ACCESS_TOKEN not available, trying API endpoint');
  
  // Check if token is in localStorage
  try {
    const localToken = localStorage.getItem('mapbox_token');
    if (localToken) {
      console.log('Found Mapbox token in localStorage');
      setGlobalMapboxToken(localToken);
      return localToken;
    }
  } catch (err) {
    console.warn('Error accessing localStorage:', err);
  }
  
  try {
    console.log('Fetching Mapbox token from API endpoint');
    const response = await fetch('/api/mapbox-token', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Mapbox token: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data && typeof data.token === 'string') {
      console.log('Successfully retrieved Mapbox token from API');
      setGlobalMapboxToken(data.token);
      return data.token;
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
  
  // Try to get token from environment
  const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  if (token) {
    setGlobalMapboxToken(token as string);
    return token as string;
  }
  
  // Try to get from localStorage as fallback
  try {
    const localToken = localStorage.getItem('mapbox_token');
    if (localToken) {
      console.log('Found Mapbox token in localStorage (sync)');
      setGlobalMapboxToken(localToken);
      return localToken;
    }
  } catch (err) {
    console.warn('Error accessing localStorage (sync):', err);
  }
  
  // Log absence of token and set global mapboxgl.accessToken to empty to prevent errors
  console.warn('Mapbox access token not found in environment or localStorage');
  // We'll manually set this to prevent mapbox-gl initialization errors
  mapboxgl.accessToken = '';
  
  // Return empty string, the component should handle token fetching via API
  return '';
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