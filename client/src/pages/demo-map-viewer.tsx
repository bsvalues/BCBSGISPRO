import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/auth-context';
import { Button } from '../components/ui/button';
import { MapTool, MeasurementUnit } from '../lib/map-utils';
import {
  residentialParcels,
  commercialParcels,
  agriculturalParcels,
  specialPurposeParcels
} from '../data/demo-property-data';

const DemoMapViewer: React.FC = () => {
  const { user } = useAuth();
  const [selectedTool, setSelectedTool] = useState<MapTool>(MapTool.PAN);
  const [measurementUnit, setMeasurementUnit] = useState<MeasurementUnit>(MeasurementUnit.FEET);
  const [mapVisible, setMapVisible] = useState(true);
  const [selectedParcel, setSelectedParcel] = useState<any>(null);
  const [activeLayers, setActiveLayers] = useState({
    residential: true,
    commercial: true,
    agricultural: true,
    specialPurpose: false,
    satellite: false,
    boundaries: true,
    labels: true
  });
  const [layerOpacity, setLayerOpacity] = useState({
    residential: 1,
    commercial: 1,
    agricultural: 1,
    specialPurpose: 1,
    satellite: 0.7,
    boundaries: 0.8,
    labels: 1
  });
  
  // Function to toggle layer visibility
  const toggleLayer = (layerName: string) => {
    setActiveLayers({
      ...activeLayers,
      [layerName]: !activeLayers[layerName as keyof typeof activeLayers]
    });
  };
  
  // Function to update layer opacity
  const updateLayerOpacity = (layerName: string, opacity: number) => {
    setLayerOpacity({
      ...layerOpacity,
      [layerName]: opacity
    });
  };

  // Mock function for parcel selection
  const handleParcelSelect = (parcel: any) => {
    setSelectedParcel(parcel);
  };

  // Function to switch mapping tools
  const switchTool = (tool: MapTool) => {
    setSelectedTool(tool);
  };

  // Get total count of parcels
  const getTotalParcelCount = () => {
    return residentialParcels.length + 
           commercialParcels.length + 
           agriculturalParcels.length + 
           specialPurposeParcels.length;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="mb-6">Please log in to access this page.</p>
          <Button onClick={() => window.location.href = '/'}>Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-9rem)]">
      {/* Left Sidebar - Controls */}
      <div className="w-64 bg-card border-r border-border p-4 overflow-auto">
        <h2 className="font-semibold mb-4">Map Tools</h2>
        
        <div className="space-y-1 mb-6">
          <Button 
            variant={selectedTool === MapTool.PAN ? "default" : "outline"}
            size="sm"
            className="w-full justify-start"
            onClick={() => switchTool(MapTool.PAN)}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 15L12 11M12 11L16 15M12 11V21M20 15V8C20 6.89543 19.1046 6 18 6H6C4.89543 6 4 6.89543 4 8V15C4 16.1046 4.89543 17 6 17H18C19.1046 17 20 16.1046 20 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Pan
          </Button>
          
          <Button 
            variant={selectedTool === MapTool.SELECT ? "default" : "outline"}
            size="sm"
            className="w-full justify-start"
            onClick={() => switchTool(MapTool.SELECT)}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19L6.5 14.5M6.5 14.5L11 10M6.5 14.5H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Select
          </Button>
          
          <Button 
            variant={selectedTool === MapTool.MEASURE ? "default" : "outline"}
            size="sm"
            className="w-full justify-start"
            onClick={() => switchTool(MapTool.MEASURE)}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 13H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 9H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 17H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Measure
          </Button>
          
          <Button 
            variant={selectedTool === MapTool.DRAW ? "default" : "outline"}
            size="sm"
            className="w-full justify-start"
            onClick={() => switchTool(MapTool.DRAW)}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 3L12 6L15 9L18 6L15 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Draw
          </Button>
        </div>
        
        <div className="border-t border-border pt-4 mb-6">
          <h2 className="font-semibold mb-4">Parcel Layers</h2>
          
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm">Residential</span>
              <input 
                type="checkbox" 
                checked={activeLayers.residential} 
                onChange={() => toggleLayer('residential')}
                className="w-4 h-4 accent-primary"
              />
            </label>
            
            {activeLayers.residential && (
              <div className="pl-4">
                <label className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Opacity</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1" 
                    value={layerOpacity.residential} 
                    onChange={e => updateLayerOpacity('residential', parseFloat(e.target.value))}
                    className="w-24"
                  />
                </label>
              </div>
            )}
            
            <label className="flex items-center justify-between">
              <span className="text-sm">Commercial</span>
              <input 
                type="checkbox" 
                checked={activeLayers.commercial} 
                onChange={() => toggleLayer('commercial')}
                className="w-4 h-4 accent-primary"
              />
            </label>
            
            {activeLayers.commercial && (
              <div className="pl-4">
                <label className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Opacity</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1" 
                    value={layerOpacity.commercial} 
                    onChange={e => updateLayerOpacity('commercial', parseFloat(e.target.value))}
                    className="w-24"
                  />
                </label>
              </div>
            )}
            
            <label className="flex items-center justify-between">
              <span className="text-sm">Agricultural</span>
              <input 
                type="checkbox" 
                checked={activeLayers.agricultural} 
                onChange={() => toggleLayer('agricultural')}
                className="w-4 h-4 accent-primary"
              />
            </label>
            
            {activeLayers.agricultural && (
              <div className="pl-4">
                <label className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Opacity</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1" 
                    value={layerOpacity.agricultural} 
                    onChange={e => updateLayerOpacity('agricultural', parseFloat(e.target.value))}
                    className="w-24"
                  />
                </label>
              </div>
            )}
            
            <label className="flex items-center justify-between">
              <span className="text-sm">Special Purpose</span>
              <input 
                type="checkbox" 
                checked={activeLayers.specialPurpose} 
                onChange={() => toggleLayer('specialPurpose')}
                className="w-4 h-4 accent-primary"
              />
            </label>
            
            {activeLayers.specialPurpose && (
              <div className="pl-4">
                <label className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Opacity</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1" 
                    value={layerOpacity.specialPurpose} 
                    onChange={e => updateLayerOpacity('specialPurpose', parseFloat(e.target.value))}
                    className="w-24"
                  />
                </label>
              </div>
            )}
          </div>
        </div>
        
        <div className="border-t border-border pt-4">
          <h2 className="font-semibold mb-4">Base Layers</h2>
          
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm">Satellite Imagery</span>
              <input 
                type="checkbox" 
                checked={activeLayers.satellite} 
                onChange={() => toggleLayer('satellite')}
                className="w-4 h-4 accent-primary"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <span className="text-sm">Boundaries</span>
              <input 
                type="checkbox" 
                checked={activeLayers.boundaries} 
                onChange={() => toggleLayer('boundaries')}
                className="w-4 h-4 accent-primary"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <span className="text-sm">Labels</span>
              <input 
                type="checkbox" 
                checked={activeLayers.labels} 
                onChange={() => toggleLayer('labels')}
                className="w-4 h-4 accent-primary"
              />
            </label>
          </div>
        </div>
      </div>
      
      {/* Main Content - Map Area */}
      <div className="flex-1 relative">
        {mapVisible ? (
          <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
            <div className="text-center p-8 max-w-md bg-card rounded-lg shadow-lg">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-16 w-16 mx-auto text-muted-foreground mb-4" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <h3 className="text-lg font-medium mb-2">Map Viewer</h3>
              <p className="text-muted-foreground mb-4">
                Using demo data from Benton County. 
                {getTotalParcelCount()} parcels available.
              </p>
              <div className="text-sm text-muted-foreground mb-4 text-left">
                <p className="mb-1">Currently displaying:</p>
                <ul className="list-disc pl-5 space-y-1">
                  {activeLayers.residential && <li>Residential parcels ({residentialParcels.length})</li>}
                  {activeLayers.commercial && <li>Commercial parcels ({commercialParcels.length})</li>}
                  {activeLayers.agricultural && <li>Agricultural parcels ({agriculturalParcels.length})</li>}
                  {activeLayers.specialPurpose && <li>Special purpose parcels ({specialPurposeParcels.length})</li>}
                </ul>
              </div>
              <div className="text-sm text-muted-foreground mb-4">
                <p>Current tool: <span className="font-medium">{selectedTool}</span></p>
                {selectedTool === MapTool.MEASURE && 
                  <p>Measurement unit: <span className="font-medium">{measurementUnit}</span></p>
                }
              </div>
              <p className="text-xs text-muted-foreground mb-6">
                This is a demo display. In the full application, an interactive map will render here utilizing Mapbox, Leaflet, or ArcGIS.
              </p>
              <div className="flex space-x-2 justify-center">
                <Button variant="outline" size="sm" onClick={() => setSelectedParcel(residentialParcels[0])}>
                  Select Sample Parcel
                </Button>
                <Button size="sm">
                  Reset View
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <Button onClick={() => setMapVisible(true)}>Show Map</Button>
          </div>
        )}
        
        {/* Map Controls */}
        <div className="absolute top-4 right-4 z-10 flex space-x-2">
          <Button size="sm" variant="secondary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            Search
          </Button>
          <Button size="sm" variant="secondary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
            Panels
          </Button>
          <Button size="sm" variant="secondary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
            </svg>
            Navigate
          </Button>
        </div>
        
        {/* Property Details Panel */}
        {selectedParcel && (
          <div className="absolute bottom-4 left-4 right-4 max-h-64 overflow-auto bg-card shadow-lg rounded-lg border border-border p-4 z-10">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold">{selectedParcel.properties.address}</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedParcel(null)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Parcel ID</p>
                <p className="font-medium">{selectedParcel.properties.parcelId}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Type</p>
                <p className="font-medium capitalize">{selectedParcel.properties.category}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Owner</p>
                <p className="font-medium">{selectedParcel.properties.owner}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Size</p>
                <p className="font-medium">{selectedParcel.properties.acres} acres</p>
              </div>
              <div>
                <p className="text-muted-foreground">Year Built</p>
                <p className="font-medium">{selectedParcel.properties.yearBuilt}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Assessed Value</p>
                <p className="font-medium">${selectedParcel.properties.assessedValue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Market Value</p>
                <p className="font-medium">${selectedParcel.properties.marketValue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Land Value</p>
                <p className="font-medium">${selectedParcel.properties.landValue.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end space-x-2">
              <Button variant="outline" size="sm">Documents</Button>
              <Button variant="outline" size="sm">History</Button>
              <Button size="sm">Full Details</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DemoMapViewer;