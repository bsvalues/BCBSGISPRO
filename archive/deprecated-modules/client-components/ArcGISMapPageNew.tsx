import React, { useState } from 'react';
import MapLayout from '../components/layout/MapLayout';
import MapToolbar from '../components/maps/MapToolbar';
import MapSidebar from '../components/maps/MapSidebar';
import { ArcGISMapComponent } from '../components/maps/arcgis/arcgis-map-component';
import { useToggle } from '../hooks/use-toggle';
import { useMapBookmarks } from '../hooks/use-map-bookmarks';
import { Button } from '../components/ui/button';
import { TooltipProvider } from '../components/ui/tooltip';
import { useToast } from '../hooks/use-toast';
import { useLocalStorage } from '../hooks/use-local-storage';
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { Slider } from '../components/ui/slider';
import { Switch } from '../components/ui/switch';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useMapPreferences } from '../hooks/use-map-preferences';
import { useRecentlyViewed } from '../hooks/use-recently-viewed';

// Mock API layers that would normally come from ArcGIS REST API
const availableLayers = [
  { id: 'parcels', name: 'Parcels and Assessor', description: 'Property boundaries and assessor data' },
  { id: 'streets', name: 'Streets', description: 'Street centerlines and labels' },
  { id: 'boundaries', name: 'Boundaries', description: 'City and county boundary lines' },
  { id: 'zoning', name: 'Zoning Districts', description: 'Zoning and land use classifications' },
  { id: 'terrain', name: 'Terrain', description: 'Elevation and terrain data' },
  { id: 'aerial', name: 'Aerial Imagery 2023', description: 'Recent aerial photography' },
  { id: 'utilities', name: 'Utility Networks', description: 'Water, sewer, and electric networks' },
  { id: 'flood', name: 'Flood Zones', description: 'FEMA flood hazard areas' }
];

// Base maps
const baseMaps = [
  { id: 'streets', name: 'Streets' },
  { id: 'satellite', name: 'Satellite' },
  { id: 'topo', name: 'Topographic' },
  { id: 'gray', name: 'Light Gray' }
];

const ArcGISMapPageNew: React.FC = () => {
  const { toast } = useToast();
  const [sidebarOpen, toggleSidebar] = useToggle(true);
  const { preferences, toggleLayer, updatePreferences, setLayerOpacity } = useMapPreferences();
  const { bookmarks, addBookmark } = useMapBookmarks();
  const { recentItems, addRecentItem } = useRecentlyViewed();
  const [tool, setTool] = useState<string>('select');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  
  // Handle tool selection
  const handleToolChange = (newTool: string) => {
    setTool(newTool);
    toast({
      title: `${newTool.charAt(0).toUpperCase() + newTool.slice(1)} Tool`,
      description: `${newTool.charAt(0).toUpperCase() + newTool.slice(1)} tool activated`,
      variant: 'default',
    });
  };
  
  // Add a fake bookmark
  const handleAddBookmark = () => {
    addBookmark({
      name: `Location ${(Math.random() * 100).toFixed(0)}`,
      description: 'Interesting property in Benton County',
      center: [-123.2, 44.5],
      zoom: 15
    });
    
    toast({
      title: 'Bookmark Added',
      description: 'Current location has been saved to your bookmarks',
      variant: 'default'
    });
  };
  
  // Add a fake recently viewed parcel
  const handleAddRecentParcel = () => {
    addRecentItem({
      id: `P-${(Math.random() * 10000).toFixed(0)}`,
      address: `${(Math.random() * 1000).toFixed(0)} Main St`,
      owner: 'Sample Owner',
      coordinates: [-123.2, 44.5]
    });
    
    toast({
      title: 'Parcel Viewed',
      description: 'Parcel added to recently viewed list',
      variant: 'default'
    });
  };
  
  return (
    <TooltipProvider>
      <MapLayout
        toolbar={<MapToolbar onToolChange={handleToolChange} onViewToggle={setViewMode} currentView={viewMode} />}
        sidebar={<MapSidebar isOpen={sidebarOpen} onClose={toggleSidebar} />}
        onRightSidebarToggle={toggleSidebar}
        isRightSidebarOpen={sidebarOpen}
      >
        <ArcGISMapComponent 
          layers={preferences.visibleLayers}
          opacity={1} 
          showLabels={preferences.showLabels}
          baseMap={preferences.baseMap}
        />
        
        {/* Demo controls - normally these would be integrated into the map interface */}
        <div className="absolute bottom-4 left-4 z-20 p-3 bg-white/90 backdrop-blur-md rounded-lg shadow-lg border border-primary/10 max-w-md">
          <h3 className="text-sm font-semibold mb-2">Demo Controls</h3>
          <div className="grid gap-2">
            <Button size="sm" onClick={handleAddBookmark} variant="outline">
              Add Current Location to Bookmarks
            </Button>
            <Button size="sm" onClick={handleAddRecentParcel} variant="outline">
              Save Parcel to Recently Viewed
            </Button>
            <Separator className="my-1" />
            
            <div className="grid grid-cols-2 gap-2">
              <Label className="self-center">Base Map</Label>
              <select 
                className="p-1 text-xs rounded-md border"
                value={preferences.baseMap} 
                onChange={(e) => updatePreferences({ baseMap: e.target.value })}
              >
                {baseMaps.map(map => (
                  <option key={map.id} value={map.id}>{map.name}</option>
                ))}
              </select>
              
              <Label className="self-center">Show Labels</Label>
              <Switch 
                checked={preferences.showLabels} 
                onChange={(e) => updatePreferences({ showLabels: e.target.checked })}
              />
            </div>
          </div>
        </div>
      </MapLayout>
    </TooltipProvider>
  );
};

export default ArcGISMapPageNew;