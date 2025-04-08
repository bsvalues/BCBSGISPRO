import React, { useRef, useEffect, useState } from 'react';
import { loadModules } from 'esri-loader';
import { EsriMapModuleSettings } from './EsriMapModuleSettings';

interface EsriMapModuleProps {
  mapSettings: EsriMapModuleSettings;
  className?: string;
  onMapLoaded?: (map: any) => void;
  onLayerClick?: (feature: any) => void;
}

/**
 * EsriMapModule - The Esri Map component using ArcGIS JavaScript API
 * 
 * Uses esri-loader to load the ArcGIS JavaScript API and initialize the map.
 */
export const EsriMapModule: React.FC<EsriMapModuleProps> = ({
  mapSettings,
  className = '',
  onMapLoaded,
  onLayerClick,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [viewLoaded, setViewLoaded] = useState(false);
  const [mapView, setMapView] = useState<any>(null);
  const [map, setMap] = useState<any>(null);
  
  useEffect(() => {
    let view: any;
    let esriMap: any;
    
    const initializeMap = async () => {
      try {
        // Load the required modules
        const [Map, MapView, Basemap, FeatureLayer] = await loadModules([
          'esri/Map',
          'esri/views/MapView',
          'esri/Basemap',
          'esri/layers/FeatureLayer'
        ]);
        
        // Create the map with the specified basemap
        esriMap = new Map({
          basemap: mapSettings.baseMap.type || 'topo-vector'
        });
        
        // Create the view
        view = new MapView({
          container: mapRef.current || '',
          map: esriMap,
          center: mapSettings.center || [-123.2615, 44.5646], // Default to Benton County, Oregon
          zoom: mapSettings.zoom || 12,
          padding: mapSettings.padding || { top: 50, right: 0, bottom: 0, left: 0 },
          constraints: {
            snapToZoom: true,
            rotationEnabled: false
          },
          ui: {
            components: ["attribution", "zoom"]
          }
        });
        
        // Wait for the view to be ready
        await view.when();
        setViewLoaded(true);
        setMapView(view);
        setMap(esriMap);
        
        // Add the Benton County basemap feature layer if specified
        if (mapSettings.bentonCountyBasemap?.visible) {
          const bentonBasemap = new FeatureLayer({
            url: "https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services/Benton_County_Basemap/FeatureServer/0",
            title: "Benton County Basemap",
            opacity: 0.8,
            visible: true
          });
          esriMap.add(bentonBasemap, 0);
          console.log("Added base layer: Benton County Basemap");
        }
        
        // Add Benton County parcel features if specified
        if (mapSettings.bentonCountyParcels?.visible) {
          const parcelLayer = new FeatureLayer({
            url: "https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services/Benton_County_Parcels/FeatureServer/0",
            title: "Benton County Parcels",
            visible: true
          });
          esriMap.add(parcelLayer);
          console.log("Added feature layer: Benton County Parcels");
        }
        
        // Add Benton County road features if specified
        if (mapSettings.bentonCountyRoads?.visible) {
          const roadLayer = new FeatureLayer({
            url: "https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services/Benton_County_Roads/FeatureServer/0",
            title: "Benton County Roads",
            visible: true
          });
          esriMap.add(roadLayer);
          console.log("Added feature layer: Benton County Roads");
        }
        
        // Add Benton County building features if specified
        if (mapSettings.bentonCountyBuildings?.visible) {
          const buildingLayer = new FeatureLayer({
            url: "https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services/Benton_County_Buildings/FeatureServer/0",
            title: "Benton County Buildings",
            visible: false
          });
          esriMap.add(buildingLayer);
          console.log("Added feature layer: Benton County Buildings");
        }
        
        // Set up click event handler
        if (onLayerClick) {
          view.on("click", (event: any) => {
            view.hitTest(event).then((hitTestResult: any) => {
              if (hitTestResult.results.length > 0) {
                const feature = hitTestResult.results[0].graphic;
                onLayerClick(feature);
              }
            });
          });
        }
        
        // Call onMapLoaded callback
        if (onMapLoaded) {
          onMapLoaded(esriMap);
        }
      } catch (error) {
        console.error("Error initializing Esri map:", error);
      }
    };

    if (mapRef.current) {
      initializeMap();
    }

    // Clean up the map when component unmounts
    return () => {
      if (view) {
        view.destroy();
      }
    };
  }, [mapSettings, onMapLoaded, onLayerClick]);

  // Additional effect to handle map settings changes
  useEffect(() => {
    if (!viewLoaded || !map) return;
    
    // Update map based on new mapSettings here if needed
    map.basemap = mapSettings.baseMap.type || 'topo-vector';
    
    // Update other settings as needed
  }, [viewLoaded, map, mapSettings]);

  return (
    <div className={`esri-map-container ${className}`} ref={mapRef} style={{ width: '100%', height: '100%' }}>
      {!viewLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-2 text-sm text-primary font-medium">Loading Map...</p>
          </div>
        </div>
      )}
    </div>
  );
};