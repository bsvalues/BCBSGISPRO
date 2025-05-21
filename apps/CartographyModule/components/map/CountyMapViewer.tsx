/**
 * County Map Viewer Component
 * 
 * This component provides a comprehensive mapping interface for county GIS data,
 * integrating multiple map providers and supporting various data layers, tools,
 * and interactions.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapControls, MapView, LayerInfo, MeasurementType, DrawingToolType } from './MapControls';
import { MeasurementTools, MeasurementResult } from './MeasurementTools';
import { logger } from '../../../../libs/DevOps/utils/logger';

// Create module-specific logger
const mapLogger = logger.withTags(['CartographyModule', 'CountyMapViewer']);

/**
 * Map provider types
 */
export enum MapProviderType {
  MAPBOX = 'mapbox',
  ARCGIS = 'arcgis',
  LEAFLET = 'leaflet',
  GOOGLE = 'google'
}

/**
 * Base layer types
 */
export enum BaseLayerType {
  STREETS = 'streets',
  SATELLITE = 'satellite',
  HYBRID = 'hybrid',
  TERRAIN = 'terrain',
  LIGHT = 'light',
  DARK = 'dark',
  TOPO = 'topo',
  NONE = 'none'
}

/**
 * County details interface
 */
export interface CountyDetails {
  id: string;
  name: string;
  state: string;
  fips: string;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  center?: {
    lat: number;
    lng: number;
  };
}

/**
 * Feature information
 */
export interface FeatureInfo {
  id: string;
  type: string;
  properties: Record<string, any>;
  geometry: any; // GeoJSON geometry
}

/**
 * County map viewer props
 */
export interface CountyMapViewerProps {
  // County to display
  county: CountyDetails;
  
  // Map configuration
  provider?: MapProviderType | string;
  apiKey?: string;
  baseLayer?: BaseLayerType;
  initialView?: Partial<MapView>;
  center?: {lat: number; lng: number};
  zoom?: number;
  
  // Layers to display
  layers?: LayerInfo[];
  
  // Features to highlight
  highlightedFeatures?: FeatureInfo[];
  
  // Controls visibility
  showControls?: boolean;
  controlsPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  controlsOrientation?: 'horizontal' | 'vertical';
  
  // Component sizing
  width?: string | number;
  height?: string | number;
  
  // Event handlers
  onMapReady?: (mapInstance: any) => void;
  onViewChange?: (view: MapView) => void;
  onLayerToggle?: (layerId: string, visible: boolean) => void;
  onLayerOpacityChange?: (layerId: string, opacity: number) => void;
  onFeatureClick?: (feature: FeatureInfo) => void;
  onFeatureHover?: (feature: FeatureInfo | null) => void;
  onMeasurementComplete?: (measurement: MeasurementResult) => void;
  onDrawingComplete?: (feature: any) => void;
  
  // Component styling
  className?: string;
  style?: React.CSSProperties;
  
  // Custom components
  renderTooltip?: (feature: FeatureInfo | null) => React.ReactNode;
  renderPopup?: (feature: FeatureInfo) => React.ReactNode;
}

/**
 * County Map Viewer Component
 */
export const CountyMapViewer: React.FC<CountyMapViewerProps> = ({
  county,
  provider = MapProviderType.MAPBOX,
  apiKey,
  baseLayer = BaseLayerType.STREETS,
  initialView,
  layers = [],
  highlightedFeatures = [],
  showControls = true,
  controlsPosition = 'top-right',
  controlsOrientation = 'vertical',
  width = '100%',
  height = '600px',
  onMapReady,
  onViewChange,
  onLayerToggle,
  onLayerOpacityChange,
  onFeatureClick,
  onFeatureHover,
  onMeasurementComplete,
  onDrawingComplete,
  className = '',
  style = {},
  renderTooltip,
  renderPopup
}) => {
  // Map container reference
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Map instance reference
  const mapInstanceRef = useRef<any>(null);
  
  // State for map view
  const [mapView, setMapView] = useState<MapView>({
    center: county.center || { lat: 0, lng: 0 },
    zoom: 10,
    bearing: 0,
    pitch: 0,
    ...initialView
  });
  
  // State for map loading
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
  // State for active tools
  const [activeMeasurement, setActiveMeasurement] = useState<MeasurementType | null>(null);
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingToolType | null>(null);
  
  // State for hovered/selected features
  const [hoveredFeature, setHoveredFeature] = useState<FeatureInfo | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<FeatureInfo | null>(null);
  
  // Initialize map on component mount
  useEffect(() => {
    initializeMap();
    
    return () => {
      // Clean up map instance on unmount
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        } catch (error) {
          mapLogger.error('Error removing map instance', error);
        }
      }
    };
  }, []);
  
  // Update map when county changes
  useEffect(() => {
    if (mapLoaded && mapInstanceRef.current) {
      updateMapForCounty();
    }
  }, [county, mapLoaded]);
  
  // Update map when layers change
  useEffect(() => {
    if (mapLoaded && mapInstanceRef.current) {
      updateMapLayers();
    }
  }, [layers, mapLoaded]);
  
  // Update map when highlighted features change
  useEffect(() => {
    if (mapLoaded && mapInstanceRef.current) {
      updateHighlightedFeatures();
    }
  }, [highlightedFeatures, mapLoaded]);
  
  /**
   * Initialize the map
   */
  const initializeMap = async () => {
    if (!mapContainerRef.current) return;
    
    try {
      // Clear any previous errors
      setLoadingError(null);
      
      // Initialize map based on provider
      switch (provider) {
        case MapProviderType.MAPBOX:
          await initializeMapbox();
          break;
        case MapProviderType.ARCGIS:
          await initializeArcGIS();
          break;
        case MapProviderType.LEAFLET:
          await initializeLeaflet();
          break;
        case MapProviderType.GOOGLE:
          await initializeGoogle();
          break;
        default:
          throw new Error(`Unsupported map provider: ${provider}`);
      }
      
      mapLogger.info('Map initialized', { provider, county: county.name });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setLoadingError(`Failed to initialize map: ${errorMessage}`);
      mapLogger.error('Map initialization failed', error);
    }
  };
  
  /**
   * Initialize Mapbox map provider
   */
  const initializeMapbox = async () => {
    try {
      if (!apiKey) {
        throw new Error('Mapbox API key is required');
      }
      
      // Import Mapbox dynamically
      const mapboxgl = await import('mapbox-gl');
      
      // Set access token
      (mapboxgl as any).accessToken = apiKey;
      
      // Create map instance
      const map = new mapboxgl.Map({
        container: mapContainerRef.current!,
        style: getMapboxStyle(baseLayer),
        center: [mapView.center.lng, mapView.center.lat],
        zoom: mapView.zoom,
        bearing: mapView.bearing,
        pitch: mapView.pitch,
        attributionControl: true,
        antialias: true
      });
      
      // Set up event handlers
      map.on('load', () => {
        mapInstanceRef.current = map;
        setMapLoaded(true);
        
        // Add layers
        updateMapLayers();
        
        // Add highlighted features
        updateHighlightedFeatures();
        
        // Notify parent component
        if (onMapReady) {
          onMapReady(map);
        }
      });
      
      map.on('move', () => {
        const center = map.getCenter();
        const newView: MapView = {
          center: { lat: center.lat, lng: center.lng },
          zoom: map.getZoom(),
          bearing: map.getBearing(),
          pitch: map.getPitch()
        };
        
        setMapView(newView);
        
        // Notify parent component
        if (onViewChange) {
          onViewChange(newView);
        }
      });
      
      // Set up click handler
      map.on('click', handleMapClick);
      
      // Set up hover handler
      map.on('mousemove', handleMapMouseMove);
      map.on('mouseout', () => {
        // Clear hover state when mouse leaves map
        setHoveredFeature(null);
        
        // Notify parent component
        if (onFeatureHover) {
          onFeatureHover(null);
        }
      });
    } catch (error) {
      mapLogger.error('Failed to initialize Mapbox', error);
      throw error;
    }
  };
  
  /**
   * Initialize ArcGIS map provider
   */
  const initializeArcGIS = async () => {
    // This would be implemented for the ArcGIS map provider
    // The implementation would be similar to Mapbox but with ArcGIS-specific setup
    
    mapLogger.info('ArcGIS initialization not fully implemented');
    setLoadingError('ArcGIS map provider not fully implemented yet');
  };
  
  /**
   * Initialize Leaflet map provider
   */
  const initializeLeaflet = async () => {
    try {
      // Import Leaflet dynamically
      const L = await import('leaflet');
      
      // Create map instance
      const map = L.map(mapContainerRef.current!, {
        center: [mapView.center.lat, mapView.center.lng],
        zoom: mapView.zoom,
        attributionControl: true
      });
      
      // Add base layer
      const baseLayerUrl = getLeafletTileUrl(baseLayer);
      L.tileLayer(baseLayerUrl, {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);
      
      // Set up event handlers
      map.on('load', () => {
        mapInstanceRef.current = map;
        setMapLoaded(true);
        
        // Add layers
        updateMapLayers();
        
        // Add highlighted features
        updateHighlightedFeatures();
        
        // Notify parent component
        if (onMapReady) {
          onMapReady(map);
        }
      });
      
      map.on('moveend', () => {
        const center = map.getCenter();
        const newView: MapView = {
          center: { lat: center.lat, lng: center.lng },
          zoom: map.getZoom(),
          bearing: 0, // Leaflet doesn't support bearing
          pitch: 0 // Leaflet doesn't support pitch
        };
        
        setMapView(newView);
        
        // Notify parent component
        if (onViewChange) {
          onViewChange(newView);
        }
      });
      
      // Set up click handler
      map.on('click', (e: any) => {
        handleMapClick({
          lngLat: { lng: e.latlng.lng, lat: e.latlng.lat },
          point: { x: e.containerPoint.x, y: e.containerPoint.y }
        });
      });
      
      // Set up hover handler
      map.on('mousemove', (e: any) => {
        handleMapMouseMove({
          lngLat: { lng: e.latlng.lng, lat: e.latlng.lat },
          point: { x: e.containerPoint.x, y: e.containerPoint.y }
        });
      });
      
      map.on('mouseout', () => {
        // Clear hover state when mouse leaves map
        setHoveredFeature(null);
        
        // Notify parent component
        if (onFeatureHover) {
          onFeatureHover(null);
        }
      });
    } catch (error) {
      mapLogger.error('Failed to initialize Leaflet', error);
      throw error;
    }
  };
  
  /**
   * Initialize Google map provider
   */
  const initializeGoogle = async () => {
    // This would be implemented for the Google Maps API
    // The implementation would be similar to other providers but with Google Maps-specific setup
    
    mapLogger.info('Google Maps initialization not fully implemented');
    setLoadingError('Google Maps provider not fully implemented yet');
  };
  
  /**
   * Update map view and layers for current county
   */
  const updateMapForCounty = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    
    try {
      // Fit map to county bounds if available
      if (county.bounds) {
        if (provider === MapProviderType.MAPBOX) {
          map.fitBounds([
            [county.bounds.west, county.bounds.south],
            [county.bounds.east, county.bounds.north]
          ], { padding: 50 });
        } else if (provider === MapProviderType.LEAFLET) {
          map.fitBounds([
            [county.bounds.south, county.bounds.west],
            [county.bounds.north, county.bounds.east]
          ], { padding: [50, 50] });
        }
      } else if (county.center) {
        // Or center on county center point
        if (provider === MapProviderType.MAPBOX) {
          map.setCenter([county.center.lng, county.center.lat]);
        } else if (provider === MapProviderType.LEAFLET) {
          map.setView([county.center.lat, county.center.lng]);
        }
      }
      
      mapLogger.debug(`Map updated for county: ${county.name}, ${county.state}`);
    } catch (error) {
      mapLogger.error(`Failed to update map for county: ${county.name}`, error);
    }
  };
  
  /**
   * Update map layers
   */
  const updateMapLayers = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    
    try {
      // Implementation depends on the map provider
      if (provider === MapProviderType.MAPBOX) {
        updateMapboxLayers(map);
      } else if (provider === MapProviderType.LEAFLET) {
        updateLeafletLayers(map);
      }
      
      mapLogger.debug(`Updated ${layers.length} layers on map`);
    } catch (error) {
      mapLogger.error('Failed to update map layers', error);
    }
  };
  
  /**
   * Update Mapbox layers
   */
  const updateMapboxLayers = (map: any) => {
    // Remove existing layers first
    const existingLayers = map.getStyle().layers.filter((layer: any) => 
      layer.id.startsWith('custom-')
    );
    
    existingLayers.forEach((layer: any) => {
      map.removeLayer(layer.id);
    });
    
    // Remove existing sources
    const existingSources = Object.keys(map.getStyle().sources).filter(source => 
      source.startsWith('custom-')
    );
    
    existingSources.forEach(source => {
      map.removeSource(source);
    });
    
    // Add new layers, sorted by z-index
    const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);
    
    sortedLayers.forEach(layer => {
      if (!layer.visible) return;
      
      // Source ID for this layer
      const sourceId = `custom-source-${layer.id}`;
      
      // Layer ID for this layer
      const layerId = `custom-layer-${layer.id}`;
      
      // Add source based on layer type
      if (layer.type === 'vector') {
        // Vector tile source
        map.addSource(sourceId, {
          type: 'vector',
          url: layer.source
        });
        
        // Add layer
        map.addLayer({
          id: layerId,
          type: 'fill',
          source: sourceId,
          'source-layer': layer.attributes?.sourceLayer || '0',
          paint: {
            'fill-color': layer.attributes?.fillColor || '#000000',
            'fill-opacity': layer.opacity,
            'fill-outline-color': layer.attributes?.outlineColor || '#000000'
          }
        });
        
        // Add outline layer
        map.addLayer({
          id: `${layerId}-outline`,
          type: 'line',
          source: sourceId,
          'source-layer': layer.attributes?.sourceLayer || '0',
          paint: {
            'line-color': layer.attributes?.outlineColor || '#000000',
            'line-width': layer.attributes?.outlineWidth || 1,
            'line-opacity': layer.opacity
          }
        });
      } else if (layer.type === 'raster') {
        // Raster tile source
        map.addSource(sourceId, {
          type: 'raster',
          url: layer.source,
          tileSize: 256
        });
        
        // Add layer
        map.addLayer({
          id: layerId,
          type: 'raster',
          source: sourceId,
          paint: {
            'raster-opacity': layer.opacity,
            'raster-hue-rotate': layer.attributes?.hueRotate || 0,
            'raster-brightness-min': layer.attributes?.brightnessMin || 0,
            'raster-brightness-max': layer.attributes?.brightnessMax || 1,
            'raster-saturation': layer.attributes?.saturation || 0,
            'raster-contrast': layer.attributes?.contrast || 0
          }
        });
      }
    });
  };
  
  /**
   * Update Leaflet layers
   */
  const updateLeafletLayers = (map: any) => {
    // Remove existing layers first
    map.eachLayer((layer: any) => {
      if (layer._url && layer._url.indexOf('tile.openstreetmap.org') === -1) {
        map.removeLayer(layer);
      }
    });
    
    // Add new layers, sorted by z-index
    const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);
    
    sortedLayers.forEach(layer => {
      if (!layer.visible) return;
      
      const L = require('leaflet');
      
      // Handle layer type with type guards
      const layerType = layer.type as string;
      
      if (layerType === 'vector') {
        // For vector data, we'd need to fetch the data and add it as GeoJSON
        // This is a simplified implementation
        if (layer.source) {
          fetch(layer.source)
            .then(response => response.json())
            .then(data => {
              L.geoJSON(data, {
                style: {
                  color: layer.attributes?.outlineColor || '#000000',
                  weight: layer.attributes?.outlineWidth || 1,
                opacity: layer.opacity,
                fillColor: layer.attributes?.fillColor || '#000000',
                fillOpacity: layer.opacity
              }
            }).addTo(map);
          })
          .catch(error => {
            mapLogger.error(`Failed to load vector data for layer ${layer.id}`, error);
          });
      } else if (layerType === 'raster' || layerType === 'imagery') {
        // For raster data, add as a tile layer
        L.tileLayer(layer.source, {
          opacity: layer.opacity,
          zIndex: layer.zIndex
        }).addTo(map);
      }
    });
  };
  
  /**
   * Update highlighted features
   */
  const updateHighlightedFeatures = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    
    try {
      // Implementation depends on the map provider
      if (provider === MapProviderType.MAPBOX) {
        updateMapboxHighlightedFeatures(map);
      } else if (provider === MapProviderType.LEAFLET) {
        updateLeafletHighlightedFeatures(map);
      }
      
      mapLogger.debug(`Updated ${highlightedFeatures.length} highlighted features on map`);
    } catch (error) {
      mapLogger.error('Failed to update highlighted features', error);
    }
  };
  
  /**
   * Update Mapbox highlighted features
   */
  const updateMapboxHighlightedFeatures = (map: any) => {
    // Remove existing highlight layers
    if (map.getLayer('highlighted-features')) {
      map.removeLayer('highlighted-features');
    }
    
    if (map.getLayer('highlighted-features-outline')) {
      map.removeLayer('highlighted-features-outline');
    }
    
    if (map.getSource('highlighted-features-source')) {
      map.removeSource('highlighted-features-source');
    }
    
    // If no features to highlight, return
    if (highlightedFeatures.length === 0) {
      return;
    }
    
    // Create GeoJSON source for highlighted features
    const geojson = {
      type: 'FeatureCollection',
      features: highlightedFeatures.map(feature => ({
        type: 'Feature',
        id: feature.id,
        properties: feature.properties,
        geometry: feature.geometry
      }))
    };
    
    // Add source
    map.addSource('highlighted-features-source', {
      type: 'geojson',
      data: geojson
    });
    
    // Add fill layer
    map.addLayer({
      id: 'highlighted-features',
      type: 'fill',
      source: 'highlighted-features-source',
      paint: {
        'fill-color': '#ffff00',
        'fill-opacity': 0.5
      }
    });
    
    // Add outline layer
    map.addLayer({
      id: 'highlighted-features-outline',
      type: 'line',
      source: 'highlighted-features-source',
      paint: {
        'line-color': '#ff0000',
        'line-width': 2
      }
    });
  };
  
  /**
   * Update Leaflet highlighted features
   */
  const updateLeafletHighlightedFeatures = (map: any) => {
    // Remove existing highlight layers
    if (map.highlightLayer) {
      map.removeLayer(map.highlightLayer);
      map.highlightLayer = null;
    }
    
    // If no features to highlight, return
    if (highlightedFeatures.length === 0) {
      return;
    }
    
    const L = require('leaflet');
    
    // Create GeoJSON for highlighted features
    const geojson = {
      type: 'FeatureCollection',
      features: highlightedFeatures.map(feature => ({
        type: 'Feature',
        id: feature.id,
        properties: feature.properties,
        geometry: feature.geometry
      }))
    };
    
    // Add highlight layer
    map.highlightLayer = L.geoJSON(geojson, {
      style: {
        color: '#ff0000',
        weight: 2,
        opacity: 1,
        fillColor: '#ffff00',
        fillOpacity: 0.5
      }
    }).addTo(map);
  };
  
  /**
   * Handle map click
   */
  const handleMapClick = (e: any) => {
    const map = mapInstanceRef.current;
    if (!map || activeMeasurement || activeDrawingTool) return;
    
    try {
      // Query features at click location
      let features: any[] = [];
      
      if (provider === MapProviderType.MAPBOX) {
        const point = e.point;
        features = map.queryRenderedFeatures(point, {
          layers: layers.map(layer => `custom-layer-${layer.id}`)
        });
      } else if (provider === MapProviderType.LEAFLET) {
        // For Leaflet, we'd need to implement custom feature querying
        // This is a simplified implementation
        features = [];
      }
      
      // If no features found, clear selection
      if (features.length === 0) {
        setSelectedFeature(null);
        return;
      }
      
      // Get the top feature
      const feature = features[0];
      
      // Create feature info
      const featureInfo: FeatureInfo = {
        id: feature.id || `feature-${Date.now()}`,
        type: feature.layer.id || 'unknown',
        properties: feature.properties || {},
        geometry: feature.geometry
      };
      
      // Set selected feature
      setSelectedFeature(featureInfo);
      
      // Notify parent component
      if (onFeatureClick) {
        onFeatureClick(featureInfo);
      }
      
      mapLogger.debug(`Feature clicked: ${featureInfo.id}`, featureInfo);
    } catch (error) {
      mapLogger.error('Error handling map click', error);
    }
  };
  
  /**
   * Handle map mouse move
   */
  const handleMapMouseMove = (e: any) => {
    const map = mapInstanceRef.current;
    if (!map || activeMeasurement || activeDrawingTool) return;
    
    try {
      // Query features at mouse location
      let features: any[] = [];
      
      if (provider === MapProviderType.MAPBOX) {
        const point = e.point;
        features = map.queryRenderedFeatures(point, {
          layers: layers.map(layer => `custom-layer-${layer.id}`)
        });
      } else if (provider === MapProviderType.LEAFLET) {
        // For Leaflet, we'd need to implement custom feature querying
        // This is a simplified implementation
        features = [];
      }
      
      // If no features found, clear hover state
      if (features.length === 0) {
        if (hoveredFeature) {
          setHoveredFeature(null);
          
          // Notify parent component
          if (onFeatureHover) {
            onFeatureHover(null);
          }
        }
        return;
      }
      
      // Get the top feature
      const feature = features[0];
      
      // Create feature info
      const featureInfo: FeatureInfo = {
        id: feature.id || `feature-${Date.now()}`,
        type: feature.layer.id || 'unknown',
        properties: feature.properties || {},
        geometry: feature.geometry
      };
      
      // Check if this is the same feature as currently hovered
      if (hoveredFeature && hoveredFeature.id === featureInfo.id) {
        return;
      }
      
      // Set hovered feature
      setHoveredFeature(featureInfo);
      
      // Notify parent component
      if (onFeatureHover) {
        onFeatureHover(featureInfo);
      }
    } catch (error) {
      mapLogger.error('Error handling map mouse move', error);
    }
  };
  
  /**
   * Handle measurement start
   */
  const handleMeasurementStart = (type: MeasurementType) => {
    setActiveMeasurement(type);
    setActiveDrawingTool(null);
    
    mapLogger.debug(`Measurement started: ${type}`);
  };
  
  /**
   * Handle measurement complete
   */
  const handleMeasurementComplete = (measurement: MeasurementResult) => {
    // Notify parent component
    if (onMeasurementComplete) {
      onMeasurementComplete(measurement);
    }
    
    // Reset active measurement
    setActiveMeasurement(null);
    
    mapLogger.debug(`Measurement completed: ${measurement.type}`);
  };
  
  /**
   * Handle measurement cancel
   */
  const handleMeasurementCancel = () => {
    setActiveMeasurement(null);
    
    mapLogger.debug('Measurement cancelled');
  };
  
  /**
   * Handle drawing start
   */
  const handleDrawingStart = (tool: DrawingToolType) => {
    setActiveDrawingTool(tool);
    setActiveMeasurement(null);
    
    mapLogger.debug(`Drawing started: ${tool}`);
  };
  
  /**
   * Handle drawing complete
   */
  const handleDrawingComplete = (feature: any) => {
    // Notify parent component
    if (onDrawingComplete) {
      onDrawingComplete(feature);
    }
    
    // Reset active drawing tool
    setActiveDrawingTool(null);
    
    mapLogger.debug('Drawing completed');
  };
  
  /**
   * Handle drawing cancel
   */
  const handleDrawingCancel = () => {
    setActiveDrawingTool(null);
    
    mapLogger.debug('Drawing cancelled');
  };
  
  /**
   * Handle zoom in
   */
  const handleZoomIn = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    
    if (provider === MapProviderType.MAPBOX) {
      map.zoomIn();
    } else if (provider === MapProviderType.LEAFLET) {
      map.zoomIn();
    }
  };
  
  /**
   * Handle zoom out
   */
  const handleZoomOut = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    
    if (provider === MapProviderType.MAPBOX) {
      map.zoomOut();
    } else if (provider === MapProviderType.LEAFLET) {
      map.zoomOut();
    }
  };
  
  /**
   * Handle reset north
   */
  const handleResetNorth = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    
    if (provider === MapProviderType.MAPBOX) {
      map.setBearing(0);
    }
    // Leaflet doesn't support bearing
  };
  
  /**
   * Handle reset view
   */
  const handleResetView = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    
    updateMapForCounty();
  };
  
  /**
   * Handle print
   */
  const handlePrint = () => {
    window.print();
  };
  
  /**
   * Handle export
   */
  const handleExport = (format: 'png' | 'jpg' | 'svg' | 'pdf') => {
    // Implementation depends on the map provider
    if (provider === MapProviderType.MAPBOX) {
      exportMapboxMap(format);
    } else if (provider === MapProviderType.LEAFLET) {
      exportLeafletMap(format);
    }
  };
  
  /**
   * Export Mapbox map
   */
  const exportMapboxMap = (format: 'png' | 'jpg' | 'svg' | 'pdf') => {
    const map = mapInstanceRef.current;
    if (!map) return;
    
    try {
      // Get map canvas
      const canvas = map.getCanvas();
      
      // Create a download link
      const link = document.createElement('a');
      
      if (format === 'svg' || format === 'pdf') {
        mapLogger.warn(`Export to ${format} not implemented for Mapbox`);
        return;
      }
      
      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL(`image/${format === 'png' ? 'png' : 'jpeg'}`);
      
      // Set link attributes
      link.href = dataUrl;
      link.download = `map-${county.name}-${county.state}.${format}`;
      
      // Click the link to download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      mapLogger.debug(`Map exported as ${format}`);
    } catch (error) {
      mapLogger.error(`Failed to export map as ${format}`, error);
    }
  };
  
  /**
   * Export Leaflet map
   */
  const exportLeafletMap = (format: 'png' | 'jpg' | 'svg' | 'pdf') => {
    // Leaflet doesn't have built-in export functionality
    // This would require additional libraries like leaflet-image
    
    mapLogger.warn(`Export to ${format} not implemented for Leaflet`);
  };
  
  /**
   * Handle share
   */
  const handleShare = () => {
    // Create a shareable URL with current view
    const url = new URL(window.location.href);
    
    // Add map view parameters
    url.searchParams.set('lat', mapView.center.lat.toString());
    url.searchParams.set('lng', mapView.center.lng.toString());
    url.searchParams.set('zoom', mapView.zoom.toString());
    url.searchParams.set('bearing', mapView.bearing.toString());
    url.searchParams.set('pitch', mapView.pitch.toString());
    
    // Add county info
    url.searchParams.set('county', county.id);
    
    // Copy to clipboard
    navigator.clipboard.writeText(url.toString())
      .then(() => {
        alert('Map URL copied to clipboard');
      })
      .catch(error => {
        mapLogger.error('Failed to copy map URL to clipboard', error);
        alert('Failed to copy map URL to clipboard');
      });
  };
  
  /**
   * Get Mapbox style URL based on base layer
   */
  const getMapboxStyle = (baseLayer: BaseLayerType): string => {
    switch (baseLayer) {
      case BaseLayerType.STREETS:
        return 'mapbox://styles/mapbox/streets-v11';
      case BaseLayerType.SATELLITE:
        return 'mapbox://styles/mapbox/satellite-v9';
      case BaseLayerType.HYBRID:
        return 'mapbox://styles/mapbox/satellite-streets-v11';
      case BaseLayerType.TERRAIN:
        return 'mapbox://styles/mapbox/outdoors-v11';
      case BaseLayerType.LIGHT:
        return 'mapbox://styles/mapbox/light-v10';
      case BaseLayerType.DARK:
        return 'mapbox://styles/mapbox/dark-v10';
      case BaseLayerType.TOPO:
        return 'mapbox://styles/mapbox/outdoors-v11';
      case BaseLayerType.NONE:
        return 'mapbox://styles/mapbox/basic-v9';
      default:
        return 'mapbox://styles/mapbox/streets-v11';
    }
  };
  
  /**
   * Get Leaflet tile URL based on base layer
   */
  const getLeafletTileUrl = (baseLayer: BaseLayerType): string => {
    switch (baseLayer) {
      case BaseLayerType.STREETS:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      case BaseLayerType.SATELLITE:
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case BaseLayerType.HYBRID:
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case BaseLayerType.TERRAIN:
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      case BaseLayerType.TOPO:
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      case BaseLayerType.LIGHT:
        return 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      case BaseLayerType.DARK:
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      case BaseLayerType.NONE:
        return 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png';
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };
  
  return (
    <div 
      className={`county-map-viewer ${className}`}
      style={{
        position: 'relative',
        width,
        height,
        ...style
      }}
    >
      {/* Map container */}
      <div 
        ref={mapContainerRef}
        className="map-container"
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      />
      
      {/* Loading overlay */}
      {!mapLoaded && (
        <div 
          className="map-loading-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            zIndex: 1000
          }}
        >
          {loadingError ? (
            <div style={{ textAlign: 'center', maxWidth: '80%' }}>
              <div style={{ 
                color: '#ef4444', 
                fontSize: '18px', 
                fontWeight: 'bold',
                marginBottom: '16px'
              }}>
                Error Loading Map
              </div>
              <div style={{ color: '#4b5563' }}>
                {loadingError}
              </div>
              <button
                onClick={initializeMap}
                style={{
                  marginTop: '16px',
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <div 
                className="loading-spinner"
                style={{
                  border: '4px solid rgba(0, 0, 0, 0.1)',
                  borderTopColor: '#3b82f6',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  animation: 'spin 1s linear infinite',
                  marginBottom: '16px'
                }}
              />
              <div style={{ color: '#4b5563' }}>Loading Map...</div>
            </>
          )}
        </div>
      )}
      
      {/* Map controls */}
      {mapLoaded && showControls && (
        <MapControls
          mapInstance={mapInstanceRef.current}
          layers={layers}
          view={mapView}
          position={controlsPosition}
          orientation={controlsOrientation}
          onLayerToggle={onLayerToggle}
          onLayerOpacityChange={onLayerOpacityChange}
          onMeasurementStart={handleMeasurementStart}
          onMeasurementComplete={handleMeasurementComplete}
          onMeasurementCancel={handleMeasurementCancel}
          onDrawingStart={handleDrawingStart}
          onDrawingComplete={handleDrawingComplete}
          onDrawingCancel={handleDrawingCancel}
          onViewChange={onViewChange}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetNorth={handleResetNorth}
          onResetView={handleResetView}
          onPrint={handlePrint}
          onExport={handleExport}
          onShare={handleShare}
        />
      )}
      
      {/* Measurement tools */}
      {mapLoaded && activeMeasurement && (
        <MeasurementTools
          mapInstance={mapInstanceRef.current}
          activeMeasurement={activeMeasurement}
          onMeasurementComplete={handleMeasurementComplete}
          onMeasurementCancel={handleMeasurementCancel}
        />
      )}
      
      {/* Tooltip */}
      {mapLoaded && hoveredFeature && !selectedFeature && (
        <div 
          className="map-tooltip"
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            backgroundColor: 'white',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
            padding: '12px',
            borderRadius: '4px',
            maxWidth: '300px',
            zIndex: 1001
          }}
        >
          {renderTooltip ? renderTooltip(hoveredFeature) : (
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                {hoveredFeature.properties.name || 'Feature'}
              </div>
              <div style={{ fontSize: '14px', color: '#4b5563' }}>
                {Object.entries(hoveredFeature.properties)
                  .filter(([key]) => key !== 'name')
                  .slice(0, 3)
                  .map(([key, value]) => (
                    <div key={key}>
                      <strong>{key}:</strong> {String(value)}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Popup */}
      {mapLoaded && selectedFeature && (
        <div 
          className="map-popup"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            backgroundColor: 'white',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
            padding: '16px',
            borderRadius: '4px',
            maxWidth: '400px',
            maxHeight: '80%',
            overflowY: 'auto',
            zIndex: 1002
          }}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
              {selectedFeature.properties.name || 'Feature Details'}
            </div>
            <button
              onClick={() => setSelectedFeature(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px'
              }}
            >
              ×
            </button>
          </div>
          
          {renderPopup ? renderPopup(selectedFeature) : (
            <div>
              {Object.entries(selectedFeature.properties).map(([key, value]) => (
                <div key={key} style={{ marginBottom: '8px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                  </div>
                  <div style={{ color: '#4b5563' }}>
                    {String(value)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* CSS animation for loading spinner */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};