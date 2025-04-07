import React, { useEffect, useState } from 'react';
import { loadModules } from '@esri/react-arcgis';

interface LayerProps {
  url: string;
  id?: string;
  visible?: boolean;
  opacity?: number;
  view: __esri.MapView;
  type: 'feature' | 'tile' | 'vector' | 'graphics' | 'wms';
  outFields?: string[];
  renderer?: __esri.Renderer;
  popupTemplate?: __esri.PopupTemplate;
  filter?: __esri.FeatureFilter;
  onLayerLoaded?: (layer: __esri.Layer) => void;
}

export const ArcGISLayer: React.FC<LayerProps> = ({
  url,
  id,
  visible = true,
  opacity = 1,
  view,
  type,
  outFields = ['*'],
  renderer,
  popupTemplate,
  filter,
  onLayerLoaded
}) => {
  const [layer, setLayer] = useState<__esri.Layer | null>(null);

  useEffect(() => {
    if (!view) return;

    const loadLayer = async () => {
      try {
        let layerModule;
        let layerOptions: Record<string, any> = {
          url,
          id: id || `layer-${Date.now()}`,
          visible,
          opacity,
          outFields
        };

        // Load appropriate layer module
        switch (type) {
          case 'feature':
            const [FeatureLayer] = await loadModules(['esri/layers/FeatureLayer']);
            if (renderer) layerOptions.renderer = renderer;
            if (popupTemplate) layerOptions.popupTemplate = popupTemplate;
            if (filter) layerOptions.definitionExpression = filter;
            layerModule = new FeatureLayer(layerOptions);
            break;
          case 'tile':
            const [TileLayer] = await loadModules(['esri/layers/TileLayer']);
            layerModule = new TileLayer(layerOptions);
            break;
          case 'vector':
            const [VectorTileLayer] = await loadModules(['esri/layers/VectorTileLayer']);
            layerModule = new VectorTileLayer(layerOptions);
            break;
          case 'graphics':
            const [GraphicsLayer] = await loadModules(['esri/layers/GraphicsLayer']);
            layerModule = new GraphicsLayer(layerOptions);
            break;
          case 'wms':
            const [WMSLayer] = await loadModules(['esri/layers/WMSLayer']);
            layerModule = new WMSLayer(layerOptions);
            break;
          default:
            console.error(`Unsupported layer type: ${type}`);
            return;
        }

        // Add layer to map
        view.map.add(layerModule);
        setLayer(layerModule);

        if (onLayerLoaded) {
          onLayerLoaded(layerModule);
        }

        // Cleanup on unmount
        return () => {
          if (layerModule && view.map) {
            view.map.remove(layerModule);
          }
        };
      } catch (error) {
        console.error(`Error loading ${type} layer:`, error);
      }
    };

    loadLayer();
  }, [url, view]);

  // Update layer properties when props change
  useEffect(() => {
    if (layer) {
      layer.visible = visible;
      layer.opacity = opacity;
    }
  }, [layer, visible, opacity]);

  return null;
};

export default ArcGISLayer;