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
  const envToken = (import.meta as any).env?.VITE_MAPBOX_ACCESS_TOKEN;
  if (envToken) {
    console.log('Using Mapbox token from environment variables');
    cachedMapboxToken = envToken as string;
    setGlobalMapboxToken(cachedMapboxToken);
    return cachedMapboxToken;
  }
  
  // Alternative: if no VITE_MAPBOX_ACCESS_TOKEN, try directly accessing from backend environment
  const directToken = (import.meta as any).env?.MAPBOX_ACCESS_TOKEN;
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
    const apiBaseUrl = (import.meta as any).env?.DEV ? 'http://localhost:5000' : '';
    
    // Try the primary endpoint first
    try {
      console.log('Trying primary endpoint: /api/map-services/mapbox-token');
      const primaryResponse = await fetch(`${apiBaseUrl}/api/map-services/mapbox-token`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (primaryResponse.ok) {
        const primaryData = await primaryResponse.json();
        if (primaryData && typeof primaryData.token === 'string') {
          console.log('Successfully retrieved Mapbox token from primary endpoint');
          setGlobalMapboxToken(primaryData.token);
          return primaryData.token;
        }
      }
    } catch (primaryErr) {
      console.warn('Primary endpoint failed:', primaryErr);
    }
    
    // If primary endpoint fails, try fallback endpoint
    console.log('Trying fallback endpoint: /api/mapbox-token');
    const fallbackResponse = await fetch(`${apiBaseUrl}/api/mapbox-token`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!fallbackResponse.ok) {
      throw new Error(`Failed to fetch Mapbox token from both endpoints: ${fallbackResponse.status} ${fallbackResponse.statusText}`);
    }
    
    const fallbackData = await fallbackResponse.json();
    
    if (fallbackData && typeof fallbackData.token === 'string') {
      console.log('Successfully retrieved Mapbox token from fallback endpoint');
      setGlobalMapboxToken(fallbackData.token);
      return fallbackData.token;
    } else {
      throw new Error('No token found in API response');
    }
  } catch (error) {
    console.error('Error fetching Mapbox token from all endpoints:', error);
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
  const token = (import.meta as any).env?.VITE_MAPBOX_ACCESS_TOKEN;
  if (token) {
    console.log('Using Mapbox token from environment variables (sync)');
    setGlobalMapboxToken(token as string);
    return token as string;
  }
  
  // Alternative: try directly accessing from backend environment
  const directToken = (import.meta as any).env?.MAPBOX_ACCESS_TOKEN;
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
  // Handle TypeScript error by using type assertion
  return (import.meta as any).env?.DEV === true;
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  // Handle TypeScript error by using type assertion
  return (import.meta as any).env?.PROD === true;
}

/**
 * Get the base URL for API requests
 */
export function getApiBaseUrl(): string {
  // In Replit development environment, use the current host to avoid CORS issues
  // In production, use relative path
  const baseUrl = (import.meta as any).env?.DEV ? `${window.location.protocol}//${window.location.host}` : '';
  return `${baseUrl}/api`;
}

/**
 * Get the base URL for WebSocket connections
 */
export function getWebSocketUrl(): string {
  try {
    // Determine protocol based on page protocol (https -> wss, http -> ws)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // Use the current host from window.location
    const host = window.location.host;
    
    // Construct the URL with proper formatting
    const wsUrl = `${protocol}//${host}/ws`;
    
    // Log the constructed URL for debugging
    console.log(`[WS-ENV] Constructed WebSocket URL: ${wsUrl}`);
    console.log(`[WS-ENV] Based on protocol: ${window.location.protocol}`);
    console.log(`[WS-ENV] Based on host: ${host}`);
    
    return wsUrl;
  } catch (error) {
    console.error('[WS-ENV] Error constructing WebSocket URL:', error);
    
    // Provide a fallback that at least has the correct format
    const fallbackUrl = `ws://${window.location.hostname}/ws`;
    console.log(`[WS-ENV] Using fallback WebSocket URL: ${fallbackUrl}`);
    
    return fallbackUrl;
  }
}