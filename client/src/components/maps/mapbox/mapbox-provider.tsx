import React, { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { toast } from '@/hooks/use-toast';

// We will fetch the token from the API instead of using env vars directly
let tokenInitialized = false;

// Check for browser WebGL support
const isSupported = mapboxgl.supported();

// Context to provide map instance to child components
export const MapboxContext = React.createContext<{
  map: mapboxgl.Map | null;
  isLoaded: boolean;
}>({
  map: null,
  isLoaded: false
});

export interface MapboxProviderProps {
  children?: React.ReactNode;
  mapContainerId: string;
  initialViewState?: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
  mapStyle?: string;
  onMapLoad?: (map: mapboxgl.Map) => void;
}

/**
 * MapboxProvider component - initializes the Mapbox GL JS map and provides it to child components
 */
export function MapboxProvider({
  children,
  mapContainerId,
  initialViewState = {
    longitude: -119.16,  // Benton County, WA
    latitude: 46.23,
    zoom: 11
  },
  mapStyle = 'mapbox://styles/mapbox/streets-v12',
  onMapLoad
}: MapboxProviderProps) {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!isSupported) {
      toast({
        title: 'Browser not supported',
        description: 'Your browser does not support WebGL, which is required for the map to display.',
        variant: 'destructive'
      });
      return;
    }

    // First, check if we need to get the Mapbox token
    const initializeMapbox = async () => {
      // Only fetch token if not already initialized
      if (!tokenInitialized) {
        try {
          const response = await fetch('/api/mapbox-token');
          const data = await response.json();
          
          if (data.token) {
            mapboxgl.accessToken = data.token;
            tokenInitialized = true;
            console.log('Mapbox token initialized successfully');
          } else {
            throw new Error('Token not found in response');
          }
        } catch (err) {
          console.error('Failed to fetch Mapbox token:', err);
          toast({
            title: 'Mapbox token error',
            description: 'Could not retrieve Mapbox access token. Map features may be limited.',
            variant: 'destructive'
          });
          return false;
        }
      }
      return true;
    };

    // Initialize Mapbox and create map
    const setupMap = async () => {
      // Only proceed if token is initialized successfully
      const tokenSuccess = await initializeMapbox();
      if (!tokenSuccess) return;

      // Only create a new map if one doesn't already exist
      if (!map) {
        try {
          const newMap = new mapboxgl.Map({
            container: mapContainerId,
            style: mapStyle,
            center: [initialViewState.longitude, initialViewState.latitude],
            zoom: initialViewState.zoom,
            attributionControl: true
          });

          // Add navigation controls
          newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
          
          // Add scale control
          newMap.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

          // Wait for map to load
          newMap.on('load', () => {
            setIsLoaded(true);
            if (onMapLoad) {
              onMapLoad(newMap);
            }
          });

          // Add error handler
          newMap.on('error', (e) => {
            console.error('Mapbox error:', e);
            toast({
              title: 'Map error',
              description: 'An error occurred with the map. Please try again later.',
              variant: 'destructive'
            });
          });

          // Set the map instance
          setMap(newMap);
        } catch (error) {
          console.error('Error initializing Mapbox:', error);
          toast({
            title: 'Map initialization failed',
            description: 'Failed to initialize the map. Please try again.',
            variant: 'destructive'
          });
        }
      }
    };

    // Call the setup function
    setupMap();

    // Cleanup function to remove the map instance
    return () => {
      if (map) {
        map.remove();
        setMap(null);
        setIsLoaded(false);
      }
    };
  }, [mapContainerId, mapStyle]); // Recreate map if container or style changes

  // Return provider with current map instance and loaded state
  return (
    <MapboxContext.Provider value={{ map, isLoaded }}>
      {children}
    </MapboxContext.Provider>
  );
}

// Hook to use the Mapbox map instance
export function useMapbox() {
  const context = React.useContext(MapboxContext);
  if (context === undefined) {
    throw new Error('useMapbox must be used within a MapboxProvider');
  }
  return context;
}

export default MapboxProvider;