import React, { useState, useEffect } from 'react';
import { EsriMapModule } from '../components/maps/esri/EsriMapModule';
import { getMapSettings } from '../components/maps/esri/EsriMapModuleSettings';
import { CheckCircle2, Layers, ChevronRight, Settings, Map } from 'lucide-react';

/**
 * EsriMapPage - The main Esri Map page component
 * 
 * This component renders the Esri Map with a sidebar for layer controls,
 * using ArcGIS JavaScript API integration via the EsriMapModule.
 */
const EsriMapPage: React.FC = () => {
  const [map, setMap] = useState<any>(null);
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [currentBaseMap, setCurrentBaseMap] = useState('topo-vector');
  
  // Handle the map loaded event
  const handleMapLoaded = (mapInstance: any) => {
    setMap(mapInstance);
    setIsLoading(false);
    console.log('Esri map loaded:', mapInstance);
  };

  // Handle feature click event
  const handleFeatureClick = (feature: any) => {
    if (feature && feature.attributes) {
      console.log('Feature clicked:', feature.attributes);
      // You can show details in a panel or modal here
    }
  };

  // Toggle the layer panel
  const toggleLayerPanel = () => {
    setIsLayerPanelOpen(!isLayerPanelOpen);
  };

  // Change the base map
  const changeBaseMap = (baseMapId: string) => {
    if (map) {
      setCurrentBaseMap(baseMapId);
      map.basemap = baseMapId;
    }
  };

  return (
    <div className="relative h-screen w-full flex">
      {/* Side Panel */}
      <div 
        className={`absolute top-[70px] left-0 bottom-0 z-30 transition-all duration-300 
                   ${isLayerPanelOpen ? 'translate-x-0' : '-translate-x-[calc(100%-40px)]'}`}
        style={{
          width: '300px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}
      >
        {/* Panel Content */}
        <div className="h-full glass-panel backdrop-blur-md bg-background/70 border-r border-primary/10 flex flex-col">
          {/* Panel Header */}
          <div className="p-4 border-b border-primary/10 flex items-center justify-between bg-background/80">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <h3 className="font-medium text-primary">Map Layers</h3>
            </div>
            <button 
              onClick={toggleLayerPanel}
              className={`p-1.5 rounded-full transition-all duration-300 hover:bg-primary/10 ${isLayerPanelOpen ? 'rotate-0' : 'rotate-180'}`}
            >
              <ChevronRight className="h-5 w-5 text-primary" />
            </button>
          </div>
          
          {/* Panel Body - visible only when open */}
          <div className={`flex-grow overflow-y-auto ${isLayerPanelOpen ? 'block' : 'hidden'}`}>
            {/* Base Maps Section */}
            <div className="p-4 border-b border-primary/10">
              <h4 className="font-medium text-sm mb-2 text-primary/90 flex items-center gap-1">
                <Map className="h-4 w-4" />
                Base Maps
              </h4>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button 
                  onClick={() => changeBaseMap('topo-vector')}
                  className={`p-3 rounded-lg text-xs font-medium relative 
                            ${currentBaseMap === 'topo-vector' 
                              ? 'bg-primary/10 text-primary shadow-inner border border-primary/20' 
                              : 'bg-background/80 hover:bg-background border border-primary/5 hover:border-primary/20'}`}
                >
                  {currentBaseMap === 'topo-vector' && (
                    <CheckCircle2 className="h-3.5 w-3.5 absolute top-1.5 right-1.5 text-primary" />
                  )}
                  Topographic
                </button>
                <button 
                  onClick={() => changeBaseMap('satellite')}
                  className={`p-3 rounded-lg text-xs font-medium relative 
                            ${currentBaseMap === 'satellite' 
                              ? 'bg-primary/10 text-primary shadow-inner border border-primary/20' 
                              : 'bg-background/80 hover:bg-background border border-primary/5 hover:border-primary/20'}`}
                >
                  {currentBaseMap === 'satellite' && (
                    <CheckCircle2 className="h-3.5 w-3.5 absolute top-1.5 right-1.5 text-primary" />
                  )}
                  Satellite
                </button>
                <button 
                  onClick={() => changeBaseMap('streets-vector')}
                  className={`p-3 rounded-lg text-xs font-medium relative 
                            ${currentBaseMap === 'streets-vector' 
                              ? 'bg-primary/10 text-primary shadow-inner border border-primary/20' 
                              : 'bg-background/80 hover:bg-background border border-primary/5 hover:border-primary/20'}`}
                >
                  {currentBaseMap === 'streets-vector' && (
                    <CheckCircle2 className="h-3.5 w-3.5 absolute top-1.5 right-1.5 text-primary" />
                  )}
                  Streets
                </button>
                <button 
                  onClick={() => changeBaseMap('hybrid')}
                  className={`p-3 rounded-lg text-xs font-medium relative 
                            ${currentBaseMap === 'hybrid' 
                              ? 'bg-primary/10 text-primary shadow-inner border border-primary/20' 
                              : 'bg-background/80 hover:bg-background border border-primary/5 hover:border-primary/20'}`}
                >
                  {currentBaseMap === 'hybrid' && (
                    <CheckCircle2 className="h-3.5 w-3.5 absolute top-1.5 right-1.5 text-primary" />
                  )}
                  Hybrid
                </button>
              </div>
            </div>
            
            {/* Benton County Layers Section */}
            <div className="p-4">
              <h4 className="font-medium text-sm mb-2 text-primary/90 flex items-center gap-1">
                <Layers className="h-4 w-4" />
                Benton County Layers
              </h4>
              <div className="space-y-2 mt-3">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-background/80 border border-primary/5 hover:border-primary/20">
                  <span className="text-sm">Parcels</span>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-4 bg-primary/20 rounded-full relative">
                      <div className="absolute inset-0 flex items-center px-0.5">
                        <div className="w-3 h-3 rounded-full bg-primary shadow-sm"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-background/80 border border-primary/5 hover:border-primary/20">
                  <span className="text-sm">Roads</span>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-4 bg-primary/20 rounded-full relative">
                      <div className="absolute inset-0 flex items-center px-0.5">
                        <div className="w-3 h-3 rounded-full bg-primary shadow-sm"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-background/80 border border-primary/5 hover:border-primary/20">
                  <span className="text-sm">Buildings</span>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-4 bg-primary/20 rounded-full relative">
                      <div className="absolute inset-0 flex items-center justify-end px-0.5">
                        <div className="w-3 h-3 rounded-full bg-muted shadow-sm"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Panel Footer */}
          <div className={`p-3 border-t border-primary/10 ${isLayerPanelOpen ? 'block' : 'hidden'}`}>
            <button className="w-full py-2 rounded-lg bg-background hover:bg-background/80 border border-primary/10 text-sm font-medium text-primary flex items-center justify-center gap-1.5">
              <Settings className="h-4 w-4" />
              Advanced Settings
            </button>
          </div>
        </div>
      </div>
      
      {/* Map Container */}
      <div className="absolute inset-0 pt-[60px] z-10">
        <EsriMapModule 
          className="w-full h-full"
          mapSettings={getMapSettings({
            baseMap: {
              type: currentBaseMap,
              enableSelection: true,
              order: 0,
              visible: true
            }
          })}
          onMapLoaded={handleMapLoaded}
          onLayerClick={handleFeatureClick}
        />
      </div>
    </div>
  );
};

export default EsriMapPage;