import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapboxToken } from '@/hooks/use-mapbox-token';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

// Define prop types for MapboxProvider
interface MapboxProviderProps {
  initialViewState?: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
  style?: React.CSSProperties;
  mapStyle?: string;
  children?: React.ReactNode;
  onMapLoaded?: (map: mapboxgl.Map) => void;
  interactive?: boolean;
}

/**
 * Mapbox Provider Component
 * 
 * This component initializes a Mapbox GL JS map and provides it to child components
 */
export const MapboxProvider: React.FC<MapboxProviderProps> = ({
  initialViewState = { longitude: -121.3153, latitude: 44.0582, zoom: 13 },
  style = { width: '100%', height: '100%' },
  mapStyle = 'mapbox://styles/mapbox/streets-v12',
  children,
  onMapLoaded,
  interactive = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const { token, isLoading, error } = useMapboxToken();
  const [mapInitialized, setMapInitialized] = useState(false);

  // Initialize the map when token is available
  useEffect(() => {
    if (!token || !mapContainerRef.current || mapRef.current) {
      return;
    }

    // Set the token for mapbox-gl
    mapboxgl.accessToken = token;

    // Initialize the map
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [initialViewState.longitude, initialViewState.latitude],
      zoom: initialViewState.zoom,
      interactive
    });

    // Store map instance in ref
    mapRef.current = map;

    // Set up event handlers
    map.on('load', () => {
      setMapInitialized(true);
      if (onMapLoaded) {
        onMapLoaded(map);
      }
    });

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [
    token, 
    initialViewState.latitude, 
    initialViewState.longitude, 
    initialViewState.zoom, 
    mapStyle, 
    onMapLoaded, 
    interactive
  ]);

  // Create a context value with map instance
  const contextValue = {
    map: mapRef.current,
    isLoaded: mapInitialized
  };

  return (
    <div style={{ ...style, position: 'relative' }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}
      
      {error && (
        <Alert variant="destructive" className="absolute top-2 left-2 right-2 z-10">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      
      {mapInitialized && children && (
        <MapboxContext.Provider value={contextValue}>
          {children}
        </MapboxContext.Provider>
      )}
    </div>
  );
};

// Create a context for Mapbox map
interface MapboxContextValue {
  map: mapboxgl.Map | null;
  isLoaded: boolean;
}

export const MapboxContext = React.createContext<MapboxContextValue>({
  map: null,
  isLoaded: false
});

// Custom hook to use Mapbox context
export function useMapbox() {
  return React.useContext(MapboxContext);
}

export default MapboxProvider;