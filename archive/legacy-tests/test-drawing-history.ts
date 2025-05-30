import { createDrawingHistoryManager } from './lib/drawing-history';
import { GeoJSONFeature } from './lib/map-utils';

// Test function
function testDrawingHistoryFeatures() {
  console.log("Testing drawing history features...");
  
  const historyManager = createDrawingHistoryManager();
  
  // Create test features with explicit typing
  const feature1 = {
    id: 'feature-1',
    type: "Feature" as const,  // Use const assertion to make it literal "Feature"
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0]
      ]]
    }
  } as GeoJSONFeature;
  
  const feature2 = {
    id: 'feature-2',
    type: "Feature" as const,  // Use const assertion to make it literal "Feature"
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [2, 2],
        [3, 2],
        [3, 3],
        [2, 3],
        [2, 2]
      ]]
    }
  } as GeoJSONFeature;
  
  const feature1Modified = {
    id: 'feature-1',
    type: "Feature" as const,  // Use const assertion to make it literal "Feature"
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [0, 0],
        [2, 0],
        [2, 2],
        [0, 2],
        [0, 0]
      ]]
    }
  } as GeoJSONFeature;
  
  // Test adding operations
  console.log("Adding feature 1...");
  historyManager.addOperation('create', feature1);
  
  console.log("Current state:", historyManager.getCurrentState());
  
  console.log("Adding feature 2...");
  historyManager.addOperation('create', feature2);
  
  console.log("Current state:", historyManager.getCurrentState());
  
  console.log("Modifying feature 1...");
  historyManager.addOperation('modify', feature1Modified);
  
  console.log("Current state:", historyManager.getCurrentState());
  
  // Test undo/redo
  console.log("Undoing operation...");
  historyManager.undo();
  console.log("Current state after undo:", historyManager.getCurrentState());
  
  console.log("Undoing another operation...");
  historyManager.undo();
  console.log("Current state after undo:", historyManager.getCurrentState());
  
  console.log("Redoing operation...");
  historyManager.redo();
  console.log("Current state after redo:", historyManager.getCurrentState());
  
  // Test version management
  const versionId = historyManager.saveVersion("Version 1");
  console.log("Saved version with ID:", versionId);
  console.log("All versions:", historyManager.getVersions());
  
  // Delete feature 1
  console.log("Deleting feature 1...");
  historyManager.addOperation('delete', feature1);
  console.log("Current state after deletion:", historyManager.getCurrentState());
  
  // Restore version
  console.log("Restoring version 1...");
  historyManager.restoreVersion(versionId);
  console.log("Current state after restoration:", historyManager.getCurrentState());
  
  console.log("All tests completed!");
}

// Run the test
testDrawingHistoryFeatures();