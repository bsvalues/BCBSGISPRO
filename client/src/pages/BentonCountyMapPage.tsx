import React, { useState, useEffect } from 'react';
import ModernLayout from '../components/layout/modern-layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { 
  Layers, Map as MapIcon, FileSearch, ZoomIn, ZoomOut, Home, 
  PenTool, Download, Share2, RotateCw, Database, Globe,
  FileType, FileSpreadsheet, Maximize2
} from 'lucide-react';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { cn } from '../lib/utils';
import BentonCountyMap from '../components/maps/benton-county-map';
import { useTitle } from '../hooks/use-title';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { useToast } from '../hooks/use-toast';

/**
 * Benton County Map Page
 * 
 * This page displays the Benton County GIS data using our custom map component.
 * It integrates authentic parcel, short plat, and long plat data from Benton County.
 */
export default function BentonCountyMapPage() {
  const [activeTab, setActiveTab] = useState('map');
  const [loading, setLoading] = useState(false);
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/streets-v11');
  const [showParcels, setShowParcels] = useState(true);
  const [showShortPlats, setShowShortPlats] = useState(false);
  const [showLongPlats, setShowLongPlats] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<any>(null);
  const { toast } = useToast();
  
  useTitle('Benton County GIS | BentonGeoPro');

  // Simulate loading state for demonstration
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);
  
  // Handle parcel selection
  const handleParcelClick = (properties: any) => {
    setSelectedParcel(properties);
    toast({
      title: 'Parcel Selected',
      description: `Selected parcel ${properties.APN || 'Unknown APN'}`,
    });
  };

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
            <Button variant="outline" size="sm" className="w-8 h-8 p-0">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="w-8 h-8 p-0">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="w-8 h-8 p-0">
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
                  <p className="text-primary font-medium">Loading Benton County GIS Data...</p>
                </div>
              </div>
            ) : (
              /* Render the Benton County map component */
              <div className="h-full w-full relative">
                <BentonCountyMap 
                  style={mapStyle} 
                  showParcels={showParcels}
                  showShortPlats={showShortPlats}
                  showLongPlats={showLongPlats}
                  onParcelClick={handleParcelClick}
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur shadow-md rounded-md p-3 max-w-xs">
                  <h3 className="text-sm font-medium mb-1">Benton County Assessor GIS</h3>
                  <p className="text-xs text-gray-500">
                    Explore authentic Benton County property data. Click on a parcel to view details.
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Side Panel */}
          <div className="w-80 border-l bg-white overflow-y-auto">
            <Tabs defaultValue="layers">
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
                <h3 className="font-medium text-lg mb-3">Benton County GIS Layers</h3>
                <div className="space-y-3">
                  {/* Layer Toggles */}
                  <div className="flex items-center justify-between space-x-2">
                    <div className="flex flex-col space-y-1">
                      <Label htmlFor="parcels-toggle" className="font-medium">Parcels</Label>
                      <p className="text-xs text-muted-foreground">Property boundaries from Assessor's office</p>
                    </div>
                    <Switch
                      id="parcels-toggle"
                      checked={showParcels}
                      onChange={(e) => setShowParcels(e.target.checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between space-x-2">
                    <div className="flex flex-col space-y-1">
                      <Label htmlFor="short-plats-toggle" className="font-medium">Short Plats</Label>
                      <p className="text-xs text-muted-foreground">Subdivision records for smaller developments</p>
                    </div>
                    <Switch
                      id="short-plats-toggle"
                      checked={showShortPlats}
                      onCheckedChange={setShowShortPlats}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between space-x-2">
                    <div className="flex flex-col space-y-1">
                      <Label htmlFor="long-plats-toggle" className="font-medium">Long Plats</Label>
                      <p className="text-xs text-muted-foreground">Subdivision records for larger developments</p>
                    </div>
                    <Switch
                      id="long-plats-toggle"
                      checked={showLongPlats}
                      onCheckedChange={setShowLongPlats}
                    />
                  </div>
                  
                  <div className="pt-2 border-t mt-4">
                    <h4 className="font-medium mb-2">Source Information</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      All GIS data layers are directly from Benton County Assessor's Office ArcGIS services.
                    </p>
                    <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                      <a
                        href="https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1"
                      >
                        <FileType className="h-3 w-3" />
                        View ArcGIS Services
                      </a>
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="data" className="p-4">
                <h3 className="font-medium text-lg mb-3">Parcel Data</h3>
                
                {selectedParcel ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Selected Parcel</h4>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-xs flex items-center gap-1">
                            <Maximize2 className="h-3 w-3" />
                            Full Data
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Parcel Data</DialogTitle>
                            <DialogDescription>
                              Complete data for parcel {selectedParcel.APN || 'Unknown'}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="mt-4 text-sm space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(selectedParcel).map(([key, value]) => (
                                <div key={key} className="border-b pb-1">
                                  <span className="font-medium text-xs">{key}:</span>{" "}
                                  <span className="text-xs">{value as string}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    <Card className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">APN</p>
                            <p>{selectedParcel.APN || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Situs Address</p>
                            <p>{selectedParcel.SITUS_ADDRESS || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Owner Name</p>
                            <p>{selectedParcel.OWNER_NAME || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Acreage</p>
                            <p>{selectedParcel.ACREAGE || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Land Value</p>
                            <p>{selectedParcel.LAND_VALUE ? `$${selectedParcel.LAND_VALUE}` : 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Total Value</p>
                            <p>{selectedParcel.TOTAL_VALUE ? `$${selectedParcel.TOTAL_VALUE}` : 'N/A'}</p>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs font-medium text-muted-foreground">Legal Description</p>
                          <p className="text-xs mt-1">{selectedParcel.LEGAL_DESC || 'No legal description available'}</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 text-xs flex items-center justify-center gap-1">
                        <FileSpreadsheet className="h-3 w-3" />
                        Export Data
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 text-xs flex items-center justify-center gap-1">
                        <PenTool className="h-3 w-3" />
                        Draw Parcel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>Click on a parcel on the map to view its details</p>
                  </div>
                )}
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