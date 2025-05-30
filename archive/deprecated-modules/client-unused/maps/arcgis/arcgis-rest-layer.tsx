import React, { useEffect, useState } from 'react';
import arcgisRestService, { getMapImageUrl } from '../../../services/arcgis-rest-service';

interface ArcGISRestLayerProps {
  serviceName: string;
  layerId?: number;
  visible?: boolean;
  opacity?: number;
  serviceType?: 'FeatureServer' | 'MapServer';
  onLayerLoaded?: (data: any) => void;
  onLayerError?: (error: Error) => void;
  mapElement?: HTMLDivElement | null;
  refreshInterval?: number; // ms - if provided, will refresh the layer at this interval
}

/**
 * ArcGISRestLayer - Loads and displays ArcGIS REST service layers
 * This components loads real data from ArcGIS REST services but displays it
 * using simplified rendering instead of requiring the full ArcGIS JS SDK
 */
const ArcGISRestLayer: React.FC<ArcGISRestLayerProps> = ({
  serviceName,
  layerId,
  visible = true,
  opacity = 1,
  serviceType = 'MapServer',
  onLayerLoaded,
  onLayerError,
  mapElement,
  refreshInterval
}) => {
  const [layerInfo, setLayerInfo] = useState<any>(null);
  const [layerImage, setLayerImage] = useState<string | null>(null);
  const [layerElement, setLayerElement] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  // Fetch layer information
  useEffect(() => {
    if (!visible) return;
    
    const fetchLayerInfo = async () => {
      try {
        let info;
        
        if (layerId !== undefined) {
          info = await arcgisRestService.getLayerInfo(serviceName, layerId, serviceType);
        } else {
          info = await arcgisRestService.getServiceInfo(serviceName, serviceType);
        }
        
        setLayerInfo(info);
        
        if (onLayerLoaded) {
          onLayerLoaded(info);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        
        if (onLayerError) {
          onLayerError(error);
        }
      }
    };
    
    fetchLayerInfo();
  }, [serviceName, layerId, serviceType, visible]);
  
  // Create and update map image layer
  useEffect(() => {
    if (!visible || !mapElement || !layerInfo) return;
    
    // Get container dimensions for proper image sizing
    const width = mapElement.clientWidth;
    const height = mapElement.clientHeight;
    
    // Create a simplified bounding box based on layer extent
    // This is a simplified approach - in a real implementation, we would
    // use the view's current extent/bbox
    const extent = layerInfo.fullExtent || layerInfo.initialExtent || {
      xmin: -180,
      ymin: -85,
      xmax: 180,
      ymax: 85,
      spatialReference: { wkid: 4326 }
    };
    
    const bbox: [number, number, number, number] = [
      extent.xmin,
      extent.ymin,
      extent.xmax,
      extent.ymax
    ];
    
    // Get map image URL
    const layers = layerId !== undefined ? `show:${layerId}` : 'show:0,1,2,3,4,5,6,7,8,9';
    const imageUrl = getMapImageUrl(serviceName, {
      layers,
      bbox,
      size: [width, height],
      dpi: 96,
      format: 'png32',
      transparent: true
    });
    
    setLayerImage(imageUrl);
    
    // Create image element and add to map
    if (layerImage) {
      const img = document.createElement('img');
      img.src = layerImage;
      img.style.position = 'absolute';
      img.style.left = '0';
      img.style.top = '0';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.opacity = opacity.toString();
      img.style.pointerEvents = 'none';
      img.style.zIndex = '10';
      
      // Append to map element
      if (mapElement) {
        // Remove any previous layer
        if (layerElement) {
          mapElement.removeChild(layerElement);
        }
        
        mapElement.appendChild(img);
        setLayerElement(img);
      }
    }
    
    // Cleanup
    return () => {
      if (layerElement && mapElement && mapElement.contains(layerElement)) {
        mapElement.removeChild(layerElement);
      }
    };
  }, [layerInfo, layerImage, mapElement, visible, opacity]);
  
  // Set up refresh interval if specified
  useEffect(() => {
    if (!refreshInterval || !visible) return;
    
    const interval = setInterval(() => {
      if (layerImage) {
        setLayerImage(layerImage + '&_=' + Date.now());
      }
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval, layerImage, visible]);
  
  // Update opacity when it changes
  useEffect(() => {
    if (layerElement) {
      layerElement.style.opacity = opacity.toString();
    }
  }, [opacity, layerElement]);
  
  // Handle visibility changes
  useEffect(() => {
    if (layerElement) {
      layerElement.style.display = visible ? 'block' : 'none';
    }
  }, [visible, layerElement]);
  
  // This component doesn't render anything directly
  return null;
};

export default ArcGISRestLayer;