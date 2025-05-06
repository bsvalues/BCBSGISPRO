import React, { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '../ui/button';
import { Loader2, Layers, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { 
  fetchBentonCountyParcels, 
  fetchShortPlats, 
  fetchLongPlats 
} from '../../services/arcgis-to-mapbox';
import { FeatureCollection } from 'geojson';

// Using environment variable for Mapbox token
const MAPBOX_TOKEN = (import.meta as any).env.VITE_MAPBOX_ACCESS_TOKEN || '';

interface BentonCountyMapProps {
  center?: [number, number];
  zoom?: number;
  style?: string;
  className?: string;
  showParcels?: boolean;
  showShortPlats?: boolean;
  showLongPlats?: boolean;
  onParcelClick?: (properties: any) => void;
}

/**
 * Benton County Map Component
 * 
 * This component displays a MapBox map with integrated Benton County GIS data layers
 * from authentic ArcGIS services.
 */
const BentonCountyMap: React.FC<BentonCountyMapProps> = ({
  center = [-119.2984, 46.2587], // Default center at Benton County, WA
  zoom = 12,
  style = 'mapbox://styles/mapbox/streets-v11',
  className = 'h-full w-full',
  showParcels = true,
  showShortPlats = false,
  showLongPlats = false,
  onParcelClick
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Layer IDs for removing/adding layers
  const PARCELS_SOURCE_ID = 'benton-parcels';
  const PARCELS_LAYER_ID = 'benton-parcels-layer';
  const PARCELS_LINE_LAYER_ID = 'benton-parcels-line-layer';
  
  const SHORT_PLATS_SOURCE_ID = 'benton-short-plats';
  const SHORT_PLATS_LAYER_ID = 'benton-short-plats-layer';
  const SHORT_PLATS_LINE_LAYER_ID = 'benton-short-plats-line-layer';
  
  const LONG_PLATS_SOURCE_ID = 'benton-long-plats';
  const LONG_PLATS_LAYER_ID = 'benton-long-plats-layer';
  const LONG_PLATS_LINE_LAYER_ID = 'benton-long-plats-line-layer';

  /**
   * Add parcels GeoJSON layer to the map
   */
  const addParcelsLayer = useCallback(async () => {
    if (!map.current || !loaded) return;
    
    try {
      setLoading(true);
      
      // Get map bounds for spatial query
      const bounds = map.current.getBounds();
      // Check if bounds exist to satisfy TypeScript
      if (!bounds) {
        setError('Could not determine map bounds');
        setLoading(false);
        return;
      }
      
      const extent: [number, number, number, number] = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth()
      ];
      
      // Fetch parcels within the current map view
      const parcelsData = await fetchBentonCountyParcels(extent);
      
      // Add source if it doesn't exist
      if (!map.current.getSource(PARCELS_SOURCE_ID)) {
        map.current.addSource(PARCELS_SOURCE_ID, {
          type: 'geojson',
          data: parcelsData
        });
      } else {
        // Update existing source
        (map.current.getSource(PARCELS_SOURCE_ID) as mapboxgl.GeoJSONSource).setData(parcelsData);
      }
      
      // Add fill layer if it doesn't exist
      if (!map.current.getLayer(PARCELS_LAYER_ID)) {
        map.current.addLayer({
          id: PARCELS_LAYER_ID,
          type: 'fill',
          source: PARCELS_SOURCE_ID,
          paint: {
            'fill-color': 'rgba(0, 140, 170, 0.1)',
            'fill-opacity': 0.6
          }
        });
        
        // Add line layer for boundaries
        map.current.addLayer({
          id: PARCELS_LINE_LAYER_ID,
          type: 'line',
          source: PARCELS_SOURCE_ID,
          paint: {
            'line-color': 'rgba(0, 140, 170, 0.8)',
            'line-width': 1
          }
        });
        
        // Add click handler for parcels
        if (onParcelClick) {
          map.current.on('click', PARCELS_LAYER_ID, (e) => {
            if (e.features && e.features.length > 0) {
              onParcelClick(e.features[0].properties);
            }
          });
          
          // Change cursor on hover
          map.current.on('mouseenter', PARCELS_LAYER_ID, () => {
            if (map.current) map.current.getCanvas().style.cursor = 'pointer';
          });
          
          map.current.on('mouseleave', PARCELS_LAYER_ID, () => {
            if (map.current) map.current.getCanvas().style.cursor = '';
          });
        }
      }
      
      // Hide/show layer based on prop
      if (map.current.getLayer(PARCELS_LAYER_ID)) {
        const visibility = showParcels ? 'visible' : 'none';
        map.current.setLayoutProperty(PARCELS_LAYER_ID, 'visibility', visibility);
        map.current.setLayoutProperty(PARCELS_LINE_LAYER_ID, 'visibility', visibility);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error adding parcels layer:', err);
      setError('Failed to load Benton County parcels data');
      setLoading(false);
    }
  }, [loaded, showParcels, onParcelClick]);
  
  /**
   * Add Short Plats GeoJSON layer to the map
   */
  const addShortPlatsLayer = useCallback(async () => {
    if (!map.current || !loaded || !showShortPlats) return;
    
    try {
      setLoading(true);
      
      // Get map bounds for spatial query
      const bounds = map.current.getBounds();
      const extent: [number, number, number, number] = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth()
      ];
      
      // Fetch short plats within the current map view
      const shortPlatsData = await fetchShortPlats(extent);
      
      // Add source if it doesn't exist
      if (!map.current.getSource(SHORT_PLATS_SOURCE_ID)) {
        map.current.addSource(SHORT_PLATS_SOURCE_ID, {
          type: 'geojson',
          data: shortPlatsData
        });
      } else {
        // Update existing source
        (map.current.getSource(SHORT_PLATS_SOURCE_ID) as mapboxgl.GeoJSONSource).setData(shortPlatsData);
      }
      
      // Add fill layer if it doesn't exist
      if (!map.current.getLayer(SHORT_PLATS_LAYER_ID)) {
        map.current.addLayer({
          id: SHORT_PLATS_LAYER_ID,
          type: 'fill',
          source: SHORT_PLATS_SOURCE_ID,
          paint: {
            'fill-color': 'rgba(230, 100, 20, 0.2)',
            'fill-opacity': 0.7
          }
        });
        
        // Add line layer for boundaries
        map.current.addLayer({
          id: SHORT_PLATS_LINE_LAYER_ID,
          type: 'line',
          source: SHORT_PLATS_SOURCE_ID,
          paint: {
            'line-color': 'rgba(230, 100, 20, 0.8)',
            'line-width': 2,
            'line-dasharray': [2, 1]
          }
        });
      }
      
      // Hide/show layer based on prop
      if (map.current.getLayer(SHORT_PLATS_LAYER_ID)) {
        const visibility = showShortPlats ? 'visible' : 'none';
        map.current.setLayoutProperty(SHORT_PLATS_LAYER_ID, 'visibility', visibility);
        map.current.setLayoutProperty(SHORT_PLATS_LINE_LAYER_ID, 'visibility', visibility);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error adding short plats layer:', err);
      setError('Failed to load Benton County short plats data');
      setLoading(false);
    }
  }, [loaded, showShortPlats]);
  
  /**
   * Add Long Plats GeoJSON layer to the map
   */
  const addLongPlatsLayer = useCallback(async () => {
    if (!map.current || !loaded || !showLongPlats) return;
    
    try {
      setLoading(true);
      
      // Get map bounds for spatial query
      const bounds = map.current.getBounds();
      const extent: [number, number, number, number] = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth()
      ];
      
      // Fetch long plats within the current map view
      const longPlatsData = await fetchLongPlats(extent);
      
      // Add source if it doesn't exist
      if (!map.current.getSource(LONG_PLATS_SOURCE_ID)) {
        map.current.addSource(LONG_PLATS_SOURCE_ID, {
          type: 'geojson',
          data: longPlatsData
        });
      } else {
        // Update existing source
        (map.current.getSource(LONG_PLATS_SOURCE_ID) as mapboxgl.GeoJSONSource).setData(longPlatsData);
      }
      
      // Add fill layer if it doesn't exist
      if (!map.current.getLayer(LONG_PLATS_LAYER_ID)) {
        map.current.addLayer({
          id: LONG_PLATS_LAYER_ID,
          type: 'fill',
          source: LONG_PLATS_SOURCE_ID,
          paint: {
            'fill-color': 'rgba(120, 60, 180, 0.2)',
            'fill-opacity': 0.7
          }
        });
        
        // Add line layer for boundaries
        map.current.addLayer({
          id: LONG_PLATS_LINE_LAYER_ID,
          type: 'line',
          source: LONG_PLATS_SOURCE_ID,
          paint: {
            'line-color': 'rgba(120, 60, 180, 0.8)',
            'line-width': 2,
            'line-dasharray': [3, 1]
          }
        });
      }
      
      // Hide/show layer based on prop
      if (map.current.getLayer(LONG_PLATS_LAYER_ID)) {
        const visibility = showLongPlats ? 'visible' : 'none';
        map.current.setLayoutProperty(LONG_PLATS_LAYER_ID, 'visibility', visibility);
        map.current.setLayoutProperty(LONG_PLATS_LINE_LAYER_ID, 'visibility', visibility);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error adding long plats layer:', err);
      setError('Failed to load Benton County long plats data');
      setLoading(false);
    }
  }, [loaded, showLongPlats]);
  
  // Initialize the map
  useEffect(() => {
    if (!mapContainer.current) return;
    
    // Make sure we have a Mapbox token
    if (!MAPBOX_TOKEN) {
      setError('Mapbox access token is missing. Please check your environment variables.');
      return;
    }
    
    // Initialize Mapbox
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    // Create new map instance
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style,
      center,
      zoom,
      attributionControl: true,
      preserveDrawingBuffer: true
    });
    
    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Add scale
    map.current.addControl(new mapboxgl.ScaleControl({
      maxWidth: 100,
      unit: 'imperial'
    }), 'bottom-left');
    
    // Add fullscreen control
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    
    // Handle map load completion
    map.current.on('load', () => {
      setLoaded(true);
    });
    
    // Handle map errors
    map.current.on('error', (e) => {
      console.error('Mapbox error:', e);
      setError(`MapBox error: ${e.error?.message || 'Unknown error'}`);
    });
    
    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);
  
  // Add GIS layers once map is loaded
  useEffect(() => {
    if (loaded) {
      addParcelsLayer();
      
      if (showShortPlats) {
        addShortPlatsLayer();
      }
      
      if (showLongPlats) {
        addLongPlatsLayer();
      }
    }
  }, [loaded, addParcelsLayer, addShortPlatsLayer, addLongPlatsLayer, showShortPlats, showLongPlats]);
  
  // Update layers when visibility props change
  useEffect(() => {
    if (map.current && loaded && map.current.getLayer(PARCELS_LAYER_ID)) {
      const visibility = showParcels ? 'visible' : 'none';
      map.current.setLayoutProperty(PARCELS_LAYER_ID, 'visibility', visibility);
      map.current.setLayoutProperty(PARCELS_LINE_LAYER_ID, 'visibility', visibility);
    }
  }, [loaded, showParcels]);
  
  useEffect(() => {
    if (showShortPlats) {
      addShortPlatsLayer();
    } else if (map.current && loaded && map.current.getLayer(SHORT_PLATS_LAYER_ID)) {
      map.current.setLayoutProperty(SHORT_PLATS_LAYER_ID, 'visibility', 'none');
      map.current.setLayoutProperty(SHORT_PLATS_LINE_LAYER_ID, 'visibility', 'none');
    }
  }, [loaded, showShortPlats, addShortPlatsLayer]);
  
  useEffect(() => {
    if (showLongPlats) {
      addLongPlatsLayer();
    } else if (map.current && loaded && map.current.getLayer(LONG_PLATS_LAYER_ID)) {
      map.current.setLayoutProperty(LONG_PLATS_LAYER_ID, 'visibility', 'none');
      map.current.setLayoutProperty(LONG_PLATS_LINE_LAYER_ID, 'visibility', 'none');
    }
  }, [loaded, showLongPlats, addLongPlatsLayer]);
  
  // Update map when center/zoom props change
  useEffect(() => {
    if (map.current && loaded) {
      map.current.setCenter(center);
      map.current.setZoom(zoom);
    }
  }, [center, zoom, loaded]);
  
  // Update map style when style prop changes
  useEffect(() => {
    if (map.current && loaded) {
      map.current.setStyle(style);
      
      // We need to re-add layers when style changes
      map.current.once('style.load', () => {
        addParcelsLayer();
        if (showShortPlats) addShortPlatsLayer();
        if (showLongPlats) addLongPlatsLayer();
      });
    }
  }, [style, loaded, addParcelsLayer, addShortPlatsLayer, addLongPlatsLayer, showShortPlats, showLongPlats]);
  
  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <div className="h-full w-full" ref={mapContainer}></div>
      
      {/* Loading Indicator */}
      {loading && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-background/80 backdrop-blur-sm rounded-full shadow-md flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm">Loading GIS data...</span>
        </div>
      )}
      
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="absolute top-2 left-2 right-2 md:max-w-md md:left-2 md:right-auto z-10">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Layer Legend */}
      <div className="absolute right-2 bottom-10 bg-background/90 backdrop-blur-sm p-2 rounded shadow-md text-xs">
        <div className="font-medium mb-1">Benton County GIS Layers</div>
        <div className="flex items-center gap-1 mb-1">
          <div className="w-3 h-3 bg-[rgba(0,140,170,0.1)] border border-[rgba(0,140,170,0.8)]"></div>
          <span>Parcels</span>
        </div>
        {showShortPlats && (
          <div className="flex items-center gap-1 mb-1">
            <div className="w-3 h-3 bg-[rgba(230,100,20,0.2)] border border-[rgba(230,100,20,0.8)]"></div>
            <span>Short Plats</span>
          </div>
        )}
        {showLongPlats && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-[rgba(120,60,180,0.2)] border border-[rgba(120,60,180,0.8)]"></div>
            <span>Long Plats</span>
          </div>
        )}
      </div>
      
      {/* Attribution */}
      <div className="absolute left-2 bottom-2 text-[8px] text-muted-foreground">
        Data: Benton County, Washington GIS
      </div>
    </div>
  );
};

export default BentonCountyMap;