import { createAnnotationManager } from './lib/drawing-annotation';

// Test function
function testAnnotationFeatures() {
  console.log("Testing annotation features...");
  
  const annotationManager = createAnnotationManager();
  
  // Create a test feature
  const feature1 = {
    id: 'feature-1',
    type: 'Feature',
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
  };
  
  const feature2 = {
    id: 'feature-2',
    type: 'Feature',
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
  };
  
  // Test adding notes
  annotationManager.addNote(feature1.id as string, "Test note 1");
  annotationManager.addNote(feature1.id as string, "Test note 2");
  
  // Test adding attribution
  annotationManager.setAttribution(feature1.id as string, {
    createdBy: "user1",
    createdAt: new Date()
  });
  
  // Test recording modification
  annotationManager.recordModification(feature1.id as string, {
    modifiedBy: "user2",
    modifiedAt: new Date(),
    description: "Changed shape"
  });
  
  // Test adding notes to another feature
  annotationManager.addNote(feature2.id as string, "Feature 2 note");
  
  // Retrieve and display data
  console.log("Feature 1 notes:", annotationManager.getNotes(feature1.id as string));
  console.log("Feature 1 attribution:", annotationManager.getAttribution(feature1.id as string));
  console.log("Feature 1 modification history:", annotationManager.getModificationHistory(feature1.id as string));
  console.log("Feature 2 notes:", annotationManager.getNotes(feature2.id as string));
  console.log("All annotated feature IDs:", annotationManager.getAnnotatedFeatureIds());
  
  // Test removing feature data
  annotationManager.removeFeatureData(feature2.id as string);
  console.log("After removing feature 2, all annotated feature IDs:", annotationManager.getAnnotatedFeatureIds());
  
  console.log("All tests completed!");
}

// Run the test
testAnnotationFeatures();