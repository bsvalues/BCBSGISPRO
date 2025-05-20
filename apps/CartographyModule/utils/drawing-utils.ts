/**
 * Drawing utilities for the CartographyModule
 * 
 * This file contains utilities for creating and manipulating
 * geospatial features and managing version history.
 */

import { v4 as uuidv4 } from 'uuid';
import { GeoJSONFeature } from '../types';

/**
 * Create a rectangle feature
 * 
 * @param center - Center coordinates [lat, lng]
 * @param width - Width in meters
 * @param height - Height in meters
 * @returns GeoJSON feature
 */
export function createRectangle(
  center: [number, number], 
  width: number, 
  height: number
): GeoJSONFeature {
  // Convert width/height in meters to degrees
  // This is a simplification - in a real app we'd use proper geodesic calculations
  const latFactor = 0.000009; // Approximate degrees per meter at equator for latitude
  const lngFactor = 0.000009; // Approximate degrees per meter at equator for longitude
  
  const halfWidthDeg = (width / 2) * lngFactor;
  const halfHeightDeg = (height / 2) * latFactor;
  
  const [lat, lng] = center;
  
  // Create rectangle coordinates (5 points to close the polygon)
  const coordinates = [
    [
      [lng - halfWidthDeg, lat - halfHeightDeg], // Bottom left
      [lng + halfWidthDeg, lat - halfHeightDeg], // Bottom right
      [lng + halfWidthDeg, lat + halfHeightDeg], // Top right
      [lng - halfWidthDeg, lat + halfHeightDeg], // Top left
      [lng - halfWidthDeg, lat - halfHeightDeg]  // Back to bottom left to close
    ]
  ];
  
  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: coordinates
    },
    properties: {
      id: uuidv4(),
      name: `Rectangle ${width.toFixed(2)}m × ${height.toFixed(2)}m`,
      description: 'Rectangle feature',
      width,
      height,
      center
    }
  };
}

/**
 * Create a circle feature
 * 
 * @param center - Center coordinates [lat, lng]
 * @param radius - Radius in meters
 * @param points - Number of points to use for the circle (default: 64)
 * @returns GeoJSON feature
 */
export function createCircle(
  center: [number, number], 
  radius: number, 
  points: number = 64
): GeoJSONFeature {
  // Convert radius in meters to degrees
  // This is a simplification - in a real app we'd use proper geodesic calculations
  const factor = 0.000009; // Approximate degrees per meter at equator
  const radiusDeg = radius * factor;
  
  const [lat, lng] = center;
  
  // Generate points in a circle
  const coordinates = [[]];
  
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const x = lng + Math.cos(angle) * radiusDeg;
    const y = lat + Math.sin(angle) * radiusDeg;
    coordinates[0].push([x, y]);
  }
  
  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: coordinates
    },
    properties: {
      id: uuidv4(),
      name: `Circle ${radius.toFixed(2)}m`,
      description: 'Circle feature',
      radius,
      center
    }
  };
}

/**
 * Generate a legal description from a feature
 * 
 * @param feature - GeoJSON feature
 * @returns Legal description string
 */
export function generateLegalDescription(feature: GeoJSONFeature): string {
  // In a real implementation, this would generate a proper legal description
  // based on the feature's geometry and properties. This could involve:
  // - Metes and bounds descriptions
  // - Section-Township-Range references
  // - Subdivision lot/block references
  // - etc.
  
  // For this example, we'll just generate a simple description
  if (!feature) {
    return 'No feature provided';
  }
  
  const geometryType = feature.geometry?.type;
  const coords = feature.geometry?.coordinates;
  
  if (!geometryType || !coords) {
    return 'Invalid geometry';
  }
  
  let description = '';
  
  switch (geometryType) {
    case 'Point':
      description = `A POINT located at latitude ${coords[1]} and longitude ${coords[0]}.`;
      break;
    case 'LineString':
      description = `A LINE beginning at latitude ${coords[0][1]} and longitude ${coords[0][0]}, `;
      description += `and ending at latitude ${coords[coords.length - 1][1]} and longitude ${coords[coords.length - 1][0]}, `;
      description += `having a total of ${coords.length} points.`;
      break;
    case 'Polygon':
      if (feature.properties?.radius) {
        // It's a circle
        description = `A CIRCLE with center at latitude ${feature.properties.center[0]} and longitude ${feature.properties.center[1]}, `;
        description += `having a radius of ${feature.properties.radius} meters.`;
      } else if (feature.properties?.width && feature.properties?.height) {
        // It's a rectangle
        description = `A RECTANGLE with center at latitude ${feature.properties.center[0]} and longitude ${feature.properties.center[1]}, `;
        description += `having width ${feature.properties.width} meters and height ${feature.properties.height} meters.`;
      } else {
        // It's a polygon
        description = `A POLYGON having ${coords[0].length - 1} sides, `;
        description += `beginning at latitude ${coords[0][0][1]} and longitude ${coords[0][0][0]}.`;
      }
      break;
    default:
      description = `A ${geometryType} feature with ${JSON.stringify(coords).length} characters of coordinate data.`;
  }
  
  // Add any additional property information
  if (feature.properties?.name) {
    description = `${feature.properties.name}:\n${description}`;
  }
  
  if (feature.properties?.description) {
    description += `\n\n${feature.properties.description}`;
  }
  
  return description;
}

/**
 * Feature version tracking
 */
export class FeatureVersionTracker {
  private versions: Map<string, { [versionId: string]: { feature: GeoJSONFeature, timestamp: string, description?: string } }>;

  constructor() {
    this.versions = new Map();
  }

  /**
   * Add a version for a feature
   * 
   * @param featureId - ID of the feature
   * @param feature - GeoJSON feature
   * @param description - Optional description of the version
   * @returns ID of the new version
   */
  addVersion(featureId: string, feature: GeoJSONFeature, description?: string): string {
    if (!this.versions.has(featureId)) {
      this.versions.set(featureId, {});
    }
    
    const versionId = uuidv4();
    const timestamp = new Date().toISOString();
    
    const featureVersions = this.versions.get(featureId)!;
    featureVersions[versionId] = {
      feature,
      timestamp,
      description
    };
    
    return versionId;
  }

  /**
   * Get a specific version of a feature
   * 
   * @param featureId - ID of the feature
   * @param versionId - ID of the version
   * @returns Version information or null if not found
   */
  getVersion(featureId: string, versionId: string): { feature: GeoJSONFeature, timestamp: string, description?: string } | null {
    const featureVersions = this.versions.get(featureId);
    
    if (!featureVersions || !featureVersions[versionId]) {
      return null;
    }
    
    return featureVersions[versionId];
  }

  /**
   * Get all versions for a feature
   * 
   * @param featureId - ID of the feature
   * @returns Array of version information or empty array if none found
   */
  getAllVersions(featureId: string): { id: string, feature: GeoJSONFeature, timestamp: string, description?: string }[] {
    const featureVersions = this.versions.get(featureId);
    
    if (!featureVersions) {
      return [];
    }
    
    return Object.entries(featureVersions).map(([id, version]) => ({
      id,
      ...version
    }));
  }

  /**
   * Get latest version for a feature
   * 
   * @param featureId - ID of the feature
   * @returns Latest version information or null if none found
   */
  getLatestVersion(featureId: string): { id: string, feature: GeoJSONFeature, timestamp: string, description?: string } | null {
    const versions = this.getAllVersions(featureId);
    
    if (versions.length === 0) {
      return null;
    }
    
    // Sort by timestamp (newest first)
    versions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return versions[0];
  }

  /**
   * Delete a version
   * 
   * @param featureId - ID of the feature
   * @param versionId - ID of the version
   * @returns Whether the version was deleted
   */
  deleteVersion(featureId: string, versionId: string): boolean {
    const featureVersions = this.versions.get(featureId);
    
    if (!featureVersions || !featureVersions[versionId]) {
      return false;
    }
    
    delete featureVersions[versionId];
    return true;
  }

  /**
   * Delete all versions for a feature
   * 
   * @param featureId - ID of the feature
   * @returns Whether any versions were deleted
   */
  deleteAllVersions(featureId: string): boolean {
    return this.versions.delete(featureId);
  }
}