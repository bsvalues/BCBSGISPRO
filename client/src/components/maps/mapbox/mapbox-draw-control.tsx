import React, { useEffect, useRef, useState } from 'react';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { useMapbox } from './mapbox-provider';
import { toast } from '@/hooks/use-toast';

// Define the drawing modes for typechecking
export type DrawMode = 'simple_select' | 'direct_select' | 'draw_point' | 'draw_line_string' | 'draw_polygon' | 'static';

// Interface for draw events
export interface DrawEvent {
  type: string;
  features: GeoJSON.Feature[];
}

// Props for the MapboxDrawControl component
export interface MapboxDrawControlProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  controls?: {
    point?: boolean;
    line?: boolean;
    polygon?: boolean;
    trash?: boolean;
    combine_features?: boolean;
    uncombine_features?: boolean;
  };
  defaultMode?: DrawMode;
  styles?: object;
  onDrawCreate?: (e: DrawEvent) => void;
  onDrawUpdate?: (e: DrawEvent) => void;
  onDrawDelete?: (e: DrawEvent) => void;
  onDrawSelectionChange?: (e: DrawEvent) => void;
  onDrawModeChange?: (mode: DrawMode) => void;
  onDrawRender?: (e: any) => void;
  onDrawActionable?: (e: { actions: { trash: boolean } }) => void;
}

/**
 * MapboxDrawControl component - adds drawing capabilities to the map
 */
export function MapboxDrawControl({
  position = 'top-left',
  controls = {
    point: true,
    line: true,
    polygon: true,
    trash: true,
    combine_features: false,
    uncombine_features: false,
  },
  defaultMode = 'simple_select',
  styles,
  onDrawCreate,
  onDrawUpdate,
  onDrawDelete,
  onDrawSelectionChange,
  onDrawModeChange,
  onDrawRender,
  onDrawActionable
}: MapboxDrawControlProps) {
  const { map, isLoaded } = useMapbox();
  const drawRef = useRef<MapboxDraw | null>(null);
  const [currentMode, setCurrentMode] = useState<DrawMode>(defaultMode);

  // Initialize the draw control
  useEffect(() => {
    if (!isLoaded || !map) return;

    try {
      // Create the draw control if it doesn't exist
      if (!drawRef.current) {
        const drawOptions = {
          displayControlsDefault: false,
          controls: controls,
          styles: styles,
          defaultMode: defaultMode,
        };

        const draw = new MapboxDraw(drawOptions);
        drawRef.current = draw;

        // Add the draw control to the map
        map.addControl(draw, position);

        // Set up event listeners
        map.on('draw.create', (e: any) => {
          if (onDrawCreate) onDrawCreate(e);
        });

        map.on('draw.update', (e: any) => {
          if (onDrawUpdate) onDrawUpdate(e);
        });

        map.on('draw.delete', (e: any) => {
          if (onDrawDelete) onDrawDelete(e);
        });

        map.on('draw.selectionchange', (e: any) => {
          if (onDrawSelectionChange) onDrawSelectionChange(e);
        });

        map.on('draw.modechange', (e: any) => {
          const mode = e.mode as DrawMode;
          setCurrentMode(mode);
          if (onDrawModeChange) onDrawModeChange(mode);
        });

        map.on('draw.render', (e: any) => {
          if (onDrawRender) onDrawRender(e);
        });

        map.on('draw.actionable', (e: any) => {
          if (onDrawActionable) onDrawActionable(e);
        });
      }
    } catch (error) {
      console.error('Error setting up draw control:', error);
      toast({
        title: 'Drawing tools error',
        description: 'Failed to initialize drawing tools. Please refresh the page.',
        variant: 'destructive'
      });
    }

    // Cleanup function
    return () => {
      if (map && drawRef.current) {
        try {
          // Remove all event listeners and the control
          map.off('draw.create');
          map.off('draw.update');
          map.off('draw.delete');
          map.off('draw.selectionchange');
          map.off('draw.modechange');
          map.off('draw.render');
          map.off('draw.actionable');
          map.removeControl(drawRef.current);
          drawRef.current = null;
        } catch (error) {
          console.error('Error cleaning up draw control:', error);
        }
      }
    };
  }, [map, isLoaded, position, JSON.stringify(controls), defaultMode]);

  // Methods for controlling the draw mode
  const setDrawMode = (mode: DrawMode) => {
    if (drawRef.current && map) {
      try {
        drawRef.current.changeMode(mode);
        setCurrentMode(mode);
      } catch (error) {
        console.error(`Error setting draw mode to ${mode}:`, error);
        toast({
          title: 'Error changing drawing mode',
          description: `Failed to switch to ${mode} mode. Please try again.`,
          variant: 'destructive'
        });
      }
    }
  };

  // Method to get all features
  const getAllFeatures = (): GeoJSON.Feature[] => {
    if (drawRef.current) {
      return drawRef.current.getAll().features;
    }
    return [];
  };

  // Method to get selected features
  const getSelectedFeatures = (): GeoJSON.Feature[] => {
    if (drawRef.current) {
      return drawRef.current.getSelected().features;
    }
    return [];
  };

  // Method to add features
  const addFeatures = (featureCollection: GeoJSON.FeatureCollection) => {
    if (drawRef.current) {
      try {
        drawRef.current.add(featureCollection);
      } catch (error) {
        console.error('Error adding features:', error);
        toast({
          title: 'Error adding features',
          description: 'Failed to add features to the map. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  // Method to delete features
  const deleteFeatures = (featureIds: string[]) => {
    if (drawRef.current) {
      try {
        drawRef.current.delete(featureIds);
      } catch (error) {
        console.error('Error deleting features:', error);
        toast({
          title: 'Error deleting features',
          description: 'Failed to delete selected features. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  // Method to delete all features
  const deleteAllFeatures = () => {
    if (drawRef.current) {
      try {
        drawRef.current.deleteAll();
      } catch (error) {
        console.error('Error deleting all features:', error);
        toast({
          title: 'Error clearing drawings',
          description: 'Failed to clear all drawings. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  // Public API for child components
  const drawControl = {
    setDrawMode,
    getCurrentMode: () => currentMode,
    getAllFeatures,
    getSelectedFeatures,
    addFeatures,
    deleteFeatures,
    deleteAllFeatures
  };

  // This component doesn't render anything visible, it just adds controls to the map
  return null;
}

export default MapboxDrawControl;