/**
 * Measurement Tools Component
 * 
 * This component provides tools for measuring distances, areas,
 * and angles on the map for land surveying and assessment purposes.
 */

import React, { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { logger } from '../../../../libs/DevOps/utils/logger';

// Create module-specific logger
const measurementLogger = logger.withTags(['CartographyModule', 'MeasurementTools']);

/**
 * Measurement type
 */
export enum MeasurementType {
  DISTANCE = 'distance',
  AREA = 'area',
  BEARING = 'bearing'
}

/**
 * Measurement unit
 */
export enum MeasurementUnit {
  // Distance units
  FEET = 'feet',
  METERS = 'meters',
  MILES = 'miles',
  KILOMETERS = 'kilometers',
  
  // Area units
  SQUARE_FEET = 'square_feet',
  SQUARE_METERS = 'square_meters',
  ACRES = 'acres',
  HECTARES = 'hectares'
}

/**
 * Measurement result
 */
export interface MeasurementResult {
  type: MeasurementType;
  value: number;
  unit: MeasurementUnit;
  formattedValue: string;
  points: Array<[number, number]>; // [lng, lat] pairs
  geometry?: GeoJSON.Geometry;
}

/**
 * Component props
 */
interface MeasurementToolsProps {
  map: mapboxgl.Map | null;
  active: boolean;
  measurementType: MeasurementType;
  distanceUnit?: MeasurementUnit;
  areaUnit?: MeasurementUnit;
  clearOnComplete?: boolean;
  showResults?: boolean;
  onMeasurementComplete?: (result: MeasurementResult) => void;
  onMeasurementStart?: () => void;
  onMeasurementCancel?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Measurement Tools Component
 */
export const MeasurementTools: React.FC<MeasurementToolsProps> = ({
  map,
  active = false,
  measurementType = MeasurementType.DISTANCE,
  distanceUnit = MeasurementUnit.FEET,
  areaUnit = MeasurementUnit.ACRES,
  clearOnComplete = true,
  showResults = true,
  onMeasurementComplete,
  onMeasurementStart,
  onMeasurementCancel,
  className = '',
  style = {}
}) => {
  // State for measurement points
  const [points, setPoints] = useState<Array<[number, number]>>([]);
  
  // State for measurement in progress
  const [measuring, setMeasuring] = useState<boolean>(false);
  
  // State for current measurement result
  const [result, setResult] = useState<MeasurementResult | null>(null);
  
  // State for temporary point (for hover effect)
  const [tempPoint, setTempPoint] = useState<[number, number] | null>(null);
  
  // Effect to initialize/cleanup measurement tool
  useEffect(() => {
    if (!map) return;
    
    // Setup measurement sources and layers when the map and active state change
    if (active) {
      initializeMeasurementLayers();
      attachMapEventListeners();
      
      measurementLogger.info(`Measurement tool activated: ${measurementType}`);
      
      if (onMeasurementStart) {
        onMeasurementStart();
      }
    }
    
    // Clean up when component unmounts or active state changes
    return () => {
      if (map && active) {
        cleanup();
      }
    };
  }, [map, active, measurementType]);
  
  // Effect to update visualization when points change
  useEffect(() => {
    if (!map || !active || points.length === 0) return;
    
    updateMeasurementVisualization();
    
    // Calculate measurement if we have enough points
    if (
      (measurementType === MeasurementType.DISTANCE && points.length >= 2) ||
      (measurementType === MeasurementType.AREA && points.length >= 3) ||
      (measurementType === MeasurementType.BEARING && points.length === 2)
    ) {
      const newResult = calculateMeasurement();
      setResult(newResult);
      
      if (onMeasurementComplete && 
          ((measurementType === MeasurementType.DISTANCE && points.length >= 2) ||
           (measurementType === MeasurementType.AREA && points.length >= 3) ||
           (measurementType === MeasurementType.BEARING && points.length === 2))) {
        onMeasurementComplete(newResult);
      }
    }
  }, [points, tempPoint]);
  
  // Initialize measurement layers
  const initializeMeasurementLayers = () => {
    if (!map) return;
    
    // Add measurement source if it doesn't exist
    if (!map.getSource('measurement-source')) {
      map.addSource('measurement-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });
    }
    
    // Add point layer if it doesn't exist
    if (!map.getLayer('measurement-points')) {
      map.addLayer({
        id: 'measurement-points',
        type: 'circle',
        source: 'measurement-source',
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-radius': 5,
          'circle-color': '#0080ff',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });
    }
    
    // Add line layer if it doesn't exist
    if (!map.getLayer('measurement-lines')) {
      map.addLayer({
        id: 'measurement-lines',
        type: 'line',
        source: 'measurement-source',
        filter: ['==', ['geometry-type'], 'LineString'],
        paint: {
          'line-color': '#0080ff',
          'line-width': 2,
          'line-dasharray': [2, 1]
        }
      });
    }
    
    // Add polygon layer if it doesn't exist
    if (!map.getLayer('measurement-polygons')) {
      map.addLayer({
        id: 'measurement-polygons',
        type: 'fill',
        source: 'measurement-source',
        filter: ['==', ['geometry-type'], 'Polygon'],
        paint: {
          'fill-color': '#0080ff',
          'fill-opacity': 0.2
        }
      });
    }
    
    // Add hover layer if it doesn't exist
    if (!map.getLayer('measurement-hover')) {
      map.addLayer({
        id: 'measurement-hover',
        type: 'line',
        source: 'measurement-source',
        filter: ['==', ['get', 'id'], 'temp-line'],
        paint: {
          'line-color': '#0080ff',
          'line-width': 2,
          'line-dasharray': [2, 2]
        }
      });
    }
    
    // Add labels layer if it doesn't exist
    if (!map.getLayer('measurement-labels')) {
      map.addLayer({
        id: 'measurement-labels',
        type: 'symbol',
        source: 'measurement-source',
        filter: ['==', ['get', 'type'], 'label'],
        layout: {
          'text-field': '{label}',
          'text-font': ['Open Sans Regular'],
          'text-size': 12,
          'text-offset': [0, -1],
          'text-anchor': 'center'
        },
        paint: {
          'text-color': '#333333',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2
        }
      });
    }
  };
  
  // Attach map event listeners
  const attachMapEventListeners = () => {
    if (!map) return;
    
    // Set cursor to crosshair when tool is active
    map.getCanvas().style.cursor = 'crosshair';
    
    // Add click handler to add points
    map.on('click', handleMapClick);
    
    // Add mousemove handler for hover effect
    map.on('mousemove', handleMapMouseMove);
    
    // Add keydown handler to cancel measurement with escape key
    document.addEventListener('keydown', handleKeyDown);
  };
  
  // Handle map click event
  const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
    if (!active) return;
    
    // Get click coordinates
    const clickPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];
    
    // Add point to measurement
    setPoints(prevPoints => [...prevPoints, clickPoint]);
    
    // Set measuring state
    if (!measuring) {
      setMeasuring(true);
    }
    
    // If we're measuring bearing and have 2 points, or
    // double click for distance/area, complete the measurement
    if (
      (measurementType === MeasurementType.BEARING && points.length === 1) ||
      (e.originalEvent.detail === 2 && measurementType !== MeasurementType.BEARING)
    ) {
      completeMeasurement();
    }
  };
  
  // Handle map mousemove event
  const handleMapMouseMove = (e: mapboxgl.MapMouseEvent) => {
    if (!active || !measuring) return;
    
    // Update temp point for hover visualization
    setTempPoint([e.lngLat.lng, e.lngLat.lat]);
  };
  
  // Handle keydown event
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!active) return;
    
    // Escape key cancels measurement
    if (e.key === 'Escape') {
      cancelMeasurement();
    }
    
    // Enter key completes measurement
    if (e.key === 'Enter') {
      completeMeasurement();
    }
  };
  
  // Update measurement visualization
  const updateMeasurementVisualization = () => {
    if (!map) return;
    
    // Create features array
    const features: any[] = [];
    
    // Add point features
    points.forEach((point, index) => {
      features.push({
        type: 'Feature',
        properties: {
          id: `point-${index}`,
          index
        },
        geometry: {
          type: 'Point',
          coordinates: point
        }
      });
    });
    
    // Add line or polygon feature based on measurement type
    if (points.length > 0) {
      if (measurementType === MeasurementType.AREA && points.length >= 3) {
        // Create polygon for area measurement
        const polygonCoordinates = [...points];
        
        // Close the polygon
        if (polygonCoordinates[0][0] !== polygonCoordinates[polygonCoordinates.length - 1][0] ||
            polygonCoordinates[0][1] !== polygonCoordinates[polygonCoordinates.length - 1][1]) {
          polygonCoordinates.push(polygonCoordinates[0]);
        }
        
        features.push({
          type: 'Feature',
          properties: {
            id: 'area-polygon'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [polygonCoordinates]
          }
        });
      } else {
        // Create line for distance or bearing measurement
        features.push({
          type: 'Feature',
          properties: {
            id: 'distance-line'
          },
          geometry: {
            type: 'LineString',
            coordinates: points
          }
        });
      }
      
      // Add temporary hover line if we have a temp point
      if (tempPoint) {
        const lastPoint = points[points.length - 1];
        
        features.push({
          type: 'Feature',
          properties: {
            id: 'temp-line'
          },
          geometry: {
            type: 'LineString',
            coordinates: [lastPoint, tempPoint]
          }
        });
      }
    }
    
    // Add measurement label if we have a result
    if (result) {
      // Calculate label position
      let labelPosition: [number, number];
      
      if (measurementType === MeasurementType.AREA && points.length >= 3) {
        // For area, put label at centroid
        const coordinates = points.reduce(
          (acc, point) => [acc[0] + point[0] / points.length, acc[1] + point[1] / points.length],
          [0, 0]
        );
        labelPosition = coordinates;
      } else if (measurementType === MeasurementType.DISTANCE && points.length >= 2) {
        // For distance, put label at midpoint of line
        const midIndex = Math.floor(points.length / 2);
        const startPoint = points[midIndex - 1];
        const endPoint = points[midIndex];
        labelPosition = [
          (startPoint[0] + endPoint[0]) / 2,
          (startPoint[1] + endPoint[1]) / 2
        ];
      } else {
        // For bearing, put label near endpoint
        labelPosition = points[points.length - 1];
      }
      
      features.push({
        type: 'Feature',
        properties: {
          id: 'measurement-label',
          type: 'label',
          label: result.formattedValue
        },
        geometry: {
          type: 'Point',
          coordinates: labelPosition
        }
      });
    }
    
    // Update source data
    const source = map.getSource('measurement-source') as mapboxgl.GeoJSONSource;
    source.setData({
      type: 'FeatureCollection',
      features
    });
  };
  
  // Calculate measurement result
  const calculateMeasurement = (): MeasurementResult => {
    let value = 0;
    let unit: MeasurementUnit;
    let formattedValue = '';
    let geometry: GeoJSON.Geometry | undefined;
    
    switch (measurementType) {
      case MeasurementType.DISTANCE:
        // Calculate distance along line
        value = calculateDistance(points);
        unit = distanceUnit;
        formattedValue = formatDistance(value, unit);
        geometry = {
          type: 'LineString',
          coordinates: points
        };
        break;
        
      case MeasurementType.AREA:
        // Calculate area of polygon
        value = calculateArea(points);
        unit = areaUnit;
        formattedValue = formatArea(value, unit);
        geometry = {
          type: 'Polygon',
          coordinates: [
            [...points, points[0]] // Close the polygon
          ]
        };
        break;
        
      case MeasurementType.BEARING:
        // Calculate bearing between points
        if (points.length >= 2) {
          const startPoint = points[0];
          const endPoint = points[1];
          value = calculateBearing(startPoint, endPoint);
          unit = MeasurementUnit.FEET; // Not used for bearing
          formattedValue = formatBearing(value);
          geometry = {
            type: 'LineString',
            coordinates: [startPoint, endPoint]
          };
        }
        break;
    }
    
    return {
      type: measurementType,
      value,
      unit,
      formattedValue,
      points: [...points],
      geometry
    };
  };
  
  // Complete measurement
  const completeMeasurement = () => {
    if (!measuring || points.length === 0) return;
    
    // Calculate final measurement
    const finalResult = calculateMeasurement();
    setResult(finalResult);
    
    // Call completion callback
    if (onMeasurementComplete) {
      onMeasurementComplete(finalResult);
    }
    
    // Clear measurement if configured
    if (clearOnComplete) {
      resetMeasurement();
    } else {
      setMeasuring(false);
    }
  };
  
  // Cancel measurement
  const cancelMeasurement = () => {
    if (!measuring) return;
    
    resetMeasurement();
    
    // Call cancel callback
    if (onMeasurementCancel) {
      onMeasurementCancel();
    }
  };
  
  // Reset measurement
  const resetMeasurement = () => {
    setPoints([]);
    setTempPoint(null);
    setMeasuring(false);
    
    // Clear visualization
    if (map) {
      const source = map.getSource('measurement-source') as mapboxgl.GeoJSONSource;
      source.setData({
        type: 'FeatureCollection',
        features: []
      });
    }
  };
  
  // Clean up event listeners and layers
  const cleanup = () => {
    if (!map) return;
    
    // Remove event listeners
    map.off('click', handleMapClick);
    map.off('mousemove', handleMapMouseMove);
    document.removeEventListener('keydown', handleKeyDown);
    
    // Reset cursor
    map.getCanvas().style.cursor = '';
    
    // Reset state
    resetMeasurement();
    
    measurementLogger.info('Measurement tool deactivated');
  };
  
  // Convert between units
  const convertDistance = (distance: number, fromUnit: MeasurementUnit, toUnit: MeasurementUnit): number => {
    // Convert to meters first
    let meters = distance;
    
    switch (fromUnit) {
      case MeasurementUnit.FEET:
        meters = distance * 0.3048;
        break;
      case MeasurementUnit.MILES:
        meters = distance * 1609.34;
        break;
      case MeasurementUnit.KILOMETERS:
        meters = distance * 1000;
        break;
    }
    
    // Convert meters to target unit
    switch (toUnit) {
      case MeasurementUnit.FEET:
        return meters / 0.3048;
      case MeasurementUnit.MILES:
        return meters / 1609.34;
      case MeasurementUnit.KILOMETERS:
        return meters / 1000;
      default:
        return meters;
    }
  };
  
  // Format distance for display
  const formatDistance = (distance: number, unit: MeasurementUnit): string => {
    let displayDistance = distance;
    let displayUnit = '';
    
    switch (unit) {
      case MeasurementUnit.FEET:
        displayDistance = Math.round(distance * 10) / 10;
        displayUnit = 'ft';
        break;
      case MeasurementUnit.METERS:
        displayDistance = Math.round(distance * 10) / 10;
        displayUnit = 'm';
        break;
      case MeasurementUnit.MILES:
        displayDistance = Math.round(distance * 1000) / 1000;
        displayUnit = 'mi';
        break;
      case MeasurementUnit.KILOMETERS:
        displayDistance = Math.round(distance * 100) / 100;
        displayUnit = 'km';
        break;
    }
    
    return `${displayDistance.toLocaleString()} ${displayUnit}`;
  };
  
  // Format area for display
  const formatArea = (area: number, unit: MeasurementUnit): string => {
    let displayArea = area;
    let displayUnit = '';
    
    switch (unit) {
      case MeasurementUnit.SQUARE_FEET:
        displayArea = Math.round(area * 10) / 10;
        displayUnit = 'sq ft';
        break;
      case MeasurementUnit.SQUARE_METERS:
        displayArea = Math.round(area * 10) / 10;
        displayUnit = 'sq m';
        break;
      case MeasurementUnit.ACRES:
        displayArea = Math.round(area * 1000) / 1000;
        displayUnit = 'acres';
        break;
      case MeasurementUnit.HECTARES:
        displayArea = Math.round(area * 100) / 100;
        displayUnit = 'ha';
        break;
    }
    
    return `${displayArea.toLocaleString()} ${displayUnit}`;
  };
  
  // Format bearing for display
  const formatBearing = (bearing: number): string => {
    const degreesFormatted = Math.round(bearing * 10) / 10;
    return `${degreesFormatted}°`;
  };
  
  // Calculate distance between points
  const calculateDistance = (points: Array<[number, number]>): number => {
    if (points.length < 2) return 0;
    
    let totalDistance = 0;
    
    for (let i = 1; i < points.length; i++) {
      const from = points[i - 1];
      const to = points[i];
      
      // Calculate distance in meters using Haversine formula
      const distance = calculateHaversineDistance(from, to);
      
      // Convert to requested unit
      totalDistance += convertDistance(distance, MeasurementUnit.METERS, distanceUnit);
    }
    
    return totalDistance;
  };
  
  // Calculate area of polygon
  const calculateArea = (points: Array<[number, number]>): number => {
    if (points.length < 3) return 0;
    
    // Close polygon if not already closed
    const coords = [...points];
    if (coords[0][0] !== coords[coords.length - 1][0] || 
        coords[0][1] !== coords[coords.length - 1][1]) {
      coords.push(coords[0]);
    }
    
    // Calculate area using Shoelace formula
    // This is an approximation for small areas on the Earth's surface
    let area = 0;
    
    for (let i = 0; i < coords.length - 1; i++) {
      area += coords[i][0] * coords[i + 1][1] - coords[i + 1][0] * coords[i][1];
    }
    
    area = Math.abs(area) / 2;
    
    // Convert to square meters (approximate)
    // This uses the fact that 1 degree of longitude at the equator is approximately 111,320 meters
    // Adjust for latitude to improve accuracy
    const latitude = coords.reduce((sum, coord) => sum + coord[1], 0) / coords.length;
    const latitudeRadians = (latitude * Math.PI) / 180;
    const metersPerDegree = 111320 * Math.cos(latitudeRadians);
    
    let areaSquareMeters = area * Math.pow(metersPerDegree, 2);
    
    // Convert to requested unit
    switch (areaUnit) {
      case MeasurementUnit.SQUARE_FEET:
        return areaSquareMeters * 10.7639;
      case MeasurementUnit.ACRES:
        return areaSquareMeters * 0.000247105;
      case MeasurementUnit.HECTARES:
        return areaSquareMeters * 0.0001;
      default:
        return areaSquareMeters;
    }
  };
  
  // Calculate bearing between two points
  const calculateBearing = (from: [number, number], to: [number, number]): number => {
    // Convert to radians
    const fromLat = (from[1] * Math.PI) / 180;
    const fromLng = (from[0] * Math.PI) / 180;
    const toLat = (to[1] * Math.PI) / 180;
    const toLng = (to[0] * Math.PI) / 180;
    
    const y = Math.sin(toLng - fromLng) * Math.cos(toLat);
    const x = Math.cos(fromLat) * Math.sin(toLat) -
              Math.sin(fromLat) * Math.cos(toLat) * Math.cos(toLng - fromLng);
    
    // Calculate bearing in radians
    const bearing = Math.atan2(y, x);
    
    // Convert to degrees
    return ((bearing * 180) / Math.PI + 360) % 360;
  };
  
  // Calculate Haversine distance between two points
  const calculateHaversineDistance = (from: [number, number], to: [number, number]): number => {
    const R = 6371000; // Earth's radius in meters
    
    // Convert to radians
    const lat1 = (from[1] * Math.PI) / 180;
    const lat2 = (to[1] * Math.PI) / 180;
    const deltaLat = ((to[1] - from[1]) * Math.PI) / 180;
    const deltaLng = ((to[0] - from[0]) * Math.PI) / 180;
    
    // Haversine formula
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // Distance in meters
  };
  
  // Render component
  return showResults && result ? (
    <div 
      className={`measurement-tools ${className}`}
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        padding: '10px',
        backgroundColor: 'white',
        borderRadius: '4px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        zIndex: 1000,
        minWidth: '200px',
        ...style
      }}
    >
      <div style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
        {measurementType === MeasurementType.DISTANCE ? 'Distance' : 
         measurementType === MeasurementType.AREA ? 'Area' : 'Bearing'}
      </div>
      
      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
        {result.formattedValue}
      </div>
      
      <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
        <button
          onClick={resetMeasurement}
          style={{
            padding: '5px 10px',
            border: '1px solid #ccc',
            borderRadius: '3px',
            backgroundColor: '#f0f0f0',
            cursor: 'pointer'
          }}
        >
          Clear
        </button>
        
        {measuring && (
          <button
            onClick={completeMeasurement}
            style={{
              padding: '5px 10px',
              border: '1px solid #0080ff',
              borderRadius: '3px',
              backgroundColor: '#0080ff',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            {measurementType === MeasurementType.DISTANCE ? 'Finish Line' : 
             measurementType === MeasurementType.AREA ? 'Finish Polygon' : 'Measure'}
          </button>
        )}
      </div>
      
      <div style={{ marginTop: '5px', fontSize: '11px', color: '#666' }}>
        {measuring ? 'Click to add points, double-click to finish' : 'Measurement complete'}
      </div>
    </div>
  ) : null;
};