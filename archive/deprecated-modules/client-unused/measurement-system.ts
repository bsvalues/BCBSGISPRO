/**
 * Measurement System Module
 * 
 * This module provides utilities for measuring distances and areas on maps,
 * converting between unit systems, and formatting measurement values.
 */

import L from 'leaflet';

/**
 * Supported measurement types
 */
export enum MeasurementType {
  LENGTH = 'length',
  AREA = 'area',
  DISTANCE = 'distance',
  PERIMETER = 'perimeter'
}

/**
 * Supported measurement units
 */
export enum MeasurementUnit {
  METERS = 'meters',
  KILOMETERS = 'kilometers',
  FEET = 'feet',
  MILES = 'miles',
  SQUARE_METERS = 'square_meters',
  HECTARES = 'hectares',
  SQUARE_FEET = 'square_feet',
  ACRES = 'acres'
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

/**
 * Convert value from one unit to another
 * 
 * @param value The value to convert 
 * @param fromUnit The source unit
 * @param toUnit The target unit
 * @returns Converted value
 */
export function convertUnit(value: number, fromUnit: MeasurementUnit, toUnit: MeasurementUnit): number {
  if (fromUnit === toUnit) return value;
  
  // Convert to base units (meters or square meters) first
  let baseValue: number;
  
  // Convert from source unit to base unit
  switch (fromUnit) {
    case MeasurementUnit.METERS:
      baseValue = value;
      break;
    case MeasurementUnit.KILOMETERS:
      baseValue = value * 1000;
      break;
    case MeasurementUnit.FEET:
      baseValue = value / 3.28084;
      break;
    case MeasurementUnit.MILES:
      baseValue = value * 1609.34;
      break;
    case MeasurementUnit.SQUARE_METERS:
      baseValue = value;
      break;
    case MeasurementUnit.HECTARES:
      baseValue = value * 10000;
      break;
    case MeasurementUnit.SQUARE_FEET:
      baseValue = value / 10.7639;
      break;
    case MeasurementUnit.ACRES:
      baseValue = value * 4046.86;
      break;
    default:
      baseValue = value;
  }
  
  // Convert from base unit to target unit
  switch (toUnit) {
    case MeasurementUnit.METERS:
      return baseValue;
    case MeasurementUnit.KILOMETERS:
      return baseValue / 1000;
    case MeasurementUnit.FEET:
      return baseValue * 3.28084;
    case MeasurementUnit.MILES:
      return baseValue / 1609.34;
    case MeasurementUnit.SQUARE_METERS:
      return baseValue;
    case MeasurementUnit.HECTARES:
      return baseValue / 10000;
    case MeasurementUnit.SQUARE_FEET:
      return baseValue * 10.7639;
    case MeasurementUnit.ACRES:
      return baseValue / 4046.86;
    default:
      return baseValue;
  }
}

/**
 * Calculate the perimeter of a polygon
 * 
 * @param points Array of points forming the polygon
 * @returns Perimeter length in meters
 */
export function calculatePerimeter(points: Point[]): number {
  if (points.length < 3) return 0;
  
  // Make sure the polygon is closed
  const closedPoints = [...points];
  if (closedPoints[0].lat !== closedPoints[closedPoints.length - 1].lat ||
      closedPoints[0].lng !== closedPoints[closedPoints.length - 1].lng) {
    closedPoints.push(closedPoints[0]);
  }
  
  return calculatePathLength(closedPoints);
}

/**
 * MeasurementManager class for managing measurements on a map
 */
export class MeasurementManager {
  private measurements: Map<string, Measurement> = new Map();
  private activeUnit: MeasurementUnit = MeasurementUnit.METERS;
  private listeners: Array<(measurements: Measurement[]) => void> = [];
  private currentPoints: [number, number][] = [];
  
  /**
   * Clear all current points
   */
  clear(): void {
    this.currentPoints = [];
    this.clearMeasurements();
  }
  
  /**
   * Add a point to the current measurement
   * 
   * @param point Point to add [lng, lat]
   */
  addPoint(point: [number, number]): void {
    this.currentPoints.push(point);
  }
  
  /**
   * Get the perimeter of the current shape
   * 
   * @returns Perimeter in meters
   */
  getCurrentPerimeter(): number {
    if (this.currentPoints.length < 2) return 0;
    
    let perimeter = 0;
    
    for (let i = 0; i < this.currentPoints.length - 1; i++) {
      const p1 = this.currentPoints[i];
      const p2 = this.currentPoints[i + 1];
      
      // Calculate distance between points using Haversine formula
      const R = 6371000; // Earth radius in meters
      const lat1 = p1[1] * Math.PI / 180;
      const lat2 = p2[1] * Math.PI / 180;
      const dLat = (p2[1] - p1[1]) * Math.PI / 180;
      const dLon = (p2[0] - p1[0]) * Math.PI / 180;
      
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1) * Math.cos(lat2) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      perimeter += distance;
    }
    
    return perimeter;
  }
  
  /**
   * Get the area of the current shape
   * 
   * @returns Area in square meters
   */
  getCurrentArea(): number {
    if (this.currentPoints.length < 3) return 0;
    
    // Convert points to closed polygon if needed
    const closedPolygon = [...this.currentPoints];
    if (
      closedPolygon[0][0] !== closedPolygon[closedPolygon.length - 1][0] ||
      closedPolygon[0][1] !== closedPolygon[closedPolygon.length - 1][1]
    ) {
      closedPolygon.push(closedPolygon[0]);
    }
    
    // Calculate area using Shoelace formula
    let area = 0;
    for (let i = 0; i < closedPolygon.length - 1; i++) {
      area += closedPolygon[i][0] * closedPolygon[i + 1][1] - 
              closedPolygon[i + 1][0] * closedPolygon[i][1];
    }
    
    // Convert to square meters (rough approximation - not geodesically accurate)
    area = Math.abs(area) / 2;
    
    // Convert to square meters using approximate scale factor
    // This is a rough approximation and should be replaced with proper geodesic area calculation
    const latMid = this.currentPoints.reduce((sum, p) => sum + p[1], 0) / this.currentPoints.length;
    const scale = 111319.9 * Math.cos(latMid * Math.PI / 180);
    return area * scale * scale;
  }
  
  /**
   * Add a new measurement
   * 
   * @param measurement Measurement to add
   * @returns The added measurement with a generated ID if none was provided
   */
  addMeasurement(measurement: Measurement): Measurement {
    const id = measurement.id || generateMeasurementId();
    const measurementWithId = { ...measurement, id };
    this.measurements.set(id, measurementWithId);
    this.notifyListeners();
    return measurementWithId;
  }
  
  /**
   * Get a measurement by ID
   * 
   * @param id Measurement ID
   * @returns The measurement or undefined if not found
   */
  getMeasurement(id: string): Measurement | undefined {
    return this.measurements.get(id);
  }
  
  /**
   * Get all measurements
   * 
   * @returns Array of all measurements
   */
  getAllMeasurements(): Measurement[] {
    return Array.from(this.measurements.values());
  }
  
  /**
   * Update an existing measurement
   * 
   * @param id Measurement ID
   * @param updates Partial measurement updates
   * @returns The updated measurement or undefined if not found
   */
  updateMeasurement(id: string, updates: Partial<Measurement>): Measurement | undefined {
    const measurement = this.measurements.get(id);
    if (!measurement) return undefined;
    
    const updatedMeasurement = { ...measurement, ...updates };
    this.measurements.set(id, updatedMeasurement);
    this.notifyListeners();
    return updatedMeasurement;
  }
  
  /**
   * Remove a measurement
   * 
   * @param id Measurement ID
   * @returns True if the measurement was removed, false otherwise
   */
  removeMeasurement(id: string): boolean {
    const result = this.measurements.delete(id);
    if (result) this.notifyListeners();
    return result;
  }
  
  /**
   * Clear all measurements
   */
  clearMeasurements(): void {
    this.measurements.clear();
    this.notifyListeners();
  }
  
  /**
   * Set the active measurement unit
   * 
   * @param unit Unit to set as active
   */
  setActiveUnit(unit: MeasurementUnit): void {
    this.activeUnit = unit;
  }
  
  /**
   * Get the active measurement unit
   * 
   * @returns Active measurement unit
   */
  getActiveUnit(): MeasurementUnit {
    return this.activeUnit;
  }
  
  /**
   * Add a listener for measurement changes
   * 
   * @param listener Function to call when measurements change
   */
  addListener(listener: (measurements: Measurement[]) => void): void {
    this.listeners.push(listener);
  }
  
  /**
   * Remove a listener
   * 
   * @param listener Listener to remove
   */
  removeListener(listener: (measurements: Measurement[]) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }
  
  /**
   * Notify all listeners of changes
   */
  private notifyListeners(): void {
    const measurements = this.getAllMeasurements();
    for (const listener of this.listeners) {
      listener(measurements);
    }
  }
}

/**
 * MeasurementDisplay class for displaying measurements on a map
 */
export class MeasurementDisplay {
  private map: any = null;
  private measurementLayers: Map<string, any> = new Map();
  private style = {
    color: '#3388ff',
    weight: 2,
    fillColor: '#3388ff',
    fillOpacity: 0.2
  };
  
  /**
   * Format a distance for display
   * 
   * @param distance Distance in meters
   * @param unit Unit to display in
   * @returns Formatted distance string
   */
  formatDistance(distance: number, unit: MeasurementUnit = MeasurementUnit.METERS): string {
    if (unit === MeasurementUnit.METERS) {
      if (distance >= 1000) {
        return `${(distance / 1000).toFixed(2)} km`;
      } else {
        return `${distance.toFixed(2)} m`;
      }
    } else if (unit === MeasurementUnit.FEET) {
      const feet = distance * 3.28084;
      if (feet >= 5280) {
        return `${(feet / 5280).toFixed(2)} mi`;
      } else {
        return `${feet.toFixed(2)} ft`;
      }
    } else {
      return `${distance.toFixed(2)}`;
    }
  }
  
  /**
   * Format an area for display
   * 
   * @param area Area in square meters
   * @param unit Unit to display in
   * @returns Formatted area string
   */
  formatArea(area: number, unit: MeasurementUnit = MeasurementUnit.SQUARE_METERS): string {
    if (unit === MeasurementUnit.SQUARE_METERS) {
      if (area >= 10000) {
        return `${(area / 10000).toFixed(2)} hectares`;
      } else {
        return `${area.toFixed(2)} m²`;
      }
    } else if (unit === MeasurementUnit.SQUARE_FEET) {
      const squareFeet = area * 10.7639;
      if (squareFeet >= 43560) {
        return `${(squareFeet / 43560).toFixed(2)} acres`;
      } else {
        return `${squareFeet.toFixed(2)} ft²`;
      }
    } else if (unit === MeasurementUnit.ACRES) {
      return `${(area / 4046.86).toFixed(2)} acres`;
    } else if (unit === MeasurementUnit.HECTARES) {
      return `${(area / 10000).toFixed(2)} hectares`;
    } else {
      return `${area.toFixed(2)}`;
    }
  }
  
  /**
   * Set the map instance for displaying measurements
   * 
   * @param map Leaflet map instance
   */
  setMap(map: any): void {
    this.map = map;
  }
  
  /**
   * Display a measurement on the map
   * 
   * @param measurement Measurement to display
   * @returns ID of the measurement
   */
  displayMeasurement(measurement: Measurement): string {
    if (!this.map) return measurement.id || '';
    
    // Remove existing layer if there is one
    if (measurement.id && this.measurementLayers.has(measurement.id)) {
      this.removeMeasurement(measurement.id);
    }
    
    const id = measurement.id || generateMeasurementId();
    let layer: any = null;
    
    // Create the appropriate layer based on measurement type
    if (measurement.type === MeasurementType.LENGTH || 
        measurement.type === MeasurementType.DISTANCE) {
      
      // Create a polyline for length/distance measurements
      const latLngs = measurement.points.map(p => [p.lat, p.lng]);
      layer = L.polyline(latLngs, {
        ...this.style,
        color: measurement.color || this.style.color
      });
      
      // Add a label at the midpoint
      if (measurement.points.length >= 2) {
        const midpointIdx = Math.floor(measurement.points.length / 2);
        const labelPoint = measurement.points[midpointIdx];
        const popupContent = `<div class="measurement-popup">${measurement.formatted}</div>`;
        layer.bindTooltip(popupContent, { permanent: true });
      }
    } 
    else if (measurement.type === MeasurementType.AREA ||
             measurement.type === MeasurementType.PERIMETER) {
      
      // Create a polygon for area measurements
      const latLngs = measurement.points.map(p => [p.lat, p.lng]);
      layer = L.polygon(latLngs, {
        ...this.style,
        color: measurement.color || this.style.color,
        fillColor: measurement.color || this.style.fillColor
      });
      
      // Add a label at the centroid
      if (measurement.points.length >= 3) {
        const centroidLat = measurement.points.reduce((sum, p) => sum + p.lat, 0) / measurement.points.length;
        const centroidLng = measurement.points.reduce((sum, p) => sum + p.lng, 0) / measurement.points.length;
        const popupContent = `<div class="measurement-popup">${measurement.formatted}</div>`;
        layer.bindTooltip(popupContent, { permanent: true });
      }
    }
    
    if (layer) {
      layer.addTo(this.map);
      this.measurementLayers.set(id, layer);
    }
    
    return id;
  }
  
  /**
   * Remove a measurement from the map
   * 
   * @param id Measurement ID
   * @returns True if the measurement was removed, false otherwise
   */
  removeMeasurement(id: string): boolean {
    const layer = this.measurementLayers.get(id);
    if (layer && this.map) {
      this.map.removeLayer(layer);
      return this.measurementLayers.delete(id);
    }
    return false;
  }
  
  /**
   * Clear all measurements from the map
   */
  clearMeasurements(): void {
    for (const [id, layer] of this.measurementLayers.entries()) {
      if (this.map) {
        this.map.removeLayer(layer);
      }
    }
    this.measurementLayers.clear();
  }
  
  /**
   * Update the style for all measurements
   * 
   * @param style Style properties to update
   */
  updateStyle(style: Partial<typeof this.style>): void {
    this.style = { ...this.style, ...style };
    
    // Update all existing layers with the new style
    for (const layer of this.measurementLayers.values()) {
      if (layer.setStyle) {
        layer.setStyle(this.style);
      }
    }
  }
  
  /**
   * Update a specific measurement's display
   * 
   * @param measurement Updated measurement
   * @returns True if the measurement was updated, false otherwise
   */
  updateMeasurement(measurement: Measurement): boolean {
    if (!measurement.id) return false;
    
    // Re-display the measurement to update it
    this.removeMeasurement(measurement.id);
    this.displayMeasurement(measurement);
    return true;
  }
}