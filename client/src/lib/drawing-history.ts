import { v4 as uuidv4 } from 'uuid';
import { GeoJSONFeature } from './map-utils';

/**
 * Types of operations that can be performed on features
 */
export type OperationType = 'create' | 'modify' | 'delete';

/**
 * Structure of a history operation
 */
export interface HistoryOperation {
  type: OperationType;
  feature: GeoJSONFeature;
  timestamp: Date;
}

/**
 * Structure of a saved version
 */
export interface VersionInfo {
  id: string;
  name: string;
  timestamp: Date;
  state: GeoJSONFeature[];
}

/**
 * Interface for the drawing history manager
 */
export interface DrawingHistoryManager {
  /**
   * Add an operation to the history
   */
  addOperation(type: OperationType, feature: GeoJSONFeature): void;

  /**
   * Undo the last operation
   */
  undo(): boolean;

  /**
   * Redo an undone operation
   */
  redo(): boolean;

  /**
   * Get the current state of all features
   */
  getCurrentState(): GeoJSONFeature[];

  /**
   * Save the current state as a named version
   */
  saveVersion(name: string): string;

  /**
   * Get a list of all saved versions
   */
  getVersions(): VersionInfo[];

  /**
   * Restore a saved version
   */
  restoreVersion(versionId: string): boolean;
}

/**
 * Create a new drawing history manager
 */
export function createDrawingHistoryManager(): DrawingHistoryManager {
  // Store history operations
  const operations: HistoryOperation[] = [];
  // Current position in the history
  let currentPosition = -1;
  // Saved versions
  const versions: VersionInfo[] = [];
  
  /**
   * Apply an operation to the state
   */
  function applyOperationToState(
    state: Map<string, GeoJSONFeature>,
    operation: HistoryOperation
  ): void {
    const { type, feature } = operation;
    const featureId = feature.id as string;
    
    switch (type) {
      case 'create':
      case 'modify':
        state.set(featureId, feature);
        break;
      case 'delete':
        state.delete(featureId);
        break;
    }
  }
  
  /**
   * Calculate the current state by applying all operations in order
   */
  function calculateState(): Map<string, GeoJSONFeature> {
    const state = new Map<string, GeoJSONFeature>();
    
    // Apply all operations up to the current position
    for (let i = 0; i <= currentPosition; i++) {
      applyOperationToState(state, operations[i]);
    }
    
    return state;
  }
  
  /**
   * Convert state map to an array of features
   */
  function stateToArray(state: Map<string, GeoJSONFeature>): GeoJSONFeature[] {
    return Array.from(state.values());
  }
  
  return {
    addOperation(type: OperationType, feature: GeoJSONFeature): void {
      // If we're not at the end of the history, remove all operations after the current position
      if (currentPosition < operations.length - 1) {
        operations.splice(currentPosition + 1);
      }
      
      // Add the new operation
      operations.push({
        type,
        feature,
        timestamp: new Date()
      });
      
      // Move to the end of the history
      currentPosition = operations.length - 1;
    },
    
    undo(): boolean {
      if (currentPosition >= 0) {
        currentPosition--;
        return true;
      }
      
      return false;
    },
    
    redo(): boolean {
      if (currentPosition < operations.length - 1) {
        currentPosition++;
        return true;
      }
      
      return false;
    },
    
    getCurrentState(): GeoJSONFeature[] {
      const state = calculateState();
      return stateToArray(state);
    },
    
    saveVersion(name: string): string {
      const id = uuidv4();
      const state = this.getCurrentState();
      
      versions.push({
        id,
        name,
        timestamp: new Date(),
        state: [...state]
      });
      
      return id;
    },
    
    getVersions(): VersionInfo[] {
      return [...versions];
    },
    
    restoreVersion(versionId: string): boolean {
      const version = versions.find(v => v.id === versionId);
      
      if (!version) {
        return false;
      }
      
      // Clear the history
      operations.length = 0;
      
      // Add each feature as a 'create' operation
      version.state.forEach(feature => {
        operations.push({
          type: 'create',
          feature,
          timestamp: new Date()
        });
      });
      
      // Set the current position to the end of the history
      currentPosition = operations.length - 1;
      
      return true;
    }
  };
}