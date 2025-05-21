/**
 * MapProviderType
 * 
 * Standard type definition for map providers across the entire TerraFusion platform.
 * Used by all mapping components to ensure consistent provider interface.
 */

/**
 * Supported map provider types
 */
export type MapProviderType = 'mapbox' | 'leaflet' | 'arcgis';

/**
 * Map provider configuration
 */
export interface MapProviderConfig {
  provider: MapProviderType;
  apiKey?: string;
  options?: Record<string, any>;
}