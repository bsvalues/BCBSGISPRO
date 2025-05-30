/**
 * Map utility functions for BentonGeoPro application
 * Contains helpers for working with map coordinates, features, and GIS data
 */

// Map tool enumeration
export enum MapTool {
  SELECT = 'select',
  DRAW_POINT = 'draw_point',
  DRAW_LINE = 'draw_line',
  DRAW_POLYGON = 'draw_polygon',
  MEASURE_DISTANCE = 'measure_distance',
  MEASURE_AREA = 'measure_area',
  IDENTIFY = 'identify'
}

// Map layer interface
export interface MapLayer {
  id: string;
  name: string;
  type: 'raster' | 'vector' | 'geojson';
  source: string;
  visible: boolean;
  opacity: number;
  metadata?: Record<string, any>;
  category?: string;
}

// Benton County center coordinates
export const BENTON_COUNTY_CENTER = {
  lat: 46.2587,
  lng: -119.2984
};

// Default zoom level for county view
export const DEFAULT_ZOOM = 11;

// Default basemap style
export const DEFAULT_BASEMAP = 'streets-v11';

// Convert latitude/longitude to a human-readable format
export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  
  const latDeg = Math.abs(lat);
  const lngDeg = Math.abs(lng);
  
  const latMin = (latDeg % 1) * 60;
  const lngMin = (lngDeg % 1) * 60;
  
  const latSec = (latMin % 1) * 60;
  const lngSec = (lngMin % 1) * 60;
  
  return `${Math.floor(latDeg)}° ${Math.floor(latMin)}' ${latSec.toFixed(2)}" ${latDir}, ${Math.floor(lngDeg)}° ${Math.floor(lngMin)}' ${lngSec.toFixed(2)}" ${lngDir}`;
}

// Calculate distance between two points in meters
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  
  const a = 
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

// Format distance in appropriate units
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters.toFixed(1)} m`;
  } else if (meters < 10000) {
    return `${(meters / 1000).toFixed(2)} km`;
  } else {
    return `${(meters / 1000).toFixed(1)} km`;
  }
}

// Calculate area of a polygon in square meters
export function calculateArea(coordinates: [number, number][]): number {
  // Implementation of Shoelace formula for polygon area
  let area = 0;
  
  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    area += coordinates[i][0] * coordinates[j][1];
    area -= coordinates[j][0] * coordinates[i][1];
  }
  
  area = Math.abs(area) / 2;
  
  // Convert to square meters (approximate)
  const lat = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length;
  const metersPerDegree = 111320 * Math.cos((lat * Math.PI) / 180);
  
  return area * metersPerDegree * metersPerDegree;
}

// Format area in appropriate units
export function formatArea(squareMeters: number): string {
  if (squareMeters < 10000) {
    return `${squareMeters.toFixed(1)} m²`;
  } else if (squareMeters < 1000000) {
    return `${(squareMeters / 10000).toFixed(2)} ha`;
  } else {
    return `${(squareMeters / 1000000).toFixed(2)} km²`;
  }
}

// Convert a GeoJSON feature to a simplified property description
export function featureToDescription(feature: any): string {
  if (!feature || !feature.properties) {
    return 'No feature selected';
  }
  
  const props = feature.properties;
  let description = '';
  
  // Try to identify the most common property identifiers
  const identifiers = ['id', 'name', 'title', 'parcelId', 'parcel_id', 'objectid', 'fid'];
  for (const id of identifiers) {
    if (props[id]) {
      description += `ID: ${props[id]}\n`;
      break;
    }
  }
  
  // Add type information if available
  const typeFields = ['type', 'class', 'category', 'zoning', 'landuse', 'land_use'];
  for (const field of typeFields) {
    if (props[field]) {
      description += `Type: ${props[field]}\n`;
      break;
    }
  }
  
  // Add area information if available
  const areaFields = ['area', 'area_sqm', 'shape_area', 'acres'];
  for (const field of areaFields) {
    if (props[field]) {
      const value = props[field];
      description += `Area: ${typeof value === 'number' ? formatArea(value) : value}\n`;
      break;
    }
  }
  
  // If we have an address, add it
  if (props.address || props.street) {
    description += `Address: ${props.address || props.street}\n`;
  }
  
  // If we have an owner, add it
  if (props.owner || props.owner_name) {
    description += `Owner: ${props.owner || props.owner_name}\n`;
  }
  
  // If we have nothing specific, list the first few properties
  if (!description) {
    const entries = Object.entries(props).slice(0, 5);
    description = entries.map(([key, value]) => `${key}: ${value}`).join('\n');
  }
  
  return description;
}

// Benton County GIS layers (would normally come from a server)
export const BENTON_COUNTY_LAYERS: MapLayer[] = [
  {
    id: 'parcels',
    name: 'Property Parcels',
    type: 'vector',
    source: 'benton-gis',
    visible: true,
    opacity: 0.8,
    category: 'Property'
  },
  {
    id: 'zoning',
    name: 'Zoning Districts',
    type: 'vector',
    source: 'benton-gis',
    visible: false,
    opacity: 0.6,
    category: 'Planning'
  },
  {
    id: 'taxlots',
    name: 'Tax Lots',
    type: 'vector',
    source: 'benton-gis',
    visible: true,
    opacity: 0.7,
    category: 'Property'
  },
  {
    id: 'roads',
    name: 'Roads and Highways',
    type: 'vector',
    source: 'benton-gis',
    visible: true,
    opacity: 1.0,
    category: 'Transportation'
  },
  {
    id: 'hydrography',
    name: 'Water Features',
    type: 'vector',
    source: 'benton-gis',
    visible: true,
    opacity: 0.8,
    category: 'Natural'
  },
  {
    id: 'floodplain',
    name: 'Floodplain Boundaries',
    type: 'vector',
    source: 'benton-gis',
    visible: false,
    opacity: 0.6,
    category: 'Natural'
  },
  {
    id: 'administrative',
    name: 'Administrative Boundaries',
    type: 'vector',
    source: 'benton-gis',
    visible: true,
    opacity: 0.7,
    category: 'Administrative'
  },
  {
    id: 'schools',
    name: 'School Districts',
    type: 'vector',
    source: 'benton-gis',
    visible: false,
    opacity: 0.6,
    category: 'Administrative'
  },
  {
    id: 'topography',
    name: 'Topographic Map',
    type: 'raster',
    source: 'usgs',
    visible: false,
    opacity: 0.8,
    category: 'Base Maps'
  },
  {
    id: 'imagery',
    name: 'Aerial Imagery',
    type: 'raster',
    source: 'naip',
    visible: false,
    opacity: 1.0,
    category: 'Base Maps'
  }
];