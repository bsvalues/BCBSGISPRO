import React, { useEffect, useRef, useState } from 'react';
import { loadModules } from '@esri/react-arcgis';
import { MapView, WebMap } from '@esri/react-arcgis';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// CSS needed for ArcGIS
import '@arcgis/core/assets/esri/themes/light/main.css';

export interface ArcGISMapProps {
  webMapId?: string;
  className?: string;
  center?: [number, number];
  zoom?: number;
  basemap?: string;
  options?: Record<string, any>;
  onMapLoaded?: (view: __esri.MapView, map: __esri.Map) => void;
  children?: React.ReactNode;
}

export const ArcGISMap: React.FC<ArcGISMapProps> = ({
  webMapId,
  className,
  center = [-123.262, 44.571], // Default to Benton County coordinates
  zoom = 12,
  basemap = 'topo-vector',
  options = {},
  onMapLoaded,
  children
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapView, setMapView] = useState<__esri.MapView | null>(null);
  const [map, setMap] = useState<__esri.Map | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    const initializeMap = async () => {
      try {
        // Load ArcGIS modules
        const [Map, MapView, WebMap, esriConfig] = await loadModules([
          'esri/Map',
          'esri/views/MapView',
          'esri/WebMap',
          'esri/config'
        ]);

        // Set portal URL (optional - for connecting to your ArcGIS portal)
        // esriConfig.portalUrl = 'https://your-portal-url/portal';

        // Create the map
        let esriMap;
        if (webMapId) {
          // Load a specific WebMap if ID is provided
          esriMap = new WebMap({
            portalItem: {
              id: webMapId
            }
          });
        } else {
          // Create a new Map with specified basemap
          esriMap = new Map({
            basemap
          });
        }

        // Create the MapView
        const view = new MapView({
          container: mapRef.current,
          map: esriMap,
          center,
          zoom,
          ...options
        });

        // Store references
        setMap(esriMap);
        setMapView(view);

        // Wait for the view to be ready
        view.when(() => {
          console.log('ArcGIS MapView ready');
          setLoaded(true);
          if (onMapLoaded) {
            onMapLoaded(view, esriMap);
          }
        });

        // Cleanup on unmount
        return () => {
          if (view) {
            view.destroy();
          }
        };
      } catch (error) {
        console.error('Error initializing ArcGIS map:', error);
      }
    };

    initializeMap();
  }, [webMapId, center, zoom, basemap, options, onMapLoaded]);

  return (
    <Card className={cn("w-full h-full overflow-hidden border-0 rounded-none shadow-none", className)}>
      <CardContent className="p-0 w-full h-full">
        <div ref={mapRef} className="w-full h-full" />
        {loaded && mapView && map && children}
      </CardContent>
    </Card>
  );
};

export default ArcGISMap;