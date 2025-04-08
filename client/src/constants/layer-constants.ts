/**
 * Constants related to map layers and services
 */

// Benton County ArcGIS REST services base URL
export const ARCGIS_BASE_URL = 'https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services';

// Default base layer configuration
export const DEFAULT_PARCELS_LAYER = {
  id: 'parcels-layer-base', // Fixed ID to ensure it's recognized as the same layer
  name: 'Parcels and Assessor Data',
  serviceName: 'Parcels_and_Assess',
  serviceType: 'MapServer' as const,
  layerId: 0,
  visible: true,
  opacity: 1,
  isBaseLayer: true, // Flag to mark this as a base layer that shouldn't be removed
};

// Layer type definition for use across components
export interface Layer {
  id: string;
  name: string;
  serviceName: string;
  serviceType: 'FeatureServer' | 'MapServer';
  layerId?: number;
  visible: boolean;
  opacity: number;
  isBaseLayer?: boolean;
}