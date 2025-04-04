import { useState, useCallback, useEffect } from 'react';
import { CollaborativeMap } from './collaborative-map';
import { MapboxMap } from './mapbox/mapbox-map';
import mapboxgl from 'mapbox-gl';

interface CollaborativeMapContainerProps {
  roomId: string;
  height?: string | number;
}

export function CollaborativeMapContainer({ roomId, height = '500px' }: CollaborativeMapContainerProps) {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);

  // Handle map creation
  const handleMapCreated = useCallback((mapInstance: mapboxgl.Map) => {
    setMap(mapInstance);
  }, []);

  // Initial map location (Benton County, Oregon)
  const initialCenter: [number, number] = [-123.3617, 44.5646];
  const initialZoom = 10;

  const containerStyle = {
    height: typeof height === 'number' ? `${height}px` : height,
    width: '100%',
    position: 'relative' as const,
  };

  return (
    <div style={containerStyle}>
      <MapboxMap
        initialCenter={initialCenter}
        initialZoom={initialZoom}
        onMapCreated={handleMapCreated}
        width="100%"
        height="100%"
      >
        {map && <CollaborativeMap map={map} roomId={roomId} />}
      </MapboxMap>
    </div>
  );
}