import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../../lib/utils';

interface ArcGISMapProps {
  layers?: string[];
  opacity?: number;
  showLabels?: boolean;
  baseMap?: string;
  className?: string;
  center?: [number, number];
  zoom?: number;
}

const ArcGISMap: React.FC<ArcGISMapProps> = ({
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
  
  // Mock loading state for demonstration
  useEffect(() => {
    const timer = setTimeout(() => {
      setMapLoaded(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // In a real implementation, this would load the ArcGIS API
  // and create a map with the specified layers
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // This is where you would use the ArcGIS API to create a map
    // For now, this is just a mock implementation
    
    const loadMap = async () => {
      try {
        // Would normally load ArcGIS API and initialize map
        console.log('Loading ArcGIS map with:');
        console.log(`- Base map: ${baseMap}`);
        console.log(`- Layers: ${layers.join(', ')}`);
        console.log(`- Show labels: ${showLabels}`);
        console.log(`- Center: ${center}`);
        console.log(`- Zoom: ${zoom}`);
        
        // Simulate map loading success
        setMapLoaded(true);
      } catch (err) {
        console.error('Error loading ArcGIS map:', err);
        setError('Failed to load the map. Please try again later.');
      }
    };
    
    loadMap();
    
    // Cleanup function
    return () => {
      // Would normally destroy the map instance
      console.log('Cleaning up ArcGIS map');
    };
  }, [baseMap, center, layers, showLabels, zoom]);
  
  // Update layers when they change
  useEffect(() => {
    if (!mapLoaded) return;
    
    console.log('Updating map layers:', layers);
    // In a real implementation, this would update the map layers
  }, [layers, mapLoaded]);
  
  // Update opacity when it changes
  useEffect(() => {
    if (!mapLoaded) return;
    
    console.log('Updating layer opacity:', opacity);
    // In a real implementation, this would update layer opacity
  }, [opacity, mapLoaded]);
  
  // Update base map when it changes
  useEffect(() => {
    if (!mapLoaded) return;
    
    console.log('Updating base map:', baseMap);
    // In a real implementation, this would update the base map
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

// Export both as default and named export to fix import issues
export default ArcGISMap;
export { ArcGISMap };