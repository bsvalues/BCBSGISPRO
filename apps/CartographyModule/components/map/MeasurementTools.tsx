/**
 * Measurement Tools Component
 * 
 * This component provides tools for measuring distances, areas, and angles on maps.
 * It supports multiple measurement units and can work with various map providers.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Ruler, 
  SquareIcon,
  Move, 
  RotateCcw, 
  Trash2, 
  Save,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

import { logger } from '../../../../libs/DevOps/utils/logger';
import { MeasurementType } from './MapControls';

// Create module-specific logger
const measurementLogger = logger.withTags(['CartographyModule', 'MeasurementTools']);

/**
 * Supported length units
 */
export type LengthUnit = 'feet' | 'meters' | 'miles' | 'kilometers' | 'yards' | 'nautical-miles';

/**
 * Supported area units
 */
export type AreaUnit = 'square-feet' | 'square-meters' | 'acres' | 'hectares' | 'square-miles' | 'square-kilometers';

/**
 * Measurement result for distance
 */
export interface DistanceMeasurement {
  type: 'distance';
  points: Array<[number, number]>; // Array of [lng, lat] coordinates
  segments: Array<{
    start: [number, number];
    end: [number, number];
    distance: number; // In meters
  }>;
  total: {
    meters: number;
    [unit: string]: number; // Converted values
  };
}

/**
 * Measurement result for area
 */
export interface AreaMeasurement {
  type: 'area';
  points: Array<[number, number]>; // Array of [lng, lat] coordinates forming a polygon
  area: {
    squareMeters: number;
    [unit: string]: number; // Converted values
  };
  perimeter: {
    meters: number;
    [unit: string]: number; // Converted values
  };
}

/**
 * Measurement result for bearing/angle
 */
export interface BearingMeasurement {
  type: 'bearing';
  points: Array<[number, number]>; // Array of [lng, lat] coordinates
  bearing: number; // In degrees
  compassPoint: string; // E.g., "NE", "WSW"
}

/**
 * Combined measurement result type
 */
export type MeasurementResult = DistanceMeasurement | AreaMeasurement | BearingMeasurement;

/**
 * Measurement tools props
 */
export interface MeasurementToolsProps {
  // Map instance (can be mapbox, leaflet, etc.)
  mapInstance?: any;
  
  // Active measurement type (null if no measurement is active)
  activeMeasurement: MeasurementType | null;
  
  // Default units
  defaultLengthUnit?: LengthUnit;
  defaultAreaUnit?: AreaUnit;
  
  // Show help tips
  showHelp?: boolean;
  
  // Event handlers
  onMeasurementStart?: (type: MeasurementType) => void;
  onMeasurementUpdate?: (measurement: MeasurementResult) => void;
  onMeasurementComplete?: (measurement: MeasurementResult) => void;
  onMeasurementCancel?: () => void;
  
  // Component styling
  className?: string;
  style?: React.CSSProperties;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  compact?: boolean;
}

/**
 * Measurement Tools Component
 */
export const MeasurementTools: React.FC<MeasurementToolsProps> = ({
  mapInstance,
  activeMeasurement,
  defaultLengthUnit = 'feet',
  defaultAreaUnit = 'acres',
  showHelp = true,
  onMeasurementStart,
  onMeasurementUpdate,
  onMeasurementComplete,
  onMeasurementCancel,
  className = '',
  style = {},
  position = 'bottom-left',
  compact = false
}) => {
  // State for selected units
  const [lengthUnit, setLengthUnit] = useState<LengthUnit>(defaultLengthUnit);
  const [areaUnit, setAreaUnit] = useState<AreaUnit>(defaultAreaUnit);
  
  // State for measurement results
  const [currentMeasurement, setCurrentMeasurement] = useState<MeasurementResult | null>(null);
  
  // State for measurement points
  const [points, setPoints] = useState<Array<[number, number]>>([]);
  
  // State for UI
  const [expanded, setExpanded] = useState<boolean>(!compact);
  const [helpExpanded, setHelpExpanded] = useState<boolean>(false);
  
  // Initialize on component mount
  useEffect(() => {
    measurementLogger.info('Measurement tools initialized', { 
      defaultLengthUnit, 
      defaultAreaUnit 
    });
    
    return () => {
      // Clean up any active measurements on unmount
      cleanupMeasurement();
    };
  }, []);
  
  // Handle changes to active measurement
  useEffect(() => {
    if (activeMeasurement) {
      startMeasurement(activeMeasurement);
    } else {
      cleanupMeasurement();
    }
  }, [activeMeasurement]);
  
  /**
   * Start a new measurement
   */
  const startMeasurement = useCallback((type: MeasurementType) => {
    measurementLogger.debug(`Starting ${type} measurement`);
    
    // Reset state
    setPoints([]);
    setCurrentMeasurement(null);
    
    // Set up map interactions based on measurement type
    setupMapInteractions(type);
    
    // Notify parent
    if (onMeasurementStart) {
      onMeasurementStart(type);
    }
  }, [onMeasurementStart, mapInstance]);
  
  /**
   * Clean up active measurement
   */
  const cleanupMeasurement = useCallback(() => {
    measurementLogger.debug('Cleaning up measurement');
    
    // Reset state
    setPoints([]);
    setCurrentMeasurement(null);
    
    // Clean up map interactions
    cleanupMapInteractions();
  }, [mapInstance]);
  
  /**
   * Set up map interactions for measurement
   */
  const setupMapInteractions = useCallback((type: MeasurementType) => {
    if (!mapInstance) return;
    
    // This would be implemented differently for each map provider
    // Here's a generic implementation that would be customized
    
    try {
      // Change cursor to crosshair
      mapInstance.getCanvas().style.cursor = 'crosshair';
      
      // Add click handler to map
      mapInstance.on('click', handleMapClick);
      
      // Add mousemove handler for live updates
      mapInstance.on('mousemove', handleMapMouseMove);
      
      // Add escape key handler for cancellation
      document.addEventListener('keydown', handleKeyDown);
      
      measurementLogger.debug(`Map interactions set up for ${type} measurement`);
    } catch (error) {
      measurementLogger.error('Failed to set up map interactions', error);
    }
  }, [mapInstance]);
  
  /**
   * Clean up map interactions
   */
  const cleanupMapInteractions = useCallback(() => {
    if (!mapInstance) return;
    
    try {
      // Reset cursor
      mapInstance.getCanvas().style.cursor = '';
      
      // Remove event handlers
      mapInstance.off('click', handleMapClick);
      mapInstance.off('mousemove', handleMapMouseMove);
      document.removeEventListener('keydown', handleKeyDown);
      
      // Remove any temporary layers or markers
      if (mapInstance.getLayer('measurement-line')) {
        mapInstance.removeLayer('measurement-line');
      }
      
      if (mapInstance.getLayer('measurement-points')) {
        mapInstance.removeLayer('measurement-points');
      }
      
      if (mapInstance.getLayer('measurement-polygon')) {
        mapInstance.removeLayer('measurement-polygon');
      }
      
      if (mapInstance.getSource('measurement-source')) {
        mapInstance.removeSource('measurement-source');
      }
      
      measurementLogger.debug('Map interactions cleaned up');
    } catch (error) {
      measurementLogger.error('Failed to clean up map interactions', error);
    }
  }, [mapInstance]);
  
  /**
   * Handle map click
   */
  const handleMapClick = useCallback((e: any) => {
    const clickedPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];
    
    // Add point to list
    setPoints(prevPoints => {
      const newPoints = [...prevPoints, clickedPoint];
      
      // Calculate measurement based on points
      calculateMeasurement(newPoints);
      
      return newPoints;
    });
    
    measurementLogger.debug(`Added point: [${clickedPoint[0]}, ${clickedPoint[1]}]`);
  }, [activeMeasurement]);
  
  /**
   * Handle map mouse move
   */
  const handleMapMouseMove = useCallback((e: any) => {
    if (points.length === 0) return;
    
    const currentPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];
    
    // Create a temporary set of points with the current mouse position
    const tempPoints = [...points, currentPoint];
    
    // Update the visual representation
    updateMapVisualization(tempPoints);
    
    // Calculate temporary measurement
    const tempMeasurement = calculateMeasurementFromPoints(tempPoints, activeMeasurement!);
    
    // Notify parent of update
    if (onMeasurementUpdate && tempMeasurement) {
      onMeasurementUpdate(tempMeasurement);
    }
  }, [points, activeMeasurement, onMeasurementUpdate]);
  
  /**
   * Handle key down (for esc key)
   */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Cancel measurement
      if (onMeasurementCancel) {
        onMeasurementCancel();
      }
    }
  }, [onMeasurementCancel]);
  
  /**
   * Update the visual representation on the map
   */
  const updateMapVisualization = useCallback((points: Array<[number, number]>) => {
    if (!mapInstance || points.length === 0) return;
    
    try {
      // Create or update GeoJSON source
      const source = {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      };
      
      // Add points feature
      source.data.features.push({
        type: 'Feature',
        geometry: {
          type: 'MultiPoint',
          coordinates: points as GeoJSONCoordinate[]
        },
        properties: {}
      } as GeoJSONFeature);
      
      // Add line feature
      source.data.features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: points as GeoJSONCoordinate[]
        },
        properties: {}
      } as GeoJSONFeature);
      
      // Add polygon feature if measuring area and we have at least 3 points
      if (activeMeasurement === MeasurementType.AREA && points.length >= 3) {
        const closedPoints = [...points];
        
        // Close the polygon
        if (closedPoints[0][0] !== closedPoints[closedPoints.length - 1][0] ||
            closedPoints[0][1] !== closedPoints[closedPoints.length - 1][1]) {
          closedPoints.push(closedPoints[0]);
        }
        
        source.data.features.push({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [closedPoints]
          },
          properties: {}
        });
      }
      
      // Update or create the source
      if (mapInstance.getSource('measurement-source')) {
        mapInstance.getSource('measurement-source').setData(source.data);
      } else {
        mapInstance.addSource('measurement-source', source);
        
        // Add layers on first creation
        mapInstance.addLayer({
          id: 'measurement-line',
          type: 'line',
          source: 'measurement-source',
          filter: ['==', '$type', 'LineString'],
          paint: {
            'line-color': '#0080ff',
            'line-width': 2,
            'line-dasharray': [2, 1]
          }
        });
        
        mapInstance.addLayer({
          id: 'measurement-points',
          type: 'circle',
          source: 'measurement-source',
          filter: ['==', '$type', 'Point'],
          paint: {
            'circle-radius': 5,
            'circle-color': '#0080ff',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2
          }
        });
        
        mapInstance.addLayer({
          id: 'measurement-polygon',
          type: 'fill',
          source: 'measurement-source',
          filter: ['==', '$type', 'Polygon'],
          paint: {
            'fill-color': '#0080ff',
            'fill-opacity': 0.2,
            'fill-outline-color': '#0080ff'
          }
        });
      }
    } catch (error) {
      measurementLogger.error('Failed to update map visualization', error);
    }
  }, [mapInstance, activeMeasurement]);
  
  /**
   * Calculate measurement from the current points
   */
  const calculateMeasurement = useCallback((newPoints: Array<[number, number]>) => {
    if (!activeMeasurement || newPoints.length < 2) return;
    
    const measurement = calculateMeasurementFromPoints(newPoints, activeMeasurement);
    
    if (measurement) {
      setCurrentMeasurement(measurement);
      
      // Notify parent of update
      if (onMeasurementUpdate) {
        onMeasurementUpdate(measurement);
      }
      
      // If this is the final point for certain measurements, complete the measurement
      const isFinalPoint = 
        (activeMeasurement === MeasurementType.BEARING && newPoints.length === 2) ||
        (activeMeasurement === MeasurementType.ANGLE && newPoints.length === 3);
      
      if (isFinalPoint && onMeasurementComplete) {
        onMeasurementComplete(measurement);
      }
    }
  }, [activeMeasurement, onMeasurementUpdate, onMeasurementComplete]);
  
  /**
   * Calculate measurement from points
   */
  const calculateMeasurementFromPoints = (
    points: Array<[number, number]>, 
    type: MeasurementType
  ): MeasurementResult | null => {
    if (points.length < 2) return null;
    
    switch (type) {
      case MeasurementType.DISTANCE:
        return calculateDistance(points);
      
      case MeasurementType.AREA:
        if (points.length < 3) return null;
        return calculateArea(points);
      
      case MeasurementType.BEARING:
        return calculateBearing(points);
      
      case MeasurementType.PERIMETER:
        if (points.length < 2) return null;
        return calculatePerimeter(points);
      
      default:
        return null;
    }
  };
  
  /**
   * Calculate distance measurement
   */
  const calculateDistance = (points: Array<[number, number]>): DistanceMeasurement => {
    let totalMeters = 0;
    const segments = [];
    
    // Calculate distance for each segment
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      
      const segmentMeters = calculateDistanceBetween(start, end);
      totalMeters += segmentMeters;
      
      segments.push({
        start,
        end,
        distance: segmentMeters
      });
    }
    
    // Convert to selected unit
    const total: Record<string, number> = {
      meters: totalMeters
    };
    
    // Add converted values
    total[lengthUnit] = convertLength(totalMeters, 'meters', lengthUnit);
    
    return {
      type: 'distance',
      points,
      segments,
      total
    };
  };
  
  /**
   * Calculate area measurement
   */
  const calculateArea = (points: Array<[number, number]>): AreaMeasurement => {
    // Ensure the polygon is closed
    const closedPoints = [...points];
    if (closedPoints[0][0] !== closedPoints[closedPoints.length - 1][0] ||
        closedPoints[0][1] !== closedPoints[closedPoints.length - 1][1]) {
      closedPoints.push(closedPoints[0]);
    }
    
    // Calculate area using the Shoelace formula
    const squareMeters = calculatePolygonArea(closedPoints);
    
    // Calculate perimeter
    let perimeterMeters = 0;
    for (let i = 0; i < closedPoints.length - 1; i++) {
      perimeterMeters += calculateDistanceBetween(closedPoints[i], closedPoints[i + 1]);
    }
    
    // Create area conversions
    const area: Record<string, number> = {
      squareMeters
    };
    
    // Add converted values for area
    area[areaUnit] = convertArea(squareMeters, 'square-meters', areaUnit);
    
    // Create perimeter conversions
    const perimeter: Record<string, number> = {
      meters: perimeterMeters
    };
    
    // Add converted values for perimeter
    perimeter[lengthUnit] = convertLength(perimeterMeters, 'meters', lengthUnit);
    
    return {
      type: 'area',
      points,
      area,
      perimeter
    };
  };
  
  /**
   * Calculate perimeter measurement
   */
  const calculatePerimeter = (points: Array<[number, number]>): DistanceMeasurement => {
    // For perimeter, we calculate distance but close the loop
    const closedPoints = [...points];
    
    // Close the loop if needed
    if (points.length > 2 && (
      closedPoints[0][0] !== closedPoints[closedPoints.length - 1][0] ||
      closedPoints[0][1] !== closedPoints[closedPoints.length - 1][1]
    )) {
      closedPoints.push(closedPoints[0]);
    }
    
    return calculateDistance(closedPoints);
  };
  
  /**
   * Calculate bearing measurement
   */
  const calculateBearing = (points: Array<[number, number]>): BearingMeasurement => {
    // Need at least two points to calculate bearing
    if (points.length < 2) {
      return {
        type: 'bearing',
        points,
        bearing: 0,
        compassPoint: 'N'
      };
    }
    
    // Calculate bearing between the first two points
    const start = points[0];
    const end = points[1];
    
    const bearing = calculateBearingBetween(start, end);
    const compassPoint = getCompassPoint(bearing);
    
    return {
      type: 'bearing',
      points,
      bearing,
      compassPoint
    };
  };
  
  /**
   * Calculate the distance between two points in meters
   */
  const calculateDistanceBetween = (
    point1: [number, number], 
    point2: [number, number]
  ): number => {
    // Implementation of the Haversine formula for distance calculation
    const [lon1, lat1] = point1;
    const [lon2, lat2] = point2;
    
    const R = 6371000; // Radius of the Earth in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * 
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  };
  
  /**
   * Calculate the bearing between two points in degrees
   */
  const calculateBearingBetween = (
    point1: [number, number], 
    point2: [number, number]
  ): number => {
    const [lon1, lat1] = point1;
    const [lon2, lat2] = point2;
    
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    
    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    bearing = (bearing + 360) % 360; // Normalize to 0-360
    
    return bearing;
  };
  
  /**
   * Calculate the area of a polygon in square meters
   */
  const calculatePolygonArea = (points: Array<[number, number]>): number => {
    // If this were a real implementation, we'd use a library like Turf.js
    // For simplicity, let's use a basic implementation of the Shoelace formula
    
    // Convert to projected coordinates for more accurate area calculation
    const projectedPoints = points.map(point => {
      // Simple approximation - in a real app, use proper projection
      const [lon, lat] = point;
      // Approximate meters per degree at the equator
      const metersPerDegree = 111319.9;
      const x = lon * metersPerDegree * Math.cos(lat * Math.PI / 180);
      const y = lat * metersPerDegree;
      return [x, y];
    });
    
    let area = 0;
    for (let i = 0, j = projectedPoints.length - 1; i < projectedPoints.length; j = i++) {
      area += projectedPoints[i][0] * projectedPoints[j][1];
      area -= projectedPoints[j][0] * projectedPoints[i][1];
    }
    
    return Math.abs(area / 2);
  };
  
  /**
   * Convert a length measurement between units
   */
  const convertLength = (value: number, fromUnit: LengthUnit | 'meters', toUnit: LengthUnit): number => {
    // Conversion factors to meters
    const toMeters: Record<string, number> = {
      'meters': 1,
      'feet': 0.3048,
      'miles': 1609.34,
      'kilometers': 1000,
      'yards': 0.9144,
      'nautical-miles': 1852
    };
    
    // Convert to meters first
    const meters = value * (fromUnit === 'meters' ? 1 : 1 / toMeters[fromUnit]);
    
    // Then convert to target unit
    return meters / toMeters[toUnit];
  };
  
  /**
   * Convert an area measurement between units
   */
  const convertArea = (value: number, fromUnit: AreaUnit | 'square-meters', toUnit: AreaUnit): number => {
    // Conversion factors to square meters
    const toSquareMeters: Record<string, number> = {
      'square-meters': 1,
      'square-feet': 0.092903,
      'acres': 4046.86,
      'hectares': 10000,
      'square-miles': 2589988.11,
      'square-kilometers': 1000000
    };
    
    // Convert to square meters first
    const squareMeters = value * (fromUnit === 'square-meters' ? 1 : 1 / toSquareMeters[fromUnit]);
    
    // Then convert to target unit
    return squareMeters / toSquareMeters[toUnit];
  };
  
  /**
   * Get the compass point from a bearing
   */
  const getCompassPoint = (bearing: number): string => {
    const compassPoints = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW', 'N'];
    const index = Math.round(bearing / 22.5);
    return compassPoints[index % 16];
  };
  
  /**
   * Format a measurement value for display
   */
  const formatMeasurement = (value: number, unit: string): string => {
    let formattedValue = value.toFixed(2);
    let displayUnit = unit;
    
    // Format units for display
    switch (unit) {
      case 'square-feet':
        displayUnit = 'ft²';
        break;
      case 'square-meters':
        displayUnit = 'm²';
        break;
      case 'square-kilometers':
        displayUnit = 'km²';
        break;
      case 'square-miles':
        displayUnit = 'mi²';
        break;
      case 'meters':
        displayUnit = 'm';
        break;
      case 'kilometers':
        displayUnit = 'km';
        break;
      case 'feet':
        displayUnit = 'ft';
        break;
      case 'miles':
        displayUnit = 'mi';
        break;
      case 'nautical-miles':
        displayUnit = 'nm';
        break;
      case 'yards':
        displayUnit = 'yd';
        break;
    }
    
    return `${formattedValue} ${displayUnit}`;
  };
  
  /**
   * Get the active tool icon
   */
  const getActiveToolIcon = useMemo(() => {
    if (!activeMeasurement) return null;
    
    switch (activeMeasurement) {
      case MeasurementType.DISTANCE:
        return <Ruler size={16} />;
      case MeasurementType.AREA:
        return <SquareIcon size={16} />;
      case MeasurementType.BEARING:
        return <Compass size={16} />;
      case MeasurementType.PERIMETER:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <path d="M21 3v18M3 21h18M3 3v18"/>
          </svg>
        );
      default:
        return null;
    }
  }, [activeMeasurement]);
  
  /**
   * Get the measurement display text
   */
  const getMeasurementDisplay = useMemo(() => {
    if (!currentMeasurement) return null;
    
    switch (currentMeasurement.type) {
      case 'distance':
        return formatMeasurement(currentMeasurement.total[lengthUnit], lengthUnit);
      
      case 'area':
        return (
          <>
            {formatMeasurement(currentMeasurement.area[areaUnit], areaUnit)}
            <br />
            <small>Perimeter: {formatMeasurement(currentMeasurement.perimeter[lengthUnit], lengthUnit)}</small>
          </>
        );
      
      case 'bearing':
        return (
          <>
            {currentMeasurement.bearing.toFixed(1)}° ({currentMeasurement.compassPoint})
          </>
        );
      
      default:
        return null;
    }
  }, [currentMeasurement, lengthUnit, areaUnit]);
  
  /**
   * Get unit options for selector
   */
  const getLengthUnitOptions = useMemo(() => {
    const options: { value: LengthUnit; label: string }[] = [
      { value: 'feet', label: 'Feet (ft)' },
      { value: 'meters', label: 'Meters (m)' },
      { value: 'miles', label: 'Miles (mi)' },
      { value: 'kilometers', label: 'Kilometers (km)' },
      { value: 'yards', label: 'Yards (yd)' },
      { value: 'nautical-miles', label: 'Nautical Miles (nm)' }
    ];
    
    return options;
  }, []);
  
  /**
   * Get area unit options for selector
   */
  const getAreaUnitOptions = useMemo(() => {
    const options: { value: AreaUnit; label: string }[] = [
      { value: 'acres', label: 'Acres (ac)' },
      { value: 'square-feet', label: 'Square Feet (ft²)' },
      { value: 'square-meters', label: 'Square Meters (m²)' },
      { value: 'hectares', label: 'Hectares (ha)' },
      { value: 'square-miles', label: 'Square Miles (mi²)' },
      { value: 'square-kilometers', label: 'Square Kilometers (km²)' }
    ];
    
    return options;
  }, []);
  
  /**
   * Handle completion of measurement
   */
  const handleCompleteMeasurement = useCallback(() => {
    if (!currentMeasurement) return;
    
    // Notify parent of completion
    if (onMeasurementComplete) {
      onMeasurementComplete(currentMeasurement);
    }
    
    // Clean up measurement if it's not auto-completing
    if (activeMeasurement !== MeasurementType.BEARING && activeMeasurement !== MeasurementType.ANGLE) {
      // Don't actually reset the measurement state here, let the parent do it
      // by setting activeMeasurement to null
    }
  }, [currentMeasurement, activeMeasurement, onMeasurementComplete]);
  
  /**
   * Handle cancellation of measurement
   */
  const handleCancelMeasurement = useCallback(() => {
    if (onMeasurementCancel) {
      onMeasurementCancel();
    }
  }, [onMeasurementCancel]);
  
  /**
   * Handle reset of current points
   */
  const handleResetPoints = useCallback(() => {
    setPoints([]);
    setCurrentMeasurement(null);
    
    // Update the UI
    updateMapVisualization([]);
    
    measurementLogger.debug('Measurement points reset');
  }, [updateMapVisualization]);
  
  /**
   * Toggle expanded state
   */
  const toggleExpanded = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);
  
  /**
   * Toggle help expanded state
   */
  const toggleHelpExpanded = useCallback(() => {
    setHelpExpanded(prev => !prev);
  }, []);
  
  // Get placeholder text based on active measurement
  const getPlaceholderText = useMemo(() => {
    if (!activeMeasurement) return '';
    
    switch (activeMeasurement) {
      case MeasurementType.DISTANCE:
        return 'Click to start measuring distance';
      case MeasurementType.AREA:
        return 'Click to start measuring area';
      case MeasurementType.PERIMETER:
        return 'Click to start measuring perimeter';
      case MeasurementType.BEARING:
        return 'Click to set start and end points';
      default:
        return '';
    }
  }, [activeMeasurement]);
  
  // Get help text based on active measurement
  const getHelpText = useMemo(() => {
    if (!activeMeasurement) return '';
    
    switch (activeMeasurement) {
      case MeasurementType.DISTANCE:
        return 'Click on the map to add points. Double-click to finish.';
      case MeasurementType.AREA:
        return 'Click to add vertices of the polygon. Complete the shape by clicking near the starting point.';
      case MeasurementType.PERIMETER:
        return 'Click to add vertices of the shape. Complete the shape by clicking near the starting point.';
      case MeasurementType.BEARING:
        return 'Click to set the start point, then click again to set the end point and calculate bearing.';
      default:
        return '';
    }
  }, [activeMeasurement]);
  
  // Determine container classes based on position
  const containerClasses = `measurement-tools ${position} ${expanded ? 'expanded' : 'collapsed'} ${className}`;
  
  // Don't render anything if no active measurement
  if (activeMeasurement === null) {
    return null;
  }
  
  // Determine position styles
  const positionStyle = getPositionStyle(position);
  
  return (
    <div className={containerClasses} style={{ 
      position: 'absolute',
      ...positionStyle,
      backgroundColor: 'white',
      borderRadius: '4px',
      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
      padding: '12px',
      minWidth: '240px',
      maxWidth: '320px',
      zIndex: 1000,
      ...style
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {getActiveToolIcon}
          <span style={{ fontWeight: 'bold' }}>
            {activeMeasurement === MeasurementType.DISTANCE && 'Distance Measurement'}
            {activeMeasurement === MeasurementType.AREA && 'Area Measurement'}
            {activeMeasurement === MeasurementType.PERIMETER && 'Perimeter Measurement'}
            {activeMeasurement === MeasurementType.BEARING && 'Bearing Measurement'}
          </span>
        </div>
        
        {compact && (
          <button 
            onClick={toggleExpanded}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>
      
      {/* Expanded content */}
      {expanded && (
        <>
          {/* Help text */}
          {showHelp && (
            <div 
              style={{ 
                marginBottom: '12px',
                padding: '8px',
                backgroundColor: '#f8fafc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                cursor: 'pointer'
              }} onClick={toggleHelpExpanded}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HelpCircle size={14} />
                  <span>Help</span>
                </div>
                
                {helpExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
              
              {helpExpanded && (
                <div style={{ marginTop: '8px', color: '#64748b' }}>
                  {getHelpText}
                  
                  <div style={{ marginTop: '8px' }}>
                    <strong>Keyboard Shortcuts:</strong>
                    <ul style={{ margin: '4px 0 0 20px', padding: 0 }}>
                      <li>Press <code>Esc</code> to cancel measurement</li>
                      <li>Double-click to complete measurement</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Points count */}
          <div style={{ marginBottom: '12px', fontSize: '14px' }}>
            Points: <strong>{points.length}</strong>
            {points.length === 0 && (
              <span style={{ marginLeft: '8px', color: '#64748b', fontStyle: 'italic' }}>
                {getPlaceholderText}
              </span>
            )}
          </div>
          
          {/* Measurement result */}
          {currentMeasurement && (
            <div style={{ 
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#eef2ff',
              borderRadius: '4px',
              textAlign: 'center',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              {getMeasurementDisplay}
            </div>
          )}
          
          {/* Unit selectors */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ marginBottom: '8px' }}>
              <label 
                htmlFor="length-unit" 
                style={{ 
                  display: 'block', 
                  marginBottom: '4px', 
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Length Unit
              </label>
              <select
                id="length-unit"
                value={lengthUnit}
                onChange={(e) => setLengthUnit(e.target.value as LengthUnit)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1'
                }}
              >
                {getLengthUnitOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            {(activeMeasurement === MeasurementType.AREA) && (
              <div>
                <label 
                  htmlFor="area-unit" 
                  style={{ 
                    display: 'block', 
                    marginBottom: '4px', 
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  Area Unit
                </label>
                <select
                  id="area-unit"
                  value={areaUnit}
                  onChange={(e) => setAreaUnit(e.target.value as AreaUnit)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1'
                  }}
                >
                  {getAreaUnitOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {points.length > 0 && (
              <button
                onClick={handleResetPoints}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  flex: 1,
                  padding: '8px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={14} />
                Reset
              </button>
            )}
            
            {points.length >= 2 && activeMeasurement !== MeasurementType.BEARING && (
              <button
                onClick={handleCompleteMeasurement}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  flex: 1,
                  padding: '8px',
                  backgroundColor: '#e0f2fe',
                  border: '1px solid #bae6fd',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                <Save size={14} />
                Complete
              </button>
            )}
            
            <button
              onClick={handleCancelMeasurement}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                flex: 1,
                padding: '8px',
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              <Trash2 size={14} />
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// Helper function to get positioning style based on position prop
function getPositionStyle(position: string): React.CSSProperties {
  switch (position) {
    case 'top-left':
      return { top: '10px', left: '10px' };
    case 'top-right':
      return { top: '10px', right: '10px' };
    case 'bottom-left':
      return { bottom: '10px', left: '10px' };
    case 'bottom-right':
      return { bottom: '10px', right: '10px' };
    default:
      return { bottom: '10px', left: '10px' };
  }
}