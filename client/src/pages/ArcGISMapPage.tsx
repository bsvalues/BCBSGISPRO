import React, { useState } from 'react';
// Use simplified ArcGIS components without direct dependency on ArcGIS JS API
import ArcGISProviderSimplified from '../components/maps/arcgis/arcgis-provider-simplified';
import ArcGISSketchSimplified from '../components/maps/arcgis/arcgis-sketch-simplified';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Layers, Map, MapPin, PenTool, FileSearch, 
  ZoomIn, ZoomOut, Home, ChevronLeft, ChevronRight 
} from 'lucide-react';

/**
 * ArcGIS Map Page Component
 * 
 * This page displays a map using ArcGIS with sketch capabilities 
 * and additional map tools.
 */
const ArcGISMapPage: React.FC = () => {
  const [selectedFeature, setSelectedFeature] = useState<any | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('layers');
  const [isSketchActive, setIsSketchActive] = useState(false);
  
  // Handle map clicks
  const handleMapClick = (e: any) => {
    console.log('Map clicked:', e);
    
    // Simulate a feature selection
    if (Math.random() > 0.5) {
      setSelectedFeature({
        id: `feature-${Math.floor(Math.random() * 1000)}`,
        type: 'parcel',
        attributes: {
          parcelNumber: `23-11-${Math.floor(Math.random() * 10)}-${Math.floor(Math.random() * 100)}-${Math.floor(Math.random() * 1000)}`,
          owner: 'Sample Owner',
          address: `${Math.floor(Math.random() * 1000)} Main Street`,
          acres: (Math.random() * 10).toFixed(2),
          zoning: 'Residential'
        },
        geometry: e.mapPoint
      });
    } else {
      setSelectedFeature(null);
    }
  };
  
  // Handle sketch completion
  const handleSketchComplete = (geometry: any) => {
    console.log('Sketch completed:', geometry);
    
    // Create a simulated selection from the sketch
    setSelectedFeature({
      id: `sketch-${Date.now()}`,
      type: 'selection',
      attributes: {
        area: `${(Math.random() * 5).toFixed(2)} acres`,
        perimeter: `${(Math.random() * 1000).toFixed(2)} ft`,
        created: new Date().toLocaleString()
      },
      geometry: geometry
    });
  };
  
  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  
  // Toggle sketch mode
  const toggleSketch = () => {
    setIsSketchActive(!isSketchActive);
  };
  
  return (
    <div className="flex h-screen w-full bg-gray-100 relative overflow-hidden">
      {/* Main map container */}
      <div className="flex-grow relative">
        {/* Map provider */}
        <ArcGISProviderSimplified
          initialViewState={{
            longitude: -123.3617,
            latitude: 44.5646,
            zoom: 12
          }}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Sketch component (conditionally rendered) */}
          {isSketchActive && (
            <ArcGISSketchSimplified
              view={undefined /* This will be populated automatically by the parent component */}
              onSketchComplete={handleSketchComplete}
              position="top-right"
            />
          )}
        </ArcGISProviderSimplified>
        
        {/* Map controls overlay */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-2">
          <Card className="p-2 bg-white/90 backdrop-blur shadow-lg">
            <div className="flex flex-col gap-1">
              <Button size="sm" variant="ghost" title="Zoom In">
                <ZoomIn size={18} />
              </Button>
              <Button size="sm" variant="ghost" title="Zoom Out">
                <ZoomOut size={18} />
              </Button>
              <Button size="sm" variant="ghost" title="Home">
                <Home size={18} />
              </Button>
            </div>
          </Card>
        </div>
        
        {/* Map tools */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
          <Card className="p-2 bg-white/90 backdrop-blur shadow-lg">
            <div className="flex items-center gap-1">
              <Button 
                size="sm" 
                variant={isSketchActive ? "default" : "ghost"} 
                onClick={toggleSketch}
                title="Drawing Tools"
              >
                <PenTool size={18} />
              </Button>
              <Button size="sm" variant="ghost" title="Search">
                <FileSearch size={18} />
              </Button>
              <Button size="sm" variant="ghost" title="Add Location">
                <MapPin size={18} />
              </Button>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Sidebar */}
      <div 
        className={`bg-white h-full shadow-lg transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-0 opacity-0' : 'w-96 opacity-100'
        }`}
      >
        {!sidebarCollapsed && (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Map Explorer</h2>
              <p className="text-sm text-gray-500">Benton County GIS</p>
            </div>
            
            <Tabs defaultValue="layers" className="flex-grow flex flex-col">
              <TabsList className="w-full justify-start px-4 pt-2">
                <TabsTrigger value="layers" onClick={() => setActiveTab('layers')}>
                  <Layers size={16} className="mr-2" />
                  Layers
                </TabsTrigger>
                <TabsTrigger value="selection" onClick={() => setActiveTab('selection')}>
                  <Map size={16} className="mr-2" />
                  Selection
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="layers" className="flex-grow p-4 overflow-auto">
                <div className="space-y-4">
                  <Card className="p-4">
                    <h3 className="font-medium mb-2">Base Maps</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center">
                          <input type="radio" name="basemap" className="mr-2" defaultChecked />
                          Streets
                        </label>
                        <span className="text-xs text-gray-500">Default</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center">
                          <input type="radio" name="basemap" className="mr-2" />
                          Imagery
                        </label>
                        <span className="text-xs text-gray-500">High-res</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center">
                          <input type="radio" name="basemap" className="mr-2" />
                          Topographic
                        </label>
                        <span className="text-xs text-gray-500">Contours</span>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <h3 className="font-medium mb-2">Operational Layers</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2" defaultChecked />
                          Parcels
                        </label>
                        <span className="text-xs text-gray-500">100%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2" defaultChecked />
                          Roads
                        </label>
                        <span className="text-xs text-gray-500">100%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2" />
                          Zoning
                        </label>
                        <span className="text-xs text-gray-500">50%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2" />
                          Floodplain
                        </label>
                        <span className="text-xs text-gray-500">70%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2" />
                          Jurisdictions
                        </label>
                        <span className="text-xs text-gray-500">60%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2" />
                          Tax Lots
                        </label>
                        <span className="text-xs text-gray-500">100%</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="selection" className="flex-grow p-4 overflow-auto">
                {selectedFeature ? (
                  <Card className="p-4">
                    <h3 className="font-medium mb-2">{selectedFeature.type === 'parcel' ? 'Parcel Information' : 'Selection Information'}</h3>
                    <div className="space-y-2 text-sm">
                      {selectedFeature.type === 'parcel' ? (
                        <>
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-gray-500">Parcel ID:</span>
                            <span className="col-span-2 font-medium">{selectedFeature.attributes.parcelNumber}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-gray-500">Owner:</span>
                            <span className="col-span-2">{selectedFeature.attributes.owner}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-gray-500">Address:</span>
                            <span className="col-span-2">{selectedFeature.attributes.address}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-gray-500">Acres:</span>
                            <span className="col-span-2">{selectedFeature.attributes.acres}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-gray-500">Zoning:</span>
                            <span className="col-span-2">{selectedFeature.attributes.zoning}</span>
                          </div>
                          
                          <div className="pt-2 flex justify-end gap-2">
                            <Button size="sm" variant="outline">View Details</Button>
                            <Button size="sm">Related Documents</Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-gray-500">Selection:</span>
                            <span className="col-span-2 font-medium">{selectedFeature.id}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-gray-500">Area:</span>
                            <span className="col-span-2">{selectedFeature.attributes.area}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-gray-500">Perimeter:</span>
                            <span className="col-span-2">{selectedFeature.attributes.perimeter}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-gray-500">Created:</span>
                            <span className="col-span-2">{selectedFeature.attributes.created}</span>
                          </div>
                          
                          <div className="pt-2 flex justify-end gap-2">
                            <Button size="sm" variant="outline">Buffer</Button>
                            <Button size="sm">Find Parcels</Button>
                          </div>
                        </>
                      )}
                    </div>
                  </Card>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Map size={48} className="mx-auto mb-4 opacity-30" />
                    <p>No features selected</p>
                    <p className="text-sm mt-1">Click on the map or use the sketch tools to select features</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
      
      {/* Sidebar toggle button */}
      <button
        onClick={toggleSidebar}
        className="absolute top-1/2 transform -translate-y-1/2 bg-white rounded-full shadow-lg p-1 z-10"
        style={{ 
          left: sidebarCollapsed ? '10px' : '384px',
          transition: 'left 300ms ease-in-out'
        }}
      >
        {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>
    </div>
  );
};

export default ArcGISMapPage;