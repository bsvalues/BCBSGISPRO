import React, { useRef, useEffect, useState } from 'react';
import { loadModules } from 'esri-loader';
import { 
  EsriMapModuleSettings, 
  defaultEsriMapModuleSettings,
  BaseLayerModel,
  ViewableLayerModel 
} from './EsriMapModuleSettings';

interface EsriMapModuleProps {
  mapId?: string;
  center?: [number, number];
  zoom?: number;
  mapSettings?: Partial<EsriMapModuleSettings>;
  onMapLoaded?: (map: any) => void;
  onLayerClick?: (feature: any) => void;
  className?: string;
}

/**
 * EsriMapModule component that renders an ESRI map
 * 
 * This component uses the ESRI JS API to render a map with configurable layers
 * from the provided mapSettings or default settings.
 */
export const EsriMapModule: React.FC<EsriMapModuleProps> = ({
  mapId = 'esri-map',
  center = [-123.262, 44.564], // Default to Benton County coordinates
  zoom = 12,
  mapSettings,
  onMapLoaded,
  onLayerClick,
  className = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const viewInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Merge default settings with provided settings
  const settings = {
    ...defaultEsriMapModuleSettings,
    ...mapSettings
  };

  useEffect(() => {
    if (!mapRef.current) return;

    const loadMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load ArcGIS modules
        const [
          Map, 
          MapView, 
          FeatureLayer, 
          TileLayer,
          BasemapToggle,
          Basemap,
          Search,
          Extent,
          Graphic,
          GraphicsLayer
        ] = await loadModules([
          'esri/Map', 
          'esri/views/MapView', 
          'esri/layers/FeatureLayer',
          'esri/layers/TileLayer',
          'esri/widgets/BasemapToggle',
          'esri/Basemap',
          'esri/widgets/Search',
          'esri/geometry/Extent',
          'esri/Graphic',
          'esri/layers/GraphicsLayer'
        ]);

        // Create the map with base layers
        const map = new Map({
          basemap: settings.baseMap.type
        });

        // Add the map to the ref for tracking
        mapInstanceRef.current = map;

        // Create the map view
        const view = new MapView({
          container: mapRef.current,
          map: map,
          center: center,
          zoom: zoom,
          padding: {
            top: 50,
            bottom: 0,
            left: 0,
            right: 0
          }
        });

        // Add the view to the ref for tracking
        viewInstanceRef.current = view;

        // Add base and viewable layers
        await addBaseLayers(map, view, TileLayer, settings);
        await addViewableLayers(map, view, FeatureLayer, TileLayer, settings);

        // Add widgets
        addWidgets(view, BasemapToggle, Search);

        // Setup click event
        if (onLayerClick) {
          view.on('click', (event) => {
            view.hitTest(event).then((response) => {
              const graphics = response.results?.filter(
                (result) => result.graphic?.layer?.type === 'feature'
              );
              
              if (graphics && graphics.length > 0) {
                const feature = graphics[0].graphic;
                onLayerClick(feature);
              }
            });
          });
        }

        // When the view is loaded
        view.when(() => {
          setIsLoading(false);
          
          if (onMapLoaded) {
            onMapLoaded(map);
          }
        });

        // Return a cleanup function to destroy the map when component unmounts
        return () => {
          if (view) {
            view.destroy();
          }
        };
      } catch (err) {
        console.error('Error loading ESRI map:', err);
        setError('Failed to load the map.');
        setIsLoading(false);
      }
    };

    loadMap();
  }, [mapRef, center, zoom, onMapLoaded, onLayerClick, settings]);

  /**
   * Add base layers to the map
   */
  const addBaseLayers = async (map: any, view: any, TileLayer: any, settings: EsriMapModuleSettings) => {
    // Add base layers
    for (const baseLayer of settings.baseLayers) {
      try {
        if (baseLayer.type === 'ESRITiledLayer') {
          const layer = new TileLayer({
            url: baseLayer.url,
            id: baseLayer.name,
            title: baseLayer.name,
            visible: baseLayer.visible
          });
          map.add(layer, baseLayer.order);
          console.log(`Added base layer: ${baseLayer.name}`);
        }
      } catch (err) {
        console.error(`Error adding base layer ${baseLayer.name}:`, err);
      }
    }
  };

  /**
   * Add viewable layers to the map
   */
  const addViewableLayers = async (map: any, view: any, FeatureLayer: any, TileLayer: any, settings: EsriMapModuleSettings) => {
    // Add viewable layers
    for (const viewableLayer of settings.viewableLayers) {
      try {
        if (viewableLayer.type === 'ESRIFeatureLayer') {
          const layer = new FeatureLayer({
            url: viewableLayer.url,
            outFields: ['*'],
            id: viewableLayer.name,
            title: viewableLayer.name,
            visible: viewableLayer.visible
          });
          map.add(layer, viewableLayer.order);
          console.log(`Added feature layer: ${viewableLayer.name}`);
        } else if (viewableLayer.type === 'ESRIDynamicLayer') {
          const layer = new TileLayer({
            url: viewableLayer.url,
            id: viewableLayer.name,
            title: viewableLayer.name,
            visible: viewableLayer.visible
          });
          map.add(layer, viewableLayer.order);
          console.log(`Added dynamic layer: ${viewableLayer.name}`);
        }
      } catch (err) {
        console.error(`Error adding viewable layer ${viewableLayer.name}:`, err);
      }
    }
  };

  /**
   * Add widgets to the map view
   */
  const addWidgets = (view: any, BasemapToggle: any, Search: any) => {
    // Add base map toggle widget
    const basemapToggle = new BasemapToggle({
      view: view,
      nextBasemap: "satellite"
    });
    
    view.ui.add(basemapToggle, "bottom-right");

    // Add search widget
    const searchWidget = new Search({
      view: view,
      allPlaceholder: "Search for address or place",
      includeDefaultSources: true
    });
    
    view.ui.add(searchWidget, {
      position: "top-right",
      index: 0
    });
  };

  return (
    <div className={`relative ${className}`}>
      <div 
        id={mapId} 
        ref={mapRef} 
        className="w-full h-full"
        style={{ minHeight: '300px' }}
      ></div>
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm">
          <div className="glass-panel bg-background/60 p-4 rounded-lg shadow-md border border-primary/10 flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-foreground border-t-transparent mr-3"></div>
            <p className="text-primary font-medium">Loading map...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm">
          <div className="glass-panel bg-destructive/15 p-4 rounded-lg shadow-md border border-destructive/30 text-center max-w-md">
            <h3 className="text-destructive font-semibold mb-2">Error Loading Map</h3>
            <p className="text-destructive/90">{error}</p>
            <p className="text-xs mt-2 text-destructive/70">Please check your network connection and try again.</p>
          </div>
        </div>
      )}
    </div>
  );
};