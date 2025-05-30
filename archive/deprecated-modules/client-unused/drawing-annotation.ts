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

/**
 * Interface for feature attribution information
 */
export interface Attribution {
  createdBy?: string;
  createdAt?: Date;
  modifiedBy?: string;
  modifiedAt?: Date;
  notes?: string[];
  description?: string;
}

/**
 * Interface for the annotation manager
 */
export interface AnnotationManager {
  /**
   * Add a new annotation
   */
  addAnnotation(position: { lat: number; lng: number }, text: string, type: string): Annotation;
  
  /**
   * Get all annotations
   */
  getAnnotations(): Annotation[];
  
  /**
   * Clear all annotations
   */
  clearAnnotations(): void;
  
  /**
   * Remove a specific annotation
   */
  removeAnnotation(id: string): boolean;
  
  /**
   * Find annotations near a point
   */
  findAnnotationsNear(position: { lat: number; lng: number }, radiusMeters?: number): Annotation[];
  
  /**
   * Update an existing annotation
   */
  updateAnnotation(id: string, updates: Partial<Omit<Annotation, 'id' | 'createdAt'>>): Annotation | null;
  
  /**
   * Filter annotations by type
   */
  getAnnotationsByType(type: string): Annotation[];
  
  /**
   * Export annotations to GeoJSON
   */
  exportAnnotationsAsGeoJSON(): any;
  
  /**
   * Import annotations from GeoJSON
   */
  importAnnotationsFromGeoJSON(geojson: any): Annotation[];
  
  /**
   * Set attribution information for a feature
   */
  setAttribution(featureId: string, attribution: Partial<Attribution>): void;
  
  /**
   * Record a modification to a feature
   */
  recordModification(featureId: string, modification: Partial<Attribution>): void;
  
  /**
   * Add a note to a feature
   */
  addNote(featureId: string, note: string): void;
  
  /**
   * Get attribution information for a feature
   */
  getAttribution(featureId: string): Attribution | undefined;
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

// Storage for feature attributions
const attributions: Map<string, Attribution> = new Map();

/**
 * Set attribution information for a feature
 * 
 * @param featureId ID of the feature
 * @param attribution Attribution information to set
 */
export function setAttribution(featureId: string, attribution: Partial<Attribution>): void {
  const existing = attributions.get(featureId) || {};
  attributions.set(featureId, {
    ...existing,
    ...attribution
  });
}

/**
 * Record a modification to a feature
 * 
 * @param featureId ID of the feature
 * @param modification Modification information
 */
export function recordModification(featureId: string, modification: Partial<Attribution>): void {
  const existing = attributions.get(featureId) || {};
  attributions.set(featureId, {
    ...existing,
    ...modification
  });
}

/**
 * Add a note to a feature
 * 
 * @param featureId ID of the feature
 * @param note Note text to add
 */
export function addNote(featureId: string, note: string): void {
  const existing = attributions.get(featureId) || {};
  const notes = existing.notes || [];
  attributions.set(featureId, {
    ...existing,
    notes: [...notes, note]
  });
}

/**
 * Get attribution information for a feature
 * 
 * @param featureId ID of the feature
 * @returns Attribution information or undefined if not found
 */
export function getAttribution(featureId: string): Attribution | undefined {
  return attributions.get(featureId);
}

/**
 * Create a new annotation manager instance
 * 
 * @returns An AnnotationManager instance
 */
export function createAnnotationManager(): AnnotationManager {
  // Use the module-level functions to implement the manager
  return {
    addAnnotation(position, text, type) {
      return addAnnotation(position, text, type);
    },
    
    getAnnotations() {
      return getAnnotations();
    },
    
    clearAnnotations() {
      clearAnnotations();
    },
    
    removeAnnotation(id) {
      return removeAnnotation(id);
    },
    
    findAnnotationsNear(position, radiusMeters) {
      return findAnnotationsNear(position, radiusMeters);
    },
    
    updateAnnotation(id, updates) {
      return updateAnnotation(id, updates);
    },
    
    getAnnotationsByType(type) {
      return getAnnotationsByType(type);
    },
    
    exportAnnotationsAsGeoJSON() {
      return exportAnnotationsAsGeoJSON();
    },
    
    importAnnotationsFromGeoJSON(geojson) {
      return importAnnotationsFromGeoJSON(geojson);
    },
    
    setAttribution(featureId, attribution) {
      setAttribution(featureId, attribution);
    },
    
    recordModification(featureId, modification) {
      recordModification(featureId, modification);
    },
    
    addNote(featureId, note) {
      addNote(featureId, note);
    },
    
    getAttribution(featureId) {
      return getAttribution(featureId);
    }
  };
}