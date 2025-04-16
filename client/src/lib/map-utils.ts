/**
 * Map Utilities for BentonGeoPro
 * 
 * This file contains utilities and type definitions for working with geospatial data
 */

// Map Tool enum for tool selection
export enum MapTool {
  SELECT = 'select',
  PAN = 'pan',
  DRAW = 'draw',
  MEASURE = 'measure',
  POLYGON = 'polygon',
  CIRCLE = 'circle',
  POINT = 'point',
  LINE = 'line'
}

// Measurement unit enum for distance and area calculations
export enum MeasurementUnit {
  FEET = 'feet',
  METERS = 'meters',
  MILES = 'miles',
  KILOMETERS = 'km',
  ACRES = 'acres',
  HECTARES = 'ha',
  SQUARE_FEET = 'sqft',
  SQUARE_METERS = 'sqm'
}

// GeoJSON Types
export interface GeoJSONGeometry {
  type: string;
  coordinates: any;
}

export interface GeoJSONFeature {
  type: string;
  id?: string;
  properties: Record<string, any>;
  geometry: GeoJSONGeometry;
}

// Map View State
export interface MapViewState {
  center: [number, number]; // [longitude, latitude]
  zoom: number;
  bearing?: number;
  pitch?: number;
}

// Layer Types
export interface MapLayer {
  id: string;
  name: string;
  type: string;
  source: string;
  visible: boolean;
  opacity: number;
  zIndex: number;
  metadata?: Record<string, any>;
}

// Coordinate utility functions
export function formatCoordinates(coords: [number, number], format: 'dms' | 'dd' = 'dd'): string {
  if (format === 'dd') {
    return `${coords[1].toFixed(6)}, ${coords[0].toFixed(6)}`;
  } else {
    // Convert to degrees, minutes, seconds
    const lat = convertToDMS(coords[1], 'lat');
    const lng = convertToDMS(coords[0], 'lng');
    return `${lat} ${lng}`;
  }
}

function convertToDMS(coordinate: number, type: 'lat' | 'lng'): string {
  const absolute = Math.abs(coordinate);
  const degrees = Math.floor(absolute);
  const minutesDecimal = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesDecimal);
  const seconds = Math.floor((minutesDecimal - minutes) * 60);
  
  const direction = type === 'lat'
    ? coordinate >= 0 ? 'N' : 'S'
    : coordinate >= 0 ? 'E' : 'W';
    
  return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
}

// Distance calculation
export function calculateDistance(
  coord1: [number, number],
  coord2: [number, number],
  unit: 'miles' | 'km' | 'feet' | 'meters' = 'feet'
): number {
  const R = unit === 'miles' ? 3958.8 : 
            unit === 'km' ? 6371 : 
            unit === 'feet' ? 20902231 : 
            6371000; // Earth radius in chosen unit
  
  const dLat = toRadians(coord2[1] - coord1[1]);
  const dLon = toRadians(coord2[0] - coord1[0]);
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(toRadians(coord1[1])) * Math.cos(toRadians(coord2[1])) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Area calculation for polygons
export function calculateArea(
  coordinates: number[][][],
  unit: 'acres' | 'sqft' | 'sqm' | 'ha' = 'acres'
): number {
  // Simplified area calculation for demo purposes
  const polygonCoords = coordinates[0]; // Use outer ring
  
  let area = 0;
  for (let i = 0; i < polygonCoords.length - 1; i++) {
    area += polygonCoords[i][0] * polygonCoords[i+1][1] - polygonCoords[i+1][0] * polygonCoords[i][1];
  }
  
  area = Math.abs(area) / 2;
  
  // Convert to desired unit (this is a simplified approximation)
  // For accurate calculations, use a proper geospatial library
  const CONVERSION = {
    acres: 0.00000024711,
    sqft: 10.7639,
    sqm: 1,
    ha: 0.0001
  };
  
  return area * CONVERSION[unit];
}

// Bounding box calculation
export function getBoundingBox(features: GeoJSONFeature[]): [number, number, number, number] {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  features.forEach(feature => {
    if (feature.geometry.type === 'Polygon') {
      const coords = feature.geometry.coordinates[0];
      coords.forEach((coord: [number, number]) => {
        minX = Math.min(minX, coord[0]);
        minY = Math.min(minY, coord[1]);
        maxX = Math.max(maxX, coord[0]);
        maxY = Math.max(maxY, coord[1]);
      });
    }
  });
  
  return [minX, minY, maxX, maxY];
}