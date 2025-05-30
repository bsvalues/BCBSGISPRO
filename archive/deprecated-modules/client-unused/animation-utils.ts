import * as turf from '@turf/turf';
import { Feature, FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';
import L from 'leaflet';
import { GeoJSONFeature } from './map-utils';

/**
 * Interpolate between two GeoJSON polygon features
 * 
 * @param startFeature Starting GeoJSON feature
 * @param endFeature Target GeoJSON feature
 * @param progress Progress of interpolation (0-1)
 * @returns Interpolated GeoJSON feature
 */
export function interpolateFeatures(
  startFeature: GeoJSONFeature, 
  endFeature: GeoJSONFeature, 
  progress: number
): GeoJSONFeature {
  // Ensure progress is within bounds
  const t = Math.max(0, Math.min(1, progress));
  
  // Handle different geometry types
  if (startFeature.geometry.type !== endFeature.geometry.type) {
    // If types don't match, just return the appropriate feature based on progress
    return t < 0.5 ? startFeature : endFeature;
  }
  
  // Handle different geometry types
  switch (startFeature.geometry.type) {
    case 'Polygon':
      return interpolatePolygons(startFeature, endFeature, t);
    case 'MultiPolygon':
      return interpolateMultiPolygons(startFeature, endFeature, t);
    case 'LineString':
      return interpolateLineStrings(startFeature, endFeature, t);
    default:
      // For unsupported types, just return the appropriate feature based on progress
      return t < 0.5 ? startFeature : endFeature;
  }
}

/**
 * Interpolate between two polygon features
 */
function interpolatePolygons(
  startFeature: GeoJSONFeature, 
  endFeature: GeoJSONFeature, 
  progress: number
): GeoJSONFeature {
  // For polygons, we'll interpolate between vertices
  const startCoords = startFeature.geometry.coordinates[0];
  const endCoords = endFeature.geometry.coordinates[0];
  
  // Use the feature with fewer points as the base to interpolate
  const useStartAsBase = startCoords.length <= endCoords.length;
  const baseCoords = useStartAsBase ? startCoords : endCoords;
  const targetCoords = useStartAsBase ? endCoords : startCoords;
  
  // If using end as base but progress is based on start -> end, we need to invert progress
  const adjustedProgress = useStartAsBase ? progress : 1 - progress;
  
  // Create interpolated coordinates
  const interpolatedCoords = baseCoords.map((coord, index) => {
    // Find the closest point in the target feature for this coordinate
    const closestPoint = findClosestPoint(coord, targetCoords);
    
    // Interpolate between the two points
    return [
      coord[0] + (closestPoint[0] - coord[0]) * adjustedProgress,
      coord[1] + (closestPoint[1] - coord[1]) * adjustedProgress
    ];
  });
  
  // Create a new feature with the interpolated coordinates
  return {
    type: 'Feature',
    properties: { 
      ...startFeature.properties,
      _isInterpolated: true 
    },
    geometry: {
      type: 'Polygon',
      coordinates: [ensureClosedCoordinates(interpolatedCoords)]
    }
  };
}

/**
 * Interpolate between two multi-polygon features
 */
function interpolateMultiPolygons(
  startFeature: GeoJSONFeature, 
  endFeature: GeoJSONFeature, 
  progress: number
): GeoJSONFeature {
  // For simplicity, we'll just convert to polygons and interpolate those
  // In a production environment, you would want to match corresponding polygons
  
  // Get the first polygon from each multi-polygon
  const startPoly = {
    type: 'Feature',
    properties: startFeature.properties,
    geometry: {
      type: 'Polygon',
      coordinates: startFeature.geometry.coordinates[0]
    }
  } as GeoJSONFeature;
  
  const endPoly = {
    type: 'Feature',
    properties: endFeature.properties,
    geometry: {
      type: 'Polygon',
      coordinates: endFeature.geometry.coordinates[0]
    }
  } as GeoJSONFeature;
  
  // Interpolate between the polygons
  return interpolatePolygons(startPoly, endPoly, progress);
}

/**
 * Interpolate between two line string features
 */
function interpolateLineStrings(
  startFeature: GeoJSONFeature, 
  endFeature: GeoJSONFeature, 
  progress: number
): GeoJSONFeature {
  // Similar approach as with polygons
  const startCoords = startFeature.geometry.coordinates;
  const endCoords = endFeature.geometry.coordinates;
  
  // Use the feature with fewer points as the base to interpolate
  const useStartAsBase = startCoords.length <= endCoords.length;
  const baseCoords = useStartAsBase ? startCoords : endCoords;
  const targetCoords = useStartAsBase ? endCoords : startCoords;
  
  // If using end as base but progress is based on start -> end, we need to invert progress
  const adjustedProgress = useStartAsBase ? progress : 1 - progress;
  
  // Create interpolated coordinates
  const interpolatedCoords = baseCoords.map((coord, index) => {
    // Find the closest point in the target feature for this coordinate
    const closestPoint = findClosestPoint(coord, targetCoords);
    
    // Interpolate between the two points
    return [
      coord[0] + (closestPoint[0] - coord[0]) * adjustedProgress,
      coord[1] + (closestPoint[1] - coord[1]) * adjustedProgress
    ];
  });
  
  // Create a new feature with the interpolated coordinates
  return {
    type: 'Feature',
    properties: { 
      ...startFeature.properties,
      _isInterpolated: true 
    },
    geometry: {
      type: 'LineString',
      coordinates: interpolatedCoords
    }
  };
}

/**
 * Find the closest point in a coordinates array to a given point
 */
function findClosestPoint(point: number[], coordinates: number[][]): number[] {
  let minDistance = Infinity;
  let closestPoint = coordinates[0];
  
  for (const coord of coordinates) {
    const distance = 
      Math.pow(point[0] - coord[0], 2) + 
      Math.pow(point[1] - coord[1], 2);
    
    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = coord;
    }
  }
  
  return closestPoint;
}

/**
 * Ensure polygon coordinates are closed (first point = last point)
 */
function ensureClosedCoordinates(coordinates: number[][]): number[][] {
  if (coordinates.length === 0) return coordinates;
  
  const firstPoint = coordinates[0];
  const lastPoint = coordinates[coordinates.length - 1];
  
  // Check if the polygon is already closed
  if (firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1]) {
    return coordinates;
  }
  
  // Close the polygon by adding a copy of the first point as the last point
  return [...coordinates, [...firstPoint]];
}

/**
 * Create animation frames between two GeoJSON features
 * 
 * @param startFeature Starting GeoJSON feature
 * @param endFeature Target GeoJSON feature
 * @param frames Number of frames to generate
 * @returns Array of interpolated features representing animation frames
 */
export function createAnimationFrames(
  startFeature: GeoJSONFeature,
  endFeature: GeoJSONFeature,
  frames: number = 30
): GeoJSONFeature[] {
  const animationFrames: GeoJSONFeature[] = [];
  
  for (let i = 0; i <= frames; i++) {
    const progress = i / frames;
    animationFrames.push(interpolateFeatures(startFeature, endFeature, progress));
  }
  
  return animationFrames;
}

/**
 * Apply a smooth animation between two boundary states on a Leaflet map
 * 
 * @param map Leaflet map instance
 * @param layer Leaflet layer to animate
 * @param startFeature Starting GeoJSON feature
 * @param endFeature Target GeoJSON feature
 * @param duration Animation duration in milliseconds
 * @param onComplete Callback to run when animation completes
 */
export function animateBoundary(
  map: L.Map,
  layer: L.GeoJSON,
  startFeature: GeoJSONFeature,
  endFeature: GeoJSONFeature,
  duration: number = 1000,
  onComplete?: () => void
): void {
  // Number of frames based on duration (aiming for 60fps)
  const frames = Math.min(60, Math.floor(duration / 16));
  const frameDelay = duration / frames;
  
  // Generate all animation frames in advance
  const animationFrames = createAnimationFrames(startFeature, endFeature, frames);
  let currentFrame = 0;
  
  // Start the animation loop
  const animationInterval = setInterval(() => {
    // Update the layer with the current frame
    layer.clearLayers();
    layer.addData(animationFrames[currentFrame]);
    
    // Move to the next frame
    currentFrame++;
    
    // Check if animation is complete
    if (currentFrame >= animationFrames.length) {
      clearInterval(animationInterval);
      if (onComplete) onComplete();
    }
  }, frameDelay);
}

/**
 * Animate zooming to a specific boundary
 * 
 * @param map Leaflet map instance
 * @param feature GeoJSON feature to zoom to
 * @param padding Padding around the bounds
 * @param duration Animation duration in milliseconds
 */
export function animateZoomToBoundary(
  map: L.Map,
  feature: GeoJSONFeature,
  padding: number = 50,
  duration: number = 800
): void {
  // Calculate the bounds of the feature
  const bounds = L.geoJSON(feature).getBounds();
  
  // Animate zooming to the bounds
  map.flyToBounds(bounds, {
    padding: [padding, padding],
    duration: duration / 1000 // Leaflet uses seconds, not milliseconds
  });
}

/**
 * Create an interpolated buffer around a geometry
 * 
 * @param feature GeoJSON feature
 * @param maxDistance Maximum buffer distance in kilometers
 * @param progress Progress of buffer (0-1)
 * @returns Buffered GeoJSON feature
 */
export function createGrowingBuffer(
  feature: GeoJSONFeature,
  maxDistance: number,
  progress: number
): GeoJSONFeature {
  // Calculate buffer distance based on progress
  const distance = maxDistance * progress;
  
  // Create the buffer
  return turf.buffer(feature, distance, { units: 'kilometers' });
}

/**
 * Create a glowing animation effect for a boundary
 * 
 * @param map Leaflet map instance
 * @param layer Leaflet layer to animate
 * @param feature GeoJSON feature to animate
 * @param duration Animation duration in milliseconds
 * @param maxBuffer Maximum buffer distance in kilometers
 * @param onComplete Callback to run when animation completes
 */
export function createPulsatingBoundary(
  map: L.Map,
  layer: L.GeoJSON,
  feature: GeoJSONFeature,
  glowColor: string = '#3388ff',
  maxBuffer: number = 0.5,
  duration: number = 2000,
  onComplete?: () => void
): void {
  const frames = 30;
  const frameDelay = duration / frames;
  let currentFrame = 0;
  
  // Create a new layer for the glow effect
  const glowLayer = L.geoJSON(feature, {
    style: {
      color: glowColor,
      weight: 3,
      opacity: 0.6,
      fillColor: glowColor,
      fillOpacity: 0.2
    }
  }).addTo(map);
  
  // Start the animation loop
  const animationInterval = setInterval(() => {
    // Calculate the sine wave to create a pulsating effect (0-1-0-1...)
    const progress = Math.abs(Math.sin(currentFrame / frames * Math.PI));
    
    // Create the buffer for this frame
    const buffer = createGrowingBuffer(feature, maxBuffer, progress);
    
    // Update the glow layer
    glowLayer.clearLayers();
    glowLayer.addData(buffer);
    
    // Move to the next frame
    currentFrame++;
    
    // Check if animation is complete
    if (currentFrame >= frames * 2) { // Do two full pulses
      clearInterval(animationInterval);
      
      // Remove the glow layer
      map.removeLayer(glowLayer);
      
      if (onComplete) onComplete();
    }
  }, frameDelay);
}