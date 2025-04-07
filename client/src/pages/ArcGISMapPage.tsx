import React, { useEffect, useState, useRef } from 'react';
import { ArcGISMap, ArcGISControls, ArcGISLayer, ArcGISSketch } from '../components/maps/arcgis';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const basemapOptions = [
  { value: 'topo-vector', label: 'Topographic' },
  { value: 'satellite', label: 'Satellite' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'streets-vector', label: 'Streets' },
  { value: 'gray-vector', label: 'Gray' },
  { value: 'osm', label: 'OpenStreetMap' },
  { value: 'terrain', label: 'Terrain' }
];

// For demo purposes, some interesting ESRI feature service URLs
const layerOptions = [
  { 
    value: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_Counties/FeatureServer/0', 
    label: 'USA Counties',
    type: 'feature'
  },
  { 
    value: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_Major_Cities/FeatureServer/0', 
    label: 'USA Major Cities',
    type: 'feature'
  },
  { 
    value: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_Parks/FeatureServer/0', 
    label: 'USA Parks',
    type: 'feature'
  },
  { 
    value: 'https://tiles.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_States_Generalized/MapServer', 
    label: 'USA States',
    type: 'tile'
  }
];

// Oregon/Benton County specific layers
const oregonLayers = [
  {
    value: 'https://services.arcgis.com/uUvqNMGPm7axC2dD/ArcGIS/rest/services/Oregon_Counties/FeatureServer/0',
    label: 'Oregon Counties',
    type: 'feature'
  },
  {
    value: 'https://services.arcgis.com/uUvqNMGPm7axC2dD/ArcGIS/rest/services/Oregon_City_Limits/FeatureServer/0',
    label: 'Oregon City Limits',
    type: 'feature'
  },
  {
    value: 'https://services.arcgis.com/uUvqNMGPm7axC2dD/ArcGIS/rest/services/Oregon_Tax_Lots/FeatureServer/0',
    label: 'Oregon Tax Lots',
    type: 'feature'
  }
];

const ArcGISMapPage: React.FC = () => {
  const [mapView, setMapView] = useState<__esri.MapView | null>(null);
  const [map, setMap] = useState<__esri.Map | null>(null);
  const [basemap, setBasemap] = useState('topo-vector');
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({});
  const [layerOpacity, setLayerOpacity] = useState<Record<string, number>>({});
  const [showControls, setShowControls] = useState(true);
  const [showSketch, setShowSketch] = useState(false);
  const [activeTab, setActiveTab] = useState('layers');
  
  // Store added layers for reference
  const layersRef = useRef<Record<string, {url: string, type: string}>>({});

  const handleMapLoaded = (view: __esri.MapView, esriMap: __esri.Map) => {
    console.log('ArcGIS map loaded successfully');
    setMapView(view);
    setMap(esriMap);
  };

  const toggleLayer = (layerUrl: string, layerType: string) => {
    setActiveLayers(prev => {
      const newState = { ...prev };
      newState[layerUrl] = !prev[layerUrl];
      
      // Add to reference if toggled on and not already present
      if (newState[layerUrl] && !layersRef.current[layerUrl]) {
        layersRef.current[layerUrl] = { url: layerUrl, type: layerType };
        // Initialize opacity
        setLayerOpacity(prev => ({
          ...prev,
          [layerUrl]: 1
        }));
      }
      
      return newState;
    });
  };

  const handleOpacityChange = (layerUrl: string, value: number) => {
    setLayerOpacity(prev => ({
      ...prev,
      [layerUrl]: value / 100
    }));
  };

  return (
    <div className="flex flex-col w-full h-screen">
      <div className="flex p-4 bg-background shadow-md z-10">
        <h1 className="text-2xl font-bold">ArcGIS Map Integration</h1>
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch 
              id="controls-switch"
              checked={showControls}
              onCheckedChange={setShowControls}
            />
            <Label htmlFor="controls-switch">Map Controls</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="sketch-switch"
              checked={showSketch}
              onCheckedChange={setShowSketch}
            />
            <Label htmlFor="sketch-switch">Sketch Tools</Label>
          </div>
          
          <Select value={basemap} onValueChange={setBasemap}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select basemap" />
            </SelectTrigger>
            <SelectContent>
              {basemapOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex-1 flex">
        <div className="flex-1 relative">
          <ArcGISMap 
            className="w-full h-full" 
            basemap={basemap}
            center={[-123.262, 44.571]} // Benton County, OR approximate coordinates
            zoom={10}
            onMapLoaded={handleMapLoaded}
          >
            {/* Map Controls */}
            {mapView && showControls && (
              <ArcGISControls 
                view={mapView}
                enableHome
                enableZoom
                enableSearch
                enableBasemapGallery
                enableLayerList
                enableLegend
                position="top-right"
              />
            )}
            
            {/* Sketch Tools */}
            {mapView && showSketch && (
              <ArcGISSketch 
                view={mapView}
                onSketchComplete={(geometry) => {
                  console.log('Sketch completed:', geometry);
                }}
              />
            )}
            
            {/* Dynamic Layers */}
            {mapView && Object.entries(activeLayers).map(([url, active]) => {
              if (!active) return null;
              const layerInfo = layersRef.current[url];
              return (
                <ArcGISLayer
                  key={url}
                  view={mapView}
                  url={url}
                  type={layerInfo.type as any}
                  opacity={layerOpacity[url] || 1}
                  onLayerLoaded={(layer) => {
                    console.log(`Layer loaded: ${url}`);
                  }}
                />
              );
            })}
          </ArcGISMap>
        </div>
        
        {/* Control Panel */}
        <Card className="w-96 h-full rounded-none border-l shadow-none overflow-auto">
          <CardHeader className="px-4 py-3">
            <CardTitle>Map Configuration</CardTitle>
            <CardDescription>
              Manage map layers and settings
            </CardDescription>
          </CardHeader>
          
          <Tabs defaultValue="layers" value={activeTab} onValueChange={setActiveTab}>
            <div className="px-4">
              <TabsList className="w-full">
                <TabsTrigger value="layers" className="flex-1">Layers</TabsTrigger>
                <TabsTrigger value="oregon" className="flex-1">Oregon</TabsTrigger>
                <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="layers" className="m-0">
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {layerOptions.map(layer => (
                    <div key={layer.value} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id={`layer-${layer.value}`}
                            checked={!!activeLayers[layer.value]}
                            onCheckedChange={() => toggleLayer(layer.value, layer.type)}
                          />
                          <Label htmlFor={`layer-${layer.value}`}>{layer.label}</Label>
                        </div>
                        <span className="text-xs text-muted-foreground">{layer.type}</span>
                      </div>
                      
                      {activeLayers[layer.value] && (
                        <div className="pl-6 pr-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs">Opacity</span>
                            <span className="text-xs">{Math.round((layerOpacity[layer.value] || 1) * 100)}%</span>
                          </div>
                          <Slider
                            value={[(layerOpacity[layer.value] || 1) * 100]}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={([value]) => handleOpacityChange(layer.value, value)}
                          />
                        </div>
                      )}
                      <Separator className="my-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </TabsContent>
            
            <TabsContent value="oregon" className="m-0">
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {oregonLayers.map(layer => (
                    <div key={layer.value} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id={`layer-${layer.value}`}
                            checked={!!activeLayers[layer.value]}
                            onCheckedChange={() => toggleLayer(layer.value, layer.type)}
                          />
                          <Label htmlFor={`layer-${layer.value}`}>{layer.label}</Label>
                        </div>
                        <span className="text-xs text-muted-foreground">{layer.type}</span>
                      </div>
                      
                      {activeLayers[layer.value] && (
                        <div className="pl-6 pr-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs">Opacity</span>
                            <span className="text-xs">{Math.round((layerOpacity[layer.value] || 1) * 100)}%</span>
                          </div>
                          <Slider
                            value={[(layerOpacity[layer.value] || 1) * 100]}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={([value]) => handleOpacityChange(layer.value, value)}
                          />
                        </div>
                      )}
                      <Separator className="my-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </TabsContent>
            
            <TabsContent value="settings" className="m-0">
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="custom-layer-url">Custom Layer URL</Label>
                    <div className="flex mt-1 gap-2">
                      <Input id="custom-layer-url" placeholder="https://services.arcgis.com/..." />
                      <Button variant="secondary" onClick={() => {
                        const input = document.getElementById('custom-layer-url') as HTMLInputElement;
                        if (input.value) {
                          toggleLayer(input.value, 'feature');
                          input.value = '';
                        }
                      }}>Add</Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter a valid ArcGIS service URL to add as a layer
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Map Controls</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="enableZoom" defaultChecked />
                        <Label htmlFor="enableZoom">Zoom</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="enableHome" defaultChecked />
                        <Label htmlFor="enableHome">Home</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="enableSearch" defaultChecked />
                        <Label htmlFor="enableSearch">Search</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="enableLegend" defaultChecked />
                        <Label htmlFor="enableLegend">Legend</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="enableBasemapGallery" defaultChecked />
                        <Label htmlFor="enableBasemapGallery">Basemap Gallery</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="enableLayerList" defaultChecked />
                        <Label htmlFor="enableLayerList">Layer List</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
          
          <CardFooter className="px-4 py-3 flex justify-between">
            <Button variant="outline" onClick={() => {
              setActiveLayers({});
              layersRef.current = {};
              setLayerOpacity({});
            }}>Clear All Layers</Button>
            <Button onClick={() => {
              // Zoom to Benton County
              if (mapView) {
                mapView.goTo({
                  center: [-123.262, 44.571],
                  zoom: 10
                });
              }
            }}>Reset View</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ArcGISMapPage;