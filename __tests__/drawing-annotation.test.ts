import { 
  AnnotationManager,
  Attribution,
  createAnnotationManager 
} from '../client/src/lib/drawing-annotation';
import { Feature, Polygon, GeoJsonProperties } from 'geojson';

describe('Drawing Annotation', () => {
  // Create a test feature
  const createTestFeature = (id: string = 'feature-1'): Feature<Polygon, GeoJsonProperties> => ({
    id,
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
  });

  test('should attach notes to features', () => {
    const annotationManager = createAnnotationManager();
    const feature = createTestFeature();
    
    annotationManager.addNote(feature.id as string, "Test note");
    expect(annotationManager.getNotes(feature.id as string)).toContain("Test note");
  });
  
  test('should track attribution data', () => {
    const annotationManager = createAnnotationManager();
    const feature = createTestFeature();
    
    const attribution: Attribution = {
      createdBy: "user1",
      createdAt: new Date("2025-04-01T12:00:00Z")
    };
    
    annotationManager.setAttribution(feature.id as string, attribution);
    
    const retrievedAttribution = annotationManager.getAttribution(feature.id as string);
    expect(retrievedAttribution?.createdBy).toBe("user1");
    expect(retrievedAttribution?.createdAt).toEqual(new Date("2025-04-01T12:00:00Z"));
  });
  
  test('should update modification history when feature changes', () => {
    const annotationManager = createAnnotationManager();
    const feature = createTestFeature();
    
    annotationManager.setAttribution(feature.id as string, {
      createdBy: "user1",
      createdAt: new Date("2025-04-01T12:00:00Z")
    });
    
    annotationManager.recordModification(feature.id as string, {
      modifiedBy: "user2",
      modifiedAt: new Date("2025-04-02T12:00:00Z"),
      description: "Changed shape"
    });
    
    const history = annotationManager.getModificationHistory(feature.id as string);
    expect(history.length).toBe(1);
    expect(history[0].modifiedBy).toBe("user2");
    expect(history[0].description).toBe("Changed shape");
  });

  test('should add multiple notes to a feature', () => {
    const annotationManager = createAnnotationManager();
    const feature = createTestFeature();
    
    annotationManager.addNote(feature.id as string, "First note");
    annotationManager.addNote(feature.id as string, "Second note");
    
    const notes = annotationManager.getNotes(feature.id as string);
    expect(notes.length).toBe(2);
    expect(notes[0]).toBe("First note");
    expect(notes[1]).toBe("Second note");
  });

  test('should handle features without prior attribution', () => {
    const annotationManager = createAnnotationManager();
    const feature = createTestFeature();
    
    // Try to get attributes for a feature that hasn't been attributed yet
    const attribution = annotationManager.getAttribution(feature.id as string);
    expect(attribution).toBeUndefined();
    
    // Try to get modification history for a feature that hasn't been modified
    const history = annotationManager.getModificationHistory(feature.id as string);
    expect(history).toEqual([]);
  });

  test('should get all annotated features', () => {
    const annotationManager = createAnnotationManager();
    const feature1 = createTestFeature('feature-1');
    const feature2 = createTestFeature('feature-2');
    
    annotationManager.addNote(feature1.id as string, "Note for feature 1");
    annotationManager.setAttribution(feature2.id as string, {
      createdBy: "user1",
      createdAt: new Date()
    });
    
    const annotatedFeatureIds = annotationManager.getAnnotatedFeatureIds();
    expect(annotatedFeatureIds.length).toBe(2);
    expect(annotatedFeatureIds).toContain('feature-1');
    expect(annotatedFeatureIds).toContain('feature-2');
  });

  test('should remove annotation data for a feature', () => {
    const annotationManager = createAnnotationManager();
    const feature = createTestFeature();
    
    annotationManager.addNote(feature.id as string, "Test note");
    annotationManager.setAttribution(feature.id as string, {
      createdBy: "user1",
      createdAt: new Date()
    });
    
    annotationManager.removeFeatureData(feature.id as string);
    
    expect(annotationManager.getNotes(feature.id as string)).toEqual([]);
    expect(annotationManager.getAttribution(feature.id as string)).toBeUndefined();
  });
});