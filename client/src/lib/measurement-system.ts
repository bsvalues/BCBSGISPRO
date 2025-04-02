import * as turf from '@turf/turf';
import { Feature, Polygon, MultiPolygon, GeoJsonProperties, Position } from 'geojson';

/**
 * Units for measurements
 */
export enum MeasurementUnit {
  METERS = 'meters',
  KILOMETERS = 'kilometers',
  FEET = 'feet',
  MILES = 'miles',
  ACRES = 'acres',
  HECTARES = 'hectares',
  SQUARE_FEET = 'square_feet',
  SQUARE_METERS = 'square_meters'
}

/**
 * Type of measurement
 */
export enum MeasurementType {
  DISTANCE = 'distance',
  AREA = 'area',
  PERIMETER = 'perimeter'
}

/**
 * Calculate area of a polygon in square meters
 * @param polygon Polygon feature
 * @param unit Optional unit for result (default: square meters)
 * @returns Area in specified unit
 */
export function calculateArea(
  polygon: Feature<Polygon | MultiPolygon, GeoJsonProperties>,
  unit: MeasurementUnit = MeasurementUnit.SQUARE_METERS
): number {
  let area = turf.area(polygon);
  
  // Convert from square meters to requested unit
  switch (unit) {
    case MeasurementUnit.HECTARES:
      return area / 10000;
    case MeasurementUnit.ACRES:
      return area / 4046.86;
    case MeasurementUnit.SQUARE_FEET:
      return area * 10.7639;
    default:
      return area;
  }
}

/**
 * Calculate perimeter of a polygon in meters
 * @param polygon Polygon feature
 * @param unit Optional unit for result (default: meters)
 * @returns Perimeter in specified unit
 */
export function calculatePerimeter(
  polygon: Feature<Polygon | MultiPolygon, GeoJsonProperties>,
  unit: MeasurementUnit = MeasurementUnit.METERS
): number {
  const line = turf.polygonToLine(polygon);
  return turf.length(line, { units: convertToTurfUnits(unit) as turf.Units });
}

/**
 * Convert a measurement from one unit to another
 * @param value Value to convert
 * @param fromUnit Unit to convert from
 * @param toUnit Unit to convert to
 * @returns Converted value
 */
export function convertUnit(
  value: number,
  fromUnit: MeasurementUnit,
  toUnit: MeasurementUnit
): number {
  // First convert to base units (meters or square meters)
  let baseValue: number;
  
  // Convert from source unit to base unit
  switch (fromUnit) {
    // Distance units
    case MeasurementUnit.KILOMETERS:
      baseValue = value * 1000;
      break;
    case MeasurementUnit.FEET:
      baseValue = value * 0.3048;
      break;
    case MeasurementUnit.MILES:
      baseValue = value * 1609.34;
      break;
    
    // Area units
    case MeasurementUnit.HECTARES:
      baseValue = value * 10000;
      break;
    case MeasurementUnit.ACRES:
      baseValue = value * 4046.86;
      break;
    case MeasurementUnit.SQUARE_FEET:
      baseValue = value / 10.7639;
      break;

    // Already in base units
    case MeasurementUnit.METERS:
    case MeasurementUnit.SQUARE_METERS:
    default:
      baseValue = value;
      break;
  }
  
  // Convert from base unit to target unit
  switch (toUnit) {
    // Distance units
    case MeasurementUnit.KILOMETERS:
      return baseValue / 1000;
    case MeasurementUnit.FEET:
      return baseValue / 0.3048;
    case MeasurementUnit.MILES:
      return baseValue / 1609.34;
    
    // Area units
    case MeasurementUnit.HECTARES:
      return baseValue / 10000;
    case MeasurementUnit.ACRES:
      return baseValue / 4046.86;
    case MeasurementUnit.SQUARE_FEET:
      return baseValue * 10.7639;

    // Already in base units
    case MeasurementUnit.METERS:
    case MeasurementUnit.SQUARE_METERS:
    default:
      return baseValue;
  }
}

/**
 * Helper function to convert between MeasurementUnit and Turf.js units
 */
function convertToTurfUnits(unit: MeasurementUnit): string {
  switch (unit) {
    case MeasurementUnit.KILOMETERS:
      return 'kilometers';
    case MeasurementUnit.METERS:
      return 'meters';
    case MeasurementUnit.MILES:
      return 'miles';
    case MeasurementUnit.FEET:
      return 'feet';
    default:
      return 'meters';
  }
}

/**
 * Class for formatting measurement display values with appropriate units
 */
export class MeasurementDisplay {
  /**
   * Format an area measurement with appropriate units
   * @param value Area value
   * @param unit Unit of measurement
   * @returns Formatted string with value and units
   */
  formatArea(value: number, unit: MeasurementUnit): string {
    const unitSymbol = this.getAreaUnitSymbol(unit);
    return this.formatValue(value, unitSymbol);
  }
  
  /**
   * Format a distance measurement with appropriate units
   * @param value Distance value
   * @param unit Unit of measurement
   * @returns Formatted string with value and units
   */
  formatDistance(value: number, unit: MeasurementUnit): string {
    // Automatically convert to km for large meter values
    if (unit === MeasurementUnit.METERS && value >= 1000) {
      return this.formatValue(value / 1000, 'km');
    }
    
    const unitSymbol = this.getDistanceUnitSymbol(unit);
    return this.formatValue(value, unitSymbol);
  }
  
  /**
   * Format a value with appropriate number formatting and unit symbol
   * @param value The numeric value
   * @param unitSymbol The unit symbol to append
   * @returns Formatted string
   */
  private formatValue(value: number, unitSymbol: string): string {
    // Use different precision based on the magnitude
    const formatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: value >= 100 ? 0 : 2,
      maximumFractionDigits: value >= 100 ? 0 : 2
    });
    
    return `${formatter.format(value)} ${unitSymbol}`;
  }
  
  /**
   * Get the symbol for area units
   */
  private getAreaUnitSymbol(unit: MeasurementUnit): string {
    switch (unit) {
      case MeasurementUnit.SQUARE_METERS:
        return 'm²';
      case MeasurementUnit.SQUARE_FEET:
        return 'ft²';
      case MeasurementUnit.ACRES:
        return 'ac';
      case MeasurementUnit.HECTARES:
        return 'ha';
      default:
        return 'm²';
    }
  }
  
  /**
   * Get the symbol for distance units
   */
  private getDistanceUnitSymbol(unit: MeasurementUnit): string {
    switch (unit) {
      case MeasurementUnit.METERS:
        return 'm';
      case MeasurementUnit.KILOMETERS:
        return 'km';
      case MeasurementUnit.FEET:
        return 'ft';
      case MeasurementUnit.MILES:
        return 'mi';
      default:
        return 'm';
    }
  }
}

/**
 * Class for tracking and managing real-time measurements during drawing
 */
export class MeasurementManager {
  private points: Position[] = [];
  private updateCount: number = 0;
  private displayUnits = {
    distance: MeasurementUnit.METERS,
    area: MeasurementUnit.SQUARE_METERS
  };
  
  /**
   * Add a new point to the measurement
   * @param point [longitude, latitude] coordinate
   */
  addPoint(point: Position): void {
    this.points.push(point);
    this.updateCount++;
  }
  
  /**
   * Remove the last point
   */
  removeLastPoint(): void {
    if (this.points.length > 0) {
      this.points.pop();
      this.updateCount++;
    }
  }
  
  /**
   * Clear all points
   */
  clear(): void {
    this.points = [];
    this.updateCount++;
  }
  
  /**
   * Get the current area if a polygon is formed
   */
  getCurrentArea(unit: MeasurementUnit = this.displayUnits.area): number {
    if (this.points.length < 3) {
      return 0;
    }
    
    const polygon = this.createPolygonFeature();
    return calculateArea(polygon, unit);
  }
  
  /**
   * Get the current perimeter of the shape
   */
  getCurrentPerimeter(unit: MeasurementUnit = this.displayUnits.distance): number {
    if (this.points.length < 2) {
      return 0;
    }
    
    // For open paths, calculate length of the path
    if (this.points.length < 3) {
      const line = turf.lineString(this.points);
      return turf.length(line, { units: convertToTurfUnits(unit) as turf.Units });
    }
    
    // For closed shapes, calculate the perimeter
    const polygon = this.createPolygonFeature();
    return calculatePerimeter(polygon, unit);
  }
  
  /**
   * Set the display unit for distance measurements
   */
  setDistanceUnit(unit: MeasurementUnit): void {
    this.displayUnits.distance = unit;
  }
  
  /**
   * Set the display unit for area measurements
   */
  setAreaUnit(unit: MeasurementUnit): void {
    this.displayUnits.area = unit;
  }
  
  /**
   * Get the number of times measurements have been updated
   */
  getMeasurementUpdateCount(): number {
    return this.updateCount;
  }
  
  /**
   * Get the current points
   */
  getPoints(): Position[] {
    return [...this.points];
  }
  
  /**
   * Create a polygon feature from the current points
   */
  private createPolygonFeature(): Feature<Polygon, GeoJsonProperties> {
    // Create a closed ring if needed
    const coordinates = [...this.points];
    
    // Add the first point at the end to close the ring if not already closed
    if (
      coordinates.length > 2 &&
      (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
       coordinates[0][1] !== coordinates[coordinates.length - 1][1])
    ) {
      coordinates.push(coordinates[0]);
    }
    
    return turf.polygon([coordinates]);
  }
}