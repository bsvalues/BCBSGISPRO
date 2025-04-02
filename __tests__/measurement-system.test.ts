import { 
  calculateArea, 
  calculatePerimeter, 
  convertUnit,
  MeasurementUnit,
  MeasurementDisplay,
  MeasurementManager
} from '@/lib/measurement-system';
import { Feature, Polygon, GeoJsonProperties } from 'geojson';

describe('Measurement System', () => {
  // Create a simple square polygon for testing (100m x 100m)
  const createTestPolygon = (): Feature<Polygon, GeoJsonProperties> => ({
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [0, 0],
        [0.001, 0],    // ~100m at equator
        [0.001, 0.001],
        [0, 0.001],
        [0, 0]         // Close the polygon
      ]]
    }
  });

  test('should calculate area of polygon accurately', () => {
    const polygon = createTestPolygon();
    // Area of square should be roughly 10000 sq meters (1 hectare)
    expect(calculateArea(polygon, MeasurementUnit.SQUARE_METERS)).toBeCloseTo(10000, -1);
    expect(calculateArea(polygon, MeasurementUnit.ACRES)).toBeCloseTo(2.47, 0);
  });

  test('should calculate perimeter correctly', () => {
    const polygon = createTestPolygon();
    // Perimeter should be roughly 400 meters (4 sides of ~100m each)
    expect(calculatePerimeter(polygon, MeasurementUnit.METERS)).toBeCloseTo(400, -1);
    expect(calculatePerimeter(polygon, MeasurementUnit.FEET)).toBeCloseTo(1312, -1);
  });

  test('should convert between measurement units correctly', () => {
    expect(convertUnit(100, MeasurementUnit.METERS, MeasurementUnit.FEET)).toBeCloseTo(328.08, 0);
    expect(convertUnit(1, MeasurementUnit.ACRES, MeasurementUnit.SQUARE_METERS)).toBeCloseTo(4046.86, 0);
    expect(convertUnit(1, MeasurementUnit.HECTARES, MeasurementUnit.ACRES)).toBeCloseTo(2.47, 0);
  });

  test('MeasurementDisplay should format values with proper units', () => {
    const display = new MeasurementDisplay();
    
    expect(display.formatArea(10000, MeasurementUnit.SQUARE_METERS)).toBe('10,000 m²');
    expect(display.formatArea(2.5, MeasurementUnit.ACRES)).toBe('2.50 ac');
    
    expect(display.formatDistance(1500, MeasurementUnit.METERS)).toBe('1.50 km');
    expect(display.formatDistance(750, MeasurementUnit.FEET)).toBe('750.00 ft');
  });

  test('MeasurementManager should track real-time measurements during drawing', () => {
    const manager = new MeasurementManager();
    const points: [number, number][] = [
      [0, 0],
      [0.001, 0],
      [0.001, 0.001]
    ];

    // Simulate adding points during drawing
    points.forEach(point => manager.addPoint(point));
    
    // Should have current measurements
    expect(manager.getCurrentPerimeter()).toBeGreaterThan(0);
    expect(manager.getMeasurementUpdateCount()).toBe(3);
    
    // Add final point to close polygon
    manager.addPoint([0, 0]);
    
    // Area should now be available
    expect(manager.getCurrentArea()).toBeGreaterThan(0);
  });
});