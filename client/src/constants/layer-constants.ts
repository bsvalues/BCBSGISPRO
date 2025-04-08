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

// Direct URLs for static map images (for fallback or testing)
export const STATIC_MAP_IMAGES = {
  PARCELS: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services/Parcels_and_Assess/MapServer/export?bbox=-123.4617,44.4646,-123.2617,44.6646&bboxSR=4326&imageSR=4326&size=1200,800&dpi=96&format=png32&transparent=true&layers=show:0,1,2,3,4&f=image',
  AERIAL: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services/Aerials_2020/MapServer/export?bbox=-123.4617,44.4646,-123.2617,44.6646&bboxSR=4326&imageSR=4326&size=1200,800&dpi=96&format=jpeg&transparent=false&layers=show:0&f=image',
  ZONING: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services/Zoning/MapServer/export?bbox=-123.4617,44.4646,-123.2617,44.6646&bboxSR=4326&imageSR=4326&size=1200,800&dpi=96&format=png32&transparent=true&layers=show:0&f=image',
  ROADS: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services/Roads/MapServer/export?bbox=-123.4617,44.4646,-123.2617,44.6646&bboxSR=4326&imageSR=4326&size=1200,800&dpi=96&format=png32&transparent=true&layers=show:0&f=image',
  FIRE_DISTRICTS: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services/Fire_Districts/MapServer/export?bbox=-123.4617,44.4646,-123.2617,44.6646&bboxSR=4326&imageSR=4326&size=1200,800&dpi=96&format=png32&transparent=true&layers=show:0&f=image'
};