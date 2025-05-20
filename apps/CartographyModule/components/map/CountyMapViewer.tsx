/**
 * County Map Viewer Component
 * 
 * This component provides an interactive map for viewing county parcel data
 * with support for various basemaps, layer controls, and GIS tools.
 */

import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { logger } from '../../../../libs/DevOps/utils/logger';

// Create module-specific logger
const mapLogger = logger.withTags(['CartographyModule', 'MapViewer']);

// Map provider options
export enum MapProvider {
  MAPBOX = 'mapbox',
  ARCGIS = 'arcgis',
  LEAFLET = 'leaflet'
}

// Basemap styles
export enum BasemapStyle {
  STREETS = 'streets',
  SATELLITE = 'satellite',
  TERRAIN = 'terrain',
  LIGHT = 'light',
  DARK = 'dark',
  OUTDOORS = 'outdoors',
  TOPO = 'topo'
}

// Map configuration options
export interface MapConfig {
  // Provider options
  provider: MapProvider;
  apiKey?: string; // Mapbox or ArcGIS API key
  
  // Initial view settings
  center: [number, number]; // [longitude, latitude]
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
  bounds?: [[number, number], [number, number]]; // [[sw_lng, sw_lat], [ne_lng, ne_lat]]
  
  // Style options
  basemapStyle: BasemapStyle;
  customBasemapUrl?: string;
  
  // Features
  enableDraw?: boolean;
  enableMeasurement?: boolean;
  enable3D?: boolean;
  
  // Layer options
  showParcelBoundaries?: boolean;
  showParcelLabels?: boolean;
  showTaxCodeAreas?: boolean;
  showZoning?: boolean;
  
  // County-specific
  countyName?: string;
  countyFips?: string;
}

// Default map configuration
const defaultConfig: MapConfig = {
  provider: MapProvider.MAPBOX,
  center: [-119.2034, 46.2503], // Benton County, WA
  zoom: 10,
  minZoom: 5,
  maxZoom: 20,
  basemapStyle: BasemapStyle.STREETS,
  enableDraw: true,
  enableMeasurement: true,
  enable3D: false,
  showParcelBoundaries: true,
  showParcelLabels: true
};

// Map styling lookup
const mapboxStyleUrls: Record<BasemapStyle, string> = {
  [BasemapStyle.STREETS]: 'mapbox://styles/mapbox/streets-v12',
  [BasemapStyle.SATELLITE]: 'mapbox://styles/mapbox/satellite-v9',
  [BasemapStyle.TERRAIN]: 'mapbox://styles/mapbox/outdoors-v12',
  [BasemapStyle.LIGHT]: 'mapbox://styles/mapbox/light-v11',
  [BasemapStyle.DARK]: 'mapbox://styles/mapbox/dark-v11',
  [BasemapStyle.OUTDOORS]: 'mapbox://styles/mapbox/outdoors-v12',
  [BasemapStyle.TOPO]: 'mapbox://styles/mapbox/outdoors-v12' // Fallback, Mapbox doesn't have a dedicated topo style
};

// Event handler types
export interface MapEventHandlers {
  onMapLoaded?: () => void;
  onMapClick?: (event: { lngLat: [number, number], features?: any[] }) => void;
  onFeatureSelect?: (features: any[]) => void;
  onLayerToggle?: (layerId: string, visible: boolean) => void;
  onViewportChange?: (viewport: { center: [number, number], zoom: number }) => void;
  onDrawComplete?: (geometry: any) => void;
  onMeasureComplete?: (measurement: { distance?: number, area?: number }) => void;
}

// Component props
interface CountyMapViewerProps {
  config?: Partial<MapConfig>;
  eventHandlers?: MapEventHandlers;
  className?: string;
  style?: React.CSSProperties;
  isReadOnly?: boolean;
}

/**
 * County Map Viewer Component
 */
export const CountyMapViewer: React.FC<CountyMapViewerProps> = ({
  config = {},
  eventHandlers = {},
  className = '',
  style = {},
  isReadOnly = false
}) => {
  // Merge with default configuration
  const mergedConfig: MapConfig = { ...defaultConfig, ...config };
  
  // State for the mapbox instance
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // State for active layers
  const [activeLayers, setActiveLayers] = useState<string[]>([]);
  
  // State for selected features
  const [selectedFeatures, setSelectedFeatures] = useState<any[]>([]);
  
  // Initialize map
  useEffect(() => {
    // Skip if map is already initialized or container is not available
    if (map.current || !mapContainer.current) return;
    
    // Skip if no API key is provided for Mapbox
    if (mergedConfig.provider === MapProvider.MAPBOX && !mergedConfig.apiKey) {
      mapLogger.warn('Mapbox API key not provided, map initialization skipped');
      return;
    }
    
    // Set API key if provided
    if (mergedConfig.provider === MapProvider.MAPBOX && mergedConfig.apiKey) {
      mapboxgl.accessToken = mergedConfig.apiKey;
    }
    
    // Get style URL based on basemap style
    const styleUrl = mergedConfig.customBasemapUrl || 
                     mapboxStyleUrls[mergedConfig.basemapStyle] || 
                     mapboxStyleUrls[BasemapStyle.STREETS];
    
    try {
      // Initialize map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: styleUrl,
        center: mergedConfig.center,
        zoom: mergedConfig.zoom,
        minZoom: mergedConfig.minZoom,
        maxZoom: mergedConfig.maxZoom,
        attributionControl: true
      });
      
      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Add geolocate control
      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true
        }),
        'top-right'
      );
      
      // Add scale control
      map.current.addControl(
        new mapboxgl.ScaleControl({
          maxWidth: 150,
          unit: 'imperial' // or 'metric'
        }),
        'bottom-left'
      );
      
      // Set bounds if provided
      if (mergedConfig.bounds) {
        map.current.fitBounds(mergedConfig.bounds, {
          padding: 50,
          duration: 0 // Instant fit on initial load
        });
      }
      
      // Handle map load
      map.current.on('load', () => {
        setMapLoaded(true);
        
        if (eventHandlers.onMapLoaded) {
          eventHandlers.onMapLoaded();
        }
        
        // Add county boundary layer if county is specified
        if (mergedConfig.countyName || mergedConfig.countyFips) {
          addCountyBoundaryLayer();
        }
        
        // Add parcel layers if enabled
        if (mergedConfig.showParcelBoundaries) {
          addParcelLayers();
        }
        
        // Add tax code areas if enabled
        if (mergedConfig.showTaxCodeAreas) {
          addTaxCodeLayers();
        }
        
        // Add zoning if enabled
        if (mergedConfig.showZoning) {
          addZoningLayers();
        }
      });
      
      // Handle map click
      map.current.on('click', (e) => {
        if (eventHandlers.onMapClick) {
          // Query features at click point
          const features = map.current?.queryRenderedFeatures(e.point) || [];
          
          eventHandlers.onMapClick({
            lngLat: [e.lngLat.lng, e.lngLat.lat],
            features
          });
        }
      });
      
      // Handle viewport changes
      map.current.on('moveend', () => {
        if (eventHandlers.onViewportChange && map.current) {
          const center = map.current.getCenter();
          
          eventHandlers.onViewportChange({
            center: [center.lng, center.lat],
            zoom: map.current.getZoom()
          });
        }
      });
      
      mapLogger.info('Map initialized', {
        metadata: {
          provider: mergedConfig.provider,
          center: mergedConfig.center,
          zoom: mergedConfig.zoom,
          basemap: mergedConfig.basemapStyle
        }
      });
    } catch (error) {
      mapLogger.error('Error initializing map', error);
    }
    
    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mergedConfig, eventHandlers]);
  
  // Handle basemap style changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    // Get style URL based on basemap style
    const styleUrl = mergedConfig.customBasemapUrl || 
                     mapboxStyleUrls[mergedConfig.basemapStyle] || 
                     mapboxStyleUrls[BasemapStyle.STREETS];
    
    map.current.setStyle(styleUrl);
    
    mapLogger.info('Map style updated', {
      metadata: {
        style: mergedConfig.basemapStyle,
        url: styleUrl
      }
    });
  }, [mergedConfig.basemapStyle, mergedConfig.customBasemapUrl, mapLoaded]);
  
  // Handle changes to active layers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    // Toggle layer visibility based on activeLayers state
    const toggleLayerVisibility = (layerId: string, visible: boolean) => {
      if (!map.current) return;
      
      const layer = map.current.getLayer(layerId);
      
      if (layer) {
        map.current.setLayoutProperty(
          layerId,
          'visibility',
          visible ? 'visible' : 'none'
        );
        
        mapLogger.info(`Layer ${layerId} visibility set to ${visible ? 'visible' : 'hidden'}`);
      }
    };
    
    // Update layer visibility
    activeLayers.forEach(layerId => {
      toggleLayerVisibility(layerId, true);
    });
    
    // Hide layers not in activeLayers
    const allLayers = [
      'county-boundary',
      'county-boundary-outline',
      'parcels-fill',
      'parcels-outline',
      'parcel-labels',
      'taxcode-fill',
      'taxcode-outline',
      'taxcode-labels',
      'zoning-fill',
      'zoning-outline',
      'zoning-labels'
    ];
    
    allLayers.forEach(layerId => {
      if (!activeLayers.includes(layerId)) {
        toggleLayerVisibility(layerId, false);
      }
    });
  }, [activeLayers, mapLoaded]);
  
  // Add county boundary layer
  const addCountyBoundaryLayer = () => {
    if (!map.current) return;
    
    // Check if layer already exists
    if (map.current.getLayer('county-boundary')) {
      return;
    }
    
    // In a real implementation, this would load actual county GeoJSON data
    // from an API or file. For now, we'll use placeholder data.
    
    // Add source
    map.current.addSource('county-boundary-source', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-119.3035, 46.2503],
            [-119.1035, 46.2503],
            [-119.1035, 46.3503],
            [-119.3035, 46.3503],
            [-119.3035, 46.2503]
          ]]
        },
        properties: {
          name: mergedConfig.countyName || 'County',
          fips: mergedConfig.countyFips || '00000'
        }
      }
    });
    
    // Add fill layer
    map.current.addLayer({
      id: 'county-boundary',
      type: 'fill',
      source: 'county-boundary-source',
      paint: {
        'fill-color': '#0080ff',
        'fill-opacity': 0.1
      }
    });
    
    // Add outline layer
    map.current.addLayer({
      id: 'county-boundary-outline',
      type: 'line',
      source: 'county-boundary-source',
      paint: {
        'line-color': '#0080ff',
        'line-width': 2,
        'line-dasharray': [2, 1]
      }
    });
    
    // Update active layers
    setActiveLayers(prev => [...prev, 'county-boundary', 'county-boundary-outline']);
  };
  
  // Add parcel layers
  const addParcelLayers = () => {
    if (!map.current) return;
    
    // Check if layer already exists
    if (map.current.getLayer('parcels-fill')) {
      return;
    }
    
    // In a real implementation, this would load actual parcel GeoJSON data
    // from an API or file. For now, we'll use placeholder data.
    
    // Add source
    map.current.addSource('parcels-source', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [-119.25, 46.28],
                [-119.24, 46.28],
                [-119.24, 46.29],
                [-119.25, 46.29],
                [-119.25, 46.28]
              ]]
            },
            properties: {
              parcelId: '12345',
              address: '123 Main St',
              owner: 'John Doe',
              zoning: 'R1',
              taxcode: 'TC001',
              acres: 1.25,
              value: 250000
            }
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [-119.24, 46.28],
                [-119.23, 46.28],
                [-119.23, 46.29],
                [-119.24, 46.29],
                [-119.24, 46.28]
              ]]
            },
            properties: {
              parcelId: '12346',
              address: '125 Main St',
              owner: 'Jane Smith',
              zoning: 'R1',
              taxcode: 'TC001',
              acres: 1.1,
              value: 230000
            }
          }
        ]
      }
    });
    
    // Add fill layer
    map.current.addLayer({
      id: 'parcels-fill',
      type: 'fill',
      source: 'parcels-source',
      paint: {
        'fill-color': [
          'interpolate',
          ['linear'],
          ['get', 'value'],
          100000, '#f7fbff',
          200000, '#c7dcef',
          300000, '#8fc2dd',
          400000, '#5fa1ca',
          500000, '#3a7eb9',
          750000, '#2167a8',
          1000000, '#0e51a2'
        ],
        'fill-opacity': 0.6
      }
    });
    
    // Add outline layer
    map.current.addLayer({
      id: 'parcels-outline',
      type: 'line',
      source: 'parcels-source',
      paint: {
        'line-color': '#555555',
        'line-width': 1
      }
    });
    
    // Add labels if enabled
    if (mergedConfig.showParcelLabels) {
      map.current.addLayer({
        id: 'parcel-labels',
        type: 'symbol',
        source: 'parcels-source',
        layout: {
          'text-field': ['get', 'parcelId'],
          'text-font': ['Open Sans Regular'],
          'text-size': 12,
          'text-offset': [0, 0],
          'text-anchor': 'center'
        },
        paint: {
          'text-color': '#333333',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1
        }
      });
      
      setActiveLayers(prev => [...prev, 'parcel-labels']);
    }
    
    // Add click handler for parcels
    map.current.on('click', 'parcels-fill', (e) => {
      if (e.features && e.features.length > 0) {
        setSelectedFeatures(e.features);
        
        if (eventHandlers.onFeatureSelect) {
          eventHandlers.onFeatureSelect(e.features);
        }
      }
    });
    
    // Update active layers
    setActiveLayers(prev => [...prev, 'parcels-fill', 'parcels-outline']);
  };
  
  // Add tax code layers
  const addTaxCodeLayers = () => {
    if (!map.current) return;
    
    // Check if layer already exists
    if (map.current.getLayer('taxcode-fill')) {
      return;
    }
    
    // In a real implementation, this would load actual tax code GeoJSON data
    // This is just a placeholder
    
    // Add source
    map.current.addSource('taxcode-source', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [-119.26, 46.27],
                [-119.22, 46.27],
                [-119.22, 46.30],
                [-119.26, 46.30],
                [-119.26, 46.27]
              ]]
            },
            properties: {
              taxcodeId: 'TC001',
              name: 'School District 1',
              rate: 0.0125,
              jurisdiction: 'County'
            }
          }
        ]
      }
    });
    
    // Add fill layer
    map.current.addLayer({
      id: 'taxcode-fill',
      type: 'fill',
      source: 'taxcode-source',
      paint: {
        'fill-color': '#ffff00',
        'fill-opacity': 0.1
      }
    });
    
    // Add outline layer
    map.current.addLayer({
      id: 'taxcode-outline',
      type: 'line',
      source: 'taxcode-source',
      paint: {
        'line-color': '#777700',
        'line-width': 2,
        'line-dasharray': [4, 2]
      }
    });
    
    // Add labels
    map.current.addLayer({
      id: 'taxcode-labels',
      type: 'symbol',
      source: 'taxcode-source',
      layout: {
        'text-field': ['get', 'taxcodeId'],
        'text-font': ['Open Sans Regular'],
        'text-size': 14,
        'text-offset': [0, 0],
        'text-anchor': 'center'
      },
      paint: {
        'text-color': '#555500',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1
      }
    });
    
    // Update active layers
    setActiveLayers(prev => [...prev, 'taxcode-fill', 'taxcode-outline', 'taxcode-labels']);
  };
  
  // Add zoning layers
  const addZoningLayers = () => {
    if (!map.current) return;
    
    // Check if layer already exists
    if (map.current.getLayer('zoning-fill')) {
      return;
    }
    
    // In a real implementation, this would load actual zoning GeoJSON data
    // This is just a placeholder
    
    // Add source
    map.current.addSource('zoning-source', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [-119.25, 46.28],
                [-119.23, 46.28],
                [-119.23, 46.29],
                [-119.25, 46.29],
                [-119.25, 46.28]
              ]]
            },
            properties: {
              zoningCode: 'R1',
              description: 'Residential Single Family',
              minLotSize: 7500
            }
          }
        ]
      }
    });
    
    // Add fill layer
    map.current.addLayer({
      id: 'zoning-fill',
      type: 'fill',
      source: 'zoning-source',
      paint: {
        'fill-color': [
          'match',
          ['get', 'zoningCode'],
          'R1', '#bdffb8',
          'R2', '#9aeb94',
          'R3', '#77d870',
          'C1', '#caaef0',
          'C2', '#ac8eda',
          'I1', '#ff9e9e',
          'I2', '#ff7575',
          'AG', '#f1dfad',
          '#cccccc' // default
        ],
        'fill-opacity': 0.3
      }
    });
    
    // Add outline layer
    map.current.addLayer({
      id: 'zoning-outline',
      type: 'line',
      source: 'zoning-source',
      paint: {
        'line-color': '#555555',
        'line-width': 1,
        'line-dasharray': [1, 1]
      }
    });
    
    // Add labels
    map.current.addLayer({
      id: 'zoning-labels',
      type: 'symbol',
      source: 'zoning-source',
      layout: {
        'text-field': ['get', 'zoningCode'],
        'text-font': ['Open Sans Regular'],
        'text-size': 12,
        'text-offset': [0, 0],
        'text-anchor': 'center'
      },
      paint: {
        'text-color': '#333333',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1
      }
    });
    
    // Update active layers
    setActiveLayers(prev => [...prev, 'zoning-fill', 'zoning-outline', 'zoning-labels']);
  };
  
  // Toggle layer visibility
  const toggleLayer = (layerId: string, visible: boolean) => {
    if (visible) {
      setActiveLayers(prev => Array.from(new Set([...prev, layerId])));
    } else {
      setActiveLayers(prev => prev.filter(id => id !== layerId));
    }
    
    if (eventHandlers.onLayerToggle) {
      eventHandlers.onLayerToggle(layerId, visible);
    }
  };
  
  // Zoom to a specific feature
  const zoomToFeature = (feature: any) => {
    if (!map.current || !feature.geometry) return;
    
    // Calculate bounds from feature
    const bounds = new mapboxgl.LngLatBounds();
    
    if (feature.geometry.type === 'Point') {
      bounds.extend(feature.geometry.coordinates);
    } else if (feature.geometry.type === 'LineString') {
      feature.geometry.coordinates.forEach((coord: [number, number]) => {
        bounds.extend(coord);
      });
    } else if (feature.geometry.type === 'Polygon') {
      feature.geometry.coordinates[0].forEach((coord: [number, number]) => {
        bounds.extend(coord);
      });
    }
    
    // Zoom to bounds
    map.current.fitBounds(bounds, {
      padding: 50,
      duration: 1000 // 1 second animation
    });
  };
  
  // Export methods to parent via ref
  React.useImperativeHandle(
    (props as any).ref,
    () => ({
      getMap: () => map.current,
      toggleLayer,
      zoomToFeature,
      getSelectedFeatures: () => selectedFeatures,
      getActiveLayers: () => activeLayers,
      setViewport: (center: [number, number], zoom: number) => {
        if (map.current) {
          map.current.setCenter(center);
          map.current.setZoom(zoom);
        }
      }
    }),
    [map, selectedFeatures, activeLayers]
  );
  
  return (
    <div 
      ref={mapContainer} 
      className={`county-map-viewer ${className}`}
      style={{ 
        width: '100%', 
        height: '500px', 
        borderRadius: '4px',
        ...style 
      }}
    />
  );
};