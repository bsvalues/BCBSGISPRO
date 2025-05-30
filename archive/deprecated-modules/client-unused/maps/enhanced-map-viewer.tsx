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
        {/* Atmospheric light effects */}
        <div 
          className="absolute inset-0 z-[5] pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.1), rgba(0,20,40,0.03))',
            boxShadow: 'inset 0 0 150px rgba(0,0,0,0.07)'
          }}
        />
        
        {/* Dynamic light rays effect - creates sense of depth and atmosphere */}
        <div 
          className="absolute inset-0 z-[5] pointer-events-none opacity-20"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.1) 100%)',
            animation: 'pulse 10s ease-in-out infinite alternate'
          }}
        />
        
        {/* Floating title with premium styling */}
        <div 
          className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[15] premium-glass px-5 py-2 rounded-full pointer-events-none floating-ui benton-border"
          style={{
            backdropFilter: 'blur(8px)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 5px 12px -3px rgba(0, 0, 0, 0.05)'
          }}
        >
          <div className="text-sm font-semibold flex items-center gap-2">
            <div className="bg-primary/20 p-1 rounded-full">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 17L12 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8L12 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="gradient-heading">BentonGeoPro</span>
          </div>
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
          // Enhanced map options for smoother interactions
          fadeAnimation={true}
          markerZoomAnimation={true}
          zoomAnimation={true}
        >
          {/* Premium map tile layer with enhanced visuals */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          />
          
          {/* Optional overlay for enhanced visual style */}
          <TileLayer 
            url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
            opacity={0.9}
          />
          
          {/* Child components (including ParcelOverlay) can now use Leaflet context */}
          {children}
        </MapContainer>
        
        {/* Dramatic vignette effect - creates depth and focus */}
        <div 
          className="absolute inset-0 z-[4] pointer-events-none" 
          style={{
            boxShadow: 'inset 0 0 200px rgba(0,0,0,0.25)',
            background: 'radial-gradient(circle at center, rgba(0,0,0,0) 40%, rgba(0,0,0,0.2) 100%)'
          }}
        />
        
        {/* Enhanced corner gradients - 3D-like depth effect */}
        <div className="absolute top-0 left-0 w-[30%] h-[30%] pointer-events-none z-[3] opacity-30"
          style={{
            background: 'radial-gradient(circle at top left, rgba(255,255,255,0.15), transparent 70%)'
          }}
        />
        
        <div className="absolute bottom-0 right-0 w-[30%] h-[30%] pointer-events-none z-[3] opacity-30"
          style={{
            background: 'radial-gradient(circle at bottom right, rgba(0,0,0,0.1), transparent 70%)'
          }}
        />
        
        {/* Elegant attribution with transition effects */}
        <div 
          className="absolute bottom-3 right-3 z-[100] premium-glass text-xs px-3 py-1.5 rounded-full opacity-70 hover:opacity-100 transition-all duration-300"
          style={{ transform: 'translateZ(2px)' }}
        >
          <div className="relative overflow-hidden">
            <span className="relative z-10 text-gray-700">
              &copy; <a href="https://www.openstreetmap.org/copyright" className="text-primary-700 hover:underline">OpenStreetMap</a> contributors
            </span>
          </div>
        </div>
        
        {/* Active tool indicator with premium styling */}
        <div 
          className="absolute bottom-3 left-3 z-[100] premium-glass px-4 py-2 rounded-full opacity-80 hover:opacity-100 transition-all duration-300 btn-3d benton-border"
          style={{ transform: 'translateZ(5px)' }}
        >
          <div className="text-xs font-medium flex items-center gap-2">
            <div className="bg-primary/10 p-1 rounded-full flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 12H12M16 12H12M12 12V8M12 12V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span>
              <span className="gradient-heading">{activeTool}</span>
              {activeTool === MapTool.MEASURE && measurementType && (
                <span className="ml-1 text-gray-600">
                  {measurementType} • {measurementUnit}
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
    );
  }
);

EnhancedMapViewer.displayName = 'EnhancedMapViewer';

export default EnhancedMapViewer;