import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Slider } from '../../ui/slider';
import { Checkbox } from '../../ui/checkbox';
import { Label } from '../../ui/label';
import { Loader2, Info, AlertCircle } from 'lucide-react';
import { STATIC_MAP_IMAGES, Layer } from '../../../constants/layer-constants';
import { Alert, AlertDescription } from '../../ui/alert';

interface ImageMapProps {
  width?: string | number;
  height?: string | number;
  showControls?: boolean;
  layers?: Layer[];
}

/**
 * Simplified Image-based Map Component for Benton County GIS
 * 
 * This component displays ArcGIS REST service map layers using direct static image URLs
 * rather than relying on complex REST API interactions.
 */
const SimplifiedImageMap: React.ForwardRefRenderFunction<any, ImageMapProps> = (props, ref) => {
  const {
    width = '100%',
    height = '600px',
    showControls = true,
    layers: externalLayers = []
  } = props;
  
  const [error, setError] = useState<string | null>(null);
  const [layerStates, setLayerStates] = useState<{
    [key: string]: {
      visible: boolean;
      opacity: number;
      loading: boolean;
      error: boolean;
    }
  }>({
    PARCELS: { visible: true, opacity: 1, loading: true, error: false },
    AERIAL: { visible: false, opacity: 0.8, loading: false, error: false },
    ZONING: { visible: false, opacity: 0.7, loading: false, error: false },
    ROADS: { visible: false, opacity: 1, loading: false, error: false },
    FIRE_DISTRICTS: { visible: false, opacity: 0.7, loading: false, error: false }
  });
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    toggleLayer: (layerKey: string) => {
      setLayerStates(prev => ({
        ...prev,
        [layerKey]: {
          ...prev[layerKey],
          visible: !prev[layerKey].visible,
          loading: !prev[layerKey].visible // If turning on, set loading to true
        }
      }));
    },
    setLayerOpacity: (layerKey: string, opacity: number) => {
      setLayerStates(prev => ({
        ...prev,
        [layerKey]: {
          ...prev[layerKey],
          opacity
        }
      }));
    },
    getVisibleLayers: () => {
      return Object.entries(layerStates)
        .filter(([_, state]) => state.visible)
        .map(([key]) => key);
    }
  }));
  
  // Handle image load success
  const handleImageLoad = (layerKey: string) => {
    setLayerStates(prev => ({
      ...prev,
      [layerKey]: {
        ...prev[layerKey],
        loading: false,
        error: false
      }
    }));
  };
  
  // Handle image load error
  const handleImageError = (layerKey: string) => {
    setLayerStates(prev => ({
      ...prev,
      [layerKey]: {
        ...prev[layerKey],
        loading: false,
        error: true
      }
    }));
    setError(`Failed to load ${layerKey} layer. Please check your connection or try again later.`);
  };
  
  // Map container style
  const mapStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f0f8ff', // Light blue background
    border: '1px solid #ddd',
    borderRadius: '4px'
  };
  
  return (
    <div className="relative">
      {/* Main map container */}
      <div ref={mapContainerRef} style={mapStyle} className="relative">
        {/* Base map - always present */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#e6f2ff' }}>
          {/* Fallback base layer (light grid pattern) */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: 'linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              opacity: 0.2
            }}
          />
        </div>
        
        {/* Map layers - stacked from bottom to top */}
        {Object.entries(STATIC_MAP_IMAGES).map(([key, url]) => {
          const layerState = layerStates[key];
          if (!layerState) return null;
          
          return layerState.visible ? (
            <div 
              key={key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: layerState.opacity,
                zIndex: key === 'PARCELS' ? 10 : key === 'ROADS' ? 30 : 20, // Ensure roads are on top
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              {layerState.loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-sm z-10">
                  <div className="flex flex-col items-center gap-2 bg-white/80 p-3 rounded-lg shadow-lg">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <p className="text-sm font-medium">Loading {key.toLowerCase().replace('_', ' ')} layer...</p>
                  </div>
                </div>
              )}
              
              {layerState.error ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-sm z-10">
                  <div className="flex flex-col items-center gap-2 bg-white/80 p-3 rounded-lg shadow-lg">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                    <p className="text-sm font-medium">Failed to load {key.toLowerCase().replace('_', ' ')} layer</p>
                  </div>
                </div>
              ) : (
                <img
                  src={url}
                  alt={`${key} Map Layer`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onLoad={() => handleImageLoad(key)}
                  onError={() => handleImageError(key)}
                />
              )}
            </div>
          ) : null;
        })}
        
        {/* Map attribution */}
        <div 
          style={{
            position: 'absolute',
            bottom: '5px',
            right: '5px',
            fontSize: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            padding: '2px 5px',
            borderRadius: '3px',
            zIndex: 100
          }}
        >
          Benton County GIS Services
        </div>
      </div>
      
      {/* Controls */}
      {showControls && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Layer Controls</h3>
          <div className="space-y-2">
            {Object.keys(STATIC_MAP_IMAGES).map(key => {
              const layerState = layerStates[key];
              if (!layerState) return null;
              
              return (
                <div key={key} className="flex items-center justify-between border rounded p-2">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id={`layer-${key}`}
                      checked={layerState.visible}
                      onCheckedChange={() => {
                        setLayerStates(prev => ({
                          ...prev,
                          [key]: {
                            ...prev[key],
                            visible: !prev[key].visible,
                            loading: !prev[key].visible
                          }
                        }));
                      }}
                    />
                    <Label htmlFor={`layer-${key}`} className="text-sm">
                      {key.replace(/_/g, ' ')}
                    </Label>
                    {layerState.loading && <Loader2 className="h-3 w-3 animate-spin ml-2" />}
                    {layerState.error && <AlertCircle className="h-3 w-3 text-red-500 ml-2" />}
                  </div>
                  
                  {layerState.visible && (
                    <div className="w-32 flex items-center gap-2">
                      <span className="text-xs">Opacity</span>
                      <Slider 
                        value={[layerState.opacity * 100]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={(values) => {
                          const opacity = values[0] / 100;
                          setLayerStates(prev => ({
                            ...prev,
                            [key]: {
                              ...prev[key],
                              opacity
                            }
                          }));
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default forwardRef(SimplifiedImageMap);