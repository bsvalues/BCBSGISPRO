import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { GeoJSONFeature } from '@/lib/map-utils';

// Event constants
const CREATED = 'draw:created';
const EDITED = 'draw:edited';
const DELETED = 'draw:deleted';

interface DrawControlProps {
  position?: L.ControlPosition;
  onCreate?: (feature: GeoJSONFeature) => void;
  onEdit?: (features: GeoJSONFeature[]) => void;
  onDelete?: (features: GeoJSONFeature[]) => void;
  onMounted?: (drawControl: L.Control.Draw) => void;
  draw?: {
    polyline?: L.DrawOptions.PolylineOptions | false;
    polygon?: L.DrawOptions.PolygonOptions | false;
    rectangle?: L.DrawOptions.RectangleOptions | false;
    circle?: L.DrawOptions.CircleOptions | false;
    marker?: L.DrawOptions.MarkerOptions | false;
    circlemarker?: L.DrawOptions.CircleMarkerOptions | false;
  };
  edit?: {
    featureGroup: L.FeatureGroup;
    edit?: L.DrawOptions.EditHandlerOptions | false;
    remove?: L.DrawOptions.DeleteHandlerOptions | false;
  };
}

// Extending Leaflet Event types for Draw events
declare module 'leaflet' {
  interface LeafletEvent {
    layer?: L.Layer;
    layers?: {
      getLayers(): L.Layer[];
    };
    layerType?: string;
  }
}

/**
 * React component that adds Leaflet.Draw controls to the map
 */
export function DrawControl({
  position = 'topleft',
  onCreate,
  onEdit,
  onDelete,
  onMounted,
  draw,
  edit,
}: DrawControlProps) {
  const map = useMap();
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const featGroupRef = useRef<L.FeatureGroup | null>(null);

  useEffect(() => {
    // Initialize the FeatureGroup to store editable layers
    if (!featGroupRef.current) {
      featGroupRef.current = edit?.featureGroup || new L.FeatureGroup();
      map.addLayer(featGroupRef.current);
    }

    const featureGroup = featGroupRef.current;

    // Initialize draw control
    const drawOptions = {
      position,
      draw: {
        polyline: {
          shapeOptions: {
            color: '#3B82F6',
            weight: 4
          },
          showLength: true,
          metric: true
        },
        polygon: {
          allowIntersection: false,
          drawError: {
            color: '#EF4444',
            message: '<strong>Error:</strong> Polygon edges cannot cross!'
          },
          shapeOptions: {
            color: '#3B82F6',
            weight: 2,
            fillOpacity: 0.2
          },
          showArea: true,
          metric: true
        },
        rectangle: {
          shapeOptions: {
            color: '#3B82F6',
            weight: 2,
            fillOpacity: 0.2
          },
          showArea: true,
          metric: true
        },
        circle: false,
        circlemarker: false,
        marker: {
          icon: new L.Icon.Default()
        },
        ...draw,
      },
      edit: {
        featureGroup,
        edit: true,
        remove: true,
        ...edit,
      },
    };

    drawControlRef.current = new L.Control.Draw(drawOptions);
    map.addControl(drawControlRef.current);

    if (onMounted && drawControlRef.current) {
      onMounted(drawControlRef.current);
    }

    // Event handler for draw:created
    const handleCreated = (e: L.LeafletEvent) => {
      featureGroup.addLayer(e.layer);
      
      if (onCreate) {
        const geoJSON = e.layer.toGeoJSON() as GeoJSONFeature;
        if (e.layerType) {
          geoJSON.properties = { ...geoJSON.properties, type: e.layerType };
        }
        onCreate(geoJSON);
      }
    };

    // Event handler for draw:edited
    const handleEdited = (e: L.LeafletEvent) => {
      if (onEdit && e.layers) {
        const editedFeatures: GeoJSONFeature[] = [];
        e.layers.getLayers().forEach((layer: any) => {
          const geoJSON = layer.toGeoJSON() as GeoJSONFeature;
          editedFeatures.push(geoJSON);
        });
        onEdit(editedFeatures);
      }
    };

    // Event handler for draw:deleted
    const handleDeleted = (e: L.LeafletEvent) => {
      if (onDelete && e.layers) {
        const deletedFeatures: GeoJSONFeature[] = [];
        e.layers.getLayers().forEach((layer: any) => {
          const geoJSON = layer.toGeoJSON() as GeoJSONFeature;
          deletedFeatures.push(geoJSON);
        });
        onDelete(deletedFeatures);
      }
    };

    // Attach event handlers
    map.on(CREATED, handleCreated);
    map.on(EDITED, handleEdited);
    map.on(DELETED, handleDeleted);

    // Return cleanup function
    return () => {
      map.off(CREATED, handleCreated);
      map.off(EDITED, handleEdited);
      map.off(DELETED, handleDeleted);
      
      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
      }

      // Do not remove featureGroup here as it may be shared with other components
    };
  }, [map, position, onCreate, onEdit, onDelete, onMounted, draw, edit]);

  return null;
}

export default DrawControl;