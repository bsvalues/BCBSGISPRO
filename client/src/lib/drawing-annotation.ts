/**
 * Attribution information for a feature
 */
export interface Attribution {
  createdBy: string;
  createdAt: Date;
  source?: string;
  [key: string]: any;
}

/**
 * Information about a modification to a feature
 */
export interface Modification {
  modifiedBy: string;
  modifiedAt: Date;
  description?: string;
  [key: string]: any;
}

/**
 * Structure containing all annotation data for a feature
 */
interface FeatureAnnotationData {
  notes: string[];
  attribution?: Attribution;
  modificationHistory: Modification[];
}

/**
 * Interface for the annotation manager
 */
export interface AnnotationManager {
  /**
   * Add a note to a feature
   */
  addNote(featureId: string, note: string): void;

  /**
   * Get all notes for a feature
   */
  getNotes(featureId: string): string[];

  /**
   * Set the attribution information for a feature
   */
  setAttribution(featureId: string, attribution: Attribution): void;

  /**
   * Get the attribution information for a feature
   */
  getAttribution(featureId: string): Attribution | undefined;

  /**
   * Record a modification to a feature
   */
  recordModification(featureId: string, modification: Modification): void;

  /**
   * Get the modification history for a feature
   */
  getModificationHistory(featureId: string): Modification[];

  /**
   * Get IDs of all features that have annotations
   */
  getAnnotatedFeatureIds(): string[];

  /**
   * Remove all annotation data for a feature
   */
  removeFeatureData(featureId: string): void;
}

/**
 * Create a new annotation manager
 */
export function createAnnotationManager(): AnnotationManager {
  // Store annotation data for each feature
  const annotationData: Map<string, FeatureAnnotationData> = new Map();

  /**
   * Get or create annotation data for a feature
   */
  function getOrCreateData(featureId: string): FeatureAnnotationData {
    if (!annotationData.has(featureId)) {
      annotationData.set(featureId, {
        notes: [],
        modificationHistory: []
      });
    }
    return annotationData.get(featureId)!;
  }

  return {
    addNote(featureId: string, note: string): void {
      const data = getOrCreateData(featureId);
      data.notes.push(note);
    },

    getNotes(featureId: string): string[] {
      const data = annotationData.get(featureId);
      return data ? [...data.notes] : [];
    },

    setAttribution(featureId: string, attribution: Attribution): void {
      const data = getOrCreateData(featureId);
      data.attribution = { ...attribution };
    },

    getAttribution(featureId: string): Attribution | undefined {
      const data = annotationData.get(featureId);
      return data?.attribution ? { ...data.attribution } : undefined;
    },

    recordModification(featureId: string, modification: Modification): void {
      const data = getOrCreateData(featureId);
      data.modificationHistory.push({ ...modification });
    },

    getModificationHistory(featureId: string): Modification[] {
      const data = annotationData.get(featureId);
      return data ? [...data.modificationHistory] : [];
    },

    getAnnotatedFeatureIds(): string[] {
      return Array.from(annotationData.keys());
    },

    removeFeatureData(featureId: string): void {
      annotationData.delete(featureId);
    }
  };
}