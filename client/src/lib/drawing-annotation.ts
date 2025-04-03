/**
 * Drawing Annotation Module
 * 
 * This module provides functionality for adding, retrieving, and managing
 * map annotations. Annotations are used to mark points of interest,
 * add notes, or highlight features on the map.
 */

/**
 * Interface representing an annotation on the map
 */
export interface Annotation {
  // Geographic position of the annotation
  position: {
    lat: number;
    lng: number;
  };
  // Text content of the annotation
  text: string;
  // Type of annotation (e.g., 'note', 'measurement', 'warning')
  type: string;
  // When the annotation was created
  createdAt: Date;
  // Unique identifier for the annotation
  id: string;
}

// In-memory storage for annotations
let annotations: Annotation[] = [];

/**
 * Generate a unique ID for an annotation
 * @returns A unique string ID
 */
function generateId(): string {
  // Simple implementation using timestamp and random number
  // In a production environment, consider using UUID
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

/**
 * Add a new annotation at the specified position
 * 
 * @param position Geographic coordinates where to place the annotation
 * @param text Content of the annotation
 * @param type Type of the annotation
 * @returns The newly created annotation
 */
export function addAnnotation(
  position: { lat: number; lng: number },
  text: string,
  type: string
): Annotation {
  const annotation: Annotation = {
    position,
    text,
    type,
    createdAt: new Date(),
    id: generateId()
  };
  
  annotations.push(annotation);
  return annotation;
}

/**
 * Get all annotations
 * 
 * @returns Array of all annotations
 */
export function getAnnotations(): Annotation[] {
  return [...annotations]; // Return a copy to prevent direct modification
}

/**
 * Clear all annotations
 */
export function clearAnnotations(): void {
  annotations = [];
}

/**
 * Remove a specific annotation by ID
 * 
 * @param id The ID of the annotation to remove
 * @returns boolean indicating whether an annotation was removed
 */
export function removeAnnotation(id: string): boolean {
  const initialLength = annotations.length;
  annotations = annotations.filter(annotation => annotation.id !== id);
  return annotations.length < initialLength;
}

/**
 * Find annotations near a specific point
 * 
 * @param position The position to search near
 * @param radiusMeters The search radius in meters
 * @returns Array of annotations within the specified radius
 */
export function findAnnotationsNear(
  position: { lat: number; lng: number },
  radiusMeters: number = 100
): Annotation[] {
  // Simple distance calculation using Haversine formula
  function getDistanceInMeters(pos1: { lat: number; lng: number }, pos2: { lat: number; lng: number }): number {
    const R = 6371000; // Earth radius in meters
    const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
    const dLon = (pos2.lng - pos1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  return annotations.filter(annotation => {
    const distance = getDistanceInMeters(position, annotation.position);
    return distance <= radiusMeters;
  });
}

/**
 * Update an existing annotation
 * 
 * @param id ID of the annotation to update
 * @param updates Partial annotation object with fields to update
 * @returns The updated annotation or null if not found
 */
export function updateAnnotation(
  id: string, 
  updates: Partial<Omit<Annotation, 'id' | 'createdAt'>>
): Annotation | null {
  const index = annotations.findIndex(a => a.id === id);
  
  if (index === -1) {
    return null;
  }
  
  annotations[index] = {
    ...annotations[index],
    ...updates
  };
  
  return annotations[index];
}

/**
 * Filter annotations by type
 * 
 * @param type The type to filter by
 * @returns Array of annotations matching the specified type
 */
export function getAnnotationsByType(type: string): Annotation[] {
  return annotations.filter(annotation => annotation.type === type);
}

/**
 * Export annotations to GeoJSON format
 * 
 * @returns GeoJSON FeatureCollection of annotations
 */
export function exportAnnotationsAsGeoJSON() {
  return {
    type: "FeatureCollection",
    features: annotations.map(annotation => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [annotation.position.lng, annotation.position.lat]
      },
      properties: {
        id: annotation.id,
        text: annotation.text,
        type: annotation.type,
        createdAt: annotation.createdAt.toISOString()
      }
    }))
  };
}

/**
 * Import annotations from GeoJSON format
 * 
 * @param geojson GeoJSON FeatureCollection to import
 * @returns Array of imported annotations
 */
export function importAnnotationsFromGeoJSON(geojson: any): Annotation[] {
  if (geojson.type !== "FeatureCollection") {
    throw new Error("Invalid GeoJSON: must be a FeatureCollection");
  }
  
  const importedAnnotations = geojson.features
    .filter((feature: any) => 
      feature.type === "Feature" && 
      feature.geometry?.type === "Point" &&
      Array.isArray(feature.geometry.coordinates) &&
      feature.geometry.coordinates.length >= 2 &&
      feature.properties?.text &&
      feature.properties?.type
    )
    .map((feature: any) => {
      const [lng, lat] = feature.geometry.coordinates;
      return {
        position: { lat, lng },
        text: feature.properties.text,
        type: feature.properties.type,
        createdAt: new Date(feature.properties.createdAt || Date.now()),
        id: feature.properties.id || generateId()
      };
    });
  
  // Add the imported annotations to the existing ones
  annotations = [...annotations, ...importedAnnotations];
  
  return importedAnnotations;
}