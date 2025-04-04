/**
 * Environment variables and configuration
 */

/**
 * Get the Mapbox access token from environment
 */
export function getMapboxToken(): string {
  const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  if (!token) {
    console.warn('Mapbox access token not found in environment');
    return '';
  }
  return token as string;
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