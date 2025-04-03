import React, { useState, useRef, useEffect } from 'react';
import MapboxProvider from './mapbox-provider';
import { cn } from '@/lib/utils';

export interface MapboxMapProps {
  id?: string;
  className?: string;
  width?: string | number;
  height?: string | number;
  longitude?: number;
  latitude?: number;
  zoom?: number;
  style?: string;
  children?: React.ReactNode;
  onMapLoad?: (map: mapboxgl.Map) => void;
}

/**
 * MapboxMap component - renders a Mapbox GL JS map with the provided configuration
 */
export function MapboxMap({
  id = 'mapbox-map',
  className,
  width = '100%',
  height = '100%',
  longitude = -119.16, // Benton County, WA
  latitude = 46.23,
  zoom = 11,
  style = 'mapbox://styles/mapbox/streets-v12',
  children,
  onMapLoad
}: MapboxMapProps) {
  // Create a unique ID for the map container if not provided
  const mapId = useRef<string>(id);
  const [mapContainerStyle, setMapContainerStyle] = useState({
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  });

  // Update the map container style if width or height changes
  useEffect(() => {
    setMapContainerStyle({
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height
    });
  }, [width, height]);

  return (
    <div className={cn('mapbox-map-container relative', className)} style={mapContainerStyle}>
      <div
        id={mapId.current}
        className="absolute inset-0 w-full h-full"
        style={{ background: '#e5e7eb' }} // Light gray background while loading
      />
      <MapboxProvider
        mapContainerId={mapId.current}
        initialViewState={{
          longitude,
          latitude,
          zoom
        }}
        mapStyle={style}
        onMapLoad={onMapLoad}
      >
        {children}
      </MapboxProvider>
    </div>
  );
}

export default MapboxMap;