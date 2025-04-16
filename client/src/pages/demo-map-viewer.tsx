import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { useAuth } from '../context/auth-context';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { demoProperties } from '../data/demo-property-data';
import { MapTool, LayerType, MeasurementUnit, defaultMapSettings } from '../lib/map-utils';

const DemoMapViewer: React.FC = () => {
  const { user } = useAuth();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [selectedTool, setSelectedTool] = useState<MapTool>(MapTool.PAN);
  const [visibleLayers, setVisibleLayers] = useState<Record<string, boolean>>({
    parcels: true,
    zoning: false,
    aerial: false,
    floodplain: false,
    annotations: false
  });
  const [measurementUnit, setMeasurementUnit] = useState<MeasurementUnit>(MeasurementUnit.FEET);
  const [selectedParcel, setSelectedParcel] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter properties by type
  const residentialProperties = demoProperties.filter(p => p.propertyType === 'Residential');
  const commercialProperties = demoProperties.filter(p => p.propertyType === 'Commercial');
  const agriculturalProperties = demoProperties.filter(p => p.propertyType === 'Agricultural');
  const vacantLandProperties = demoProperties.filter(p => p.propertyType === 'Vacant Land');
  
  // Filter properties based on search
  const filteredProperties = demoProperties.filter(property => {
    if (!searchQuery) return false;
    
    const lowerCaseQuery = searchQuery.toLowerCase();
    return (
      property.parcelId.toLowerCase().includes(lowerCaseQuery) ||
      property.ownerName.toLowerCase().includes(lowerCaseQuery) ||
      property.address.street.toLowerCase().includes(lowerCaseQuery)
    );
  });
  
  // Toggle layer visibility
  const toggleLayer = (layer: string) => {
    setVisibleLayers(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };
  
  // Change measurement unit
  const handleUnitChange = (unit: MeasurementUnit) => {
    setMeasurementUnit(unit);
  };
  
  // Select tool
  const handleToolSelect = (tool: MapTool) => {
    setSelectedTool(tool);
  };
  
  // Handle property selection
  const handlePropertySelect = (parcelId: string) => {
    setSelectedParcel(parcelId);
  };
  
  // NOTE: In a real implementation, we would initialize and handle an actual map
  // such as Leaflet, Mapbox GL, or ArcGIS JS API here. For this demo, we're just
  // showing a simplified UI.
  
  useEffect(() => {
    // This would be where we'd initialize the map and add base layers
    const initMap = () => {
      // Simulate map initialization
      console.log('Map initialized with settings:', defaultMapSettings);
    };
    
    if (mapContainerRef.current) {
      initMap();
    }
    
    return () => {
      // Cleanup map instance on component unmount
    };
  }, []);
  
  // In a real implementation, this effect would update the map when layers change
  useEffect(() => {
    console.log('Visible layers updated:', visibleLayers);
  }, [visibleLayers]);
  
  if (!user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="mb-6">Please log in to access this page.</p>
          <Link href="/">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 h-[calc(100vh-9rem)] flex flex-col">
      <header className="mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Map Viewer</h1>
          <p className="text-muted-foreground">
            Benton County GIS Data
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">Export</Button>
          <Button variant="outline" size="sm">Print</Button>
          <Button size="sm">Save View</Button>
        </div>
      </header>
      
      <div className="flex flex-1 space-x-4 overflow-hidden">
        {/* Map Container */}
        <div className="flex-1 relative">
          <div 
            ref={mapContainerRef}
            className="w-full h-full bg-gray-200 rounded-md overflow-hidden relative"
          >
            {/* This would typically be replaced by an actual map library */}
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-500 text-center">
                Demo Map View <br />
                <span className="text-sm">Centered on Benton County, OR</span>
              </p>
            </div>
            
            {/* Map Tools Overlay */}
            <div className="absolute top-4 left-4 bg-card shadow rounded-md p-2 flex flex-col space-y-2">
              {Object.values(MapTool).slice(0, 6).map((tool) => (
                <button
                  key={tool}
                  className={`w-8 h-8 flex items-center justify-center rounded-md ${
                    selectedTool === tool ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-accent'
                  }`}
                  onClick={() => handleToolSelect(tool)}
                  title={tool}
                >
                  {/* Tool icon would go here */}
                  <span className="text-xs">{tool.charAt(0)}</span>
                </button>
              ))}
            </div>
            
            {/* Zoom Controls */}
            <div className="absolute bottom-4 right-4 bg-card shadow rounded-md p-2 flex flex-col space-y-2">
              <button
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-accent"
                onClick={() => handleToolSelect(MapTool.ZOOM_IN)}
                title="Zoom In"
              >
                +
              </button>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-accent"
                onClick={() => handleToolSelect(MapTool.ZOOM_OUT)}
                title="Zoom Out"
              >
                -
              </button>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-accent"
                onClick={() => handleToolSelect(MapTool.ZOOM_EXTENT)}
                title="Zoom to Extent"
              >
                <span className="text-xs">⤢</span>
              </button>
            </div>
            
            {/* Measurement Tool UI (conditionally shown) */}
            {selectedTool === MapTool.MEASURE && (
              <div className="absolute bottom-4 left-4 bg-card shadow rounded-md p-3">
                <h4 className="text-sm font-medium mb-2">Measurement</h4>
                <div className="flex space-x-2 mb-2">
                  {[MeasurementUnit.FEET, MeasurementUnit.METERS].map((unit) => (
                    <button
                      key={unit}
                      className={`px-2 py-1 text-xs rounded-md ${
                        measurementUnit === unit ? 'bg-primary text-primary-foreground' : 'bg-accent/50 hover:bg-accent'
                      }`}
                      onClick={() => handleUnitChange(unit)}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">Click on map to start measuring</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="w-80 flex flex-col space-y-4">
          {/* Search */}
          <div className="bg-card shadow rounded-md p-4">
            <h3 className="text-lg font-medium mb-2">Search</h3>
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Parcel ID, Owner, or Address"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button className="w-full" size="sm">Search</Button>
              
              {filteredProperties.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium mb-1">Results</h4>
                  <div className="h-48 overflow-y-auto border rounded-md p-2">
                    {filteredProperties.map((property) => (
                      <div 
                        key={property.id}
                        className={`p-2 text-sm rounded-md mb-1 cursor-pointer ${
                          selectedParcel === property.parcelId ? 
                          'bg-primary/10 font-medium' : 'hover:bg-accent'
                        }`}
                        onClick={() => handlePropertySelect(property.parcelId)}
                      >
                        <div>{property.parcelId}</div>
                        <div className="text-xs text-muted-foreground">{property.address.street}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Layers */}
          <div className="bg-card shadow rounded-md p-4">
            <h3 className="text-lg font-medium mb-2">Layers</h3>
            <div className="space-y-1">
              {Object.entries(visibleLayers).map(([layer, isVisible]) => (
                <div key={layer} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`layer-${layer}`}
                    className="mr-2"
                    checked={isVisible}
                    onChange={() => toggleLayer(layer)}
                  />
                  <label 
                    htmlFor={`layer-${layer}`}
                    className="text-sm capitalize select-none cursor-pointer"
                  >
                    {layer}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Property Details (shown when a property is selected) */}
          {selectedParcel && (
            <div className="bg-card shadow rounded-md p-4 flex-1 overflow-y-auto">
              <h3 className="text-lg font-medium mb-2">Property Details</h3>
              <div className="space-y-4">
                {demoProperties
                  .filter(p => p.parcelId === selectedParcel)
                  .map(property => (
                    <div key={property.id}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{property.parcelId}</h4>
                          <p className="text-sm text-muted-foreground">{property.address.street}</p>
                        </div>
                        <Button variant="outline" size="sm">View Full</Button>
                      </div>
                      
                      <div className="mt-3 space-y-2">
                        <div className="grid grid-cols-2 gap-1">
                          <div className="text-sm text-muted-foreground">Owner</div>
                          <div className="text-sm">{property.ownerName}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          <div className="text-sm text-muted-foreground">Type</div>
                          <div className="text-sm">{property.propertyType}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          <div className="text-sm text-muted-foreground">Assessed Value</div>
                          <div className="text-sm">${property.assessedValue.toLocaleString()}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          <div className="text-sm text-muted-foreground">Market Value</div>
                          <div className="text-sm">${property.marketValue.toLocaleString()}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          <div className="text-sm text-muted-foreground">Land Area</div>
                          <div className="text-sm">{property.landArea} acres</div>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          <div className="text-sm text-muted-foreground">Zoning</div>
                          <div className="text-sm">{property.zoning}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          <div className="text-sm text-muted-foreground">Last Assessment</div>
                          <div className="text-sm">{property.lastAssessmentDate}</div>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-border">
                        <h5 className="text-sm font-medium mb-1">Features</h5>
                        <div className="flex flex-wrap gap-1">
                          {property.features.map((feature, index) => (
                            <span 
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DemoMapViewer;