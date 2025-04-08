import React from 'react';
import { EsriMapModule } from '../components/maps/esri/EsriMapModule';
import { getMapSettings } from '../components/maps/esri/EsriMapModuleSettings';
import { Globe, Layers, Map as MapIcon } from 'lucide-react';

/**
 * EsriMapPage component that renders a full-page Esri map with controls.
 * 
 * This component uses the EsriMapModule to display an ESRI map with configurable
 * layers and settings.
 */
const EsriMapPage: React.FC = () => {
  const handleMapLoaded = (map: any) => {
    console.log('Esri map loaded:', map);
  };

  const handleLayerClick = (feature: any) => {
    console.log('Layer clicked:', feature);
  };

  // Use default settings and customize as needed
  const mapSettings = getMapSettings({
    mapTitle: 'Benton County GIS Viewer',
    autoSelectMaxRecords: 500
  });

  return (
    <div className="h-screen w-full flex flex-col">
      {/* Page header with controls */}
      <div className="absolute top-16 left-0 right-0 z-10 px-4 py-2 glass-panel backdrop-blur-md bg-background/40 border-b border-primary/10">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/20 text-primary p-1.5 rounded-full">
              <Globe className="h-5 w-5" />
            </div>
            <h1 className="text-lg font-medium">Esri GIS Viewer</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-background/60 backdrop-blur-sm border border-primary/10 shadow-sm p-1.5 rounded-lg hover:bg-background/80 hover:border-primary/20 transition-all duration-200">
              <Layers className="h-5 w-5 text-primary/80" />
            </div>
            <div className="bg-background/60 backdrop-blur-sm border border-primary/10 shadow-sm p-1.5 rounded-lg hover:bg-background/80 hover:border-primary/20 transition-all duration-200">
              <MapIcon className="h-5 w-5 text-primary/80" />
            </div>
          </div>
        </div>
      </div>

      {/* Main map container */}
      <div className="flex-1 w-full h-full">
        <EsriMapModule 
          mapId="benton-county-map"
          center={[-123.262, 44.564]} 
          zoom={12}
          mapSettings={mapSettings}
          onMapLoaded={handleMapLoaded}
          onLayerClick={handleLayerClick}
          className="w-full h-full"
        />
      </div>

      {/* Map attribution */}
      <div className="absolute bottom-4 right-4 z-10 glass-panel backdrop-blur-md bg-background/40 px-3 py-1.5 rounded-lg text-xs border border-primary/10">
        <div className="readable-text">
          Powered by Esri ArcGIS | Benton County GIS
        </div>
      </div>
    </div>
  );
};

export default EsriMapPage;