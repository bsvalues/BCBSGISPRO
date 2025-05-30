import { MeasurementManager, MeasurementDisplay, MeasurementUnit, calculateArea, calculatePerimeter, convertUnit } from './lib/measurement-system';
import * as turf from '@turf/turf';

// Test function
function testMeasurementSystem() {
  console.log("Testing measurement system...");
  
  // Create test polygon
  const squarePolygon = turf.polygon([[
    [0, 0],
    [1000, 0],
    [1000, 1000],
    [0, 1000],
    [0, 0]
  ]]);
  
  // Test area calculation
  console.log("\nTesting area calculations...");
  
  const areaInSquareMeters = calculateArea(squarePolygon);
  console.log("Area in square meters:", areaInSquareMeters);
  
  const areaInHectares = calculateArea(squarePolygon, MeasurementUnit.HECTARES);
  console.log("Area in hectares:", areaInHectares);
  
  const areaInAcres = calculateArea(squarePolygon, MeasurementUnit.ACRES);
  console.log("Area in acres:", areaInAcres);
  
  // Test perimeter calculation
  console.log("\nTesting perimeter calculations...");
  
  const perimeterInMeters = calculatePerimeter(squarePolygon);
  console.log("Perimeter in meters:", perimeterInMeters);
  
  const perimeterInKilometers = calculatePerimeter(squarePolygon, MeasurementUnit.KILOMETERS);
  console.log("Perimeter in kilometers:", perimeterInKilometers);
  
  const perimeterInMiles = calculatePerimeter(squarePolygon, MeasurementUnit.MILES);
  console.log("Perimeter in miles:", perimeterInMiles);
  
  // Test unit conversion
  console.log("\nTesting unit conversion...");
  
  const metersToFeet = convertUnit(1000, MeasurementUnit.METERS, MeasurementUnit.FEET);
  console.log("1000 meters in feet:", metersToFeet);
  
  const acresToHectares = convertUnit(100, MeasurementUnit.ACRES, MeasurementUnit.HECTARES);
  console.log("100 acres in hectares:", acresToHectares);
  
  // Test MeasurementDisplay
  console.log("\nTesting measurement display formatting...");
  
  const display = new MeasurementDisplay();
  
  console.log("Format 1234.56 meters:", display.formatDistance(1234.56, MeasurementUnit.METERS));
  console.log("Format 1.2345 kilometers:", display.formatDistance(1.2345, MeasurementUnit.KILOMETERS));
  console.log("Format 5280 feet:", display.formatDistance(5280, MeasurementUnit.FEET));
  
  console.log("Format 123456.78 square meters:", display.formatArea(123456.78, MeasurementUnit.SQUARE_METERS));
  console.log("Format 12.345 hectares:", display.formatArea(12.345, MeasurementUnit.HECTARES));
  console.log("Format 40.5 acres:", display.formatArea(40.5, MeasurementUnit.ACRES));
  
  // Test MeasurementManager
  console.log("\nTesting MeasurementManager...");
  
  const manager = new MeasurementManager();
  
  // Add a triangle
  manager.addPoint([0, 0]);
  manager.addPoint([1000, 0]);
  manager.addPoint([500, 866]);
  
  console.log("Triangle area:", manager.getCurrentArea());
  console.log("Triangle perimeter:", manager.getCurrentPerimeter());
  
  // Change units
  manager.setAreaUnit(MeasurementUnit.HECTARES);
  manager.setDistanceUnit(MeasurementUnit.KILOMETERS);
  
  console.log("Triangle area in hectares:", manager.getCurrentArea());
  console.log("Triangle perimeter in kilometers:", manager.getCurrentPerimeter());
  
  // Remove a point and check again
  manager.removeLastPoint();
  
  console.log("Line length after removing a point:", manager.getCurrentPerimeter());
  console.log("Area after removing a point (should be 0):", manager.getCurrentArea());
  
  console.log("\nAll tests completed!");
}

// Run the test
testMeasurementSystem();