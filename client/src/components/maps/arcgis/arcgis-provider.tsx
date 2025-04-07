import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';

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
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<any>(null);
  const viewRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Using dynamic imports for better compatibility
    const loadMap = async () => {
      try {
        // Import Map and MapView classes
        const Map = await import('@arcgis/core/Map').then(m => m.default);
        const MapView = await import('@arcgis/core/views/MapView').then(m => m.default);
        
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
        
        // Store references
        mapRef.current = map;
        viewRef.current = view;
        
        // Wait for the view to load
        await view.when();
        
        console.log('ArcGIS map loaded');
        setMapLoaded(true);
        
        if (onMapLoaded) {
          onMapLoaded(map, view);
        }
      } catch (err) {
        console.error('Error loading ArcGIS map:', err);
        setError('Failed to load ArcGIS map');
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
  }, [initialViewState, interactive, onMapLoaded]);

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
    <div style={style}>
      {error ? (
        <Card className="p-4 text-center">
          <p className="text-red-500">{error}</p>
          <p className="text-sm mt-2">
            Falling back to alternative map provider if available.
          </p>
        </Card>
      ) : (
        <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
          {mapLoaded && childrenWithProps}
        </div>
      )}
    </div>
  );
};

export default ArcGISProvider;