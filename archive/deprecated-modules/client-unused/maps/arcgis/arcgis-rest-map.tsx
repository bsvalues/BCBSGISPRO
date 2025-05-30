import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Slider } from '../../../components/ui/slider';
import { Checkbox } from '../../../components/ui/checkbox';
import { Label } from '../../../components/ui/label';
import { Loader2 } from 'lucide-react';
import arcgisRestService, { 
  fetchServiceList, 
  fetchServiceInfo,
  getMapImageUrl 
} from '../../../services/arcgis-rest-service';
import { Layer, DEFAULT_PARCELS_LAYER } from '../../../constants/layer-constants';

interface ArcGISRestMapProps {
  width?: string | number;
  height?: string | number;
  initialCenter?: [number, number];
  initialZoom?: number;
  showControls?: boolean;
  layers?: Layer[];
}

/**
 * ArcGIS REST Map Component
 * 
 * This component uses the ArcGIS REST service to display a map with layers
 * from the specified endpoint. It does not require the ArcGIS JavaScript API.
 */
const ArcGISRestMap: React.ForwardRefRenderFunction<any, ArcGISRestMapProps> = (props, ref) => {
  const {
    width = '100%',
    height = '600px',
    initialCenter = [-123.3617, 44.5646], // Benton County, Oregon
    initialZoom = 12,
    showControls = true,
    layers: externalLayers = []
  } = props;
  const [services, setServices] = useState<any[]>([]);
  const [layers, setLayers] = useState<Layer[]>([DEFAULT_PARCELS_LAYER]); // Start with DEFAULT_PARCELS_LAYER
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [center, setCenter] = useState<[number, number]>(initialCenter);
  const [zoom, setZoom] = useState(initialZoom);
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState(false);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  
  // Expose methods to parent component via forwardRef
  useImperativeHandle(ref, () => ({
    addLayer,
    removeLayer,
    toggleLayerVisibility,
    updateLayerOpacity,
    moveLayer,
    setCenter,
    setZoom,
    getLayers: () => layers
  }));
  
  // Handle external layers when they change
  useEffect(() => {
    if (externalLayers && externalLayers.length > 0) {
      console.log('External layers provided:', externalLayers);
      
      // Check if the DEFAULT_PARCELS_LAYER is included in the external layers
      const hasDefaultParcelsLayer = externalLayers.some(
        layer => layer.id === DEFAULT_PARCELS_LAYER.id || 
                (layer.serviceName === DEFAULT_PARCELS_LAYER.serviceName && 
                 layer.serviceType === DEFAULT_PARCELS_LAYER.serviceType)
      );
      
      // If the default parcels layer is not included, add it to the layers
      if (!hasDefaultParcelsLayer) {
        console.log('Adding DEFAULT_PARCELS_LAYER to external layers');
        setLayers([DEFAULT_PARCELS_LAYER, ...externalLayers]);
      } else {
        setLayers(externalLayers);
      }
    }
  }, [externalLayers]);
  
  // Add a new layer from a service
  const addLayer = async (serviceName: string, serviceType: 'FeatureServer' | 'MapServer' = 'MapServer') => {
    try {
      setLoading(true);
      console.log(`Adding layer from service: ${serviceName} (${serviceType})`);
      
      // Check if this layer already exists to prevent duplicates
      const existingLayer = layers.find(
        layer => layer.serviceName === serviceName && 
                 layer.serviceType === serviceType &&
                 (serviceType === 'MapServer' || layer.layerId === undefined)
      );
      
      if (existingLayer) {
        console.log(`Layer ${serviceName} (${serviceType}) already exists, skipping`);
        setLoading(false);
        return;
      }
      
      // Try a direct fetch for debugging
      const directUrl = `https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services/${serviceName}/${serviceType}?f=json`;
      console.log('Fetching from:', directUrl);
      
      let directInfo = null;
      try {
        const directResponse = await fetch(directUrl);
        directInfo = await directResponse.json();
        console.log('Direct service info:', directInfo);
      } catch (directErr) {
        console.warn('Direct fetch failed:', directErr);
      }
      
      // Now use our module
      console.log('Fetching using our service module...');
      const serviceInfo = await fetchServiceInfo(serviceName, serviceType);
      console.log('Service info from our module:', serviceInfo);
      
      if (serviceType === 'MapServer') {
        console.log('Adding MapServer layer');
        // Add the entire map service as one layer
        const newLayer: Layer = {
          id: `${serviceName}-${serviceType}-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Add timestamp and random number to ensure uniqueness
          name: serviceInfo.documentInfo?.Title || serviceInfo.mapName || serviceName,
          visible: true,
          opacity: 1,
          serviceName,
          serviceType
        };
        
        console.log('New layer:', newLayer);
        setLayers(prev => [...prev, newLayer]);
      } else if (serviceInfo.layers && serviceInfo.layers.length > 0) {
        console.log(`Adding ${serviceInfo.layers.length} FeatureServer layers`);
        // Add each layer in the feature service individually
        // First check for any existing layers with the same IDs
        const existingLayerIds = new Set(layers.map(l => l.id));
        
        const newLayers = serviceInfo.layers.map((layer: any) => {
          // Ensure unique ID by adding a timestamp and random number
          const baseId = `${serviceName}-${serviceType}-${layer.id}`;
          const id = existingLayerIds.has(baseId) ? 
            `${baseId}-${Date.now()}-${Math.floor(Math.random() * 1000)}` : 
            `${baseId}-${Math.floor(Math.random() * 1000)}`;
          
          return {
            id,
            name: layer.name,
            visible: true,
            opacity: 1,
            serviceName,
            layerId: layer.id,
            serviceType
          };
        });
        
        console.log('New layers:', newLayers);
        setLayers(prev => [...prev, ...newLayers]);
      } else {
        console.warn('No valid layers found in service info');
        
        // Add a fallback layer for testing
        const fallbackLayer: Layer = {
          id: `${serviceName}-${serviceType}-fallback-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Add timestamp and random number to ensure uniqueness
          name: `${serviceName} (Fallback)`,
          visible: true,
          opacity: 1,
          serviceName,
          serviceType
        };
        
        console.log('Adding fallback layer:', fallbackLayer);
        setLayers(prev => [...prev, fallbackLayer]);
      }
      
      setLoading(false);
      setSelectedService(null);
    } catch (err) {
      setError(`Failed to add layer from ${serviceName}`);
      setLoading(false);
      console.error('Error adding layer:', err);
      
      // Add a fallback layer for testing when errors occur
      const fallbackLayer: Layer = {
        id: `${serviceName}-${serviceType}-error-fallback-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Add timestamp and random number to ensure uniqueness
        name: `${serviceName} (Error Fallback)`,
        visible: true,
        opacity: 1,
        serviceName,
        serviceType
      };
      
      console.log('Adding error fallback layer:', fallbackLayer);
      setLayers(prev => [...prev, fallbackLayer]);
      setLoading(false);
      setSelectedService(null);
    }
  };
  
  // Define a function to load the Parcels_and_Assess layer
  const loadParcelsLayer = React.useCallback(async () => {
    try {
      // Check if the Parcels_and_Assess layer is already loaded
      const parcelsLayerExists = layers.some(layer => 
        layer.serviceName === 'Parcels_and_Assess' && layer.serviceType === 'MapServer'
      );
      
      if (parcelsLayerExists) {
        console.log('Parcels_and_Assess layer already loaded, skipping auto-load');
        return true;
      }
      
      console.log('Auto-loading Parcels_and_Assess layer...');
      await addLayer('Parcels_and_Assess', 'MapServer');
      return true;
    } catch (err) {
      console.error('Failed to auto-load Parcels_and_Assess layer:', err);
      return false;
    }
  }, [addLayer, layers]);

  // Fetch available services when component mounts
  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        console.log('Fetching ArcGIS services...');
        
        // Direct fetch without using our service for debugging
        const response = await fetch('https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services?f=json');
        const directData = await response.json();
        console.log('Direct service list fetch result:', directData);
        
        // Using our service
        const serviceData = await fetchServiceList();
        console.log('Service list from our module:', serviceData);
        
        if (serviceData && serviceData.services) {
          console.log(`Found ${serviceData.services.length} services`);
          setServices(serviceData.services);
        } else {
          console.warn('No services found in the response:', serviceData);
          // Fallback to direct data if possible
          if (directData && directData.services) {
            console.log('Using direct fetch data as fallback');
            setServices(directData.services);
          } else {
            // Create a sample set of services for testing
            setServices([
              { 
                name: 'Parcels_and_Assess', 
                type: 'MapServer',
                url: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services/Parcels_and_Assess/MapServer'
              },
              {
                name: 'Zoning',
                type: 'MapServer',
                url: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services/Zoning/MapServer'
              }
            ]);
          }
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load ArcGIS services');
        setLoading(false);
        console.error('Error loading services:', err);
        
        // Use a small set for testing when errors occur
        setServices([
          { 
            name: 'Parcels_and_Assess', 
            type: 'MapServer',
            url: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services/Parcels_and_Assess/MapServer'
          },
          {
            name: 'Zoning',
            type: 'MapServer',
            url: 'https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services/Zoning/MapServer'
          }
        ]);
      }
    };
    
    loadServices();
  }, []);
  
  // Load the Parcels layer after services are loaded - but only if no external layers were provided
  useEffect(() => {
    // Only auto-load Parcels layer if:
    // 1. Services have been loaded
    // 2. We have no external layers (from props)
    // 3. No layers are currently loaded
    if (services.length > 0 && !externalLayers?.length && layers.length === 0) {
      console.log('No external layers provided, auto-loading Parcels layer');
      loadParcelsLayer();
    } else if (externalLayers?.length) {
      console.log('External layers provided, skipping auto-load of Parcels layer');
    }
  }, [services, loadParcelsLayer, externalLayers, layers]);
  
  // Calculate map dimensions
  const mapStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    position: 'relative',
    overflow: 'hidden',
    background: '#f0f0f0',
    border: '1px solid #ddd'
  };
  
  // Calculate the extent (bbox) based on center and zoom
  const calculateExtent = (): [number, number, number, number] => {
    // Simple calculation for demonstration
    const [lng, lat] = center;
    const span = 5.0 / zoom; // Adjust this value to control extent width
    
    return [
      lng - span,
      lat - span,
      lng + span,
      lat + span
    ];
  };
  
  // Update a layer's visibility
  const toggleLayerVisibility = (layerId: string) => {
    setLayers(prev => 
      prev.map(layer => 
        layer.id === layerId 
          ? { ...layer, visible: !layer.visible } 
          : layer
      )
    );
  };
  
  // Update a layer's opacity
  const updateLayerOpacity = (layerId: string, opacity: number) => {
    console.log(`[ArcGISRestMap] updateLayerOpacity called for layer ${layerId} with opacity ${opacity}`);
    
    // Debug: Find the layer in current state
    const targetLayer = layers.find(l => l.id === layerId);
    console.log(`[ArcGISRestMap] Found layer in current state:`, targetLayer);
    
    // For ESRI JS API implementation, we don't have mapView in this component type
    // This section is stubbed for future use with the ESRI JavaScript API
    console.log(`[ArcGISRestMap] This is a REST API version, not using ESRI JS API mapView`);
    console.log(`[ArcGISRestMap] Will update opacity through DOM elements and state updates`);
    
    // For our DOM-based fallback approach, find and update the image element directly
    if (mapRef.current) {
      // Find all image and div elements that might represent our layer
      const allLayerElements = Array.from(mapRef.current.children).filter(
        child => (child instanceof HTMLImageElement || child instanceof HTMLDivElement) && 
        // Only consider actual layer elements (not loading indicators)
        !(child as HTMLElement).textContent?.includes('Loading:')
      );
      
      console.log(`[ArcGISRestMap] Found ${allLayerElements.length} potential layer elements in the DOM`);
      
      // Loop through and find the layer element by checking if its src includes the layer ID
      // or for div elements, check if the textContent includes the layer name
      let layerElement: HTMLElement | null = null;
      
      for (const element of allLayerElements) {
        if (element instanceof HTMLImageElement) {
          // For image elements, check if the src contains the layer ID or service name
          if (targetLayer && (
              element.src.includes(targetLayer.id) || 
              element.src.includes(targetLayer.serviceName)
            )) {
            layerElement = element;
            break;
          }
        } else if (element instanceof HTMLDivElement) {
          // For divs (feature server placeholders), check if the content includes the layer name
          if (targetLayer && element.textContent?.includes(targetLayer.name || targetLayer.serviceName)) {
            layerElement = element;
            break;
          }
        }
      }
      
      if (layerElement) {
        console.log(`[ArcGISRestMap] Found layer element in the DOM, updating opacity directly`);
        layerElement.style.opacity = opacity.toString();
      } else {
        console.log(`[ArcGISRestMap] Could not find layer element in the DOM to update opacity directly`);
      }
    }
    
    // Update the layers in our state regardless
    setLayers(prev => {
      const updated = prev.map(layer => 
        layer.id === layerId 
          ? { ...layer, opacity } 
          : layer
      );
      console.log(`[ArcGISRestMap] Updated layers state:`, updated);
      return updated;
    });
  };
  
  // Remove a layer (but don't allow removing base layers)
  const removeLayer = (layerId: string) => {
    setLayers(prev => 
      prev.filter(layer => 
        // Keep the layer if it's not the one to remove OR if it's a base layer
        layer.id !== layerId || layer.isBaseLayer === true
      )
    );
  };
  
  // Move a layer up or down in the stack
  const moveLayer = (layerId: string, direction: 'up' | 'down') => {
    setLayers(prev => {
      const index = prev.findIndex(layer => layer.id === layerId);
      if (index === -1) return prev;
      
      if (direction === 'up' && index > 0) {
        const newLayers = [...prev];
        [newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]];
        return newLayers;
      } else if (direction === 'down' && index < prev.length - 1) {
        const newLayers = [...prev];
        [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
        return newLayers;
      }
      
      return prev;
    });
  };
  
  // State to track if any layers successfully loaded
  const [layerLoadStatus, setLayerLoadStatus] = useState<{
    loading: boolean;
    loaded: number;
    failed: number;
    total: number;
  }>({
    loading: false,
    loaded: 0,
    failed: 0,
    total: 0
  });
  
  // Render the map images
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Set initial loading state
    setLayerLoadStatus({
      loading: true,
      loaded: 0,
      failed: 0,
      total: layers.filter(layer => layer.visible).length
    });
    
    // Clear previous layers
    if (mapRef.current) {
      mapRef.current.innerHTML = '';
      
      // Get container dimensions
      const width = mapRef.current.clientWidth;
      const height = mapRef.current.clientHeight;
    
      // Get the current map extent
      const bbox = calculateExtent();
      
      // Create and render each visible layer
      const visibleLayers = layers.filter(layer => layer.visible);
      let loadedCount = 0;
      let failedCount = 0;
      
      visibleLayers.forEach(layer => {
        if (layer.serviceType === 'MapServer') {
          // For MapServer, we can use the export operation
          const img = document.createElement('img');
          const layersParam = layer.layerId !== undefined ? `show:${layer.layerId}` : 'show:all';
          
          const imageUrl = getMapImageUrl(layer.serviceName, {
            layers: layersParam,
            bbox,
            size: [width, height],
            format: 'png32',
            transparent: true
          });
          
          // Add loading indicator for this layer
          const loadingDiv = document.createElement('div');
          loadingDiv.style.position = 'absolute';
          loadingDiv.style.left = '0';
          loadingDiv.style.top = '0';
          loadingDiv.style.width = '100%';
          loadingDiv.style.height = '100%';
          loadingDiv.style.display = 'flex';
          loadingDiv.style.alignItems = 'center';
          loadingDiv.style.justifyContent = 'center';
          loadingDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
          loadingDiv.style.color = '#666';
          loadingDiv.style.fontSize = '14px';
          loadingDiv.textContent = `Loading: ${layer.name}...`;
          
          if (mapRef.current) {
            mapRef.current.appendChild(loadingDiv);
          }
          
          // Set up the image
          img.src = imageUrl;
          img.style.position = 'absolute';
          img.style.left = '0';
          img.style.top = '0';
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.opacity = layer.opacity.toString();
          img.style.pointerEvents = 'none';
          
          // Handle successful load
          img.onload = () => {
            // Remove loading indicator
            if (mapRef.current && mapRef.current.contains(loadingDiv)) {
              mapRef.current.removeChild(loadingDiv);
            }
            
            loadedCount++;
            console.log(`Successfully loaded layer: ${layer.name}`);
            
            // Update status
            setLayerLoadStatus(prev => ({
              ...prev,
              loading: loadedCount + failedCount < visibleLayers.length,
              loaded: loadedCount,
              failed: failedCount
            }));
          };
          
          // Handle load error
          img.onerror = () => {
            failedCount++;
            console.error(`Failed to load layer: ${layer.name}`);
            
            // Update layer div to show error
            if (mapRef.current && mapRef.current.contains(loadingDiv)) {
              loadingDiv.style.backgroundColor = 'rgba(255, 200, 200, 0.3)';
              loadingDiv.style.color = '#c00';
              loadingDiv.textContent = `Error loading: ${layer.name}`;
            }
            
            // Update status
            setLayerLoadStatus(prev => ({
              ...prev,
              loading: loadedCount + failedCount < visibleLayers.length,
              loaded: loadedCount,
              failed: failedCount
            }));
          };
          
          // Add the image to the map
          if (mapRef.current) {
            mapRef.current.appendChild(img);
          }
        } else {
          // For FeatureServer, display a placeholder
          const div = document.createElement('div');
          div.style.position = 'absolute';
          div.style.left = '0';
          div.style.top = '0';
          div.style.width = '100%';
          div.style.height = '100%';
          div.style.display = 'flex';
          div.style.alignItems = 'center';
          div.style.justifyContent = 'center';
          div.style.pointerEvents = 'none';
          div.style.opacity = layer.opacity.toString();
          div.style.color = '#666';
          div.style.fontSize = '14px';
          div.textContent = `FeatureServer layer: ${layer.name || layer.serviceName}`;
          div.style.backgroundColor = 'rgba(200, 255, 200, 0.1)';
          div.style.border = '2px dashed #ccc';
          
          if (mapRef.current) {
            mapRef.current.appendChild(div);
          }
          
          // Count this as loaded for the purpose of status tracking
          loadedCount++;
          
          // Update status
          setLayerLoadStatus(prev => ({
            ...prev,
            loading: loadedCount + failedCount < visibleLayers.length,
            loaded: loadedCount,
            failed: failedCount
          }));
        }
      });
      
      // If there are no visible layers, update status to show not loading
      if (visibleLayers.length === 0) {
        setLayerLoadStatus({
          loading: false,
          loaded: 0,
          failed: 0,
          total: 0
        });
        
        // Show a message about no layers
        const noLayersDiv = document.createElement('div');
        noLayersDiv.style.position = 'absolute';
        noLayersDiv.style.left = '0';
        noLayersDiv.style.top = '0';
        noLayersDiv.style.width = '100%';
        noLayersDiv.style.height = '100%';
        noLayersDiv.style.display = 'flex';
        noLayersDiv.style.alignItems = 'center';
        noLayersDiv.style.justifyContent = 'center';
        noLayersDiv.style.color = '#888';
        noLayersDiv.style.fontSize = '16px';
        noLayersDiv.style.fontWeight = 'bold';
        noLayersDiv.style.backgroundColor = '#f8f8f8';
        noLayersDiv.textContent = 'No active layers. Add layers from the sidebar.';
        
        if (mapRef.current) {
          mapRef.current.appendChild(noLayersDiv);
        }
      }
    }
  }, [layers, center, zoom]);
  
  // Auto-open the layers panel when in REST mode
  useEffect(() => {
    // Auto-open the layers panel after services are loaded
    if (services.length > 0 && !isLayersPanelOpen) {
      console.log('Auto-opening layers panel');
      setIsLayersPanelOpen(true);
    }
  }, [services, isLayersPanelOpen]);

  return (
    <div style={{ position: 'relative' }}>
      <div style={mapStyle} ref={mapContainerRef}>
        {/* Map container */}
        <div 
          ref={mapRef} 
          style={{ 
            width: '100%', 
            height: '100%', 
            position: 'relative',
            overflow: 'hidden'
          }}
        />
        
        {/* Loading indicator */}
        {loading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255, 255, 255, 0.8)',
            padding: '10px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255, 0, 0, 0.1)',
            border: '1px solid rgba(255, 0, 0, 0.3)',
            padding: '10px',
            borderRadius: '8px',
            color: 'red'
          }}>
            {error}
          </div>
        )}
        
        {/* Status indicator */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(255, 255, 255, 0.8)',
          padding: '5px 10px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div>{services.length} services available</div>
          
          {/* Layer status */}
          {layerLoadStatus.total > 0 && (
            <div style={{ 
              fontSize: '11px', 
              color: layerLoadStatus.failed > 0 ? '#c00' : '#080' 
            }}>
              {layerLoadStatus.loading ? (
                <>
                  <span className="inline-block animate-spin mr-1">⟳</span>
                  Loading layers: {layerLoadStatus.loaded}/{layerLoadStatus.total}
                </>
              ) : layerLoadStatus.failed > 0 ? (
                <>
                  <span className="mr-1">⚠️</span>
                  {layerLoadStatus.loaded} layers loaded, {layerLoadStatus.failed} failed
                </>
              ) : (
                <>
                  <span className="mr-1">✓</span>
                  {layerLoadStatus.loaded} layers loaded
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Map controls */}
        {showControls && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 1000
          }}>
            <Card className="p-2 backdrop-blur-sm bg-white/80">
              <Button 
                size="sm" 
                variant={isLayersPanelOpen ? "default" : "outline"}
                onClick={() => setIsLayersPanelOpen(!isLayersPanelOpen)}
              >
                {isLayersPanelOpen ? "Hide Layers" : "Show Layers"}
              </Button>
            </Card>
          </div>
        )}
        
        {/* Navigation controls */}
        {showControls && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            right: '10px',
            zIndex: 1000
          }}>
            <Card className="p-2 backdrop-blur-sm bg-white/80">
              <div className="flex flex-col gap-1">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setZoom(prev => Math.min(prev + 1, 20))}
                >
                  +
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setZoom(prev => Math.max(prev - 1, 1))}
                >
                  -
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setCenter(initialCenter);
                    setZoom(initialZoom);
                  }}
                >
                  Home
                </Button>
              </div>
            </Card>
          </div>
        )}
        
        {/* Layers panel - Completely rebuilt for better performance */}
        <div 
          className={`absolute top-20 right-10 w-80 z-50 transition-all duration-300 ${
            isLayersPanelOpen ? 'opacity-100 translate-x-0' : 'opacity-0 pointer-events-none translate-x-10'
          }`}
          style={{
            height: 'calc(80vh - 40px)',
            maxHeight: '600px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div className="p-4 border-b">
            <h3 className="font-medium text-lg">Layers ({services.length} services)</h3>
          </div>
          
          {/* Service selector */}
          <div className="p-4 border-b">
            <label className="block text-sm font-medium mb-2">Add Layer</label>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <select 
                  className="flex-grow border rounded px-2 py-1 text-sm"
                  value={selectedService || ''}
                  onChange={(e) => setSelectedService(e.target.value || null)}
                >
                  <option value="">Select a service...</option>
                  {services.slice(0, 100).map(service => (
                    <option key={service.name} value={service.name}>
                      {service.name} ({service.type})
                    </option>
                  ))}
                </select>
                <Button 
                  size="sm" 
                  disabled={!selectedService}
                  onClick={() => selectedService && addLayer(selectedService)}
                >
                  Add
                </Button>
              </div>
              
              {/* Add search filter if there are many services */}
              {services.length > 10 && (
                <div className="mt-1">
                  <input
                    type="text"
                    placeholder="Filter services..."
                    className="w-full px-2 py-1 text-sm border rounded"
                    onChange={(e) => {
                      const query = e.target.value.toLowerCase();
                      const filtered = services.filter(service => 
                        service.name.toLowerCase().includes(query)
                      );
                      // Just logging for now - would implement actual filtering
                      console.log(`Found ${filtered.length} services matching "${query}"`);
                    }}
                  />
                </div>
              )}
            </div>
            
            {/* Add a helper instruction */}
            <p className="text-xs text-gray-500 mt-1">
              Select a service from the dropdown and click "Add" to add it to the map.
            </p>
            
            {/* Add some example services */}
            <div className="mt-3">
              <p className="text-xs font-medium">Quick add services:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-6 text-xs py-0 px-1"
                  onClick={() => addLayer('Parcels_and_Assess', 'MapServer')}
                >
                  Parcels Map
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-6 text-xs py-0 px-1"
                  onClick={() => addLayer('Zoning', 'MapServer')}
                >
                  Zoning Map
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-6 text-xs py-0 px-1"
                  onClick={() => addLayer('Roads', 'MapServer')}
                >
                  Roads Map
                </Button>
              </div>
            </div>
          </div>
          
          {/* Layer list with proper scrolling */}
          <div className="flex-1 overflow-y-auto p-4">
            {layers.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm mb-2">
                  No layers added. Select a service above to add layers.
                </p>
                <Button 
                  size="sm" 
                  onClick={() => addLayer('Parcels_and_Assess', 'MapServer')}
                >
                  Add Parcels Map Layer
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {layers.map((layer, index) => (
                  <Card 
                    key={`layer-card-${layer.id}-${index}`} 
                    className={`p-2 border ${layer.isBaseLayer ? 'border-green-500' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 max-w-[70%]">
                        <Checkbox 
                          id={`visible-${layer.id}-${index}`}
                          checked={layer.visible}
                          onCheckedChange={() => toggleLayerVisibility(layer.id)}
                        />
                        <Label 
                          htmlFor={`visible-${layer.id}-${index}`}
                          className="font-medium text-sm cursor-pointer truncate"
                          title={layer.name}
                        >
                          {layer.name}
                          {layer.isBaseLayer && (
                            <span className="text-xs ml-1 px-1 bg-green-100 rounded text-green-700">base</span>
                          )}
                        </Label>
                      </div>
                      <div className="flex items-center">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => removeLayer(layer.id)}
                          className={`h-6 w-6 p-0 ${layer.isBaseLayer ? 'opacity-50 cursor-not-allowed' : 'text-red-500'}`}
                          title={layer.isBaseLayer ? "Base layer cannot be removed" : "Remove Layer"}
                          disabled={layer.isBaseLayer}
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs w-12">Opacity:</span>
                      <Slider
                        value={[layer.opacity * 100]}
                        min={0}
                        max={100}
                        step={1}
                        className="flex-grow"
                        onValueChange={(value) => updateLayerOpacity(layer.id, value[0] / 100)}
                      />
                      <span className="text-xs w-8 text-right">{Math.round(layer.opacity * 100)}%</span>
                    </div>
                    
                    <div className="flex justify-between mt-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        disabled={index === 0}
                        onClick={() => moveLayer(layer.id, 'up')}
                        className="h-6 w-6 p-0"
                        title="Move Up"
                      >
                        ↑
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        disabled={index === layers.length - 1}
                        onClick={() => moveLayer(layer.id, 'down')}
                        className="h-6 w-6 p-0"
                        title="Move Down"
                      >
                        ↓
                      </Button>
                      <Button 
                        size="sm" 
                        variant={layer.visible ? "default" : "ghost"}
                        onClick={() => toggleLayerVisibility(layer.id)}
                        className="h-6 px-2 text-xs"
                        title={layer.visible ? "Hide Layer" : "Show Layer"}
                      >
                        {layer.visible ? "Visible" : "Hidden"}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default forwardRef(ArcGISRestMap);