import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../../lib/utils';

interface ArcGISMapComponentProps {
  layers?: string[];
  opacity?: number;
  showLabels?: boolean;
  baseMap?: string;
  className?: string;
  center?: [number, number];
  zoom?: number;
}

const ArcGISMapComponent: React.FC<ArcGISMapComponentProps> = ({
  layers = ['parcels', 'streets', 'boundaries'],
  opacity = 1,
  showLabels = true,
  baseMap = 'streets',
  className,
  center = [-123.2, 44.5], // Benton County default center
  zoom = 12
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [serviceList, setServiceList] = useState<any[]>([]);
  
  // Get the Mapbox token from environment variables
  useEffect(() => {
    // This should be using the environment variable on the server side
    const fetchMapboxToken = async () => {
      try {
        // First try the new endpoint
        const response = await fetch('/api/map-services/mapbox-token');
        const data = await response.json();
        
        if (data.token) {
          console.log('Successfully fetched Mapbox token from /api/map-services/mapbox-token');
          setMapboxToken(data.token);
          return;
        }
        
        // If the new endpoint fails, try the legacy endpoint
        console.log('Trying legacy endpoint for Mapbox token');
        const legacyResponse = await fetch('/api/mapbox-token');
        const legacyData = await legacyResponse.json();
        
        if (legacyData.token) {
          console.log('Successfully fetched Mapbox token from legacy endpoint');
          setMapboxToken(legacyData.token);
          return;
        }
        
        console.error('No Mapbox token returned from either API endpoint');
        setError('Could not load Mapbox token. Please check your environment configuration.');
      } catch (err) {
        console.error('Error fetching Mapbox token:', err);
        setError('Failed to load map services. Please try again later.');
      }
    };

    fetchMapboxToken();
  }, []);
  
  // Fetch ArcGIS services
  useEffect(() => {
    const fetchArcGISServices = async () => {
      try {
        console.log('Fetching ArcGIS services...');
        // First try the new endpoint
        try {
          const response = await fetch('/api/map-services/arcgis-services');
          const data = await response.json();
          
          if (data && data.services) {
            console.log('Successfully fetched ArcGIS services from new endpoint');
            console.log('Found', data.services.length, 'services for sidebar');
            setServiceList(data.services);
            return;
          }
        } catch (error) {
          console.warn('Failed to fetch from new endpoint, trying legacy endpoint', error);
        }
        
        // If the new endpoint fails, try a legacy endpoint if it exists
        try {
          const legacyResponse = await fetch('/api/arcgis-services');
          const legacyData = await legacyResponse.json();
          
          if (legacyData && legacyData.services) {
            console.log('Successfully fetched ArcGIS services from legacy endpoint');
            console.log('Found', legacyData.services.length, 'services for sidebar');
            setServiceList(legacyData.services);
            return;
          }
        } catch (legacyError) {
          console.warn('Legacy endpoint also failed', legacyError);
        }
        
        // If both endpoints fail, use hardcoded fallback data for development
        console.log('Using fallback ArcGIS services data');
        const fallbackServices = [
          {
            name: "Parcels_and_Assess",
            type: "MapServer",
            url: "https://services.arcgis.com/benton-county/arcgis/rest/services/Parcels_and_Assess/MapServer"
          },
          {
            name: "Streets",
            type: "MapServer",
            url: "https://services.arcgis.com/benton-county/arcgis/rest/services/Streets/MapServer"
          },
          {
            name: "Boundaries",
            type: "MapServer",
            url: "https://services.arcgis.com/benton-county/arcgis/rest/services/Boundaries/MapServer"
          }
        ];
        
        setServiceList(fallbackServices);
      } catch (err) {
        console.error('Error fetching ArcGIS services:', err);
      }
    };

    fetchArcGISServices();
  }, []);
  
  // Load ArcGIS map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    const loadMap = async () => {
      try {
        console.log('Loading ArcGIS map with:');
        console.log(`- Base map: ${baseMap}`);
        console.log(`- Layers: ${layers.join(', ')}`);
        console.log(`- Show labels: ${showLabels}`);
        console.log(`- Center: ${center}`);
        console.log(`- Zoom: ${zoom}`);
        
        // We would normally initialize the map here using ArcGIS JS API
        // For this demo, we'll just simulate the map loading
        setTimeout(() => {
          console.log('ArcGIS map loaded (simulated)');
          setMapLoaded(true);
        }, 1500);
        
        // Add default layers - would normally use Benton County's services
        const externalLayers = [
          {
            id: 'parcels-layer-base',
            name: 'Parcels and Assessor Data',
            serviceName: 'Parcels_and_Assess',
            serviceType: 'MapServer',
            layerId: 0,
            visible: true,
            opacity: 1,
            isBaseLayer: true
          }
        ];
        
        console.log('External layers provided:', externalLayers);
        
        // Check if Parcels layer should be auto-loaded
        if (externalLayers.some(layer => layer.serviceName === 'Parcels_and_Assess')) {
          console.log('External layers provided, skipping auto-load of Parcels layer');
        } else {
          // Would normally load the Parcels layer here
        }
        
      } catch (err) {
        console.error('Error loading ArcGIS map:', err);
        setError('Failed to load the map. Please try again later.');
      }
    };
    
    loadMap();
    
    return () => {
      console.log('Cleaning up ArcGIS map');
    };
  }, [baseMap, center, layers, showLabels, zoom]);
  
  // Update layers when they change
  useEffect(() => {
    if (!mapLoaded) return;
    
    // In a real implementation, this would update the map layers
    // For now, we'll skip this since we don't have a real map
  }, [layers, mapLoaded]);
  
  // Update opacity when it changes
  useEffect(() => {
    if (!mapLoaded) return;
    
    // In a real implementation, this would update layer opacity
    // For now, we'll skip this since we don't have a real map
  }, [opacity, mapLoaded]);
  
  // Update base map when it changes
  useEffect(() => {
    if (!mapLoaded) return;
    
    // In a real implementation, this would update the base map
    // For now, we'll skip this since we don't have a real map
  }, [baseMap, mapLoaded]);
  
  return (
    <div 
      className={cn(
        "relative w-full h-full bg-neutral-100", 
        className
      )}
      data-testid="arcgis-map"
    >
      <div 
        ref={mapContainerRef} 
        className="w-full h-full"
        style={{
          backgroundColor: '#e0f0ff', // Light blue background for demonstration
          backgroundImage: "url('https://maps.arcgis.com/sharing/rest/content/items/8d7cc6d37a4a4e1fb2c8d4c2d722ac29/resources/img/basemap-streets-navigation.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'relative'
        }}
      >
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <div className="text-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" role="status">
                <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
              </div>
              <p className="mt-4 text-sm text-primary-foreground">Loading map...</p>
            </div>
          </div>
        )}
        
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
        
        {/* Overlay to show what layers would be visible */}
        {mapLoaded && (
          <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm p-3 rounded-lg shadow-md border border-primary/20 text-sm max-w-xs">
            <h3 className="font-medium mb-1.5">Current Map Settings</h3>
            <div className="space-y-1">
              <p><span className="font-medium">Base Map:</span> {baseMap}</p>
              <p><span className="font-medium">Visible Layers:</span></p>
              <ul className="pl-4 list-disc">
                {layers.map(layer => (
                  <li key={layer}>{layer}</li>
                ))}
              </ul>
              <p><span className="font-medium">Labels:</span> {showLabels ? 'On' : 'Off'}</p>
            </div>
          </div>
        )}
        
        {/* Mock Benton County overlay */}
        <div className="absolute top-4 left-4 bg-primary-foreground px-3 py-1.5 rounded-md shadow-md text-sm font-medium text-primary">
          Benton County, Oregon
        </div>
      </div>
    </div>
  );
};

export { ArcGISMapComponent };