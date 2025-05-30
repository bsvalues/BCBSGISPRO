/**
 * LayerManager Props Interface
 * 
 * This file defines the prop interface for the LayerManager component,
 * using the standardized types from the shared types library.
 */

import { Layer, LayerType } from '../../../../libs/types';

/**
 * Props for the LayerManager component
 */
export interface LayerManagerProps {
  // Layers to manage
  layers?: Layer[];
  
  // Available layer types that can be added
  availableLayerTypes?: LayerType[];
  
  // Whether to allow adding new layers
  allowAddLayers?: boolean;
  
  // Whether to allow removing layers
  allowRemoveLayers?: boolean;
  
  // Whether to allow reordering layers
  allowReorderLayers?: boolean;
  
  // Whether to allow editing layer properties
  allowEditLayers?: boolean;
  
  // Whether to show layer visibility toggle
  showVisibilityToggle?: boolean;
  
  // Whether to show layer opacity control
  showOpacityControl?: boolean;
  
  // Whether to show layer info button
  showInfoButton?: boolean;
  
  // Event handlers
  onLayerToggle?: (layerId: string, visible: boolean) => void;
  onLayerOpacityChange?: (layerId: string, opacity: number) => void;
  onLayerAdd?: (layer: Layer) => void;
  onLayerRemove?: (layerId: string) => void;
  onLayerReorder?: (layerIds: string[]) => void;
  onLayerEdit?: (layerId: string, properties: Partial<Layer>) => void;
  
  // Component styling
  className?: string;
  style?: React.CSSProperties;
}