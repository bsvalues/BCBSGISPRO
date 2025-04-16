import React, { useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '../context/auth-context';
import { MapTool, BENTON_COUNTY_CENTER, DEFAULT_ZOOM, BENTON_COUNTY_LAYERS } from '../lib/map-utils';

// Placeholder component for map viewer
const DemoMapViewer: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTool, setActiveTool] = useState<MapTool>(MapTool.SELECT);
  const [activeLayer, setActiveLayer] = useState<string | null>(null);
  const [layerOpacity, setLayerOpacity] = useState<Record<string, number>>({});
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  
  // Group layers by category
  const layersByCategory = BENTON_COUNTY_LAYERS.reduce((acc, layer) => {
    const category = layer.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(layer);
    return acc;
  }, {} as Record<string, typeof BENTON_COUNTY_LAYERS>);
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header/Navigation */}
      <header className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-primary">BentonGeoPro</h1>
            <nav className="ml-10 flex space-x-4">
              <Link href="/dashboard">
                <span className="px-3 py-2 text-sm font-medium rounded-md text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer">
                  Dashboard
                </span>
              </Link>
              <Link href="/map">
                <span className="px-3 py-2 text-sm font-medium rounded-md bg-primary/10 text-primary cursor-pointer">
                  Map Viewer
                </span>
              </Link>
              <Link href="/documents">
                <span className="px-3 py-2 text-sm font-medium rounded-md text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer">
                  Documents
                </span>
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center">
            {user && (
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <p className="font-medium">{user.fullName}</p>
                  <p className="text-muted-foreground">{user.role}</p>
                </div>
                <button 
                  onClick={logout}
                  className="px-3 py-2 text-sm font-medium rounded-md text-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* Map Interface */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-64 bg-card border-r overflow-y-auto">
          {/* Tools Section */}
          <div className="p-4 border-b">
            <h3 className="text-sm font-medium mb-3">Tools</h3>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(MapTool).map((tool) => (
                <button
                  key={tool}
                  className={`p-2 rounded-md flex flex-col items-center justify-center text-xs ${
                    activeTool === tool ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
                  }`}
                  onClick={() => setActiveTool(tool)}
                >
                  <span className="capitalize">{tool.replace('_', ' ')}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Layers Section */}
          <div className="p-4">
            <h3 className="text-sm font-medium mb-3">Layers</h3>
            
            {Object.entries(layersByCategory).map(([category, layers]) => (
              <div key={category} className="mb-4">
                <h4 className="text-xs font-medium text-muted-foreground mb-2">{category}</h4>
                
                {layers.map((layer) => (
                  <div key={layer.id} className="mb-2">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={layer.visible}
                          onChange={() => {
                            // In a real app, would toggle layer visibility
                            console.log(`Toggle layer ${layer.id}`);
                          }}
                          className="rounded text-primary focus:ring-primary mr-2"
                        />
                        <span className="text-sm">{layer.name}</span>
                      </label>
                      
                      <button
                        className={`w-5 h-5 rounded-sm ${
                          activeLayer === layer.id ? 'bg-primary' : 'bg-accent'
                        }`}
                        onClick={() => setActiveLayer(activeLayer === layer.id ? null : layer.id)}
                      />
                    </div>
                    
                    {activeLayer === layer.id && (
                      <div className="mt-2 pl-6">
                        <div className="mb-2">
                          <label className="block text-xs text-muted-foreground mb-1">
                            Opacity: {(layerOpacity[layer.id] || layer.opacity) * 100}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={layerOpacity[layer.id] || layer.opacity}
                            onChange={(e) => {
                              setLayerOpacity({
                                ...layerOpacity,
                                [layer.id]: parseFloat(e.target.value)
                              });
                            }}
                            className="w-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        
        {/* Map Display */}
        <div className="flex-1 bg-accent/20 relative">
          {/* Map placeholder - in a real app, this would be a MapBox or Leaflet component */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-6 bg-card rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-2">Interactive Map</h3>
              <p className="text-muted-foreground mb-4">
                In the actual application, this area would display an interactive map of Benton County
                properties and GIS layers using Mapbox GL or Leaflet.
              </p>
              <div className="bg-accent/20 p-4 rounded-md text-sm text-left">
                <div className="mb-2">
                  <strong>Center:</strong> {BENTON_COUNTY_CENTER.lat.toFixed(4)}, {BENTON_COUNTY_CENTER.lng.toFixed(4)}
                </div>
                <div className="mb-2">
                  <strong>Zoom:</strong> {DEFAULT_ZOOM}
                </div>
                <div className="mb-2">
                  <strong>Active Tool:</strong> {activeTool.replace('_', ' ')}
                </div>
                <div>
                  <strong>Visible Layers:</strong> {BENTON_COUNTY_LAYERS.filter(l => l.visible).map(l => l.name).join(', ')}
                </div>
              </div>
            </div>
          </div>
          
          {/* Map Controls */}
          <div className="absolute top-4 right-4 bg-card shadow-md rounded-md p-2">
            <div className="flex flex-col gap-2">
              <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-accent">
                <span className="text-lg">+</span>
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-accent">
                <span className="text-lg">−</span>
              </button>
              <div className="h-px bg-border my-1" />
              <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-accent">
                <span className="text-sm">⟳</span>
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-accent">
                <span className="text-sm">⌖</span>
              </button>
            </div>
          </div>
          
          {/* Feature Info Panel */}
          <div className="absolute bottom-4 left-4 w-80 bg-card shadow-md rounded-md p-4">
            <h4 className="text-sm font-medium mb-2">Property Information</h4>
            <p className="text-sm text-muted-foreground">
              Select a property on the map to view details.
            </p>
          </div>
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="bg-card border-t p-2 text-xs text-muted-foreground flex justify-between">
        <div>
          Coordinates: {BENTON_COUNTY_CENTER.lat.toFixed(4)}, {BENTON_COUNTY_CENTER.lng.toFixed(4)}
        </div>
        <div>
          Active Tool: <span className="font-medium">{activeTool.replace('_', ' ')}</span>
        </div>
        <div>
          Scale: 1:10,000
        </div>
      </div>
    </div>
  );
};

export default DemoMapViewer;