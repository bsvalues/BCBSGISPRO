import React, { useEffect, useRef } from 'react';

type LayerType = 'feature' | 'tile' | 'dynamic' | 'image' | 'vector' | 'wms' | 'csv' | 'geojson';

interface ArcGISLayerProps {
  view: __esri.MapView;
  url: string;
  type: LayerType;
  opacity?: number;
  visible?: boolean;
  title?: string;
  outFields?: string[];
  onLayerLoaded?: (layer: __esri.Layer) => void;
  onLayerError?: (error: Error) => void;
}

const ArcGISLayer: React.FC<ArcGISLayerProps> = ({
  view,
  url,
  type,
  opacity = 1,
  visible = true,
  title,
  outFields = ['*'],
  onLayerLoaded,
  onLayerError
}) => {
  const layerRef = useRef<__esri.Layer | null>(null);
  
  useEffect(() => {
    // Load appropriate layer module based on type
    let layerPromise: Promise<any>;
    
    switch (type) {
      case 'feature':
        layerPromise = import('@arcgis/core/layers/FeatureLayer').then(({ default: FeatureLayer }) => {
          return new FeatureLayer({
            url,
            opacity,
            visible,
            title: title || `Feature Layer ${url}`,
            outFields
          });
        });
        break;
        
      case 'tile':
        layerPromise = import('@arcgis/core/layers/TileLayer').then(({ default: TileLayer }) => {
          return new TileLayer({
            url,
            opacity,
            visible,
            title: title || `Tile Layer ${url}`
          });
        });
        break;
        
      case 'dynamic':
        layerPromise = import('@arcgis/core/layers/MapImageLayer').then(({ default: MapImageLayer }) => {
          return new MapImageLayer({
            url,
            opacity,
            visible,
            title: title || `Map Image Layer ${url}`
          });
        });
        break;
        
      case 'image':
        layerPromise = import('@arcgis/core/layers/ImageryLayer').then(({ default: ImageryLayer }) => {
          return new ImageryLayer({
            url,
            opacity,
            visible,
            title: title || `Imagery Layer ${url}`
          });
        });
        break;
        
      case 'vector':
        layerPromise = import('@arcgis/core/layers/VectorTileLayer').then(({ default: VectorTileLayer }) => {
          return new VectorTileLayer({
            url,
            opacity,
            visible,
            title: title || `Vector Tile Layer ${url}`
          });
        });
        break;
        
      case 'wms':
        layerPromise = import('@arcgis/core/layers/WMSLayer').then(({ default: WMSLayer }) => {
          return new WMSLayer({
            url,
            opacity,
            visible,
            title: title || `WMS Layer ${url}`
          });
        });
        break;
        
      case 'csv':
        layerPromise = import('@arcgis/core/layers/CSVLayer').then(({ default: CSVLayer }) => {
          return new CSVLayer({
            url,
            opacity,
            visible,
            title: title || `CSV Layer ${url}`
          });
        });
        break;
        
      case 'geojson':
        layerPromise = import('@arcgis/core/layers/GeoJSONLayer').then(({ default: GeoJSONLayer }) => {
          return new GeoJSONLayer({
            url,
            opacity,
            visible,
            title: title || `GeoJSON Layer ${url}`
          });
        });
        break;
        
      default:
        // Default to FeatureLayer if type is not recognized
        layerPromise = import('@arcgis/core/layers/FeatureLayer').then(({ default: FeatureLayer }) => {
          return new FeatureLayer({
            url,
            opacity,
            visible,
            title: title || `Layer ${url}`,
            outFields
          });
        });
    }
    
    // Add the layer to the map
    layerPromise
      .then(layer => {
        // Store reference for cleanup
        layerRef.current = layer;
        
        // Add layer to map's operational layers
        view.map.add(layer);
        
        // Call onLayerLoaded callback if provided
        if (onLayerLoaded) {
          onLayerLoaded(layer);
        }
      })
      .catch(error => {
        console.error('Error adding layer:', error);
        if (onLayerError) {
          onLayerError(error);
        }
      });
      
    // Cleanup function to remove layer when component unmounts
    return () => {
      if (layerRef.current) {
        view.map.remove(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [url, type]); // Only re-run if url or type changes
  
  // Update layer properties if they change
  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.opacity = opacity;
      layerRef.current.visible = visible;
    }
  }, [opacity, visible]);
  
  // This component doesn't render anything directly
  return null;
};

export default ArcGISLayer;