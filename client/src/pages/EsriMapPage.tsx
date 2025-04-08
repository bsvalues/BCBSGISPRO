import React, { useState, useMemo } from 'react';
import { EsriMapModule } from '@/components/maps/esri/EsriMapModule';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, Layers, Map, Settings, BookmarkIcon, EyeIcon, Download, Repeat } from 'lucide-react';
import { EsriMapModuleSettingsModel } from '@/components/maps/esri/EsriMapModuleSettings';

const EsriMapPage: React.FC = () => {
  const [showLayerList, setShowLayerList] = useState(true);
  const [showBasemapToggle, setShowBasemapToggle] = useState(true);
  const [enableSelection, setEnableSelection] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [activeTab, setActiveTab] = useState('layers');
  const [selectedBasemap, setSelectedBasemap] = useState('streets');
  const [layerVisibility, setLayerVisibility] = useState({
    parcels: true,
    zoning: false,
    streets: true,
    boundaries: true
  });
  const [layerOpacity, setLayerOpacity] = useState({
    parcels: 100,
    zoning: 70,
    streets: 90,
    boundaries: 80
  });
  const [bookmarks, setBookmarks] = useState([
    { id: 1, name: 'Downtown Corvallis', coordinates: [-123.26, 44.57], zoom: 15 },
    { id: 2, name: 'OSU Campus', coordinates: [-123.28, 44.56], zoom: 16 },
    { id: 3, name: 'Benton County Overview', coordinates: [-123.40, 44.50], zoom: 11 }
  ]);
  
  // Create Esri map settings based on ArcGIS REST services documentation
  const mapSettings: EsriMapModuleSettingsModel = useMemo(() => ({
    baseMap: {
      enableSelection: false,
      order: 0,
      visible: true,
      type: 'ESRIDynamicLayer'
    },
    baseLayers: [
      {
        name: 'Imagery',
        enableSelection: false,
        order: 0,
        visible: selectedBasemap === 'satellite',
        url: 'https://services.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/World_Imagery/MapServer',
        type: 'ESRITiledLayer',
        spatialReferenceID: 3857
      },
      {
        name: 'Street Map',
        enableSelection: false,
        order: 1,
        visible: selectedBasemap === 'streets',
        url: 'https://services.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/World_Street_Map/MapServer',
        type: 'ESRITiledLayer',
        spatialReferenceID: 3857
      }
    ],
    viewableLayers: [
      {
        name: 'Parcels',
        enableSelection: true,
        selectionLayerID: 0,
        order: 5,
        visible: layerVisibility.parcels,
        url: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/Parcels_and_Assess/FeatureServer',
        type: 'ESRIFeatureLayer'
      },
      {
        name: 'Zoning',
        enableSelection: false,
        selectionLayerID: 0,
        order: 6,
        visible: layerVisibility.zoning,
        url: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/Zoning/FeatureServer',
        type: 'ESRIFeatureLayer'
      },
      {
        name: 'Streets',
        enableSelection: false,
        selectionLayerID: 0,
        order: 3,
        visible: layerVisibility.streets,
        url: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/Streets/FeatureServer',
        type: 'ESRIFeatureLayer'
      },
      {
        name: 'Boundaries',
        enableSelection: false,
        selectionLayerID: 0,
        order: 4,
        visible: layerVisibility.boundaries,
        url: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/Boundaries/FeatureServer',
        type: 'ESRIFeatureLayer'
      }
    ],
    mapTitle: 'Benton County Assessor Office',
    autoSelectMaxRecords: 2000
  }), [selectedBasemap, layerVisibility]);

  return (
    <div className="flex flex-col w-full h-screen bg-background overflow-hidden">
      {/* Header - Transparent glass-like design */}
      <header className="w-full px-4 py-2 border-b border-primary/10 bg-background/80 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center space-x-2">
          <Map className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-medium">Benton County GIS</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="bg-background/80">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="bg-background/80">
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>
        </div>
      </header>
      
      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div 
          className={`${sidebarVisible ? 'w-72' : 'w-0'} transition-all duration-300 ease-in-out border-r border-primary/10 bg-background/80 backdrop-blur-md flex flex-col z-10`}
        >
          {sidebarVisible && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="w-full p-0 h-auto bg-transparent">
                <TabsTrigger 
                  value="layers" 
                  className="flex-1 py-3 data-[state=active]:bg-primary/10"
                >
                  <Layers className="h-4 w-4 mr-1" />
                  Layers
                </TabsTrigger>
                <TabsTrigger 
                  value="bookmarks" 
                  className="flex-1 py-3 data-[state=active]:bg-primary/10"
                >
                  <BookmarkIcon className="h-4 w-4 mr-1" />
                  Bookmarks
                </TabsTrigger>
              </TabsList>
              
              <ScrollArea className="flex-1 p-4">
                <TabsContent value="layers" className="m-0 h-full">
                  <div className="space-y-4">
                    <Card className="border-primary/10 shadow-sm">
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                          <span>Base Maps</span>
                          <EyeIcon className="h-4 w-4 text-primary" />
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <Select 
                          value={selectedBasemap}
                          onValueChange={setSelectedBasemap}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select base map" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="streets">Streets</SelectItem>
                            <SelectItem value="satellite">Satellite</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                            <SelectItem value="topo">Topographic</SelectItem>
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-primary/10 shadow-sm">
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium">Operational Layers</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Switch 
                              id="parcels" 
                              checked={layerVisibility.parcels}
                              onCheckedChange={(checked) => 
                                setLayerVisibility(prev => ({ ...prev, parcels: checked }))
                              }
                            />
                            <Label htmlFor="parcels">Parcels</Label>
                          </div>
                          <Slider 
                            value={[layerOpacity.parcels]} 
                            onValueChange={(value) => 
                              setLayerOpacity(prev => ({ ...prev, parcels: value[0] }))
                            }
                            max={100} 
                            step={1} 
                            className="w-24"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Switch 
                              id="zoning" 
                              checked={layerVisibility.zoning}
                              onCheckedChange={(checked) => 
                                setLayerVisibility(prev => ({ ...prev, zoning: checked }))
                              }
                            />
                            <Label htmlFor="zoning">Zoning</Label>
                          </div>
                          <Slider 
                            value={[layerOpacity.zoning]} 
                            onValueChange={(value) => 
                              setLayerOpacity(prev => ({ ...prev, zoning: value[0] }))
                            }
                            max={100} 
                            step={1} 
                            className="w-24"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Switch 
                              id="streets" 
                              checked={layerVisibility.streets}
                              onCheckedChange={(checked) => 
                                setLayerVisibility(prev => ({ ...prev, streets: checked }))
                              }
                            />
                            <Label htmlFor="streets">Streets</Label>
                          </div>
                          <Slider 
                            value={[layerOpacity.streets]} 
                            onValueChange={(value) => 
                              setLayerOpacity(prev => ({ ...prev, streets: value[0] }))
                            }
                            max={100} 
                            step={1} 
                            className="w-24"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Switch 
                              id="boundaries" 
                              checked={layerVisibility.boundaries}
                              onCheckedChange={(checked) => 
                                setLayerVisibility(prev => ({ ...prev, boundaries: checked }))
                              }
                            />
                            <Label htmlFor="boundaries">Boundaries</Label>
                          </div>
                          <Slider 
                            value={[layerOpacity.boundaries]} 
                            onValueChange={(value) => 
                              setLayerOpacity(prev => ({ ...prev, boundaries: value[0] }))
                            }
                            max={100} 
                            step={1} 
                            className="w-24"
                          />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-primary/10 shadow-sm">
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium">Map Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="layer-list">Show Layer List</Label>
                          <Switch 
                            id="layer-list" 
                            checked={showLayerList}
                            onCheckedChange={setShowLayerList}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="basemap-toggle">Show Basemap Toggle</Label>
                          <Switch 
                            id="basemap-toggle" 
                            checked={showBasemapToggle}
                            onCheckedChange={setShowBasemapToggle}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="selection">Enable Selection</Label>
                          <Switch 
                            id="selection" 
                            checked={enableSelection}
                            onCheckedChange={setEnableSelection}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="bookmarks" className="m-0 h-full">
                  <div className="space-y-4">
                    <Card className="border-primary/10 shadow-sm">
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium">Saved Locations</CardTitle>
                        <CardDescription>Click on a bookmark to zoom to that location</CardDescription>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="space-y-2">
                          {bookmarks.map(bookmark => (
                            <Button 
                              key={bookmark.id}
                              variant="ghost" 
                              className="w-full justify-start text-left"
                              onClick={() => console.log('Navigate to bookmark:', bookmark)}
                            >
                              <BookmarkIcon className="h-4 w-4 mr-2" />
                              {bookmark.name}
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter className="py-2 flex justify-between">
                        <Button variant="outline" size="sm">
                          <BookmarkIcon className="h-4 w-4 mr-1" />
                          Save Current View
                        </Button>
                      </CardFooter>
                    </Card>
                    
                    <Card className="border-primary/10 shadow-sm">
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium">Recently Viewed</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="space-y-2">
                          <Button variant="ghost" className="w-full justify-start text-left">
                            <Repeat className="h-4 w-4 mr-2" />
                            Parcel #4532781
                          </Button>
                          <Button variant="ghost" className="w-full justify-start text-left">
                            <Repeat className="h-4 w-4 mr-2" />
                            Downtown Area
                          </Button>
                          <Button variant="ghost" className="w-full justify-start text-left">
                            <Repeat className="h-4 w-4 mr-2" />
                            Marys Peak
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          )}
        </div>
        
        {/* Map container */}
        <div className="flex-1 relative">
          <EsriMapModule 
            showLayerList={showLayerList}
            showBasemapToggle={showBasemapToggle}
            enableSelection={enableSelection}
            settings={mapSettings}
            center={[-123.2, 44.5]} // Benton County, Oregon
            zoom={12}
            layerOpacity={layerOpacity}
          />
          
          {/* Sidebar toggle button */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm shadow-md border border-primary/10"
            onClick={() => setSidebarVisible(!sidebarVisible)}
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${!sidebarVisible ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EsriMapPage;