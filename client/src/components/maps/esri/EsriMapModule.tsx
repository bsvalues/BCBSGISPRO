import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import DEFAULT_ESRI_MAP_SETTINGS, { 
  getArcGISLayerType, 
  getServiceUrl,
  EsriMapModuleSettingsModel 
} from './EsriMapModuleSettings';

interface LayerOpacitySettings {
  [key: string]: number;
}

interface EsriMapModuleProps {
  className?: string;
  center?: [number, number];
  zoom?: number;
  showLayerList?: boolean;
  showBasemapToggle?: boolean;
  enableSelection?: boolean;
  settings?: EsriMapModuleSettingsModel;
  layerOpacity?: LayerOpacitySettings;
}

const EsriMapModule: React.FC<EsriMapModuleProps> = ({
  className,
  center = [-123.2, 44.5], // Default to Benton County, OR coordinates
  zoom = 12,
  showLayerList = true,
  showBasemapToggle = true,
  enableSelection = true,
  settings = DEFAULT_ESRI_MAP_SETTINGS,
  layerOpacity = {}
}) => {
  const mapRef = useRef<any>(null);
  const viewRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [layers, setLayers] = useState<any[]>([]);
  const [esriModules, setEsriModules] = useState<any>(null);

  // Load the Esri modules
  useEffect(() => {
    const loadEsriModules = async () => {
      try {
        // Dynamically import esri-loader
        const esriLoader = await import('esri-loader');
        
        // Load ArcGIS API for JavaScript modules
        const [
          Map,
          MapView,
          FeatureLayer,
          TileLayer,
          esriConfig,
          LayerList,
          BasemapToggle
        ] = await esriLoader.loadModules([
          'esri/Map',
          'esri/views/MapView',
          'esri/layers/FeatureLayer',
          'esri/layers/TileLayer',
          'esri/config',
          'esri/widgets/LayerList',
          'esri/widgets/BasemapToggle'
        ]);
        
        setEsriModules({
          Map,
          MapView,
          FeatureLayer,
          TileLayer,
          esriConfig,
          LayerList,
          BasemapToggle
        });
      } catch (err) {
        console.error('Error loading Esri modules:', err);
        setError('Failed to load ArcGIS API. Please check your internet connection.');
      }
    };
    
    loadEsriModules();
  }, []);

  // Effect to update layer opacity when layerOpacity prop changes
  useEffect(() => {
    if (!layers.length || !viewRef.current) return;
    
    // Apply opacity to each layer
    layers.forEach(layer => {
      if (!layer) return;
      
      const layerName = layer.title?.toLowerCase();
      if (layerName && layerOpacity[layerName] !== undefined) {
        // Convert from percentage (0-100) to decimal (0-1)
        const opacityValue = layerOpacity[layerName] / 100;
        layer.opacity = opacityValue;
        console.log(`Setting opacity of ${layerName} to ${opacityValue}`);
      }
    });
  }, [layers, layerOpacity]);

  // Initialize the map once modules are loaded
  useEffect(() => {
    if (!esriModules) return;
    
    const initMap = async () => {
      try {
        setLoading(true);
        console.log('Initializing Esri Map Module...');
        
        const {
          Map,
          MapView,
          FeatureLayer,
          TileLayer,
          LayerList,
          BasemapToggle
        } = esriModules;

        // Create a new map instance
        const map = new Map({
          basemap: 'streets'
        });
        mapRef.current = map;

        // Create the map view
        const view = new MapView({
          container: 'esri-map-container',
          map: map,
          center: center,
          zoom: zoom,
          ui: {
            components: ['zoom', 'compass', 'attribution']
          }
        });
        viewRef.current = view;

        // Load layers from the ArcGIS services
        try {
          // Check if we are using the settings configuration
          if (settings && settings.baseLayers && settings.viewableLayers) {
            console.log('Using settings configuration for map layers');
            
            // Load base layers from settings
            const baseLayers = settings.baseLayers.map(layerConfig => {
              const layerType = getArcGISLayerType(layerConfig.type);
              const layerUrl = getServiceUrl(layerConfig.url, layerConfig.type);
              
              if (layerType === 'TileLayer') {
                return new TileLayer({
                  url: layerUrl,
                  title: layerConfig.name,
                  visible: layerConfig.visible,
                  // Add other properties as needed
                });
              } else if (layerType === 'MapImageLayer') {
                // We're using TileLayer for simplicity, but you could use MapImageLayer with dynamic layers
                return new TileLayer({
                  url: layerUrl,
                  title: layerConfig.name,
                  visible: layerConfig.visible,
                  // Add other properties as needed
                });
              }
              return null;
            }).filter(layer => layer !== null);
            
            // Load viewable layers from settings
            const viewableLayers = settings.viewableLayers.map(layerConfig => {
              const layerType = getArcGISLayerType(layerConfig.type);
              const layerUrl = getServiceUrl(layerConfig.url, layerConfig.type);
              
              if (layerType === 'FeatureLayer') {
                return new FeatureLayer({
                  url: layerUrl,
                  title: layerConfig.name,
                  outFields: ['*'],
                  popupEnabled: true,
                  visible: layerConfig.visible,
                  // Add other properties as needed
                });
              } else if (layerType === 'MapImageLayer') {
                // We're using TileLayer for simplicity, but you could use MapImageLayer with dynamic layers
                return new TileLayer({
                  url: layerUrl,
                  title: layerConfig.name,
                  visible: layerConfig.visible,
                  // Add other properties as needed
                });
              }
              return null;
            }).filter(layer => layer !== null);
            
            // Add layers to the map
            [...baseLayers, ...viewableLayers].forEach(layer => {
              if (layer) map.add(layer);
            });
            
            setLayers([...baseLayers, ...viewableLayers].filter(layer => layer !== null));
          } else {
            // Fetch services from our API if not using settings
            const response = await fetch('/api/map-services/arcgis-services');
            const data = await response.json();
            
            if (data && data.services && data.services.length > 0) {
              console.log('Found', data.services.length, 'ArcGIS services');
              
              // Create layers for each service
              const mapLayers = data.services.map((service: any) => {
                if (service.type === 'MapServer') {
                  return new TileLayer({
                    url: service.url,
                    title: service.name,
                    visible: service.name === 'Parcels_and_Assess' // Make parcels visible by default
                  });
                } else if (service.type === 'FeatureServer') {
                  return new FeatureLayer({
                    url: `${service.url}/0`, // Default to first layer
                    title: service.name,
                    outFields: ['*'],
                    popupEnabled: true,
                    visible: service.name === 'Parcels_and_Assess' // Make parcels visible by default
                  });
                }
                return null;
              }).filter(layer => layer !== null);
              
              // Add layers to the map
              mapLayers.forEach((layer: any) => {
                map.add(layer);
              });
              
              setLayers(mapLayers);
            } else {
              console.log('No ArcGIS services found, using hardcoded service URLs');
              
              // Fallback to hardcoded services based on the provided documentation
              const parcelsLayer = new FeatureLayer({
                url: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/Parcels_and_Assess/FeatureServer/0',
                title: 'Parcels and Assessor Data',
                outFields: ['*'],
                popupEnabled: true,
                visible: true
              });
              
              const streetsLayer = new TileLayer({
                url: 'https://services.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/World_Street_Map/MapServer',
                title: 'World Street Map',
                visible: true
              });
              
              const imageryLayer = new TileLayer({
                url: 'https://services.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/World_Imagery/MapServer',
                title: 'World Imagery',
                visible: false
              });
              
              map.addMany([parcelsLayer, streetsLayer, imageryLayer]);
              setLayers([parcelsLayer, streetsLayer, imageryLayer]);
            }
          }
          
          // Add layer list widget if requested
          if (showLayerList) {
            const layerList = new LayerList({
              view: view,
              container: document.createElement('div')
            });
            view.ui.add(layerList, 'top-right');
          }
          
          // Add basemap toggle if requested
          if (showBasemapToggle) {
            const basemapToggle = new BasemapToggle({
              view: view,
              nextBasemap: 'satellite'
            });
            view.ui.add(basemapToggle, 'bottom-right');
          }
          
          // Wait for the view to be ready
          await view.when();
          console.log('Esri Map Module initialized successfully');
          setLoading(false);
          
        } catch (err) {
          console.error('Error loading ArcGIS services:', err);
          setError('Failed to load map services. Please check your network connection.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to initialize the map. Please refresh the page and try again.');
        setLoading(false);
      }
    };

    initMap();

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up Esri Map Module');
      if (viewRef.current) {
        viewRef.current.destroy();
      }
    };
  }, [esriModules, center, zoom, showLayerList, showBasemapToggle, enableSelection, settings]);

  return (
    <div className={cn("relative w-full h-full", className)}>
      <div 
        id="esri-map-container" 
        className="w-full h-full"
        style={{ position: 'relative' }}
      />

      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" role="status">
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
            </div>
            <p className="mt-4 text-sm text-primary-foreground">Loading map...</p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-destructive text-destructive-foreground p-4 rounded-md shadow-lg max-w-xs">
            <h3 className="font-semibold mb-2">Error Loading Map</h3>
            <p className="text-sm">{error}</p>
            <button 
              className="mt-2 px-3 py-1 bg-background text-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => setError(null)}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* County identifier overlay */}
      <div className="absolute top-4 left-4 bg-primary-foreground px-3 py-1.5 rounded-md shadow-md text-sm font-medium text-primary">
        Benton County, Oregon
      </div>
    </div>
  );
};

export { EsriMapModule };