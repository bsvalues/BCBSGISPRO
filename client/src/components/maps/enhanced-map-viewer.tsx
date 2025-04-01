import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  GeoJSON, 
  FeatureGroup,
  LayersControl,
  ZoomControl,
  ScaleControl,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-measure/dist/leaflet-measure.css';
import { 
  GeoJSONFeature, 
  MapTool, 
  MapLayerType,
  MeasurementType,
  MeasurementUnit,
  getDefaultLayerStyle
} from '@/lib/map-utils';
import { DrawControl } from './draw-control';
import { MapControls } from './map-controls';
import MeasurementTool from './measurement-tool';
import { MeasurementControl } from './measurement-control';
import LayerFilter from './layer-filter';
import BaseMapSelector from './basemap-selector';
import { Button } from '@/components/ui/button';
import { 
  Map as MapIcon, 
  Ruler, 
  Pencil, 
  HandMetal, 
  Circle, 
  Square, 
  Trash2,
  LineChart,
  MapPin,
  MousePointer2,
  Layers as LayersIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedMapViewerProps {
  width?: string;
  height?: string;
  center?: [number, number];
  zoom?: number;
  initialFeatures?: GeoJSONFeature[];
  mapLayers?: any[];
  onFeaturesChanged?: (features: GeoJSONFeature[]) => void;
  onParcelSelect?: (parcelId: string) => void;
  className?: string;
  initialTool?: MapTool;
  activeTool?: MapTool;
  showDrawTools?: boolean;
  showMeasureTools?: boolean;
  showLayerControl?: boolean;
  readOnly?: boolean;
  disableInteraction?: boolean;
  measurementType?: MeasurementType | null;
  measurementUnit?: MeasurementUnit;
  onMeasure?: (value: number, type: MeasurementType) => void;
}

export interface EnhancedMapViewerRef {
  map: L.Map | null;
  clearMeasurements: () => void;
  setTool: (tool: MapTool) => void;
}

// Helper component to handle map events
const MapEventHandler: React.FC<{ 
  activeTool: MapTool; 
  onParcelClick: (feature: GeoJSONFeature) => void;
  disableInteraction: boolean;
}> = ({ activeTool, onParcelClick, disableInteraction }) => {
  const map = useMap();
  
  useEffect(() => {
    if (disableInteraction) {
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
    } else {
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
    }
  }, [map, disableInteraction]);

  return null;
}

/**
 * An advanced map viewer with drawing, measurement and layer controls
 */
export const EnhancedMapViewer = forwardRef<EnhancedMapViewerRef, EnhancedMapViewerProps>((props, ref) => {
  const {
    width = '100%',
    height = '400px',
    center = [46.23, -119.16], // Benton County, WA
    zoom = 11,
    initialFeatures = [],
    mapLayers = [],
    onFeaturesChanged,
    onParcelSelect,
    className = '',
    initialTool = MapTool.PAN,
    activeTool: propActiveTool,
    showDrawTools = true,
    showMeasureTools = true,
    showLayerControl = true,
    readOnly = false,
    disableInteraction = false,
    measurementType: propMeasurementType,
    measurementUnit: propMeasurementUnit = MeasurementUnit.METERS,
    onMeasure
  } = props;

  const [activeTool, setActiveTool] = useState<MapTool>(initialTool);
  const [basemapType, setBasemapType] = useState<'street' | 'satellite' | 'topo'>('street');
  const [features, setFeatures] = useState<GeoJSONFeature[]>(initialFeatures);
  const [isDrawControlVisible, setIsDrawControlVisible] = useState(false);
  const [selectedLayers, setSelectedLayers] = useState<string[]>([]);
  const featureGroupRef = useRef<L.FeatureGroup>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    map: mapRef.current,
    clearMeasurements: () => {
      // Clear any measurements from the map
      if (mapRef.current) {
        // Implementation depends on measurement library used
      }
    },
    setTool: (tool: MapTool) => {
      setActiveTool(tool);
      if (tool === MapTool.DRAW) {
        setIsDrawControlVisible(true);
      } else {
        setIsDrawControlVisible(false);
      }
    }
  }));

  // Handle base map change
  const handleBaseMapChange = (type: 'street' | 'satellite' | 'topo') => {
    setBasemapType(type);
  };

  // Handle tool selection
  const handleToolChange = (tool: MapTool) => {
    if (activeTool === tool) {
      setActiveTool(MapTool.PAN); // Toggle off
    } else {
      setActiveTool(tool);
      if (tool === MapTool.DRAW) {
        setIsDrawControlVisible(true);
      } else {
        setIsDrawControlVisible(false);
      }
    }
  };

  // Handle feature creation
  const handleFeatureCreate = (feature: GeoJSONFeature) => {
    const newFeatures = [...features, feature];
    setFeatures(newFeatures);
    if (onFeaturesChanged) {
      onFeaturesChanged(newFeatures);
    }
  };

  // Handle feature editing
  const handleFeaturesEdit = (editedFeatures: GeoJSONFeature[]) => {
    // Find and replace the edited features
    const featureIds = editedFeatures.map(f => f.id || JSON.stringify(f.geometry));
    const updatedFeatures = features.map(f => {
      const fId = f.id || JSON.stringify(f.geometry);
      const matchingEditedFeature = editedFeatures.find(
        ef => (ef.id || JSON.stringify(ef.geometry)) === fId
      );
      return matchingEditedFeature || f;
    });
    setFeatures(updatedFeatures);
    if (onFeaturesChanged) {
      onFeaturesChanged(updatedFeatures);
    }
  };

  // Handle feature deletion
  const handleFeaturesDelete = (deletedFeatures: GeoJSONFeature[]) => {
    const featureIds = deletedFeatures.map(f => f.id || JSON.stringify(f.geometry));
    const remainingFeatures = features.filter(f => {
      const fId = f.id || JSON.stringify(f.geometry);
      return !featureIds.includes(fId);
    });
    setFeatures(remainingFeatures);
    if (onFeaturesChanged) {
      onFeaturesChanged(remainingFeatures);
    }
  };

  // Clear all features from the map
  const handleClearFeatures = () => {
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
    }
    setFeatures([]);
    if (onFeaturesChanged) {
      onFeaturesChanged([]);
    }
  };

  // Handle parcel click
  const handleParcelClick = (feature: GeoJSONFeature) => {
    if (onParcelSelect && feature.properties?.parcelId) {
      onParcelSelect(feature.properties.parcelId);
    }
  };

  // Update active tool from prop
  useEffect(() => {
    if (propActiveTool !== undefined) {
      setActiveTool(propActiveTool);
      if (propActiveTool === MapTool.DRAW) {
        setIsDrawControlVisible(true);
      } else {
        setIsDrawControlVisible(false);
      }
    }
  }, [propActiveTool]);

  // Set the map cursor based on the active tool
  useEffect(() => {
    if (!mapRef.current) return;
    
    const container = mapRef.current.getContainer();
    switch (activeTool) {
      case MapTool.PAN:
        container.style.cursor = 'grab';
        break;
      case MapTool.SELECT:
        container.style.cursor = 'pointer';
        break;
      case MapTool.MEASURE:
        container.style.cursor = 'crosshair';
        break;
      case MapTool.DRAW:
        container.style.cursor = 'crosshair';
        break;
      default:
        container.style.cursor = '';
    }
  }, [activeTool, mapRef]);

  // Handle measurement events
  const handleMeasure = (value: number, type: MeasurementType) => {
    if (onMeasure) {
      onMeasure(value, type);
    }
  };

  return (
    <div 
      className={cn(
        'relative border rounded overflow-hidden',
        className
      )}
      style={{ width, height }}
    >
      {/* Toolbar */}
      {!readOnly && (
        <div className="absolute top-2 left-2 z-[1000] bg-white rounded-md shadow-md p-1 flex flex-wrap gap-1">
          <Button 
            size="icon" 
            variant={activeTool === MapTool.PAN ? 'default' : 'outline'} 
            onClick={() => handleToolChange(MapTool.PAN)}
            title="Pan Tool"
            disabled={disableInteraction}
          >
            <HandMetal size={18} />
          </Button>
          <Button 
            size="icon" 
            variant={activeTool === MapTool.SELECT ? 'default' : 'outline'} 
            onClick={() => handleToolChange(MapTool.SELECT)}
            title="Select Features"
            disabled={disableInteraction}
          >
            <MousePointer2 size={18} />
          </Button>
          {showMeasureTools && (
            <Button 
              size="icon" 
              variant={activeTool === MapTool.MEASURE ? 'default' : 'outline'} 
              onClick={() => handleToolChange(MapTool.MEASURE)}
              title="Measure Tool"
              disabled={disableInteraction}
            >
              <Ruler size={18} />
            </Button>
          )}
          {showDrawTools && (
            <>
              <div className="w-px h-6 bg-gray-200 mx-1"></div>
              <Button 
                size="icon" 
                variant={activeTool === MapTool.DRAW ? 'default' : 'outline'} 
                onClick={() => handleToolChange(MapTool.DRAW)}
                title="Drawing Tools"
                disabled={disableInteraction}
              >
                <Pencil size={18} />
              </Button>
              <Button 
                size="icon" 
                variant="outline" 
                onClick={handleClearFeatures}
                title="Clear Features"
                disabled={disableInteraction || features.length === 0}
              >
                <Trash2 size={18} />
              </Button>
            </>
          )}
        </div>
      )}

      {/* The map */}
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height, width }}
        zoomControl={false}
        ref={mapRef}
      >
        {/* Base maps */}
        <BaseMapSelector 
          map={mapRef.current!}
          position="bottomleft"
          initialBaseMap={basemapType}
          onBaseMapChange={handleBaseMapChange}
        />

        {/* Map controls */}
        <ZoomControl position="bottomright" />
        <ScaleControl position="bottomright" imperial={true} metric={true} />
        
        {/* Measurement tools */}
        {activeTool === MapTool.MEASURE && showMeasureTools && (
          <MeasurementTool 
            position="topright"
            measurementType={propMeasurementType || MeasurementType.DISTANCE}
            unit={propMeasurementUnit}
            map={mapRef.current!}
            onMeasure={handleMeasure}
          />
        )}

        {/* Layer control */}
        {showLayerControl && mapLayers.length > 0 && (
          <LayersControl position="topright">
            {mapLayers.map((layer, index) => (
              <LayersControl.Overlay 
                key={`layer-${index}`} 
                name={layer.name} 
                checked={true}
              >
                <GeoJSON 
                  data={layer.data} 
                  style={layer.style || {}} 
                  onEachFeature={(feature, leafletLayer) => {
                    if (activeTool === MapTool.SELECT) {
                      leafletLayer.on({
                        click: () => handleParcelClick(feature as GeoJSONFeature)
                      });
                    }
                  }}
                />
              </LayersControl.Overlay>
            ))}
          </LayersControl>
        )}
        
        {/* Layer filter */}
        {mapLayers.length > 0 && (
          <LayerFilter
            position="topright"
            layers={mapLayers}
            map={mapRef.current!}
            onFilterChange={(filters) => {
              setSelectedLayers(filters);
            }}
          />
        )}

        {/* User-drawn features */}
        <FeatureGroup 
          ref={featureGroupRef}
        >
          {/* Pre-load initial features */}
          {initialFeatures.map((feature, index) => (
            <GeoJSON 
              key={`feature-${index}`} 
              data={feature} 
              style={() => ({
                color: '#3B82F6',
                weight: 2,
                fillOpacity: 0.2,
                fillColor: '#93C5FD'
              })}
            />
          ))}
        </FeatureGroup>

        {/* Drawing controls */}
        {isDrawControlVisible && !readOnly && (
          <DrawControl
            position="topright"
            onCreate={handleFeatureCreate}
            onEdit={handleFeaturesEdit}
            onDelete={handleFeaturesDelete}
            edit={{
              featureGroup: featureGroupRef.current!,
              edit: true,
              remove: true
            }}
          />
        )}
        
        {/* Map event handlers and state management */}
        {/* Using the MapEventHandler component to manage map interactions */}
        <MapEventHandler 
          activeTool={activeTool}
          onParcelClick={handleParcelClick}
          disableInteraction={disableInteraction}
        />
      </MapContainer>
    </div>
  );
});

EnhancedMapViewer.displayName = 'EnhancedMapViewer';

export default EnhancedMapViewer;