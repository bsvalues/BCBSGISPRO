import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

// Import leaflet CSS if it's not already imported elsewhere
import 'leaflet/dist/leaflet.css';

// Extend the L namespace to include the Draw control
declare module 'leaflet' {
  namespace Control {
    class Draw extends L.Control {
      constructor(options: DrawConstructorOptions);
    }
  }
  
  namespace Draw {
    let Event: {
      CREATED: string;
      EDITED: string;
      DELETED: string;
    };
  }
  
  interface DrawConstructorOptions {
    position?: L.ControlPosition;
    draw?: {
      polyline?: boolean | any;
      polygon?: boolean | any;
      rectangle?: boolean | any;
      circle?: boolean | any;
      marker?: boolean | any;
      circlemarker?: boolean | any;
    };
    edit?: {
      featureGroup: L.FeatureGroup;
      poly?: {
        allowIntersection?: boolean;
      };
      remove?: boolean;
    };
  }
}

interface DrawControlProps {
  position?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
  onCreated?: (e: any) => void;
  onEdited?: (e: any) => void;
  onDeleted?: (e: any) => void;
  draw?: any;
}

export function DrawControl({
  position = 'topleft',
  onCreated,
  onEdited,
  onDeleted,
  draw = {
    polyline: true,
    polygon: true,
    rectangle: true,
    circle: true,
    marker: true,
    circlemarker: false,
  }
}: DrawControlProps) {
  const map = useMap();
  const [drawControl, setDrawControl] = useState<L.Control.Draw | null>(null);
  const [featureGroup, setFeatureGroup] = useState<L.FeatureGroup | null>(null);

  useEffect(() => {
    // Create a feature group for drawn items
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    setFeatureGroup(drawnItems);

    // Configure the draw control
    const drawControlInstance = new L.Control.Draw({
      position,
      draw,
      edit: {
        featureGroup: drawnItems,
        poly: {
          allowIntersection: false
        },
        remove: true
      }
    });

    // Add the draw control to the map
    map.addControl(drawControlInstance);
    setDrawControl(drawControlInstance);

    // Event handlers
    map.on(L.Draw.Event.CREATED, (e: any) => {
      const layer = e.layer;
      drawnItems.addLayer(layer);
      onCreated && onCreated(e);
    });

    map.on(L.Draw.Event.EDITED, (e: any) => {
      onEdited && onEdited(e);
    });

    map.on(L.Draw.Event.DELETED, (e: any) => {
      onDeleted && onDeleted(e);
    });

    // Cleanup
    return () => {
      if (drawControlInstance) {
        map.removeControl(drawControlInstance);
      }
      
      if (drawnItems) {
        map.removeLayer(drawnItems);
      }
      
      map.off(L.Draw.Event.CREATED);
      map.off(L.Draw.Event.EDITED);
      map.off(L.Draw.Event.DELETED);
    };
  }, [map, position, draw, onCreated, onEdited, onDeleted]);

  return null; // This component doesn't render anything directly
}