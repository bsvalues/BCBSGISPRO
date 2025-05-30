import * as turf from '@turf/turf';
import { Feature, FeatureCollection, Geometry, GeoJsonProperties, Position, Polygon, MultiPolygon, LineString } from 'geojson';
import L from 'leaflet';
import { GeoJSONFeature } from './map-utils';

/**
 * Version tracking for drawn features
 */
export interface FeatureVersion {
  id: string;
  feature: GeoJSONFeature;
  timestamp: Date;
  createdBy?: string;
  description?: string;
}

/**
 * Stores feature version history
 */
export class FeatureVersionTracker {
  private versionHistory: Map<string, FeatureVersion[]> = new Map();
  
  /**
   * Add a new version of a feature
   * @param featureId Unique feature identifier
   * @param feature The GeoJSON feature
   * @param description Optional description of changes
   * @param createdBy Optional user who created this version
   */
  addVersion(
    featureId: string, 
    feature: GeoJSONFeature, 
    description?: string,
    createdBy?: string
  ): void {
    const version: FeatureVersion = {
      id: `${featureId}-${Date.now()}`,
      feature: JSON.parse(JSON.stringify(feature)), // Deep clone to prevent mutation
      timestamp: new Date(),
      description,
      createdBy
    };
    
    if (!this.versionHistory.has(featureId)) {
      this.versionHistory.set(featureId, []);
    }
    
    this.versionHistory.get(featureId)!.push(version);
  }
  
  /**
   * Get all versions of a feature
   * @param featureId Unique feature identifier
   * @returns Array of feature versions, most recent first
   */
  getVersions(featureId: string): FeatureVersion[] {
    if (!this.versionHistory.has(featureId)) {
      return [];
    }
    
    return [...this.versionHistory.get(featureId)!].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }
  
  /**
   * Get a specific version of a feature
   * @param featureId Unique feature identifier
   * @param versionId Version identifier
   * @returns The feature version or undefined if not found
   */
  getVersion(featureId: string, versionId: string): FeatureVersion | undefined {
    if (!this.versionHistory.has(featureId)) {
      return undefined;
    }
    
    return this.versionHistory.get(featureId)!.find(v => v.id === versionId);
  }
  
  /**
   * Get the most recent version of a feature
   * @param featureId Unique feature identifier
   * @returns The most recent feature version or undefined if not found
   */
  getLatestVersion(featureId: string): FeatureVersion | undefined {
    if (!this.versionHistory.has(featureId)) {
      return undefined;
    }
    
    const versions = this.versionHistory.get(featureId)!;
    return versions.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    )[0];
  }
  
  /**
   * Clear version history for a feature
   * @param featureId Unique feature identifier
   */
  clearHistory(featureId: string): void {
    this.versionHistory.delete(featureId);
  }
  
  /**
   * Clear all version history
   */
  clearAllHistory(): void {
    this.versionHistory.clear();
  }
  
  /**
   * Export version history to JSON
   */
  exportHistory(): string {
    const export_data: Record<string, FeatureVersion[]> = {};
    
    this.versionHistory.forEach((versions, featureId) => {
      export_data[featureId] = versions;
    });
    
    return JSON.stringify(export_data);
  }
  
  /**
   * Import version history from JSON
   * @param json JSON string of version history
   */
  importHistory(json: string): void {
    try {
      const import_data = JSON.parse(json) as Record<string, FeatureVersion[]>;
      
      Object.entries(import_data).forEach(([featureId, versions]) => {
        this.versionHistory.set(featureId, versions.map(v => ({
          ...v,
          timestamp: new Date(v.timestamp) // Convert string back to Date
        })));
      });
    } catch (error) {
      console.error('Failed to import version history:', error);
    }
  }
}

/**
 * Create a feature with proper GeoJSON structure and metadata
 * @param geometry The GeoJSON geometry
 * @param properties Properties for the feature
 * @returns A properly formatted GeoJSON feature
 */
export function createFeature(
  geometry: Geometry,
  properties: GeoJsonProperties = {}
): GeoJSONFeature {
  return {
    type: 'Feature',
    geometry,
    properties: {
      ...properties,
      createdAt: new Date().toISOString(),
      id: `feature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
  };
}

/**
 * Create a legal description from a polygon feature
 * @param feature Polygon feature to describe
 * @returns A legal description string
 */
export function generateLegalDescription(feature: GeoJSONFeature): string {
  if (feature.geometry.type !== 'Polygon' && feature.geometry.type !== 'MultiPolygon') {
    return 'Only polygon features can have legal descriptions generated.';
  }
  
  try {
    // This is a simplified implementation - a real implementation would:
    // 1. Find the bearing and distance between each vertex
    // 2. Identify the starting point (often a known survey marker)
    // 3. Format in typical legal description format with Township/Range/Section info
    
    let description = 'LEGAL DESCRIPTION:\n';
    description += 'A parcel of land situated in the County of Benton, State of Washington, more particularly described as follows:\n\n';
    
    const coordinates = feature.geometry.type === 'Polygon' 
      ? feature.geometry.coordinates[0] 
      : feature.geometry.coordinates[0][0];
    
    description += 'BEGINNING at a point with coordinates ';
    description += `${coordinates[0][1].toFixed(6)}° North, ${Math.abs(coordinates[0][0]).toFixed(6)}° West; `;
    
    for (let i = 1; i < coordinates.length; i++) {
      const startPoint = turf.point([coordinates[i-1][0], coordinates[i-1][1]]);
      const endPoint = turf.point([coordinates[i][0], coordinates[i][1]]);
      
      // Calculate distance and bearing between points
      const distance = turf.distance(startPoint, endPoint, { units: 'feet' });
      const bearing = turf.bearing(startPoint, endPoint);
      
      // Format bearing as degrees, minutes, seconds
      const bearingDMS = formatBearingAsDMS(bearing);
      
      description += `\nTHENCE ${bearingDMS} a distance of ${distance.toFixed(2)} feet; `;
    }
    
    description += '\n\nSAID PARCEL contains ';
    const area = turf.area(feature);
    const areaAcres = area / 4046.86;
    description += `${areaAcres.toFixed(3)} acres (${Math.round(area)} square meters).`;
    
    return description;
  } catch (error) {
    console.error('Error generating legal description:', error);
    return 'Unable to generate legal description due to an error.';
  }
}

/**
 * Format a bearing in decimal degrees as a direction with degrees, minutes, seconds
 * @param bearing Bearing in decimal degrees (-180 to 180)
 * @returns Formatted bearing string (e.g., "N 45° 30' 22" E")
 */
function formatBearingAsDMS(bearing: number): string {
  // Normalize bearing to 0-360
  let normalizedBearing = bearing;
  if (normalizedBearing < 0) {
    normalizedBearing += 360;
  }
  
  // Determine cardinal direction
  let direction: string;
  if (normalizedBearing >= 0 && normalizedBearing < 90) {
    direction = 'N ${degrees}° ${minutes}\' ${seconds}" E';
  } else if (normalizedBearing >= 90 && normalizedBearing < 180) {
    normalizedBearing = 180 - normalizedBearing;
    direction = 'S ${degrees}° ${minutes}\' ${seconds}" E';
  } else if (normalizedBearing >= 180 && normalizedBearing < 270) {
    normalizedBearing = normalizedBearing - 180;
    direction = 'S ${degrees}° ${minutes}\' ${seconds}" W';
  } else {
    normalizedBearing = 360 - normalizedBearing;
    direction = 'N ${degrees}° ${minutes}\' ${seconds}" W';
  }
  
  // Convert decimal degrees to DMS
  const degrees = Math.floor(normalizedBearing);
  const minutesDecimal = (normalizedBearing - degrees) * 60;
  const minutes = Math.floor(minutesDecimal);
  const seconds = Math.round((minutesDecimal - minutes) * 60);
  
  // Replace placeholders with actual values
  return direction
    .replace('${degrees}', degrees.toString())
    .replace('${minutes}', minutes.toString())
    .replace('${seconds}', seconds.toString());
}

/**
 * Find the nearest point on any feature in a collection
 * @param point The point coordinates [lng, lat]
 * @param features Collection of features to search
 * @param maxDistance Maximum distance to search (in meters)
 * @returns The nearest point on any feature, or null if none found within maxDistance
 */
export function findNearestPoint(
  point: [number, number],
  features: GeoJSONFeature[],
  maxDistance: number = 10 // meters
): { point: [number, number]; feature: GeoJSONFeature; distance: number } | null {
  if (features.length === 0) return null;
  
  const searchPoint = turf.point(point);
  let nearestPoint = null;
  let nearestFeature = null;
  let minDistance = Infinity;
  
  for (const feature of features) {
    // Skip non-geometry features
    if (!feature.geometry) continue;
    
    // Find nearest point on the feature
    let pointOnFeature;
    try {
      pointOnFeature = turf.nearestPointOnLine(feature as any, searchPoint);
      
      const distance = pointOnFeature.properties.dist * 1000; // Convert km to m
      if (distance < minDistance && distance <= maxDistance) {
        minDistance = distance;
        nearestPoint = pointOnFeature.geometry.coordinates as [number, number];
        nearestFeature = feature;
      }
    } catch (error) {
      // Skip features that can't be processed
      console.warn('Error finding nearest point on feature:', error);
      continue;
    }
  }
  
  if (nearestPoint && nearestFeature) {
    return {
      point: nearestPoint,
      feature: nearestFeature,
      distance: minDistance
    };
  }
  
  return null;
}

/**
 * Split a polygon by a line
 * @param polygon The polygon to split
 * @param line The line to use for splitting
 * @returns An array of polygon features resulting from the split
 */
export function splitPolygon(
  polygon: GeoJSONFeature,
  line: GeoJSONFeature
): GeoJSONFeature[] {
  try {
    if (polygon.geometry.type !== 'Polygon' && polygon.geometry.type !== 'MultiPolygon') {
      throw new Error('Feature must be a polygon for splitting');
    }
    
    if (line.geometry.type !== 'LineString') {
      throw new Error('Splitting feature must be a LineString');
    }
    
    // Use turf.js to split the polygon
    const polygons = turf.lineSplit(polygon, line);
    
    // Convert result to GeoJSON features
    return polygons.features as GeoJSONFeature[];
  } catch (error) {
    console.error('Error splitting polygon:', error);
    return [polygon]; // Return original polygon on error
  }
}

/**
 * Join two polygons if they share a border
 * @param polygon1 First polygon
 * @param polygon2 Second polygon
 * @returns The merged polygon or null if they don't share a border
 */
export function joinPolygons(
  polygon1: GeoJSONFeature,
  polygon2: GeoJSONFeature
): GeoJSONFeature | null {
  try {
    // Check if polygons share a border
    const border1 = turf.polygonToLine(polygon1);
    const border2 = turf.polygonToLine(polygon2);
    
    // Find intersection points
    const intersection = turf.lineOverlap(border1, border2, { tolerance: 0.001 });
    
    // If no overlap, return null
    if (intersection.features.length === 0) {
      return null;
    }
    
    // Merge the polygons
    const union = turf.union(polygon1, polygon2);
    return union as GeoJSONFeature;
  } catch (error) {
    console.error('Error joining polygons:', error);
    return null;
  }
}

/**
 * Check if a point is snappable to a feature
 * @param point The point to check [lng, lat]
 * @param feature The feature to check against
 * @param tolerance The snapping tolerance in meters
 * @returns The snapped point or null if not snappable
 */
export function canSnapToFeature(
  point: [number, number],
  feature: GeoJSONFeature,
  tolerance: number = 10 // meters
): [number, number] | null {
  try {
    const searchPoint = turf.point(point);
    let nearestPoint;
    
    // Handle different geometry types
    switch (feature.geometry.type) {
      case 'Point':
        const distance = turf.distance(
          searchPoint,
          turf.point(feature.geometry.coordinates as [number, number]),
          { units: 'meters' }
        );
        if (distance <= tolerance) {
          return feature.geometry.coordinates as [number, number];
        }
        break;
        
      case 'LineString':
      case 'MultiLineString':
      case 'Polygon':
      case 'MultiPolygon':
        nearestPoint = turf.nearestPointOnLine(feature as any, searchPoint);
        if (nearestPoint.properties.dist * 1000 <= tolerance) { // Convert km to m
          return nearestPoint.geometry.coordinates as [number, number];
        }
        break;
        
      default:
        return null;
    }
    
    return null;
  } catch (error) {
    console.error('Error checking snapping:', error);
    return null;
  }
}

/**
 * Generate a unique identifier for a feature
 * @returns A unique feature ID
 */
export function generateFeatureId(): string {
  return `feature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a rectangle with precise dimensions
 * @param center Center point [lng, lat]
 * @param width Width in meters
 * @param height Height in meters
 * @returns A polygon feature representing the rectangle
 */
export function createRectangle(
  center: [number, number],
  width: number, // meters
  height: number // meters
): GeoJSONFeature {
  // Create a point at the center
  const centerPoint = turf.point(center);
  
  // Create a bounding box around the center point
  const bbox = [
    turf.destination(centerPoint, width / 2000, -90, { units: 'kilometers' }).geometry.coordinates[0],
    turf.destination(centerPoint, height / 2000, -180, { units: 'kilometers' }).geometry.coordinates[1],
    turf.destination(centerPoint, width / 2000, 90, { units: 'kilometers' }).geometry.coordinates[0],
    turf.destination(centerPoint, height / 2000, 0, { units: 'kilometers' }).geometry.coordinates[1]
  ];
  
  // Create a polygon from the bounding box
  const rectangle = turf.bboxPolygon(bbox);
  
  // Add metadata
  rectangle.properties = {
    createdAt: new Date().toISOString(),
    id: generateFeatureId(),
    type: 'rectangle',
    width,
    height
  };
  
  return rectangle as GeoJSONFeature;
}

/**
 * Create a circle with precise radius
 * @param center Center point [lng, lat]
 * @param radius Radius in meters
 * @returns A polygon feature approximating the circle
 */
export function createCircle(
  center: [number, number],
  radius: number // meters
): GeoJSONFeature {
  // Create circle using turf
  const circle = turf.circle(center, radius / 1000, {
    steps: 64,
    units: 'kilometers'
  });
  
  // Add metadata
  circle.properties = {
    createdAt: new Date().toISOString(),
    id: generateFeatureId(),
    type: 'circle',
    radius
  };
  
  return circle as GeoJSONFeature;
}

/**
 * Create a georeferenced grid
 * @param bounds Bounding box [minLng, minLat, maxLng, maxLat]
 * @param cellWidth Cell width in meters
 * @param cellHeight Cell height in meters
 * @returns A feature collection of grid cells
 */
export function createGrid(
  bounds: [number, number, number, number],
  cellWidth: number, // meters
  cellHeight: number // meters
): FeatureCollection {
  // Create a bounding box polygon
  const bbox = turf.bboxPolygon(bounds);
  
  // Create a grid using turf
  const grid = turf.squareGrid(bounds, cellWidth / 1000, {
    units: 'kilometers',
    properties: {
      createdAt: new Date().toISOString(),
      type: 'grid',
      cellWidth,
      cellHeight
    }
  });
  
  return grid;
}

/**
 * Generate a parcel number based on Benton County standards
 * @param township Township number
 * @param range Range number
 * @param section Section number
 * @param quarter Quarter section code (NE, NW, SE, SW)
 * @param parcel Parcel number within quarter section
 * @returns A formatted 15-digit parcel number
 */
export function generateParcelNumber(
  township: number,
  range: number,
  section: number,
  quarter: string,
  parcel: number
): string {
  // Convert quarter section to numeric code
  let quarterCode: number;
  switch (quarter.toUpperCase()) {
    case 'NE': quarterCode = 1; break;
    case 'NW': quarterCode = 2; break;
    case 'SE': quarterCode = 3; break;
    case 'SW': quarterCode = 4; break;
    default: quarterCode = 0;
  }
  
  // Format numbers with leading zeros
  const townshipStr = township.toString().padStart(2, '0');
  const rangeStr = range.toString().padStart(2, '0');
  const sectionStr = section.toString().padStart(2, '0');
  const quarterStr = quarterCode.toString();
  const parcelStr = parcel.toString().padStart(7, '0');
  
  // Create the 15-digit parcel number
  return `${townshipStr}${rangeStr}${sectionStr}${quarterStr}${parcelStr}`;
}