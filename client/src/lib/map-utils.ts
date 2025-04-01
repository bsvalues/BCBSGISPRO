import * as turf from '@turf/turf';
import { Feature, FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';

export type GeoJSONFeature = Feature<Geometry, GeoJsonProperties>;
export type GeoJSONFeatureCollection = FeatureCollection<Geometry, GeoJsonProperties>;

export enum MapLayerType {
  PARCEL = 'parcel',
  ZONING = 'zoning',
  STREET = 'street',
  HYDROLOGY = 'hydrology',
  AERIAL = 'aerial',
  TOPOGRAPHIC = 'topographic'
}

export enum MapTool {
  PAN = 'pan',
  SELECT = 'select',
  MEASURE = 'measure',
  DRAW = 'draw',
  EDIT = 'edit'
}

export interface MapLayer {
  id: number;
  name: string;
  type: MapLayerType;
  visible: boolean;
  data: GeoJSONFeature[] | GeoJSONFeatureCollection;
  style?: any;
}

// Sample map layers for development and testing
export const DEFAULT_MAP_LAYERS: MapLayer[] = [
  {
    id: 1,
    name: 'Parcels',
    type: MapLayerType.PARCEL,
    visible: true,
    data: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            parcelId: '123456789012345',
            owner: 'John Doe',
            address: '123 Main St',
            acres: 1.5
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-119.18, 46.24],
              [-119.17, 46.24],
              [-119.17, 46.23],
              [-119.18, 46.23],
              [-119.18, 46.24]
            ]]
          }
        },
        {
          type: 'Feature',
          properties: {
            parcelId: '234567890123456',
            owner: 'Jane Smith',
            address: '456 Elm St',
            acres: 2.3
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-119.16, 46.24],
              [-119.15, 46.24],
              [-119.15, 46.23],
              [-119.16, 46.23],
              [-119.16, 46.24]
            ]]
          }
        }
      ]
    },
    style: {
      color: '#3B82F6',
      weight: 2,
      fillOpacity: 0.2,
      fillColor: '#93C5FD'
    }
  },
  {
    id: 2,
    name: 'Zoning',
    type: MapLayerType.ZONING,
    visible: false,
    data: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            zone: 'Residential',
            code: 'R-1'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-119.19, 46.25],
              [-119.17, 46.25],
              [-119.17, 46.23],
              [-119.19, 46.23],
              [-119.19, 46.25]
            ]]
          }
        },
        {
          type: 'Feature',
          properties: {
            zone: 'Commercial',
            code: 'C-1'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-119.17, 46.25],
              [-119.15, 46.25],
              [-119.15, 46.23],
              [-119.17, 46.23],
              [-119.17, 46.25]
            ]]
          }
        }
      ]
    },
    style: {
      color: '#10B981',
      weight: 1,
      fillOpacity: 0.2,
      fillColor: '#6EE7B7'
    }
  },
  {
    id: 3,
    name: 'Hydrology',
    type: MapLayerType.HYDROLOGY,
    visible: false,
    data: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            name: 'Columbia River',
            type: 'River'
          },
          geometry: {
            type: 'LineString',
            coordinates: [
              [-119.20, 46.24],
              [-119.19, 46.23],
              [-119.18, 46.22],
              [-119.17, 46.21],
              [-119.16, 46.20],
              [-119.15, 46.19]
            ]
          }
        }
      ]
    },
    style: {
      color: '#2563EB',
      weight: 2,
      fillOpacity: 0.2,
      fillColor: '#93C5FD'
    }
  }
];

/**
 * Validates a parcel number format according to Benton County standards
 */
export function isValidParcelNumber(parcelNumber: string): boolean {
  // In this simplified implementation, we check that the parcel number:
  // - Is exactly 15 characters long
  // - Contains only digits
  // - Follows a rough pattern of Benton County parcels
  
  if (!parcelNumber || typeof parcelNumber !== 'string') {
    return false;
  }
  
  // Basic format check: 15 digits
  if (!/^\d{15}$/.test(parcelNumber)) {
    return false;
  }
  
  // Further validation could be added here, such as:
  // - Checking specific ranges for section/township/range
  // - Validating check digits
  // - Ensuring the pattern follows county-specific rules
  
  return true;
}

/**
 * Calculates the area of a GeoJSON geometry in square meters
 */
export function calculateArea(geojson: GeoJSONFeature | GeoJSONFeatureCollection): number {
  return turf.area(geojson);
}

/**
 * Converts square meters to acres
 */
export function squareMetersToAcres(squareMeters: number): number {
  return squareMeters * 0.000247105;
}

/**
 * Converts square meters to square feet
 */
export function squareMetersToSquareFeet(squareMeters: number): number {
  return squareMeters * 10.7639;
}

/**
 * Formats coordinates as a readable string
 */
export function formatCoordinates(coordinates: [number, number]): string {
  return `${coordinates[0].toFixed(5)}, ${coordinates[1].toFixed(5)}`;
}

/**
 * Creates a buffer around a GeoJSON feature
 */
export function createBuffer(feature: GeoJSONFeature, radiusInMeters: number): GeoJSONFeature {
  return turf.buffer(feature, radiusInMeters, { units: 'meters' });
}

/**
 * Calculates the centroid of a GeoJSON feature
 */
export function calculateCentroid(feature: GeoJSONFeature): GeoJSONFeature {
  return turf.centroid(feature);
}

/**
 * Simplifies a GeoJSON feature's geometry
 */
export function simplifyGeometry(feature: GeoJSONFeature, tolerance: number): GeoJSONFeature {
  return turf.simplify(feature, { tolerance });
}

/**
 * Merges multiple GeoJSON features into a single feature
 */
export function mergeFeatures(features: GeoJSONFeature[]): GeoJSONFeature {
  if (features.length === 0) return null as any;
  if (features.length === 1) return features[0];
  
  const collection = turf.featureCollection(features);
  return turf.union(...features);
}

/**
 * Converts a GeoJSON feature to WKT (Well-Known Text)
 */
export function featureToWKT(feature: GeoJSONFeature): string {
  // This is a simple implementation - a full WKT converter would be more complex
  const geometry = feature.geometry;
  
  switch (geometry.type) {
    case 'Point':
      return `POINT(${geometry.coordinates[0]} ${geometry.coordinates[1]})`;
    case 'LineString':
      return `LINESTRING(${geometry.coordinates.map(coord => `${coord[0]} ${coord[1]}`).join(', ')})`;
    case 'Polygon':
      return `POLYGON((${geometry.coordinates[0].map(coord => `${coord[0]} ${coord[1]}`).join(', ')}))`;
    default:
      return '';
  }
}

/**
 * Gets sample style for displaying GeoJSON on the map
 */
export function getDefaultLayerStyle(layerType: MapLayerType): any {
  switch (layerType) {
    case MapLayerType.PARCEL:
      return {
        color: '#3B82F6',
        weight: 2,
        fillOpacity: 0.2,
        fillColor: '#93C5FD'
      };
    case MapLayerType.ZONING:
      return {
        color: '#10B981',
        weight: 1,
        fillOpacity: 0.2,
        fillColor: '#6EE7B7'
      };
    case MapLayerType.STREET:
      return {
        color: '#6B7280',
        weight: 3,
        fillOpacity: 0,
        fillColor: 'transparent'
      };
    case MapLayerType.HYDROLOGY:
      return {
        color: '#2563EB',
        weight: 1,
        fillOpacity: 0.2,
        fillColor: '#93C5FD'
      };
    default:
      return {
        color: '#3B82F6',
        weight: 2,
        fillOpacity: 0.2,
        fillColor: '#93C5FD'
      };
  }
}

/**
 * Gets a base map layer URL based on the layer type
 */
export function getBaseMapUrl(baseMapType: 'street' | 'satellite' | 'topo'): string {
  switch (baseMapType) {
    case 'street':
      return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    case 'satellite':
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    case 'topo':
      return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
    default:
      return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  }
}

/**
 * Gets attribution information for base maps
 */
export function getBaseMapAttribution(baseMapType: 'street' | 'satellite' | 'topo'): string {
  switch (baseMapType) {
    case 'street':
      return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    case 'satellite':
      return '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
    case 'topo':
      return 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>';
    default:
      return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  }
}

/**
 * Compares two GeoJSON features for equality
 */
export function areGeoJSONFeaturesEqual(feature1: GeoJSONFeature, feature2: GeoJSONFeature): boolean {
  return JSON.stringify(feature1) === JSON.stringify(feature2);
}

/**
 * Calculates the distance between two points
 */
export function calculateDistance(
  point1: [number, number], 
  point2: [number, number], 
  units: 'meters' | 'kilometers' | 'miles' | 'feet' = 'kilometers'
): number {
  const from = turf.point(point1);
  const to = turf.point(point2);
  return turf.distance(from, to, { units });
}

/**
 * Finds the bounding box for a collection of features
 */
export function calculateBoundingBox(features: GeoJSONFeature[]): [number, number, number, number] {
  if (features.length === 0) {
    // Default to a bounding box for the US
    return [-125.0, 24.0, -66.0, 49.0];
  }
  
  const collection = turf.featureCollection(features);
  return turf.bbox(collection);
}

/**
 * Formats area units properly
 */
export function formatArea(areaInSquareMeters: number): string {
  if (areaInSquareMeters >= 10000) {
    // Show in hectares
    return `${(areaInSquareMeters / 10000).toFixed(2)} ha`;
  } else {
    // Show in square meters
    return `${Math.round(areaInSquareMeters)} m²`;
  }
}

/**
 * Formats distance units properly
 */
export function formatDistance(distanceInMeters: number): string {
  if (distanceInMeters >= 1000) {
    // Show in kilometers
    return `${(distanceInMeters / 1000).toFixed(2)} km`;
  } else {
    // Show in meters
    return `${Math.round(distanceInMeters)} m`;
  }
}

/**
 * Validates GeoJSON data
 */
export function isValidGeoJSON(data: any): boolean {
  try {
    // Basic schema validation
    if (!data || typeof data !== 'object') return false;
    
    // Check for FeatureCollection
    if (data.type === 'FeatureCollection') {
      if (!Array.isArray(data.features)) return false;
      
      // Check each feature
      return data.features.every((feature: any) => 
        feature.type === 'Feature' && 
        feature.geometry && 
        typeof feature.geometry === 'object' &&
        feature.geometry.type && 
        typeof feature.geometry.type === 'string' &&
        feature.geometry.coordinates && 
        Array.isArray(feature.geometry.coordinates)
      );
    }
    
    // Check for single Feature
    if (data.type === 'Feature') {
      return data.geometry && 
        typeof data.geometry === 'object' &&
        data.geometry.type && 
        typeof data.geometry.type === 'string' &&
        data.geometry.coordinates && 
        Array.isArray(data.geometry.coordinates);
    }
    
    return false;
  } catch (error) {
    return false;
  }
}