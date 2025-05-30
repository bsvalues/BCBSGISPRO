/**
 * CountyMapViewer Props Interface
 * 
 * This file defines the prop interface for the CountyMapViewer component,
 * using the standardized types from the shared types library.
 */

import { Coordinates, MapProvider, Layer, MapViewState } from '../../../../libs/types';

/**
 * Props for the CountyMapViewer component
 */
export interface CountyMapViewerProps {
  // Map provider (mapbox, leaflet, arcgis)
  provider: MapProvider;
  
  // API key for map provider (if needed)
  apiKey?: string;
  
  // Initial map center coordinates
  center: [number, number] | Coordinates;
  
  // Initial zoom level
  zoom: number;
  
  // Optional bearing (for 3D maps)
  bearing?: number;
  
  // Optional pitch (for 3D maps)
  pitch?: number;
  
  // Map style URL or identifier
  mapStyle?: string;
  
  // Layers to display
  layers?: Layer[];
  
  // Whether to show controls
  showControls?: boolean;
  
  // Whether map is interactive
  interactive?: boolean;
  
  // Whether to preserve drawing state
  preserveDrawingBuffer?: boolean;
  
  // Base map attribution text
  attribution?: string;
  
  // Component styles
  style?: React.CSSProperties;
  
  // Component className
  className?: string;
  
  // Event handlers
  onMapLoad?: (map: any) => void;
  onMapMove?: (viewState: MapViewState) => void;
  onMapClick?: (event: { lngLat: [number, number], features?: any[] }) => void;
  onFeatureClick?: (feature: any) => void;
  onFeatureHover?: (feature: any) => void;
  onError?: (error: Error) => void;
}