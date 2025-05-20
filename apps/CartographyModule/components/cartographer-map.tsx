/**
 * Cartographer Map Component
 * 
 * A high-level map component that provides advanced cartographic capabilities,
 * including drawing, measurement, and layer management.
 */

import React, { useState, useEffect, useRef } from 'react';
import { MapboxMap } from './mapbox/mapbox-map';
import { ArcGISMap } from './arcgis/arcgis-map';
import { LeafletMap } from './leaflet/leaflet-map';
import { DrawControl } from './draw-control';
import { MeasurementTool } from './measurement-tool';
import { LayerFilter } from './layer-filter';
import { MapPreferencesPanel } from './map-preferences-panel';
import { useMapSettings } from '../hooks/use-map-settings';
import { useLayerState } from '../hooks/use-layer-state';
import { useDrawState } from '../hooks/use-draw-state';
import { useMeasurementState } from '../hooks/use-measurement-state';
import { GeoJSONFeature, MapProvider } from '../types';

export interface CartographerMapProps {
  width?: string;
  height?: string;
  center?: [number, number];
  zoom?: number;
  initialFeatures?: GeoJSONFeature[];
  mapLayers?: any[];
  onFeaturesChanged?: (features: GeoJSONFeature[]) => void;
  className?: string;
  showPrecisionTools?: boolean;
  provider?: MapProvider;
}

/**
 * CartographerMap is a high-level map component that provides 
 * advanced cartographic capabilities
 */
const CartographerMap: React.FC<CartographerMapProps> = ({
  width = '100%',
  height = '500px',
  center = [-119.5, 47.4], // Default to Washington state center
  zoom = 10,
  initialFeatures = [],
  mapLayers = [],
  onFeaturesChanged,
  className = '',
  showPrecisionTools = false,
  provider = 'mapbox'
}) => {
  // Use our custom hooks for state management
  const { settings, updateSettings } = useMapSettings();
  const { layers, toggleLayer, setLayerOpacity } = useLayerState(mapLayers);
  const { features, addFeature, updateFeature, removeFeature } = useDrawState(initialFeatures);
  const { 
    measurementActive, 
    startMeasurement, 
    endMeasurement,
    measurements
  } = useMeasurementState();

  // State for UI panels
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [activeTool, setActiveTool] = useState<'draw' | 'measure' | 'select' | null>(null);
  
  // Container ref for getting dimensions
  const containerRef = useRef<HTMLDivElement>(null);

  // Notify parent of feature changes
  useEffect(() => {
    if (onFeaturesChanged) {
      onFeaturesChanged(features);
    }
  }, [features, onFeaturesChanged]);

  // Handle draw mode activation
  const handleDrawActivate = () => {
    setActiveTool('draw');
    if (measurementActive) {
      endMeasurement();
    }
  };

  // Handle measurement mode activation
  const handleMeasureActivate = () => {
    setActiveTool('measure');
    startMeasurement();
  };

  // Handle select mode activation
  const handleSelectActivate = () => {
    setActiveTool('select');
    if (measurementActive) {
      endMeasurement();
    }
  };

  // Handle feature creation
  const handleFeatureCreated = (feature: GeoJSONFeature) => {
    addFeature(feature);
  };

  // Handle feature update
  const handleFeatureUpdated = (feature: GeoJSONFeature) => {
    updateFeature(feature);
  };

  // Handle feature deletion
  const handleFeatureDeleted = (featureId: string) => {
    removeFeature(featureId);
  };

  // Render the appropriate map based on provider
  const renderMap = () => {
    const mapProps = {
      width,
      height,
      center,
      zoom,
      features,
      layers,
      onFeatureCreated: handleFeatureCreated,
      onFeatureUpdated: handleFeatureUpdated,
      onFeatureDeleted: handleFeatureDeleted,
      activeTool,
      measurementActive
    };

    switch (provider) {
      case 'arcgis':
        return <ArcGISMap {...mapProps} />;
      case 'leaflet':
        return <LeafletMap {...mapProps} />;
      case 'mapbox':
      default:
        return <MapboxMap {...mapProps} />;
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`cartographer-map-container ${className}`}
      style={{ width, height, position: 'relative' }}
    >
      {renderMap()}
      
      {/* Map controls */}
      <div className="cartographer-map-controls">
        <button 
          onClick={() => setShowLayerPanel(!showLayerPanel)}
          className={`map-control-button ${showLayerPanel ? 'active' : ''}`}
        >
          Layers
        </button>
        <button 
          onClick={handleDrawActivate}
          className={`map-control-button ${activeTool === 'draw' ? 'active' : ''}`}
        >
          Draw
        </button>
        <button 
          onClick={handleMeasureActivate}
          className={`map-control-button ${activeTool === 'measure' ? 'active' : ''}`}
        >
          Measure
        </button>
        <button 
          onClick={handleSelectActivate}
          className={`map-control-button ${activeTool === 'select' ? 'active' : ''}`}
        >
          Select
        </button>
        <button 
          onClick={() => setShowSettingsPanel(!showSettingsPanel)}
          className={`map-control-button ${showSettingsPanel ? 'active' : ''}`}
        >
          Settings
        </button>
      </div>
      
      {/* Layer panel */}
      {showLayerPanel && (
        <LayerFilter 
          layers={layers}
          onToggleLayer={toggleLayer}
          onSetLayerOpacity={setLayerOpacity}
          onClose={() => setShowLayerPanel(false)}
        />
      )}
      
      {/* Settings panel */}
      {showSettingsPanel && (
        <MapPreferencesPanel 
          settings={settings}
          onUpdateSettings={updateSettings}
          onClose={() => setShowSettingsPanel(false)}
        />
      )}
      
      {/* Precision drawing tools */}
      {showPrecisionTools && activeTool === 'draw' && (
        <div className="precision-drawing-tools">
          <DrawControl 
            onFeatureCreated={handleFeatureCreated}
            onFeatureUpdated={handleFeatureUpdated}
            onFeatureDeleted={handleFeatureDeleted}
          />
        </div>
      )}
      
      {/* Measurement results */}
      {activeTool === 'measure' && measurements.length > 0 && (
        <div className="measurement-results">
          <h3>Measurements</h3>
          <ul>
            {measurements.map((m, index) => (
              <li key={index}>
                {m.type}: {m.value} {m.unit}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CartographerMap;