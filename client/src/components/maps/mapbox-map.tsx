import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// You would normally store this in an environment variable
// For demo purposes, using a public token (restricted by URL)
// In production, you should use your own Mapbox token and store it securely
const MAPBOX_TOKEN = 'pk.eyJ1IjoiYmVudG9uZ2VvcHJvIiwiYSI6ImNsczFqbWJ6MTA2ZTUyanA5bzVpbW85emQifQ.PSRlMX1ZfSlU4mHihGH3uA';

interface MapboxMapProps {
  center?: [number, number];
  zoom?: number;
  style?: string;
  className?: string;
}

const MapboxMap: React.FC<MapboxMapProps> = ({
  center = [-123.2620, 44.5646], // Default center at Benton County, OR
  zoom = 12,
  style = 'mapbox://styles/mapbox/streets-v11',
  className = 'h-full w-full'
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;
    
    // Initialize Mapbox
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style,
      center,
      zoom,
      attributionControl: true,
      preserveDrawingBuffer: true
    });
    
    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Add scale
    map.current.addControl(new mapboxgl.ScaleControl({
      maxWidth: 100,
      unit: 'imperial'
    }), 'bottom-left');
    
    // Add fullscreen control
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    
    // Add geolocation control
    map.current.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true
    }), 'top-right');
    
    // Handle map load completion
    map.current.on('load', () => {
      setLoaded(true);
    });
    
    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);
  
  // Update map when props change
  useEffect(() => {
    if (map.current && loaded) {
      map.current.setCenter(center);
      map.current.setZoom(zoom);
      map.current.setStyle(style);
    }
  }, [center, zoom, style, loaded]);
  
  return (
    <div className={className} ref={mapContainer} />
  );
};

export default MapboxMap;