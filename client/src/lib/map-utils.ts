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
 * Types of measurements available in the system
 */
export enum MeasurementType {
  DISTANCE = 'distance',
  AREA = 'area',
  PERIMETER = 'perimeter'
}

/**
 * Units of measurement available in the system
 */
export enum MeasurementUnit {
  // Distance units
  METERS = 'meters',
  KILOMETERS = 'kilometers',
  FEET = 'feet',
  MILES = 'miles',
  
  // Area units
  SQUARE_METERS = 'square_meters',
  HECTARES = 'hectares',
  ACRES = 'acres',
  SQUARE_FEET = 'square_feet'
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

/**
 * Calculates the distance between two geographic points using the Haversine formula
 * @param point1 [longitude, latitude] coordinate pair
 * @param point2 [longitude, latitude] coordinate pair
 * @param unit Optional unit of measurement (defaults to meters)
 * @returns Distance in the specified unit
 */
export function calculateDistance(
  point1: [number, number], 
  point2: [number, number], 
  unit: MeasurementUnit = MeasurementUnit.METERS
): number {
  const [lon1, lat1] = point1;
  const [lon2, lat2] = point2;
  
  // Convert to radians
  const R = 6371000; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  
  // Haversine formula
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * 
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceInMeters = R * c;

  // Convert to requested unit
  switch (unit) {
    case MeasurementUnit.KILOMETERS:
      return distanceInMeters / 1000;
    case MeasurementUnit.FEET:
      return distanceInMeters * 3.28084;
    case MeasurementUnit.MILES:
      return distanceInMeters / 1609.344;
    case MeasurementUnit.METERS:
    default:
      return distanceInMeters;
  }
}

/**
 * Calculates the area of a GeoJSON polygon
 * @param coordinates Array of coordinate pairs that form the polygon
 * @param unit Optional unit of measurement (defaults to square meters)
 * @returns Area in the specified unit
 */
export function calculateArea(
  coordinates: number[][][],
  unit: MeasurementUnit = MeasurementUnit.SQUARE_METERS
): number {
  // Convert to meters (planar calculation for small areas)
  let area = 0;
  
  // Use the first ring (outer ring)
  const ring = coordinates[0];
  
  // Earth radius in meters
  const R = 6371000;
  
  for (let i = 0; i < ring.length - 1; i++) {
    const [lon1, lat1] = ring[i];
    const [lon2, lat2] = ring[i + 1];
    
    // Convert to radians
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const λ1 = (lon1 * Math.PI) / 180;
    const λ2 = (lon2 * Math.PI) / 180;
    
    // Calculate area using shoelace formula mapped to spherical coordinates
    area += (λ2 - λ1) * (2 + Math.sin(φ1) + Math.sin(φ2));
  }
  
  // Finish calculation
  area = Math.abs(area * Math.pow(R, 2) / 2);
  
  // Convert to requested unit
  switch (unit) {
    case MeasurementUnit.HECTARES:
      return area / 10000;
    case MeasurementUnit.ACRES:
      return area / 4046.86;
    case MeasurementUnit.SQUARE_FEET:
      return area * 10.7639;
    case MeasurementUnit.SQUARE_METERS:
    default:
      return area;
  }
}

/**
 * Formats an area measurement with appropriate units and rounding
 * @param area Area value to format
 * @param unit Unit of measurement
 * @returns Formatted area string with unit
 */
export function formatArea(area: number, unit: MeasurementUnit = MeasurementUnit.SQUARE_METERS): string {
  switch (unit) {
    case MeasurementUnit.HECTARES:
      return `${area.toFixed(2)} ha`;
    case MeasurementUnit.ACRES:
      return `${area.toFixed(2)} ac`;
    case MeasurementUnit.SQUARE_FEET:
      return `${Math.round(area).toLocaleString()} ft²`;
    case MeasurementUnit.SQUARE_METERS:
      if (area >= 10000) {
        // If over 10,000 square meters, convert to hectares
        return formatArea(area / 10000, MeasurementUnit.HECTARES);
      }
      return `${Math.round(area).toLocaleString()} m²`;
    default:
      return `${Math.round(area).toLocaleString()} m²`;
  }
}

/**
 * Formats a distance measurement with appropriate units and rounding
 * @param distance Distance value to format
 * @param unit Unit of measurement
 * @returns Formatted distance string with unit
 */
export function formatDistance(distance: number, unit: MeasurementUnit = MeasurementUnit.METERS): string {
  switch (unit) {
    case MeasurementUnit.KILOMETERS:
      return `${distance.toFixed(2)} km`;
    case MeasurementUnit.MILES:
      return `${distance.toFixed(2)} mi`;
    case MeasurementUnit.FEET:
      return `${Math.round(distance).toLocaleString()} ft`;
    case MeasurementUnit.METERS:
      if (distance >= 1000) {
        // If over 1000 meters, convert to kilometers
        return formatDistance(distance / 1000, MeasurementUnit.KILOMETERS);
      }
      return `${Math.round(distance).toLocaleString()} m`;
    default:
      return `${Math.round(distance).toLocaleString()} m`;
  }
}

/**
 * Gets the attribution text for a base map
 * @param baseMapId The ID of the base map
 * @returns Attribution text for the specified base map
 */
export function getBaseMapAttribution(baseMapId: string): string {
  // Find the base map in the default map layers
  const baseMap = DEFAULT_MAP_LAYERS.find(layer => layer.id === baseMapId);
  
  if (!baseMap) {
    // Default attribution if base map not found
    return '© OpenStreetMap contributors';
  }
  
  // Return layer-specific attribution
  switch (baseMapId) {
    case 'osm-standard':
      return '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    case 'esri-imagery':
      return '© <a href="https://www.esri.com">Esri</a> | Source: Esri, Maxar, GeoEye, Earthstar Geographics, USDA FSA, USGS, Aerogrid, IGN, IGP, and the GIS User Community';
    case 'carto-light':
      return '© <a href="https://carto.com/">CARTO</a> | © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    case 'usgs-topo':
      return '© <a href="https://www.usgs.gov/">USGS</a> | © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    default:
      return baseMap.name ? `© ${baseMap.name}` : '© Map data providers';
  }
}

/**
 * Gets the URL for a base map
 * @param baseMapType The type of base map
 * @returns URL for the specified base map
 */
export function getBaseMapUrl(baseMapType: string): string {
  // Return URL based on base map type
  switch (baseMapType) {
    case 'street':
    case 'osm-standard':
      return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    case 'satellite':
    case 'esri-imagery':
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    case 'topo':
    case 'usgs-topo':
      return 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}';
    case 'light':
    case 'carto-light':
      return 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    default:
      // Default to OpenStreetMap if unknown base map type
      return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  }
}