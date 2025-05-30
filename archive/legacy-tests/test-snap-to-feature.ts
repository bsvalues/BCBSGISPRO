import { createSnapManager, SnapMode } from './lib/snap-to-feature';
import { GeoJSONFeature } from './lib/map-utils';

// Test function
function testSnapToFeatureSystem() {
  console.log("Testing snap-to-feature system...");
  
  const snapManager = createSnapManager();
  
  // Create test features with explicit typing
  const lineFeature = {
    id: 'line-1',
    type: "Feature" as const,  // Use const assertion to make it literal "Feature"
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [
        [0, 0],
        [10, 0]
      ]
    }
  } as GeoJSONFeature;
  
  const polygonFeature = {
    id: 'polygon-1',
    type: "Feature" as const,  // Use const assertion to make it literal "Feature"
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0]
      ]]
    }
  } as GeoJSONFeature;
  
  // Add features to the snap manager
  snapManager.addFeature(lineFeature);
  snapManager.addFeature(polygonFeature);
  
  // Test snapping to vertex
  console.log("Testing snap to vertex...");
  
  // Test point near a vertex (should snap)
  const pointNearVertex = [0.1, 0.1];
  const snappedToVertex = snapManager.snapPoint(pointNearVertex, {
    mode: SnapMode.VERTEX,
    threshold: 0.2
  });
  console.log("Point near vertex:", pointNearVertex);
  console.log("Snapped to vertex:", snappedToVertex);
  
  // Test point far from a vertex (should not snap)
  const pointFarFromVertex = [5, 1];
  const notSnappedToVertex = snapManager.snapPoint(pointFarFromVertex, {
    mode: SnapMode.VERTEX,
    threshold: 0.2
  });
  console.log("Point far from vertex:", pointFarFromVertex);
  console.log("Not snapped to vertex:", notSnappedToVertex);
  
  // Test snapping to edge
  console.log("\nTesting snap to edge...");
  
  // Test point near an edge (should snap)
  const pointNearEdge = [5, 0.1];
  const snappedToEdge = snapManager.snapPoint(pointNearEdge, {
    mode: SnapMode.EDGE,
    threshold: 0.2
  });
  console.log("Point near edge:", pointNearEdge);
  console.log("Snapped to edge:", snappedToEdge);
  
  // Test point far from an edge (should not snap)
  const pointFarFromEdge = [5, 5];
  const notSnappedToEdge = snapManager.snapPoint(pointFarFromEdge, {
    mode: SnapMode.EDGE,
    threshold: 0.2
  });
  console.log("Point far from edge:", pointFarFromEdge);
  console.log("Not snapped to edge:", notSnappedToEdge);
  
  // Test both modes
  console.log("\nTesting both vertex and edge snap...");
  const pointNearBoth = [0.1, 0.1]; // Closer to vertex
  const snappedToBoth = snapManager.snapPoint(pointNearBoth, {
    mode: SnapMode.BOTH,
    threshold: 0.2
  });
  console.log("Point near both:", pointNearBoth);
  console.log("Snapped with both modes:", snappedToBoth);
  
  // Test removing a feature
  console.log("\nRemoving the line feature and testing again...");
  snapManager.removeFeature(lineFeature.id as string);
  
  // Test snapping after removal
  const snappedAfterRemoval = snapManager.snapPoint(pointNearEdge, {
    mode: SnapMode.EDGE,
    threshold: 0.2
  });
  console.log("Same point near edge after removal:", pointNearEdge);
  console.log("Snapped to edge after removal:", snappedAfterRemoval);
  
  console.log("\nAll tests completed!");
}

// Run the test
testSnapToFeatureSystem();