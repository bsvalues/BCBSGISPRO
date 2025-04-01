import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { EnhancedMapViewer } from '@/components/maps/enhanced-map-viewer';
import { EnhancedLayerControl } from '@/components/maps/enhanced-layer-control';
import { GeoJSONFeature, MapLayerType } from '@/lib/map-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  Search, 
  Map, 
  MapPin, 
  Info,
  FileDown,
  FileUp,
  Layers as LayersIcon
} from 'lucide-react';

export default function MapViewerPage() {
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const [mapFeatures, setMapFeatures] = useState<GeoJSONFeature[]>([]);
  const [mapLayers, setMapLayers] = useState<any[]>([]);
  
  // Simulated data loading
  useEffect(() => {
    // In a real application, this would fetch layers from the server
    const mockLayers = [
      {
        name: "Parcels",
        data: {
          type: "FeatureCollection",
          features: []
        },
        style: {
          color: "#3B82F6",
          weight: 2,
          fillOpacity: 0.2,
          fillColor: "#93C5FD"
        }
      },
      {
        name: "Zoning",
        data: {
          type: "FeatureCollection",
          features: []
        },
        style: {
          color: "#10B981",
          weight: 1,
          fillOpacity: 0.2,
          fillColor: "#6EE7B7"
        }
      }
    ];
    
    setMapLayers(mockLayers);
  }, []);
  
  // Handle parcel selection
  const handleParcelSelect = (parcelId: string) => {
    setSelectedParcelId(parcelId);
    // In a real app, we would fetch the parcel details from the server
  };
  
  // Handle map features changed
  const handleFeaturesChanged = (features: GeoJSONFeature[]) => {
    setMapFeatures(features);
    console.log('Map features changed:', features);
    // In a real app, we might sync these with the server
  };
  
  // Handle export to shapefile
  const handleExportShapefile = () => {
    alert('In a production app, this would export the current features as a shapefile');
    // In a real application, we would call an API to convert GeoJSON to Shapefile
  };
  
  // Handle import from shapefile
  const handleImportShapefile = () => {
    alert('In a production app, this would open a file picker for shapefile import');
    // In a real application, we would handle file upload and conversion
  };
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar className="h-full" />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold">Map Viewer</h1>
              <p className="text-gray-500">View and analyze geographical data</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input 
                  className="pl-8" 
                  placeholder="Search for parcel, owner, or address..."
                />
              </div>
              <Button variant="outline" className="gap-1" onClick={handleExportShapefile}>
                <FileDown size={18} /> Export
              </Button>
              <Button variant="outline" className="gap-1" onClick={handleImportShapefile}>
                <FileUp size={18} /> Import
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-12 gap-4">
            {/* Main map area */}
            <div className="col-span-9">
              <Card className="h-[calc(100vh-180px)]">
                <CardContent className="p-0 h-full">
                  <EnhancedMapViewer 
                    height="100%" 
                    width="100%"
                    mapLayers={mapLayers}
                    initialFeatures={[]}
                    onFeaturesChanged={handleFeaturesChanged}
                    onParcelSelect={handleParcelSelect}
                  />
                </CardContent>
              </Card>
            </div>
            
            {/* Sidebar with property details and layers */}
            <div className="col-span-3">
              <Tabs defaultValue="property" className="h-[calc(100vh-180px)]">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="property" className="flex items-center gap-1">
                    <MapPin size={16} /> Property
                  </TabsTrigger>
                  <TabsTrigger value="layers" className="flex items-center gap-1">
                    <LayersIcon size={16} /> Layers
                  </TabsTrigger>
                  <TabsTrigger value="info" className="flex items-center gap-1">
                    <Info size={16} /> Info
                  </TabsTrigger>
                </TabsList>
                
                {/* Property tab */}
                <TabsContent value="property" className="h-[calc(100%-40px)] overflow-y-auto">
                  <Card>
                    {selectedParcelId ? (
                      <>
                        <CardHeader>
                          <CardTitle>Parcel Details</CardTitle>
                          <CardDescription>
                            Parcel ID: {selectedParcelId}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-xs font-medium text-gray-500">Owner</Label>
                              <p className="text-sm font-medium">John Smith</p>
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-gray-500">Address</Label>
                              <p className="text-sm font-medium">123 Main St, Kennewick, WA 99336</p>
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-gray-500">Area</Label>
                              <p className="text-sm font-medium">2.45 acres (10,724 sq ft)</p>
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-gray-500">Zoning</Label>
                              <p className="text-sm font-medium">Residential (R-1)</p>
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-gray-500">Assessed Value</Label>
                              <p className="text-sm font-medium">$245,000</p>
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-gray-500">Last Updated</Label>
                              <p className="text-sm font-medium">Jan 15, 2024</p>
                            </div>
                            
                            <Separator />
                            
                            <div className="grid grid-cols-2 gap-2 pt-2">
                              <Button variant="secondary" className="w-full gap-1">
                                <Map size={16} /> View Details
                              </Button>
                              <Button variant="secondary" className="w-full gap-1">
                                <FileDown size={16} /> Export
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </>
                    ) : (
                      <CardContent className="flex flex-col items-center justify-center h-64 text-center p-6">
                        <MapPin className="text-gray-400 mb-2" size={40} />
                        <p className="text-gray-500 mb-1">No parcel selected</p>
                        <p className="text-xs text-gray-400">Click on a parcel on the map to see its details</p>
                      </CardContent>
                    )}
                  </Card>
                </TabsContent>
                
                {/* Layers tab */}
                <TabsContent value="layers" className="h-[calc(100%-40px)] overflow-y-auto">
                  <EnhancedLayerControl />
                </TabsContent>
                
                {/* Info tab */}
                <TabsContent value="info" className="h-[calc(100%-40px)] overflow-y-auto">
                  <Card>
                    <CardHeader>
                      <CardTitle>Map Information</CardTitle>
                      <CardDescription>
                        Map status and statistics
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-xs font-medium text-gray-500">Current Features</Label>
                          <p className="text-sm font-medium">{mapFeatures.length} features</p>
                        </div>
                        
                        <div>
                          <Label className="text-xs font-medium text-gray-500">Map View</Label>
                          <p className="text-sm font-medium">Benton County, WA</p>
                        </div>
                        
                        <div>
                          <Label className="text-xs font-medium text-gray-500">Data Updated</Label>
                          <p className="text-sm font-medium">January 15, 2025</p>
                        </div>
                        
                        <div>
                          <Label className="text-xs font-medium text-gray-500">Sources</Label>
                          <ul className="text-sm pl-5 mt-1 list-disc space-y-1">
                            <li>Benton County GIS</li>
                            <li>USGS Topographic Data</li>
                            <li>WA State Department of Transportation</li>
                          </ul>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <Label className="text-xs font-medium text-gray-500">Legend</Label>
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-[#3B82F6] opacity-50"></div>
                              <span className="text-xs">Parcels</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-[#10B981] opacity-50"></div>
                              <span className="text-xs">Zoning Districts</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-[#6B7280] opacity-80"></div>
                              <span className="text-xs">Streets</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-[#2563EB] opacity-50"></div>
                              <span className="text-xs">Hydrology</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}