import * as turf from '@turf/turf';
import { Feature, FeatureCollection, Geometry, GeoJsonProperties, Position, Polygon, MultiPolygon } from 'geojson';
import { MapLayer as DBMapLayer } from '@shared/schema';

export type GeoJSONFeature = Feature<Geometry, GeoJsonProperties>;
export type GeoJSONFeatureCollection = FeatureCollection<Geometry, GeoJsonProperties>;

/**
 * Units for measurements
 */
export enum MeasurementUnit {
  METERS = 'meters',
  KILOMETERS = 'kilometers',
  FEET = 'feet',
  MILES = 'miles',
  ACRES = 'acres',
  HECTARES = 'hectares',
  SQUARE_FEET = 'square_feet',
  SQUARE_METERS = 'square_meters'
}

/**
 * Type of measurement
 */
export enum MeasurementType {
  DISTANCE = 'distance',
  AREA = 'area',
  PERIMETER = 'perimeter'
}

/**
 * Calculate distance between two points in meters
 * @param point1 First point as [latitude, longitude]
 * @param point2 Second point as [latitude, longitude]
 * @param unit Optional unit for result (default: meters)
 * @returns Distance in specified unit
 */
export function calculateDistance(
  point1: [number, number], 
  point2: [number, number],
  unit: MeasurementUnit = MeasurementUnit.METERS
): number {
  const from = turf.point(point1);
  const to = turf.point(point2);
  return turf.distance(from, to, { units: convertToTurfUnits(unit) });
}

/**
 * Calculate area of a polygon in square meters
 * @param polygon Polygon feature
 * @param unit Optional unit for result (default: square meters)
 * @returns Area in specified unit
 */
export function calculateArea(
  polygon: Feature<Polygon | MultiPolygon, GeoJsonProperties>,
  unit: MeasurementUnit = MeasurementUnit.SQUARE_METERS
): number {
  let area = turf.area(polygon);
  
  // Convert from square meters to requested unit
  switch (unit) {
    case MeasurementUnit.HECTARES:
      return area / 10000;
    case MeasurementUnit.ACRES:
      return area / 4046.86;
    case MeasurementUnit.SQUARE_FEET:
      return area * 10.7639;
    default:
      return area;
  }
}

/**
 * Calculate perimeter of a polygon in meters
 * @param polygon Polygon feature
 * @param unit Optional unit for result (default: meters)
 * @returns Perimeter in specified unit
 */
export function calculatePerimeter(
  polygon: Feature<Polygon | MultiPolygon, GeoJsonProperties>,
  unit: MeasurementUnit = MeasurementUnit.METERS
): number {
  const line = turf.polygonToLine(polygon);
  return turf.length(line, { units: convertToTurfUnits(unit) });
}

/**
 * Convert an array of points to a polygon feature
 * @param points Array of [lat, lon] points
 * @returns GeoJSON Polygon Feature
 */
export function pointsToPolygon(points: Position[]): Feature<Polygon, GeoJsonProperties> {
  // Ensure the polygon is closed (first point = last point)
  const closedPoints = [...points];
  if (
    closedPoints[0][0] !== closedPoints[closedPoints.length - 1][0] || 
    closedPoints[0][1] !== closedPoints[closedPoints.length - 1][1]
  ) {
    closedPoints.push(closedPoints[0]);
  }
  return turf.polygon([closedPoints]);
}

/**
 * Convert database opacity value (0-100) to UI opacity value (0-1)
 */
export function dbToUiOpacity(opacity: number | null | undefined): number {
  if (opacity === null || opacity === undefined) {
    return 1; // Default opacity if not specified
  }
  return opacity / 100;
}

/**
 * Convert UI opacity value (0-1) to database opacity value (0-100) 
 */
export function uiToDbOpacity(opacity: number): number {
  return Math.round(opacity * 100);
}

/**
 * Helper to safely access map layer zIndex property
 */
export function getLayerZIndex(layer: DBMapLayer): number {
  return layer.zindex ?? 0;
}

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

// Client-side MapLayer interface for UI use
export interface MapLayer {
  id: number;
  name: string;
  type: MapLayerType;
  visible: boolean;
  source?: string;
  opacity?: number; // UI opacity value (0-1)
  zindex?: number; // Layer stacking order (z-index)
  order?: number; // Display order in layer control
  data: GeoJSONFeature[] | GeoJSONFeatureCollection;
  style?: any;
  metadata?: any;
}

// Sample map layers for development and testing
export const DEFAULT_MAP_LAYERS: MapLayer[] = [
  {
    id: 1,
    name: 'Parcels',
    type: MapLayerType.PARCEL,
    visible: true,
    source: 'benton_county_gis',
    opacity: 1, // UI opacity (0-1)
    zindex: 10,
    order: 1,
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
    source: 'benton_county_gis',
    opacity: 0.8, // UI opacity (0-1)
    zindex: 5,
    order: 2,
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
    source: 'usgs_nhd',
    opacity: 0.7, // UI opacity (0-1)
    zindex: 3,
    order: 3,
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
  const result = turf.buffer(feature, radiusInMeters, { units: 'meters' });
  return result as GeoJSONFeature;
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
  if (features.length === 2) {
    return turf.union(features[0], features[1]);
  }
  
  // For more than 2 features, perform sequential unions
  let result = turf.union(features[0], features[1]);
  for (let i = 2; i < features.length; i++) {
    result = turf.union(result, features[i]);
  }
  
  return result as GeoJSONFeature;
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
 * Helper function to convert between MeasurementUnit and Turf.js units
 */
function convertToTurfUnits(unit: MeasurementUnit): string {
  switch (unit) {
    case MeasurementUnit.KILOMETERS:
      return 'kilometers';
    case MeasurementUnit.METERS:
      return 'meters';
    case MeasurementUnit.MILES:
      return 'miles';
    case MeasurementUnit.FEET:
      return 'feet';
    default:
      return 'meters';
  }
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
  const bbox = turf.bbox(collection);
  
  // Handle different bbox formats - turf can return either [minX, minY, maxX, maxY] or [minX, minY, minZ, maxX, maxY, maxZ]
  // We only need the first 4 values for a 2D bounding box
  return [bbox[0], bbox[1], bbox[2], bbox[3]];
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