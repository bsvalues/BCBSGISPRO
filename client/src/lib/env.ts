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
    console.log('Using cached Mapbox token');
    return cachedMapboxToken;
  }
  
  // Try to get from localStorage first (for fast loading)
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
  
  // Then try environment variable
  // Check for token directly from environment variables
  const envToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  if (envToken) {
    console.log('Using Mapbox token from environment variables');
    cachedMapboxToken = envToken as string;
    setGlobalMapboxToken(cachedMapboxToken);
    return cachedMapboxToken;
  }
  
  // Alternative: if no VITE_MAPBOX_ACCESS_TOKEN, try directly accessing from backend environment
  const directToken = import.meta.env.MAPBOX_ACCESS_TOKEN;
  if (directToken) {
    console.log('Using Mapbox token directly from process.env');
    cachedMapboxToken = directToken as string;
    setGlobalMapboxToken(cachedMapboxToken);
    return cachedMapboxToken;
  }
  
  // If both failed, fetch from API as most reliable source
  console.log('Fetching Mapbox token from API endpoint');
  try {
    // Use proper API base URL depending on environment
    const apiBaseUrl = import.meta.env.DEV ? 'http://localhost:5000' : '';
    const response = await fetch(`${apiBaseUrl}/api/mapbox-token`, {
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
    console.log('Using cached Mapbox token (sync)');
    return cachedMapboxToken;
  }
  
  // Try to get from localStorage first (for fast loading)
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
  
  // Then try environment variable
  const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  if (token) {
    console.log('Using Mapbox token from environment variables (sync)');
    setGlobalMapboxToken(token as string);
    return token as string;
  }
  
  // Alternative: try directly accessing from backend environment
  const directToken = import.meta.env.MAPBOX_ACCESS_TOKEN;
  if (directToken) {
    console.log('Using Mapbox token directly from process.env (sync)');
    setGlobalMapboxToken(directToken as string);
    return directToken as string;
  }
  
  // Log that we need to fetch from API, but that requires async
  // This is expected in many cases, so we'll change the log level to info
  console.info('Mapbox token not found in cached sources, will need to fetch from API');
  
  // We'll set empty token for now, but components should handle fetching via API
  mapboxgl.accessToken = '';
  
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
  // In development, use the specific port
  // In production, use relative path
  return import.meta.env.DEV ? 'http://localhost:5000/api' : '/api';
}

/**
 * Get the base URL for WebSocket connections
 */
export function getWebSocketUrl(): string {
  try {
    // In development environment, use specific port with ws protocol
    if (import.meta.env.DEV) {
      // Always use ws protocol for localhost connections in development
      return `ws://localhost:5000/ws`;
    }
    
    // In production, use relative WebSocket path with protocol based on page protocol
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
  } catch (error) {
    console.error('Error constructing WebSocket URL:', error);
    // Provide a fallback that at least has the correct format
    return `ws://${window.location.hostname}/ws`;
  }
}