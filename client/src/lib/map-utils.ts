/**
 * Map utility functions and types for BentonGeoPro
 */

// Map tool enum to track the currently selected mapping tool
export enum MapTool {
  PAN = 'Pan',
  SELECT = 'Select',
  MEASURE = 'Measure',
  DRAW = 'Draw',
  EDIT = 'Edit',
  DELETE = 'Delete',
  IDENTIFY = 'Identify',
  BUFFER = 'Buffer',
  ATTRIBUTE = 'Attribute',
  ZOOM_IN = 'Zoom In',
  ZOOM_OUT = 'Zoom Out',
  ZOOM_EXTENT = 'Zoom to Extent'
}

// Measurement units for distance and area calculations
export enum MeasurementUnit {
  FEET = 'Feet',
  METERS = 'Meters',
  MILES = 'Miles',
  KILOMETERS = 'Kilometers',
  ACRES = 'Acres',
  HECTARES = 'Hectares',
  SQUARE_FEET = 'Square Feet',
  SQUARE_METERS = 'Square Meters'
}

// Layer type for managing different map layers
export enum LayerType {
  BASE = 'Base',
  PARCEL = 'Parcel',
  SECTION = 'Section',
  ZONING = 'Zoning',
  FLOODPLAIN = 'Floodplain',
  AERIAL = 'Aerial',
  ANNOTATION = 'Annotation',
  CUSTOM = 'Custom'
}

// GeoJSON types for working with spatial data
export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface GeoJSONLineString {
  type: 'LineString';
  coordinates: [number, number][]; // Array of [longitude, latitude] points
}

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: [number, number][][]; // Array of arrays of [longitude, latitude] points (outer ring + holes)
}

export interface GeoJSONMultiPolygon {
  type: 'MultiPolygon';
  coordinates: [number, number][][][]; // Array of polygon coordinates
}

export type GeoJSONGeometry = 
  | GeoJSONPoint 
  | GeoJSONLineString 
  | GeoJSONPolygon 
  | GeoJSONMultiPolygon;

export interface GeoJSONFeature<P = any, G = GeoJSONGeometry> {
  type: 'Feature';
  geometry: G;
  properties: P;
  id?: string | number;
}

export interface GeoJSONFeatureCollection<P = any, G = GeoJSONGeometry> {
  type: 'FeatureCollection';
  features: GeoJSONFeature<P, G>[];
}

// Map view settings type
export interface MapViewSettings {
  center: [number, number]; // [longitude, latitude]
  zoom: number;
  basemap: string;
  layers: { [key: string]: boolean };
  layerOpacity: { [key: string]: number };
}

// Default settings for Benton County map view
export const defaultMapSettings: MapViewSettings = {
  center: [-123.2615, 44.5698], // Center on Corvallis, OR
  zoom: 11,
  basemap: 'streets',
  layers: {
    parcels: true,
    sections: true,
    zoning: false,
    floodplain: false,
    aerials: false
  },
  layerOpacity: {
    parcels: 1.0,
    sections: 0.8,
    zoning: 0.7,
    floodplain: 0.6,
    aerials: 0.9
  }
};

// Function to convert between measurement units
export function convertMeasurement(
  value: number, 
  fromUnit: MeasurementUnit, 
  toUnit: MeasurementUnit
): number {
  // Convert to base units (meters for distance, square meters for area)
  let baseValue: number;
  
  // Handle distance conversions
  if (
    [MeasurementUnit.FEET, MeasurementUnit.METERS, MeasurementUnit.MILES, MeasurementUnit.KILOMETERS].includes(fromUnit)
  ) {
    // Convert to meters
    switch (fromUnit) {
      case MeasurementUnit.FEET:
        baseValue = value * 0.3048;
        break;
      case MeasurementUnit.METERS:
        baseValue = value;
        break;
      case MeasurementUnit.MILES:
        baseValue = value * 1609.34;
        break;
      case MeasurementUnit.KILOMETERS:
        baseValue = value * 1000;
        break;
      default:
        baseValue = value;
    }
    
    // Convert from meters to desired unit
    switch (toUnit) {
      case MeasurementUnit.FEET:
        return baseValue / 0.3048;
      case MeasurementUnit.METERS:
        return baseValue;
      case MeasurementUnit.MILES:
        return baseValue / 1609.34;
      case MeasurementUnit.KILOMETERS:
        return baseValue / 1000;
      default:
        return baseValue;
    }
  } 
  // Handle area conversions
  else {
    // Convert to square meters
    switch (fromUnit) {
      case MeasurementUnit.SQUARE_FEET:
        baseValue = value * 0.092903;
        break;
      case MeasurementUnit.SQUARE_METERS:
        baseValue = value;
        break;
      case MeasurementUnit.ACRES:
        baseValue = value * 4046.86;
        break;
      case MeasurementUnit.HECTARES:
        baseValue = value * 10000;
        break;
      default:
        baseValue = value;
    }
    
    // Convert from square meters to desired unit
    switch (toUnit) {
      case MeasurementUnit.SQUARE_FEET:
        return baseValue / 0.092903;
      case MeasurementUnit.SQUARE_METERS:
        return baseValue;
      case MeasurementUnit.ACRES:
        return baseValue / 4046.86;
      case MeasurementUnit.HECTARES:
        return baseValue / 10000;
      default:
        return baseValue;
    }
  }
}

// Format measurement with unit
export function formatMeasurement(value: number, unit: MeasurementUnit): string {
  const formattedValue = value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  
  return `${formattedValue} ${unit}`;
}

// Calculate polygon area in square meters
export function calculatePolygonArea(coordinates: [number, number][][]): number {
  // Implementation of the Shoelace formula (Gauss's area formula)
  let area = 0;
  
  // Use the first ring (outer ring) of the polygon
  const ring = coordinates[0];
  
  for (let i = 0; i < ring.length - 1; i++) {
    area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  
  // Close the polygon
  area += ring[ring.length - 1][0] * ring[0][1] - ring[0][0] * ring[ring.length - 1][1];
  
  // The formula gives the area in square degrees which isn't useful
  // This is a rough approximation that works for small areas
  // For a production app, use a proper GIS library like Turf.js
  
  // Convert to square meters (approximate)
  // 1 degree of latitude ≈ 111,320 meters
  // 1 degree of longitude varies with latitude
  const avgLat = ring.reduce((sum, point) => sum + point[1], 0) / ring.length;
  const metersPerDegreeLon = Math.cos(avgLat * Math.PI / 180) * 111320;
  
  // Convert square degrees to square meters
  return Math.abs(area) * 111320 * metersPerDegreeLon / 2;
}

// Calculate distance between two points in meters
export function calculateDistance(
  point1: [number, number], 
  point2: [number, number]
): number {
  // Haversine formula for calculating great-circle distance
  const R = 6371000; // Earth radius in meters
  const φ1 = point1[1] * Math.PI / 180; // latitude 1 in radians
  const φ2 = point2[1] * Math.PI / 180; // latitude 2 in radians
  const Δφ = φ2 - φ1;
  const Δλ = (point2[0] - point1[0]) * Math.PI / 180; // longitude difference in radians

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
}