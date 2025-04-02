import * as turf from '@turf/turf';
import { Feature, Geometry, GeoJsonProperties, Position, Point, LineString, Polygon, MultiPolygon, FeatureCollection } from 'geojson';
import { GeoJSONFeature } from './map-utils';

/**
 * Supported snap modes
 */
export enum SnapMode {
  NONE = 'none',
  VERTEX = 'vertex',
  EDGE = 'edge',
  BOTH = 'both'
}

/**
 * Options for snapping
 */
export interface SnapOptions {
  mode: SnapMode;
  threshold: number;
  featureTypes?: string[];
}

/**
 * Default snap options
 */
const DEFAULT_SNAP_OPTIONS: SnapOptions = {
  mode: SnapMode.BOTH,
  threshold: 0.01,
  featureTypes: ['LineString', 'Polygon', 'MultiPolygon']
};

/**
 * Interface for the snap manager
 */
export interface SnapManager {
  /**
   * Add a feature for snapping
   */
  addFeature(feature: GeoJSONFeature): void;

  /**
   * Remove a feature from snapping
   */
  removeFeature(featureId: string): void;

  /**
   * Clear all features
   */
  clearFeatures(): void;

  /**
   * Snap a point to the nearest feature
   */
  snapPoint(point: Position, options?: Partial<SnapOptions>): Position;
}

/**
 * Create a new snap manager
 */
export function createSnapManager(): SnapManager {
  const features: GeoJSONFeature[] = [];
  let vertexCache: Position[] = [];
  let edgeCache: Feature<LineString, GeoJsonProperties>[] = [];
  let cacheValid = false;
  
  /**
   * Extract vertices from a feature
   */
  function extractVertices(feature: GeoJSONFeature): Position[] {
    const vertices: Position[] = [];
    
    if (!feature.geometry) {
      return vertices;
    }
    
    const geometry = feature.geometry;
    
    if (geometry.type === 'Point') {
      vertices.push(geometry.coordinates);
    } else if (geometry.type === 'LineString') {
      vertices.push(...geometry.coordinates);
    } else if (geometry.type === 'Polygon') {
      for (const ring of geometry.coordinates) {
        vertices.push(...ring);
      }
    } else if (geometry.type === 'MultiPolygon') {
      for (const polygon of geometry.coordinates) {
        for (const ring of polygon) {
          vertices.push(...ring);
        }
      }
    }
    
    return vertices;
  }
  
  /**
   * Extract edges from a feature
   */
  function extractEdges(feature: GeoJSONFeature): Feature<LineString, GeoJsonProperties>[] {
    const edges: Feature<LineString, GeoJsonProperties>[] = [];
    
    if (!feature.geometry) {
      return edges;
    }
    
    const geometry = feature.geometry;
    
    if (geometry.type === 'LineString') {
      // Each segment is an edge
      for (let i = 0; i < geometry.coordinates.length - 1; i++) {
        const start = geometry.coordinates[i];
        const end = geometry.coordinates[i + 1];
        
        edges.push(turf.lineString([start, end]));
      }
    } else if (geometry.type === 'Polygon') {
      // Each segment of each ring is an edge
      for (const ring of geometry.coordinates) {
        for (let i = 0; i < ring.length - 1; i++) {
          const start = ring[i];
          const end = ring[i + 1];
          
          edges.push(turf.lineString([start, end]));
        }
      }
    } else if (geometry.type === 'MultiPolygon') {
      // Each segment of each ring of each polygon is an edge
      for (const polygon of geometry.coordinates) {
        for (const ring of polygon) {
          for (let i = 0; i < ring.length - 1; i++) {
            const start = ring[i];
            const end = ring[i + 1];
            
            edges.push(turf.lineString([start, end]));
          }
        }
      }
    }
    
    return edges;
  }
  
  /**
   * Build the vertex and edge caches
   */
  function buildCache(): void {
    if (cacheValid) {
      return;
    }
    
    vertexCache = [];
    edgeCache = [];
    
    for (const feature of features) {
      vertexCache.push(...extractVertices(feature));
      edgeCache.push(...extractEdges(feature));
    }
    
    cacheValid = true;
  }
  
  return {
    addFeature(feature: GeoJSONFeature): void {
      // Skip if feature already exists
      if (features.find(f => f.id === feature.id)) {
        // Update feature if it already exists
        const index = features.findIndex(f => f.id === feature.id);
        features[index] = feature;
      } else {
        features.push(feature);
      }
      
      cacheValid = false;
    },
    
    removeFeature(featureId: string): void {
      const index = features.findIndex(f => f.id === featureId);
      
      if (index !== -1) {
        features.splice(index, 1);
        cacheValid = false;
      }
    },
    
    clearFeatures(): void {
      features.length = 0;
      vertexCache = [];
      edgeCache = [];
      cacheValid = true;
    },
    
    snapPoint(point: Position, options?: Partial<SnapOptions>): Position {
      const mergedOptions: SnapOptions = {
        ...DEFAULT_SNAP_OPTIONS,
        ...(options || {})
      };
      
      if (mergedOptions.mode === SnapMode.NONE) {
        return point;
      }
      
      buildCache();
      
      // Point feature for the input point
      const pointFeature = turf.point(point);
      
      // Snap to vertex
      if (mergedOptions.mode === SnapMode.VERTEX || mergedOptions.mode === SnapMode.BOTH) {
        let nearestVertex: Position | null = null;
        let nearestDistance = Infinity;
        
        for (const vertex of vertexCache) {
          const vertexFeature = turf.point(vertex);
          const distance = turf.distance(pointFeature, vertexFeature);
          
          if (distance < nearestDistance && distance <= mergedOptions.threshold) {
            nearestVertex = vertex;
            nearestDistance = distance;
          }
        }
        
        if (nearestVertex) {
          return nearestVertex;
        }
      }
      
      // Snap to edge
      if (mergedOptions.mode === SnapMode.EDGE || mergedOptions.mode === SnapMode.BOTH) {
        let nearestPoint: Position | null = null;
        let nearestDistance = Infinity;
        
        for (const edge of edgeCache) {
          const snapped = turf.nearestPointOnLine(edge, pointFeature);
          const distance = snapped.properties.dist;
          
          if (distance < nearestDistance && distance <= mergedOptions.threshold) {
            nearestPoint = snapped.geometry.coordinates;
            nearestDistance = distance;
          }
        }
        
        if (nearestPoint) {
          return nearestPoint;
        }
      }
      
      // No snap found, return original point
      return point;
    }
  };
}