import { Feature, Geometry, GeoJsonProperties } from 'geojson';

/**
 * Common GeoJSON feature type used throughout the application
 */
export type GeoJSONFeature = Feature<Geometry, GeoJsonProperties>;

/**
 * Supported map tools for the user interface
 */
export enum MapTool {
  PAN = 'pan',
  MEASURE = 'measure',
  DRAW = 'draw',
  EDIT = 'edit'
}

/**
 * Types of map layers
 */
export enum MapLayerType {
  BASE = 'base',
  OVERLAY = 'overlay',
  FEATURE = 'feature',
  ANNOTATION = 'annotation'
}

/**
 * Configuration for a map layer
 */
export interface MapLayerConfig {
  id: string;
  name: string;
  type: MapLayerType;
  url?: string;
  opacity?: number;
  visible?: boolean;
  data?: GeoJSONFeature | GeoJSONFeature[];
  style?: any;
}

/**
 * Map Layer definition for UI components
 */
export interface MapLayer {
  id: string;
  name: string;
  type: MapLayerType;
  url: string;
  visible: boolean;
  opacity: number;
  zindex: number;
  style?: any;
}

/**
 * Map location with zoom level
 */
export interface MapLocation {
  lat: number;
  lng: number;
  zoom: number;
}

/**
 * Default map location (Benton County, Oregon)
 */
export const DEFAULT_MAP_LOCATION: MapLocation = {
  lat: 44.5638,
  lng: -123.2794,
  zoom: 12
};

/**
 * Default map layers for the application
 */
export const DEFAULT_MAP_LAYERS: MapLayer[] = [
  {
    id: 'osm-base',
    name: 'OpenStreetMap',
    type: MapLayerType.BASE,
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    visible: true,
    opacity: 1.0,
    zindex: 0
  },
  {
    id: 'county-boundary',
    name: 'County Boundary',
    type: MapLayerType.OVERLAY,
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Counties/FeatureServer/0/query?where=NAME%3D%27Benton%27%20AND%20STATE_NAME%3D%27Oregon%27&outFields=*&outSR=4326&f=geojson',
    visible: true,
    opacity: 0.6,
    zindex: 10,
    style: {
      color: '#0066cc',
      weight: 3,
      fillOpacity: 0.1
    }
  },
  {
    id: 'parcels',
    name: 'Parcel Boundaries',
    type: MapLayerType.FEATURE,
    url: '/api/parcels/geojson',
    visible: true,
    opacity: 0.8,
    zindex: 20,
    style: {
      color: '#ff6600',
      weight: 2,
      fillOpacity: 0.05
    }
  }
];

/**
 * Helper function to validate parcel number format
 */
export function isValidParcelNumber(parcelNumber: string): boolean {
  // Format should be like "12345-67-89000"
  const parcelNumberRegex = /^\d{5}-\d{2}-\d{5}$/;
  return parcelNumberRegex.test(parcelNumber);
}