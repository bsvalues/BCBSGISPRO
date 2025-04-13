import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapboxToken } from '../../../hooks/use-mapbox-token';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert';
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
  mapContainerId?: string;
}

// Create a context for Mapbox map
interface MapboxContextValue {
  map: mapboxgl.Map | null;
  isLoaded: boolean;
}

const MapboxContext = React.createContext<MapboxContextValue>({
  map: null,
  isLoaded: false
});

// Custom hook to use Mapbox context
function useMapbox() {
  return React.useContext(MapboxContext);
}

/**
 * Mapbox Provider Component
 * 
 * This component initializes a Mapbox GL JS map and provides it to child components.
 * It manages token retrieval with multiple fallback strategies to ensure map functionality.
 */
const MapboxProvider: React.FC<MapboxProviderProps> = ({
  initialViewState = { longitude: -121.3153, latitude: 44.0582, zoom: 13 },
  style = { width: '100%', height: '100%' },
  mapStyle = 'mapbox://styles/mapbox/streets-v12',
  children,
  onMapLoaded,
  interactive = true,
  mapContainerId
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const { token, isLoading, error } = useMapboxToken();
  const [mapInitialized, setMapInitialized] = useState(false);
  const [directToken, setDirectToken] = useState<string>('');
  const [fetchingDirectly, setFetchingDirectly] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  
  // Function to initialize the map
  const initializeMap = useCallback((accessToken: string) => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }
    
    if (!accessToken) {
      console.error('Cannot initialize map without a valid Mapbox token');
      setMapError('Missing Mapbox access token. Please configure a valid token.');
      return;
    }
    
    console.log('Initializing map with token:', accessToken.substring(0, 10) + '...');
    
    try {
      // Set the token for mapbox-gl
      mapboxgl.accessToken = accessToken;
      
      // Store token in localStorage for future use
      try {
        localStorage.setItem('mapbox_token', accessToken);
        console.log('Saved Mapbox token to localStorage for future use');
      } catch (storageError) {
        console.warn('Could not save token to localStorage:', storageError);
      }
      
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
        console.log('Map loaded successfully');
        setMapInitialized(true);
        if (onMapLoaded) {
          onMapLoaded(map);
        }
      });
      
      map.on('error', (e) => {
        console.error('Mapbox map error:', e);
        setMapError(`Map error: ${e.error?.message || 'Unknown error'}`);
      });
      
    } catch (error) {
      console.error('Error initializing Mapbox map:', error);
      setMapError(`Failed to initialize map: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [
    mapStyle,
    initialViewState.longitude,
    initialViewState.latitude,
    initialViewState.zoom,
    interactive,
    onMapLoaded
  ]);
  
  // First try to get token from localStorage on component mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('mapbox_token');
      if (storedToken) {
        console.log('Found Mapbox token in localStorage');
        console.log('Setting global Mapbox token');
        mapboxgl.accessToken = storedToken;
        // Don't initialize map yet, wait for the full token retrieval flow
      }
    } catch (e) {
      console.warn('Could not access localStorage:', e);
    }
  }, []);
  
  // Handle direct token fetching from API
  const fetchTokenDirectly = useCallback(async () => {
    if (!fetchingDirectly && !directToken) {
      console.log('Attempting to fetch Mapbox token directly from API');
      setFetchingDirectly(true);
      
      try {
        const response = await fetch('/api/mapbox-token');
        if (!response.ok) {
          throw new Error(`Failed to fetch Mapbox token: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data && typeof data.token === 'string') {
          console.log('Successfully retrieved Mapbox token from API');
          setDirectToken(data.token);
        } else {
          throw new Error('Invalid token response from API');
        }
      } catch (directError) {
        console.error('Failed to fetch token directly:', directError);
        setMapError(`Could not retrieve Mapbox token: ${directError instanceof Error ? directError.message : 'Unknown error'}`);
      } finally {
        setFetchingDirectly(false);
      }
    }
  }, [fetchingDirectly, directToken]);
  
  // Try to fetch token if the hook and localStorage methods fail
  useEffect(() => {
    if (error) {
      console.log('Token hook failed with error, trying direct approach:', error);
      fetchTokenDirectly();
    }
  }, [error, fetchTokenDirectly]);
  
  // Initialize the map when token is available from any source
  useEffect(() => {
    // Use token from any available source with priority
    const accessToken = token || directToken || mapboxgl.accessToken;
    
    if (!accessToken) {
      // No token available yet, wait for token retrieval
      return;
    }
    
    if (!mapContainerRef.current || mapRef.current) {
      // Map container not ready or map already initialized
      return;
    }
    
    initializeMap(accessToken);

    // Cleanup function
    return () => {
      if (mapRef.current) {
        console.log('Cleaning up Mapbox map');
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [token, directToken, initializeMap]);

  // Create a context value with map instance
  const contextValue = {
    map: mapRef.current,
    isLoaded: mapInitialized
  };

  return (
    <div style={{ ...style, position: 'relative' }} id={mapContainerId}>
      {(isLoading || fetchingDirectly) && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}
      
      {(error || mapError) && !mapInitialized && (
        <Alert variant="destructive" className="absolute top-2 left-2 right-2 z-10">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Map Error</AlertTitle>
          <AlertDescription>
            {mapError || error?.toString() || 'Unknown error loading map'}
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

// Export everything in one place
export { MapboxProvider, MapboxContext, useMapbox };