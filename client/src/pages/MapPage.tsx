import React, { useState, useEffect } from 'react';
import ModernLayout from '../components/layout/modern-layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { 
  Layers, Map as MapIcon, FileSearch, ZoomIn, ZoomOut, Home, 
  PenTool, Download, Share2, RotateCw, Database, Globe
} from 'lucide-react';
import { cn } from '../lib/utils';
import MapboxMap from '../components/maps/mapbox-map';

/**
 * Map Page Component - The focal point of the application
 */
export default function MapPage() {
  const [activeTab, setActiveTab] = useState('map');
  const [loading, setLoading] = useState(false);
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/streets-v11');

  // Simulate loading state for demonstration
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ModernLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Main Toolbar */}
        <div className="bg-white border-b p-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Layers className="h-4 w-4" />
              <span>Layers</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <PenTool className="h-4 w-4" />
              <span>Draw</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <FileSearch className="h-4 w-4" />
              <span>Search</span>
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Home className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </Button>
          </div>
        </div>
        
        {/* Map Container and Side Panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Map View */}
          <div className="flex-1 bg-gray-100 relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                <div className="flex flex-col items-center">
                  <RotateCw className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p className="text-primary font-medium">Loading Map...</p>
                </div>
              </div>
            ) : (
              /* Render the actual Mapbox map component */
              <div className="h-full w-full relative">
                <MapboxMap style={mapStyle} />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur shadow-md rounded-md p-3 max-w-xs">
                  <h3 className="text-sm font-medium mb-1">Benton County, Washington</h3>
                  <p className="text-xs text-gray-500">
                    Explore property parcels and assessment data using the tools in the toolbar.
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Side Panel */}
          <div className="w-80 border-l bg-white overflow-y-auto">
            <Tabs defaultValue="layers" className="w-full">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="layers" className="flex items-center gap-1">
                  <Layers className="h-4 w-4" />
                  <span>Layers</span>
                </TabsTrigger>
                <TabsTrigger value="data" className="flex items-center gap-1">
                  <Database className="h-4 w-4" />
                  <span>Data</span>
                </TabsTrigger>
                <TabsTrigger value="basemap" className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  <span>Basemap</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="layers" className="p-4">
                <h3 className="font-medium text-lg mb-3">Map Layers</h3>
                <div className="space-y-2">
                  {['Parcels', 'Buildings', 'Roads', 'Zoning', 'Floodplains'].map((layer, i) => (
                    <LayerItem key={i} name={layer} active={i < 3} />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="data" className="p-4">
                <h3 className="font-medium text-lg mb-3">Data Sources</h3>
                <div className="space-y-2">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium">Parcel Data</h4>
                      <p className="text-sm text-gray-500">
                        County assessor's parcel database with property information.
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium">Imagery</h4>
                      <p className="text-sm text-gray-500">
                        Satellite and aerial imagery from multiple time periods.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="basemap" className="p-4">
                <h3 className="font-medium text-lg mb-3">Basemap Selection</h3>
                <div className="grid grid-cols-2 gap-2">
                  <BasemapOption 
                    name="Streets" 
                    active={mapStyle === 'mapbox://styles/mapbox/streets-v11'} 
                    style="mapbox://styles/mapbox/streets-v11"
                    onClick={setMapStyle}
                  />
                  <BasemapOption 
                    name="Satellite" 
                    active={mapStyle === 'mapbox://styles/mapbox/satellite-v9'} 
                    style="mapbox://styles/mapbox/satellite-v9"
                    onClick={setMapStyle}
                  />
                  <BasemapOption 
                    name="Outdoors" 
                    active={mapStyle === 'mapbox://styles/mapbox/outdoors-v12'} 
                    style="mapbox://styles/mapbox/outdoors-v12"
                    onClick={setMapStyle}
                  />
                  <BasemapOption 
                    name="Light" 
                    active={mapStyle === 'mapbox://styles/mapbox/light-v11'} 
                    style="mapbox://styles/mapbox/light-v11"
                    onClick={setMapStyle}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        {/* Status Bar */}
        <div className="bg-gray-100 border-t px-4 py-1 text-sm text-gray-600 flex justify-between">
          <div>Coordinates: 46.2587° N, 119.2984° W</div>
          <div>Scale: 1:10,000</div>
          <div>Benton County, WA</div>
        </div>
      </div>
    </ModernLayout>
  );
}

// Layer item component
function LayerItem({ name, active = false }: { name: string; active?: boolean }) {
  return (
    <div className={cn(
      "p-3 border rounded-md flex items-center justify-between",
      active ? "border-primary/30 bg-primary/5" : "border-gray-200"
    )}>
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-4 h-4 rounded-sm border flex items-center justify-center",
          active ? "bg-primary border-primary" : "border-gray-300"
        )}>
          {active && <div className="w-2 h-2 bg-white rounded-sm"></div>}
        </div>
        <span className={active ? "font-medium" : ""}>{name}</span>
      </div>
      <Button variant="ghost" size="icon" className="h-7 w-7">
        <Layers className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Basemap option component
interface BasemapOptionProps {
  name: string;
  active?: boolean;
  style: string;
  onClick: (style: string) => void;
  thumbnail?: string;
}

function BasemapOption({ 
  name, 
  active = false, 
  style,
  onClick,
  thumbnail = 'bg-gray-200' 
}: BasemapOptionProps) {
  return (
    <div 
      className={cn(
        "p-3 border rounded-md text-center cursor-pointer hover:border-primary/70 transition-colors",
        active ? "border-primary bg-primary/5 text-primary" : "border-gray-200"
      )}
      onClick={() => onClick(style)}
    >
      <div className={`h-12 rounded mb-2 ${thumbnail !== 'bg-gray-200' ? '' : thumbnail}`}>
        {thumbnail !== 'bg-gray-200' && (
          <img src={thumbnail} alt={name} className="h-full w-full object-cover rounded" />
        )}
      </div>
      <span className={active ? "font-medium" : ""}>{name}</span>
    </div>
  );
}