import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useArcgisApiKey } from '../../../hooks/use-arcgis-api-key';

// Define TypeScript interfaces for ArcGIS types
declare global {
  namespace __esri {
    interface Map {
      add: (layer: any) => void;
      remove: (layer: any) => void;
      basemap: string;
    }

    interface MapView {
      center: [number, number];
      zoom: number;
      ui: {
        components: string[];
      };
      container: HTMLDivElement;
      when: (callback?: () => void) => Promise<void>;
      goTo: (target: any, options?: any) => Promise<void>;
      on: (eventName: string, callback: (...args: any[]) => void) => any;
      destroy: () => void;
    }
  }
}

interface ArcGISProviderProps {
  initialViewState?: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
  style?: React.CSSProperties;
  children?: React.ReactNode;
  onMapLoaded?: (map: any, view: any) => void;
  interactive?: boolean;
}

/**
 * ArcGIS Provider Component
 * 
 * This component initializes an ArcGIS map and provides it to child components
 * using the ArcGIS Core API directly for improved compatibility
 */
export const ArcGISProvider: React.FC<ArcGISProviderProps> = ({
  initialViewState = { longitude: -123.3617, latitude: 44.5646, zoom: 10 }, // Benton County, Oregon
  style = { width: '100%', height: '100%' },
  children,
  onMapLoaded,
  interactive = true
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const mapRef = useRef<any>(null);
  const viewRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use our ArcGIS API key hook
  const { apiKey, isLoading: isKeyLoading, error: keyError } = useArcgisApiKey();
  
  useEffect(() => {
    if (!containerRef.current) return;

    // Using dynamic imports for better compatibility
    const loadMap = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setErrorDetails(null);
        
        // Import Map and MapView classes
        const Map = await import('@arcgis/core/Map').then(m => m.default);
        const MapView = await import('@arcgis/core/views/MapView').then(m => m.default);
        
        // Check for API configuration
        // ArcGIS JS API uses a config.apiKey setting in the application
        try {
          const esriConfig = await import('@arcgis/core/config').then(m => m.default);
          
          // Use the API key from our hook or environment variables
          const effectiveApiKey = apiKey || process.env.VITE_ARCGIS_API_KEY;
          
          if (effectiveApiKey) {
            console.log('Setting ArcGIS API key');
            esriConfig.apiKey = effectiveApiKey;
          } else {
            console.warn('No ArcGIS API key found. Some services may be limited.');
          }
        } catch (configError) {
          console.warn('Could not configure ArcGIS API key:', configError);
        }
        
        // Create a new map
        const map = new Map({
          basemap: 'streets-vector'
        });
        
        // Create a new view
        const view = new MapView({
          container: containerRef.current!,
          map: map,
          center: [initialViewState.longitude, initialViewState.latitude],
          zoom: initialViewState.zoom,
          ui: {
            components: interactive ? ['zoom', 'compass', 'attribution'] : []
          }
        });
        
        // Add error handler to view
        view.on("error", (error) => {
          console.error("ArcGIS view error:", error);
          setErrorDetails(`Map view error: ${error.name}: ${error.message}`);
        });
        
        // Store references
        mapRef.current = map;
        viewRef.current = view;
        
        // Wait for the view to load
        await view.when();
        
        console.log('ArcGIS map loaded successfully');
        setMapLoaded(true);
        setIsLoading(false);
        
        if (onMapLoaded) {
          onMapLoaded(map, view);
        }
      } catch (err: any) {
        console.error('Error loading ArcGIS map:', err);
        setMapLoaded(false);
        setIsLoading(false);
        setError('Failed to load ArcGIS map');
        setErrorDetails(err.message || 'Unknown error occurred');
      }
    };
    
    loadMap();
    
    // Cleanup
    return () => {
      if (viewRef.current) {
        try {
          viewRef.current.destroy();
        } catch (err) {
          console.error('Error destroying ArcGIS map view:', err);
        }
        
        viewRef.current = null;
        mapRef.current = null;
      }
    };
  }, [initialViewState, interactive, onMapLoaded, apiKey]);

  // Clone children with the map and view
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child) && mapLoaded) {
      return React.cloneElement(child, {
        map: mapRef.current,
        view: viewRef.current
      });
    }
    return child;
  });

  return (
    <div style={{ ...style, position: 'relative' }}>
      {error ? (
        <Alert variant="destructive" className="absolute top-2 left-2 right-2 z-10">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Map Error</AlertTitle>
          <AlertDescription>
            {error}
            {errorDetails && (
              <details className="mt-2 text-xs">
                <summary>Technical Details</summary>
                <p className="mt-1">{errorDetails}</p>
              </details>
            )}
          </AlertDescription>
        </Alert>
      ) : null}
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading ArcGIS map...</p>
          </div>
        </div>
      )}
      
      <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
        {mapLoaded && childrenWithProps}
      </div>
    </div>
  );
};

export default ArcGISProvider;