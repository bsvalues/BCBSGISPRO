/**
 * Map utility functions for the CartographyModule
 */
import { v4 as uuidv4 } from 'uuid';
import { GeoJSONFeature, MapLayerStyle } from '../types';

/**
 * Generate a unique ID
 * 
 * @returns A unique UUID
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Create a GeoJSON feature with the given geometry and properties
 * 
 * @param type - The geometry type
 * @param coordinates - The coordinates of the geometry
 * @param properties - Additional properties to add to the feature
 * @returns A GeoJSON feature
 */
export function createFeature(
  type: string,
  coordinates: number[] | number[][] | number[][][],
  properties: Record<string, any> = {}
): GeoJSONFeature {
  return {
    type: 'Feature',
    geometry: {
      type,
      coordinates
    },
    properties: {
      id: properties.id || generateId(),
      ...properties
    }
  };
}

/**
 * Create a GeoJSON Point feature
 * 
 * @param coordinates - The coordinates of the point [longitude, latitude]
 * @param properties - Additional properties to add to the feature
 * @returns A GeoJSON Point feature
 */
export function createPoint(
  coordinates: [number, number],
  properties: Record<string, any> = {}
): GeoJSONFeature {
  return createFeature('Point', coordinates, properties);
}

/**
 * Create a GeoJSON LineString feature
 * 
 * @param coordinates - The coordinates of the linestring [[longitude, latitude], ...]
 * @param properties - Additional properties to add to the feature
 * @returns A GeoJSON LineString feature
 */
export function createLineString(
  coordinates: Array<[number, number]>,
  properties: Record<string, any> = {}
): GeoJSONFeature {
  return createFeature('LineString', coordinates, properties);
}

/**
 * Create a GeoJSON Polygon feature
 * 
 * @param coordinates - The coordinates of the polygon [[[longitude, latitude], ...]]
 * @param properties - Additional properties to add to the feature
 * @returns A GeoJSON Polygon feature
 */
export function createPolygon(
  coordinates: Array<Array<[number, number]>>,
  properties: Record<string, any> = {}
): GeoJSONFeature {
  return createFeature('Polygon', coordinates, properties);
}

/**
 * Create a rectangle as a GeoJSON Polygon feature
 * 
 * @param center - The center of the rectangle [longitude, latitude]
 * @param width - The width of the rectangle in meters
 * @param height - The height of the rectangle in meters
 * @param properties - Additional properties to add to the feature
 * @returns A GeoJSON Polygon feature representing a rectangle
 */
export function createRectangle(
  center: [number, number],
  width: number,
  height: number,
  properties: Record<string, any> = {}
): GeoJSONFeature {
  // Calculate the coordinates for a rectangle centered at the given point
  const [centerLng, centerLat] = center;
  
  // Calculate the approximate degrees for the given dimensions
  // This is a rough approximation that works for small areas
  const latDegrees = height / 111320; // 111.32 km per degree latitude
  const lngDegrees = width / (111320 * Math.cos(centerLat * (Math.PI / 180))); // Adjust for latitude
  
  const halfLatDegrees = latDegrees / 2;
  const halfLngDegrees = lngDegrees / 2;
  
  // Create the rectangle coordinates - note the order matters for valid GeoJSON
  const coordinates = [[
    [centerLng - halfLngDegrees, centerLat - halfLatDegrees], // bottom-left
    [centerLng + halfLngDegrees, centerLat - halfLatDegrees], // bottom-right
    [centerLng + halfLngDegrees, centerLat + halfLatDegrees], // top-right
    [centerLng - halfLngDegrees, centerLat + halfLatDegrees], // top-left
    [centerLng - halfLngDegrees, centerLat - halfLatDegrees]  // close the ring
  ]];
  
  // Set special property to identify this as a rectangle
  const rectangleProperties = {
    shape: 'rectangle',
    width,
    height,
    ...properties
  };
  
  return createPolygon(coordinates, rectangleProperties);
}

/**
 * Create a circle as a GeoJSON Polygon feature
 * 
 * @param center - The center of the circle [longitude, latitude]
 * @param radius - The radius of the circle in meters
 * @param numPoints - The number of points to use for the circle (default: 32)
 * @param properties - Additional properties to add to the feature
 * @returns A GeoJSON Polygon feature representing a circle
 */
export function createCircle(
  center: [number, number],
  radius: number,
  numPoints: number = 32,
  properties: Record<string, any> = {}
): GeoJSONFeature {
  // Calculate the coordinates for a circle centered at the given point
  const [centerLng, centerLat] = center;
  
  // Earth's radius in meters
  const earthRadius = 6378137;
  
  // Calculate the angular distance in radians
  const angularDistance = radius / earthRadius;
  
  // Generate the points around the circle
  const points: Array<[number, number]> = [];
  for (let i = 0; i <= numPoints; i++) {
    const angle = (i * 2 * Math.PI) / numPoints;
    const latRadians = Math.asin(
      Math.sin(centerLat * (Math.PI / 180)) * Math.cos(angularDistance) +
      Math.cos(centerLat * (Math.PI / 180)) * Math.sin(angularDistance) * Math.cos(angle)
    );
    const lngRadians =
      centerLng * (Math.PI / 180) +
      Math.atan2(
        Math.sin(angle) * Math.sin(angularDistance) * Math.cos(centerLat * (Math.PI / 180)),
        Math.cos(angularDistance) - Math.sin(centerLat * (Math.PI / 180)) * Math.sin(latRadians)
      );
    
    // Convert back to degrees
    const lat = latRadians * (180 / Math.PI);
    const lng = lngRadians * (180 / Math.PI);
    
    points.push([lng, lat]);
  }
  
  // Set special property to identify this as a circle
  const circleProperties = {
    shape: 'circle',
    radius,
    ...properties
  };
  
  return createPolygon([points], circleProperties);
}

/**
 * Get the default style for a map feature
 * 
 * @param featureType - The type of feature
 * @returns A style object for the feature
 */
export function getDefaultStyle(featureType: string): MapLayerStyle {
  switch (featureType) {
    case 'Point':
      return {
        color: '#3388ff',
        weight: 3,
        opacity: 1,
        fillColor: '#3388ff',
        fillOpacity: 0.5
      };
    case 'LineString':
      return {
        color: '#3388ff',
        weight: 3,
        opacity: 1
      };
    case 'Polygon':
      return {
        color: '#3388ff',
        weight: 3,
        opacity: 1,
        fillColor: '#3388ff',
        fillOpacity: 0.2
      };
    default:
      return {
        color: '#3388ff',
        weight: 3,
        opacity: 1,
        fillColor: '#3388ff',
        fillOpacity: 0.2
      };
  }
}

/**
 * Class for tracking feature version history
 */
export class FeatureVersionTracker {
  private versions: Record<string, Array<{
    id: string;
    feature: GeoJSONFeature;
    timestamp: string;
    description: string;
  }>> = {};
  
  /**
   * Add a version to the history
   * 
   * @param featureId - The ID of the feature
   * @param feature - The GeoJSON feature
   * @param description - A description of the changes
   * @returns The ID of the version
   */
  addVersion(featureId: string, feature: GeoJSONFeature, description: string): string {
    const versionId = generateId();
    const timestamp = new Date().toISOString();
    
    if (!this.versions[featureId]) {
      this.versions[featureId] = [];
    }
    
    this.versions[featureId].push({
      id: versionId,
      feature,
      timestamp,
      description
    });
    
    // Keep at most 100 versions per feature
    if (this.versions[featureId].length > 100) {
      this.versions[featureId].shift();
    }
    
    return versionId;
  }
  
  /**
   * Get a version from the history
   * 
   * @param featureId - The ID of the feature
   * @param versionId - The ID of the version
   * @returns The version, or undefined if not found
   */
  getVersion(featureId: string, versionId: string): {
    id: string;
    feature: GeoJSONFeature;
    timestamp: string;
    description: string;
  } | undefined {
    if (!this.versions[featureId]) {
      return undefined;
    }
    
    return this.versions[featureId].find(v => v.id === versionId);
  }
  
  /**
   * Get all versions for a feature
   * 
   * @param featureId - The ID of the feature
   * @returns An array of versions
   */
  getVersions(featureId: string): Array<{
    id: string;
    feature: GeoJSONFeature;
    timestamp: string;
    description: string;
  }> {
    if (!this.versions[featureId]) {
      return [];
    }
    
    return [...this.versions[featureId]].reverse();
  }
  
  /**
   * Delete all versions for a feature
   * 
   * @param featureId - The ID of the feature
   */
  deleteFeatureVersions(featureId: string): void {
    delete this.versions[featureId];
  }
}

/**
 * Generate a legal description from a GeoJSON feature
 * 
 * @param feature - The GeoJSON feature
 * @returns A legal description of the feature
 */
export function generateLegalDescription(feature: GeoJSONFeature): string {
  // This is a placeholder implementation - in a real app, this would use
  // OpenAI's API to generate a more accurate legal description based on
  // the feature geometry
  
  if (!feature || !feature.geometry) {
    return 'Invalid feature';
  }
  
  const { type } = feature.geometry;
  
  if (type === 'Point') {
    const [lng, lat] = feature.geometry.coordinates as [number, number];
    return `A parcel of land located at approximately ${lat.toFixed(6)}° N, ${lng.toFixed(6)}° W.`;
  }
  
  if (type === 'LineString') {
    const coords = feature.geometry.coordinates as Array<[number, number]>;
    const length = coords.length;
    return `A line beginning at ${coords[0][1].toFixed(6)}° N, ${coords[0][0].toFixed(6)}° W, and extending through ${length - 1} point(s), ending at ${coords[length - 1][1].toFixed(6)}° N, ${coords[length - 1][0].toFixed(6)}° W.`;
  }
  
  if (type === 'Polygon') {
    const coords = feature.geometry.coordinates[0] as Array<[number, number]>;
    const vertexCount = coords.length - 1; // Subtract 1 because polygons repeat the first point
    
    // Simple rectangular parcel
    if (vertexCount === 4 && feature.properties?.shape === 'rectangle') {
      const width = feature.properties.width;
      const height = feature.properties.height;
      const widthFeet = (width * 3.28084).toFixed(2);
      const heightFeet = (height * 3.28084).toFixed(2);
      return `A rectangular parcel of land measuring approximately ${widthFeet} feet by ${heightFeet} feet.`;
    }
    
    // Simple circular parcel
    if (vertexCount > 20 && feature.properties?.shape === 'circle') {
      const radius = feature.properties.radius;
      const radiusFeet = (radius * 3.28084).toFixed(2);
      return `A circular parcel of land with a radius of approximately ${radiusFeet} feet.`;
    }
    
    // Complex polygon
    return `An irregular parcel of land with ${vertexCount} sides, forming a closed polygon.`;
  }
  
  return `A parcel of land represented as a ${type}.`;
}