/**
 * Measurement System Module
 * 
 * This module provides utilities for measuring distances and areas on maps,
 * converting between unit systems, and formatting measurement values.
 */

/**
 * Supported measurement types
 */
export enum MeasurementType {
  LENGTH = 'length',
  AREA = 'area'
}

/**
 * Supported unit systems
 */
export enum UnitSystem {
  METRIC = 'metric',
  IMPERIAL = 'imperial'
}

/**
 * Geographic point with latitude and longitude
 */
export interface Point {
  lat: number;
  lng: number;
}

/**
 * Measurement object representing the result of a measurement
 */
export interface Measurement {
  type: MeasurementType;
  points: Point[];
  value: number;
  unitSystem: UnitSystem;
  formatted: string;
  id?: string;
  label?: string;
  color?: string;
}

/**
 * Calculate the distance between two geographic points using the Haversine formula
 * 
 * @param point1 First geographic point
 * @param point2 Second geographic point
 * @returns Distance in meters
 */
export function calculateDistance(point1: Point, point2: Point): number {
  const R = 6371000; // Earth radius in meters
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
}

/**
 * Calculate the total length of a path
 * 
 * @param points Array of geographic points forming the path
 * @returns Total length in meters
 */
export function calculatePathLength(points: Point[]): number {
  if (points.length < 2) return 0;
  
  let totalDistance = 0;
  for (let i = 0; i < points.length - 1; i++) {
    totalDistance += calculateDistance(points[i], points[i+1]);
  }
  
  return totalDistance;
}

/**
 * Calculate the area of a polygon
 * 
 * @param points Array of geographic points forming the polygon
 * @returns Area in square meters
 */
export function calculateArea(points: Point[]): number {
  if (points.length < 3) return 0;
  
  // Make sure the polygon is closed
  const closedPoints = [...points];
  if (closedPoints[0].lat !== closedPoints[closedPoints.length - 1].lat ||
      closedPoints[0].lng !== closedPoints[closedPoints.length - 1].lng) {
    closedPoints.push(closedPoints[0]);
  }
  
  // Use the Shoelace formula (Gauss's area formula) for approximate calculation
  // For more precise results on a spherical Earth, a more complex algorithm would be needed
  let area = 0;
  
  for (let i = 0; i < closedPoints.length - 1; i++) {
    const p1 = closedPoints[i];
    const p2 = closedPoints[i + 1];
    
    // Convert to approximate Cartesian coordinates centered at polygon
    const centerLat = closedPoints.reduce((sum, p) => sum + p.lat, 0) / closedPoints.length;
    const centerLng = closedPoints.reduce((sum, p) => sum + p.lng, 0) / closedPoints.length;
    
    // Scale factors to convert degrees to approximate meters at this latitude
    const latScale = 111320; // 1 degree latitude is approximately 111.32 km
    const lngScale = 111320 * Math.cos(toRadians(centerLat)); // longitude scale varies with latitude
    
    const x1 = (p1.lng - centerLng) * lngScale;
    const y1 = (p1.lat - centerLat) * latScale;
    const x2 = (p2.lng - centerLng) * lngScale;
    const y2 = (p2.lat - centerLat) * latScale;
    
    area += (x1 * y2 - x2 * y1);
  }
  
  return Math.abs(area / 2);
}

/**
 * Convert a value from one unit system to another
 * 
 * @param value Value to convert
 * @param type Type of measurement (length or area)
 * @param fromSystem Source unit system
 * @param toSystem Target unit system
 * @returns Converted value
 */
export function convertUnits(
  value: number,
  type: MeasurementType,
  fromSystem: UnitSystem,
  toSystem: UnitSystem
): number {
  if (fromSystem === toSystem) return value;
  
  if (type === MeasurementType.LENGTH) {
    // Length conversion factors
    if (fromSystem === UnitSystem.METRIC && toSystem === UnitSystem.IMPERIAL) {
      return value * 3.28084; // meters to feet
    } else {
      return value / 3.28084; // feet to meters
    }
  } else {
    // Area conversion factors
    if (fromSystem === UnitSystem.METRIC && toSystem === UnitSystem.IMPERIAL) {
      return value * 10.7639; // square meters to square feet
    } else {
      return value / 10.7639; // square feet to square meters
    }
  }
}

/**
 * Format a measurement value with appropriate units
 * 
 * @param value Measurement value
 * @param type Type of measurement
 * @param unitSystem Unit system to use
 * @returns Formatted string with units
 */
export function formatMeasurement(
  value: number,
  type: MeasurementType,
  unitSystem: UnitSystem
): string {
  if (type === MeasurementType.LENGTH) {
    if (unitSystem === UnitSystem.METRIC) {
      if (value >= 1000) {
        return `${(value / 1000).toFixed(2)} km`;
      } else {
        return `${value.toFixed(2)} m`;
      }
    } else {
      if (value >= 5280) {
        return `${(value / 5280).toFixed(2)} mi`;
      } else {
        return `${value.toFixed(2)} ft`;
      }
    }
  } else {
    if (unitSystem === UnitSystem.METRIC) {
      if (value >= 10000) {
        return `${(value / 10000).toFixed(2)} ha`;
      } else {
        return `${value.toFixed(2)} m²`;
      }
    } else {
      if (value >= 43560) {
        return `${(value / 43560).toFixed(2)} ac`;
      } else {
        return `${value.toFixed(2)} ft²`;
      }
    }
  }
}

/**
 * Create a measurement object from a set of points
 * 
 * @param type Type of measurement
 * @param points Array of geographic points
 * @param unitSystem Unit system to use
 * @param options Additional options (id, label, color)
 * @returns Measurement object
 */
export function createMeasurement(
  type: MeasurementType,
  points: Point[],
  unitSystem: UnitSystem,
  options: { id?: string; label?: string; color?: string } = {}
): Measurement {
  let value: number;
  
  if (type === MeasurementType.LENGTH) {
    value = calculatePathLength(points);
  } else {
    value = calculateArea(points);
  }
  
  const measurement: Measurement = {
    type,
    points: [...points],
    value,
    unitSystem,
    formatted: formatMeasurement(value, type, unitSystem),
    ...options
  };
  
  return measurement;
}

/**
 * Convert degrees to radians
 * 
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
function toRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}

/**
 * Convert a measurement to a different unit system
 * 
 * @param measurement Measurement to convert
 * @param toSystem Target unit system
 * @returns Converted measurement
 */
export function convertMeasurement(
  measurement: Measurement,
  toSystem: UnitSystem
): Measurement {
  if (measurement.unitSystem === toSystem) return measurement;
  
  const convertedValue = convertUnits(
    measurement.value,
    measurement.type,
    measurement.unitSystem,
    toSystem
  );
  
  return {
    ...measurement,
    value: convertedValue,
    unitSystem: toSystem,
    formatted: formatMeasurement(convertedValue, measurement.type, toSystem)
  };
}

/**
 * Generate a unique ID for a measurement
 * 
 * @returns Unique ID string
 */
export function generateMeasurementId(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}