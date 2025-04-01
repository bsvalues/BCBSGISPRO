import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MapLayer } from "@/lib/map-utils";
import { BasicMapViewer } from "@/components/maps/basic-map-viewer";
import {
  Search,
  Layers,
  ZoomIn,
  ZoomOut,
  Move,
  Home,
  Download,
  Save,
  Printer,
  ChevronRight,
  ChevronLeft,
  Map as MapIcon,
  Ruler,
  MousePointer,
  PenTool
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function MapViewerPage() {
  // Bypass auth during development
  const user = { id: 1, username: 'admin', fullName: 'Administrator' };
  const [location] = useLocation();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  
  // Extract workflow ID from query parameters if it exists
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const workflowId = searchParams.get('workflow');
  
  // Fetch map layers
  const { data: mapLayers, isLoading: isLayersLoading } = useQuery<MapLayer[]>({
    queryKey: ["/api/map-layers"],
  });
  
  const [activeLayers, setActiveLayers] = useState<Record<number, boolean>>({});
  const [activeTab, setActiveTab] = useState<'layers' | 'parcels' | 'tools'>('layers');
  const [activeTool, setActiveTool] = useState<string | null>(null);
  
  // Initialize active layers when data is loaded
  useEffect(() => {
    if (mapLayers) {
      const initialLayers: Record<number, boolean> = {};
      mapLayers.forEach(layer => {
        initialLayers[layer.id] = layer.visible;
      });
      setActiveLayers(initialLayers);
    }
  }, [mapLayers]);
  
  // Toggle layer visibility
  const toggleLayer = (layerId: number) => {
    setActiveLayers(prev => ({
      ...prev,
      [layerId]: !prev[layerId]
    }));
  };
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would trigger a search for the parcel
    console.log("Searching for:", searchQuery);
  };
  
  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };
  
  // Select a tool
  const selectTool = (tool: string) => {
    setActiveTool(activeTool === tool ? null : tool);
  };
  
  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 flex flex-col overflow-hidden bg-neutral-100">
          {/* Map Toolbar */}
          <div className="bg-white border-b border-neutral-200 p-3 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <MapIcon className="h-5 w-5 text-primary-600" />
              <h1 className="text-lg font-semibold text-neutral-800">GIS Map Viewer</h1>
              {workflowId && (
                <span className="text-sm text-neutral-500 ml-2">
                  Workflow #{workflowId}
                </span>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className={`${activeTool === 'select' ? 'bg-primary-100 border-primary-300 text-primary-700' : ''}`}
                onClick={() => selectTool('select')}
              >
                <MousePointer className="h-4 w-4 mr-1" />
                Select
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`${activeTool === 'measure' ? 'bg-primary-100 border-primary-300 text-primary-700' : ''}`}
                onClick={() => selectTool('measure')}
              >
                <Ruler className="h-4 w-4 mr-1" />
                Measure
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`${activeTool === 'draw' ? 'bg-primary-100 border-primary-300 text-primary-700' : ''}`}
                onClick={() => selectTool('draw')}
              >
                <PenTool className="h-4 w-4 mr-1" />
                Draw
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
            </div>
            
            <form onSubmit={handleSearch} className="relative w-64">
              <Input
                type="text"
                placeholder="Search parcel, address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-8"
              />
              <Button 
                type="submit" 
                variant="ghost" 
                size="icon"
                className="absolute right-0 top-0 h-full"
              >
                <Search className="h-4 w-4 text-neutral-500" />
              </Button>
            </form>
          </div>
          
          <div className="flex flex-1 overflow-hidden">
            {/* Left Sidebar */}
            <div className={`bg-white border-r border-neutral-200 ${sidebarExpanded ? 'w-80' : 'w-0'} transition-all duration-300 flex flex-col`}>
              {sidebarExpanded && (
                <>
                  <div className="border-b border-neutral-200 p-3">
                    <div className="flex space-x-1">
                      <Button
                        variant={activeTab === 'layers' ? 'default' : 'secondary'} 
                        size="sm"
                        onClick={() => setActiveTab('layers')}
                        className="flex-1"
                      >
                        Layers
                      </Button>
                      <Button
                        variant={activeTab === 'parcels' ? 'default' : 'secondary'} 
                        size="sm"
                        onClick={() => setActiveTab('parcels')}
                        className="flex-1"
                      >
                        Parcels
                      </Button>
                      <Button
                        variant={activeTab === 'tools' ? 'default' : 'secondary'} 
                        size="sm"
                        onClick={() => setActiveTab('tools')}
                        className="flex-1"
                      >
                        Tools
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === 'layers' && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium flex items-center">
                          <Layers className="h-4 w-4 mr-2" />
                          Available Layers
                        </h3>
                        
                        {isLayersLoading ? (
                          <div className="py-4 text-center text-sm text-neutral-500">
                            Loading layers...
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {mapLayers?.map((layer) => (
                              <div key={layer.id} className="flex items-center justify-between">
                                <Label htmlFor={`layer-${layer.id}`} className="flex items-center space-x-2 text-sm">
                                  <Checkbox
                                    id={`layer-${layer.id}`}
                                    checked={activeLayers[layer.id] || false}
                                    onCheckedChange={() => toggleLayer(layer.id)}
                                  />
                                  <span>{layer.name}</span>
                                </Label>
                                <span className="text-xs text-neutral-500">
                                  {layer.source}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="pt-4 border-t border-neutral-200">
                          <h3 className="text-sm font-medium mb-2">Layer Options</h3>
                          <Button variant="outline" size="sm" className="w-full mb-2">
                            <Save className="h-4 w-4 mr-2" />
                            Save Current View
                          </Button>
                          <Button variant="outline" size="sm" className="w-full">
                            <Home className="h-4 w-4 mr-2" />
                            Reset View
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {activeTab === 'parcels' && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Parcel Information</h3>
                        
                        <div className="bg-neutral-50 p-3 rounded-md border border-neutral-200">
                          <p className="text-sm text-neutral-600 mb-2">Select a parcel on the map to see detailed information.</p>
                          
                          <div className="text-xs text-neutral-500">
                            <p>Or search for a specific parcel:</p>
                            <form className="mt-2 flex">
                              <Input 
                                type="text" 
                                placeholder="Parcel number" 
                                className="text-xs h-8"
                              />
                              <Button type="submit" size="sm" className="ml-2">
                                <Search className="h-3 w-3 mr-1" />
                                Find
                              </Button>
                            </form>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-md border border-neutral-200 overflow-hidden">
                          <div className="bg-primary-50 p-2 border-b border-primary-200">
                            <h4 className="text-sm font-medium text-primary-800">Selected Parcel</h4>
                          </div>
                          <div className="p-3 text-sm">
                            <p className="text-neutral-500 italic">No parcel selected</p>
                            {/* When a parcel is selected, show details here */}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {activeTab === 'tools' && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Map Tools</h3>
                        
                        <div className="space-y-2">
                          <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => selectTool('measure')}>
                            <Ruler className="h-4 w-4 mr-2" />
                            Measure Distance
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => selectTool('draw')}>
                            <PenTool className="h-4 w-4 mr-2" />
                            Draw Features
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start">
                            <Download className="h-4 w-4 mr-2" />
                            Export Features
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start">
                            <Printer className="h-4 w-4 mr-2" />
                            Print Map
                          </Button>
                        </div>
                        
                        <div className="pt-4 border-t border-neutral-200">
                          <h3 className="text-sm font-medium mb-2">Advanced Features</h3>
                          <Card className="bg-neutral-50">
                            <CardContent className="p-3 text-xs">
                              <p className="mb-2 font-medium">Available in ArcGIS Pro:</p>
                              <ul className="list-disc list-inside space-y-1 text-neutral-600">
                                <li>COGO Boundaries</li>
                                <li>Precision Editing</li>
                                <li>Advanced Attribution</li>
                                <li>Drawing by Legal Description</li>
                              </ul>
                              <Button variant="link" size="sm" className="px-0 mt-2 text-primary-600">
                                Learn More
                              </Button>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            
            {/* Toggle Sidebar Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-r-full rounded-l-none border border-l-0 border-neutral-200 shadow-sm h-10 w-5"
            >
              {sidebarExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            
            {/* Map Container */}
            <div className="flex-1 relative">
              <div ref={mapContainerRef} className="absolute inset-0 bg-neutral-100">
                {/* Using our basic map viewer component */}
                <BasicMapViewer 
                  mapLayers={mapLayers || []}
                  enableLayerControl={true}
                />
                
                {/* Map Controls */}
                <div className="absolute top-4 right-4 bg-white rounded-md shadow-sm">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-none border-b border-neutral-200">
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Zoom In</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-none border-b border-neutral-200">
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Zoom Out</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-none border-b border-neutral-200">
                          <Move className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Pan</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-none">
                          <Home className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Default Extent</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                {/* Map Info */}
                <div className="absolute bottom-4 left-4 bg-white p-2 rounded-md shadow-sm text-xs">
                  <div className="flex space-x-4">
                    <div>
                      <span className="text-neutral-500">Zoom:</span> <span className="font-medium">12</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Lat:</span> <span className="font-medium">46.2086</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Lng:</span> <span className="font-medium">-119.1689</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
