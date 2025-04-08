import React, { useState, useRef, useEffect } from 'react';
// Use simplified ArcGIS components without direct dependency on ArcGIS JS API
import ArcGISProviderSimplified from '../components/maps/arcgis/arcgis-provider-simplified';
import ArcGISSketchSimplified from '../components/maps/arcgis/arcgis-sketch-simplified';
import ArcGISRestMap from '../components/maps/arcgis/arcgis-rest-map';
import ArcGISRestLayer from '../components/maps/arcgis/arcgis-rest-layer';
import { fetchServiceList, fetchServiceInfo } from '../services/arcgis-rest-service';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Layers, Map, MapPin, PenTool, FileSearch, 
  ZoomIn, ZoomOut, Home, ChevronLeft, ChevronRight,
  Globe, Database, Loader2
} from 'lucide-react';
import { DEFAULT_PARCELS_LAYER } from '../constants/layer-constants';

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
  const [mapMode, setMapMode] = useState<'simulated' | 'rest'>('simulated');
  
  // ArcGIS REST specific state
  const [services, setServices] = useState<any[]>([]);
  const [filteredServices, setFilteredServices] = useState<any[]>([]);
  const [showServicesDropdown, setShowServicesDropdown] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedServiceType, setSelectedServiceType] = useState<'FeatureServer' | 'MapServer'>('MapServer');
  const [activeLayers, setActiveLayers] = useState<any[]>([DEFAULT_PARCELS_LAYER]); // Initialize with DEFAULT_PARCELS_LAYER
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Reference to map component
  const arcgisRestMapRef = useRef<any>(null);
  
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
  
  // Handle document click to close services dropdown when clicking outside
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (showServicesDropdown) {
        setShowServicesDropdown(false);
      }
    };
    
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [showServicesDropdown]);
  
  // Load ArcGIS services when map mode changes to 'rest'
  useEffect(() => {
    if (mapMode === 'rest') {
      setLoading(true);
      console.log('Loading ArcGIS services for sidebar...');
      
      fetchServiceList()
        .then(data => {
          if (data && Array.isArray(data.services)) {
            console.log(`Found ${data.services.length} services for sidebar`);
            setServices(data.services);
          } else {
            console.warn('Invalid service list format:', data);
            setError('Failed to load service list');
            
            // Provide a small set of hardcoded services for testing
            setServices([
              { name: 'Parcels_and_Assess', type: 'MapServer' },
              { name: 'Zoning', type: 'MapServer' },
              { name: 'Roads', type: 'MapServer' },
              { name: 'Aerials_2020', type: 'MapServer' },
              { name: 'Fire_Districts', type: 'MapServer' }
            ]);
          }
        })
        .catch(err => {
          console.error('Error loading services:', err);
          setError('Failed to load ArcGIS services');
          
          // Provide a small set of hardcoded services for testing
          setServices([
            { name: 'Parcels_and_Assess', type: 'MapServer' },
            { name: 'Zoning', type: 'MapServer' },
            { name: 'Roads', type: 'MapServer' },
            { name: 'Aerials_2020', type: 'MapServer' },
            { name: 'Fire_Districts', type: 'MapServer' }
          ]);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [mapMode]);
  
  // Add a layer from the selected service
  const addSelectedLayer = () => {
    if (!selectedService) return;
    
    setLoading(true);
    setError(null);
    console.log(`Adding layer from service: ${selectedService} (${selectedServiceType})`);
    
    // Check if we're adding the Parcels layer and handle it as a base layer
    const isParcelsLayer = selectedService === 'Parcels_and_Assess' && selectedServiceType === 'MapServer';
    
    // Check if this layer already exists to prevent duplicates
    const layerExists = activeLayers.some(
      layer => layer.serviceName === selectedService && layer.serviceType === selectedServiceType
    );
    
    if (layerExists) {
      console.log(`Layer ${selectedService} already exists, skipping`);
      setError(`Layer "${selectedService}" is already added`);
      setLoading(false);
      setSelectedService(null);
      return;
    }
    
    // If this is the parcels layer and we're using the DEFAULT_PARCELS_LAYER constant
    if (isParcelsLayer) {
      // Check if we already have a base parcels layer
      const baseLayerExists = activeLayers.some(
        layer => layer.id === DEFAULT_PARCELS_LAYER.id || 
                (layer.serviceName === DEFAULT_PARCELS_LAYER.serviceName && 
                 layer.serviceType === DEFAULT_PARCELS_LAYER.serviceType)
      );
      
      if (baseLayerExists) {
        console.log('Parcels layer already exists as a base layer');
        setError('Parcels layer is already added as a base layer');
        setLoading(false);
        setSelectedService(null);
        return;
      }
    }
    
    fetchServiceInfo(selectedService, selectedServiceType)
      .then(serviceInfo => {
        console.log('Service info:', serviceInfo);
        
        // Use the default layer constant if this is the parcels layer
        if (isParcelsLayer) {
          console.log('Adding parcels as base layer using DEFAULT_PARCELS_LAYER constant');
          setActiveLayers(prev => [...prev, DEFAULT_PARCELS_LAYER]);
        } else {
          const newLayer = {
            id: `${selectedService}-${Date.now()}`,
            name: serviceInfo.documentInfo?.Title || serviceInfo.name || selectedService,
            serviceType: selectedServiceType,
            serviceName: selectedService,
            visible: true,
            opacity: 1,
            isBaseLayer: false // Not a base layer
          };
          
          console.log('Adding new layer:', newLayer);
          setActiveLayers(prev => [...prev, newLayer]);
        }
        
        setLoading(false);
        setSelectedService(null); // Clear selection after adding
      })
      .catch(err => {
        console.error('Error adding layer:', err);
        setError(`Failed to add layer from ${selectedService}`);
        setLoading(false);
        
        // Add a fallback layer for testing when error occurs
        const fallbackLayer = {
          id: `${selectedService}-fallback-${Date.now()}`,
          name: selectedService,
          serviceType: selectedServiceType,
          serviceName: selectedService,
          visible: true,
          opacity: 1,
          isBaseLayer: isParcelsLayer // Mark as base layer if it's the parcels layer
        };
        
        console.log('Adding fallback layer:', fallbackLayer);
        setActiveLayers(prev => [...prev, fallbackLayer]);
      })
      .finally(() => {
        setLoading(false);
        setSelectedService(null);
      });
  };
  
  // Remove a layer (but protect base layers)
  const removeLayer = (layerId: string) => {
    setActiveLayers(prev => 
      prev.filter(layer => 
        // Keep the layer if it's not the one to remove OR if it's a base layer
        layer.id !== layerId || layer.isBaseLayer === true
      )
    );
  };
  
  // Toggle layer visibility
  const toggleLayerVisibility = (layerId: string) => {
    setActiveLayers(prev => 
      prev.map(layer => 
        layer.id === layerId 
          ? { ...layer, visible: !layer.visible } 
          : layer
      )
    );
  };
  
  // Update layer opacity
  const updateLayerOpacity = (layerId: string, opacity: number) => {
    console.log(`[ArcGISMapPage] Updating opacity for layer ${layerId} to ${opacity}`);
    
    // Debug: log the layer we're trying to update
    const layerToUpdate = activeLayers.find(l => l.id === layerId);
    console.log(`[ArcGISMapPage] Found layer to update:`, layerToUpdate);
    
    setActiveLayers(prev => {
      const updated = prev.map(layer => 
        layer.id === layerId 
          ? { ...layer, opacity } 
          : layer
      );
      console.log(`[ArcGISMapPage] Updated layers state:`, updated);
      return updated;
    });
    
    // Also update in the map component if in REST mode
    if (mapMode === 'rest' && arcgisRestMapRef.current) {
      console.log(`[ArcGISMapPage] Calling updateLayerOpacity on map ref`);
      try {
        arcgisRestMapRef.current.updateLayerOpacity(layerId, opacity);
      } catch (err) {
        console.error(`[ArcGISMapPage] Error calling updateLayerOpacity:`, err);
      }
    } else {
      console.log(`[ArcGISMapPage] Not calling map ref, mode=${mapMode}, ref exists=${!!arcgisRestMapRef.current}`);
    }
  };
  
  return (
    <div className="flex h-screen w-full bg-gray-100 relative overflow-hidden">
      {/* Main map container */}
      <div className="flex-grow relative">
        {/* Map display (conditional based on mode) */}
        {mapMode === 'simulated' ? (
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
        ) : (
          <ArcGISRestMap
            ref={arcgisRestMapRef}
            initialCenter={[-123.3617, 44.5646]}
            initialZoom={12}
            height="100%"
            showControls={true}
            layers={activeLayers}
          />
        )}
        
        {/* Map mode toggle */}
        <div className="absolute top-6 right-6 z-50">
          <Card className="p-2 bg-white/90 backdrop-blur shadow-lg">
            <div className="flex items-center gap-1">
              <Button 
                size="sm" 
                variant={mapMode === 'simulated' ? "default" : "outline"} 
                onClick={() => setMapMode('simulated')}
                title="Simulated Map"
              >
                <Globe size={18} className="mr-1" />
                Simulated
              </Button>
              <Button 
                size="sm" 
                variant={mapMode === 'rest' ? "default" : "outline"} 
                onClick={() => setMapMode('rest')}
                title="ArcGIS REST API"
              >
                <Database size={18} className="mr-1" />
                REST API
              </Button>
            </div>
          </Card>
        </div>
        
        {/* Map controls overlay (only shown in simulated mode) */}
        {mapMode === 'simulated' && (
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
        )}
        
        {/* Map tools (only shown in simulated mode) */}
        {mapMode === 'simulated' && (
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
        )}
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
              <p className="text-xs text-blue-500 mt-1">
                {mapMode === 'simulated' 
                  ? "Using simulated map data" 
                  : "Connected to ArcGIS REST services"
                }
              </p>
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
                  
                  {mapMode === 'rest' && (
                    <Card className="p-4">
                      <h3 className="font-medium mb-2">ArcGIS REST Services</h3>
                      <p className="text-xs text-gray-500 mb-2">
                        Select services to add from Benton County's ArcGIS server:
                      </p>
                      <div className="p-2 mb-3 bg-green-50 border border-green-200 rounded text-xs">
                        <p className="font-medium text-green-800">Parcels Layer</p>
                        <p className="text-green-700 mt-1">
                          The Parcels_and_Assess layer is maintained as a persistent 
                          base layer and cannot be removed. It provides essential county parcel data.
                        </p>
                      </div>
                      
                      {/* Services selection dropdown */}
                      <div className="space-y-3">
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <label className="text-sm font-medium">Available Services:</label>
                            {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                          </div>
                          
                          <div className="relative">
                            <input
                              type="text"
                              className="w-full p-2 border rounded text-sm"
                              placeholder="Type to search services... (349 available)"
                              onChange={(e) => {
                                // Filter services as user types
                                const searchTerm = e.target.value.toLowerCase();
                                if (searchTerm.length > 0) {
                                  const filtered = services
                                    .filter(service => 
                                      service.name.toLowerCase().includes(searchTerm)
                                    )
                                    .slice(0, 20); // Limit to first 20 matches
                                  
                                  setFilteredServices(filtered);
                                  setShowServicesDropdown(true);
                                } else {
                                  setFilteredServices([]);
                                  setShowServicesDropdown(false);
                                }
                              }}
                              onFocus={() => {
                                // When focusing, show the popular services
                                const popularServices = [
                                  'Parcels_and_Assess', 'Zoning', 'Roads', 'TaxLots', 
                                  'Jurisdictions', 'Floodplain'
                                ];
                                
                                const filtered = services
                                  .filter(service => 
                                    popularServices.includes(service.name)
                                  )
                                  .slice(0, 10);
                                
                                if (filtered.length > 0) {
                                  setFilteredServices(filtered);
                                  setShowServicesDropdown(true);
                                }
                              }}
                              onMouseDown={(e) => {
                                // Prevent the click from closing the dropdown when clicking the input
                                e.stopPropagation();
                              }}
                              disabled={loading}
                            />
                            
                            {showServicesDropdown && (
                              <div 
                                className="absolute z-20 w-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto"
                                onMouseDown={(e) => {
                                  // Prevent clicking inside the dropdown from closing it
                                  e.stopPropagation();
                                }}
                              >
                                {filteredServices.length > 0 ? (
                                  filteredServices.map(service => (
                                    <div 
                                      key={service.name} 
                                      className="p-2 hover:bg-gray-100 cursor-pointer text-sm border-b"
                                      onClick={() => {
                                        setSelectedService(service.name);
                                        setSelectedServiceType(service.type as 'FeatureServer' | 'MapServer');
                                        setShowServicesDropdown(false);
                                      }}
                                    >
                                      <div className="font-medium">{service.name}</div>
                                      <div className="text-xs text-gray-500">{service.type}</div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="p-3 text-center text-gray-500 text-sm">
                                    No matching services found
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {selectedService && (
                              <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200 flex justify-between items-center">
                                <div>
                                  <div className="font-medium text-sm">{selectedService}</div>
                                  <div className="text-xs text-gray-500">{selectedServiceType}</div>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-gray-400"
                                  onClick={() => setSelectedService(null)}
                                >
                                  ×
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex justify-end">
                            <Button 
                              size="sm" 
                              onClick={addSelectedLayer}
                              disabled={!selectedService || loading}
                            >
                              {loading ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                  Loading...
                                </>
                              ) : "Add Layer"}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex gap-1 flex-wrap">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-6 text-xs py-0 px-1 bg-green-50 border-green-200 text-green-700"
                            onClick={() => {
                              setSelectedService('Parcels_and_Assess');
                              setSelectedServiceType('FeatureServer');
                              setTimeout(addSelectedLayer, 0);
                            }}
                            disabled={loading}
                            title="Adds the Parcels layer as a base layer"
                          >
                            Add Parcels (Base)
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-6 text-xs py-0 px-1"
                            onClick={() => {
                              setSelectedService('Zoning');
                              setSelectedServiceType('FeatureServer');
                              setTimeout(addSelectedLayer, 0);
                            }}
                            disabled={loading}
                          >
                            Add Zoning
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-6 text-xs py-0 px-1"
                            onClick={() => {
                              setSelectedService('Roads');
                              setSelectedServiceType('FeatureServer');
                              setTimeout(addSelectedLayer, 0);
                            }}
                            disabled={loading}
                          >
                            Add Roads
                          </Button>
                        </div>
                        
                        {error && (
                          <div className="p-2 text-xs text-red-600 bg-red-50 rounded border border-red-200">
                            {error}
                          </div>
                        )}
                        
                        <div className="border-t pt-2">
                          <h4 className="text-sm font-medium mb-2">
                            Active Layers ({activeLayers.length})
                          </h4>
                          
                          {activeLayers.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-2">
                              No layers added yet. Select a service above to add a layer.
                            </p>
                          ) : (
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                              {activeLayers.map(layer => (
                                <div 
                                  key={layer.id} 
                                  className={`flex flex-col p-2 rounded ${
                                    layer.isBaseLayer ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <label className="flex items-center">
                                      <input 
                                        type="checkbox" 
                                        className="mr-2" 
                                        checked={layer.visible} 
                                        onChange={() => toggleLayerVisibility(layer.id)}
                                      />
                                      <span className="text-sm">
                                        {layer.name}
                                        {layer.isBaseLayer && (
                                          <span className="text-xs ml-1 text-green-700 bg-green-100 px-1 py-0.5 rounded">
                                            base
                                          </span>
                                        )}
                                      </span>
                                    </label>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className={`h-6 w-6 p-0 ${
                                        layer.isBaseLayer ? 'opacity-50 cursor-not-allowed' : ''
                                      }`}
                                      onClick={() => removeLayer(layer.id)}
                                      disabled={layer.isBaseLayer}
                                      title={layer.isBaseLayer ? "Base layer cannot be removed" : "Remove layer"}
                                    >
                                      ×
                                    </Button>
                                  </div>
                                  
                                  {/* Opacity slider - only shown when layer is visible */}
                                  {layer.visible && (
                                    <div className="mt-2 px-1">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-gray-500">Opacity</span>
                                        <span className="text-xs text-gray-500">{Math.round(layer.opacity * 100)}%</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs">0%</span>
                                        <input 
                                          type="range"
                                          min="0"
                                          max="1"
                                          step="0.01"
                                          value={layer.opacity}
                                          onChange={(e) => updateLayerOpacity(layer.id, parseFloat(e.target.value))}
                                          className="flex-grow h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <span className="text-xs">100%</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 text-xs text-gray-500">
                        Server: <code className="bg-gray-100 px-1 py-0.5 rounded">services7.arcgis.com/NURlY7V8UHl6XumF</code>
                      </div>
                    </Card>
                  )}
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