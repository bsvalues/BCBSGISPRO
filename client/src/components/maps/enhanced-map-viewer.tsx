import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { MapTool, MeasurementType, MeasurementUnit, MapLayer } from '@/lib/map-utils';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default icon issue
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css';
import 'leaflet-defaulticon-compatibility';

// Reference type for EnhancedMapViewer component
export interface EnhancedMapViewerRef {
  getMap: () => any;
  panTo: (lat: number, lng: number) => void;
  setZoom: (zoom: number) => void;
  map?: any;
}

export interface EnhancedMapViewerProps {
  /**
   * Width of the map container
   */
  width?: string | number;
  
  /**
   * Height of the map container
   */
  height?: string | number;
  
  /**
   * Center coordinates [latitude, longitude]
   */
  center?: [number, number];
  
  /**
   * Zoom level
   */
  zoom?: number;
  
  /**
   * Map layers to display
   */
  mapLayers?: MapLayer[];
  
  /**
   * Currently active tool
   */
  activeTool?: MapTool;
  
  /**
   * Callback when a parcel is selected
   */
  onParcelSelect?: (parcelId: string) => void;
  
  /**
   * Whether to show drawing tools
   */
  showDrawTools?: boolean;
  
  /**
   * Whether to show measurement tools
   */
  showMeasureTools?: boolean;
  
  /**
   * Current measurement type
   */
  measurementType?: MeasurementType | null;
  
  /**
   * Measurement unit to use
   */
  measurementUnit?: MeasurementUnit;
  
  /**
   * Callback when a measurement is made
   */
  onMeasure?: (value: number, type?: MeasurementType) => void;
  
  /**
   * Children components to render inside the map
   */
  children?: React.ReactNode;
  
  /**
   * Initial features to display on the map
   */
  initialFeatures?: any[];
  
  /**
   * Callback when features are changed
   */
  onFeaturesChanged?: (features: any[]) => void;
}

/**
 * Enhanced Map Viewer component with support for measurements, drawing, and layer control
 */
export const EnhancedMapViewer = forwardRef<EnhancedMapViewerRef, EnhancedMapViewerProps>(
  ({
    width = '100%',
    height = '100%',
    center = [46.23, -119.16], // Benton County, WA
    zoom = 11,
    mapLayers = [],
    activeTool = MapTool.PAN,
    onParcelSelect,
    showDrawTools = false,
    showMeasureTools = false,
    measurementType = null,
    measurementUnit = MeasurementUnit.FEET,
    onMeasure,
    children,
    initialFeatures = [],
    onFeaturesChanged
  }, ref) => {
    const mapRef = useRef<any>(null);
    
    // Expose imperative methods
    useImperativeHandle(ref, () => ({
      getMap: () => mapRef.current,
      panTo: (lat: number, lng: number) => {
        console.log(`Pan to: ${lat}, ${lng}`);
        // In a real implementation, this would pan the map
      },
      setZoom: (zoom: number) => {
        console.log(`Set zoom: ${zoom}`);
        // In a real implementation, this would set the map zoom
      },
      map: mapRef.current
    }));
    
    // Now using actual Leaflet MapContainer
    return (
      <div
        ref={mapRef}
        className="map-container-3d"
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '0px',
        }}
      >
        {/* Light haze overlay to add depth perception */}
        <div 
          className="absolute inset-0 z-[5] pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0), rgba(0,20,40,0.03))',
            boxShadow: 'inset 0 0 100px rgba(0,0,0,0.05)'
          }}
        />
        
        {/* Map title overlay */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[5] glass-panel px-4 py-2 rounded-full pointer-events-none">
          <div className="text-sm font-semibold readable-text">Benton County GIS</div>
        </div>
        
        {/* Actual Leaflet Map with MapContainer */}
        <MapContainer 
          center={[center[0], center[1]]} 
          zoom={zoom} 
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
          zoomControl={false}
          attributionControl={false}
          className="map-background"
        >
          {/* Custom premium-looking tile layer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          
          {/* Child components (including ParcelOverlay) can now use Leaflet context */}
          {children}
        </MapContainer>
        
        {/* Vignette effect for depth */}
        <div 
          className="absolute inset-0 z-[4] pointer-events-none" 
          style={{
            boxShadow: 'inset 0 0 150px rgba(0,0,0,0.2)',
            background: 'radial-gradient(circle at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.15) 100%)'
          }}
        />
        
        {/* Attribution */}
        <div className="absolute bottom-2 right-2 z-[100] glass-panel text-xs px-2 py-1 rounded opacity-70 hover:opacity-100 transition-opacity">
          &copy; <a href="https://www.openstreetmap.org/copyright" className="text-primary-700 hover:underline">OpenStreetMap</a> contributors
        </div>
        
        {/* Active tool indicator */}
        <div 
          className="absolute bottom-3 left-3 z-[100] glass-panel px-3 py-1.5 rounded-full opacity-80 hover:opacity-100 transition-all"
        >
          <div className="text-xs font-medium readable-text">
            <span className="text-primary-700">Mode:</span> {activeTool}
            {activeTool === MapTool.MEASURE && measurementType && (
              <span> | {measurementType} in {measurementUnit}</span>
            )}
          </div>
        </div>
      </div>
    );
  }
);

EnhancedMapViewer.displayName = 'EnhancedMapViewer';

export default EnhancedMapViewer;