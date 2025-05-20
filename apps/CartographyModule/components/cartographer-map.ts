/**
 * CartographerMap Component
 * 
 * This component provides an interactive map with advanced drawing
 * tools, version history, and legal description generation.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LeafletMap } from './leaflet/leaflet-map';
import { AdvancedDrawControl } from './advanced-draw-control';
import { FeatureVersionHistory } from './feature-version-history';
import { PrecisionDrawingTools } from './precision-drawing-tools';
import { AnimatedCountyBoundaries } from './animated-county-boundaries';
import { 
  GeoJSONFeature, 
  MapTool, 
  MapLayerStyle,
  MeasurementType,
  MeasurementUnit
} from '../types';
import { 
  FeatureVersionTracker,
  createCircle,
  createRectangle,
  generateLegalDescription
} from '../utils/drawing-utils';
import L from 'leaflet';

// County boundary data will be imported from appropriate module

interface CartographerMapProps {
  width?: string;
  height?: string;
  center?: [number, number];
  zoom?: number;
  initialFeatures?: GeoJSONFeature[];
  mapLayers?: any[];
  onFeaturesChanged?: (features: GeoJSONFeature[]) => void;
  className?: string;
  showPrecisionTools?: boolean;
}

/**
 * Advanced cartographic map component with precision drawing tools and version history
 */
export function CartographerMap({
  width = '100%',
  height = '600px',
  center = [46.23, -119.16], // Benton County, WA
  zoom = 11,
  initialFeatures = [],
  mapLayers = [],
  onFeaturesChanged,
  className = '',
  showPrecisionTools = true
}: CartographerMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [features, setFeatures] = useState<GeoJSONFeature[]>(initialFeatures);
  const [activeTool, setActiveTool] = useState<MapTool>(MapTool.PAN);
  const [selectedFeature, setSelectedFeature] = useState<GeoJSONFeature | null>(null);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isLegalDescriptionOpen, setIsLegalDescriptionOpen] = useState(false);
  const [legalDescription, setLegalDescription] = useState('');
  const versionTrackerRef = useRef<FeatureVersionTracker>(new FeatureVersionTracker());
  
  // Handle map ready
  const handleMapReady = (map: L.Map) => {
    mapRef.current = map;
  };
  
  // Handle feature changes
  const handleFeaturesChanged = (newFeatures: GeoJSONFeature[]) => {
    setFeatures(newFeatures);
    
    if (onFeaturesChanged) {
      onFeaturesChanged(newFeatures);
    }
  };
  
  // Feature selection
  const handleFeatureClick = (feature: GeoJSONFeature) => {
    setSelectedFeature(feature);
  };
  
  // Handle version changes
  const handleVersionChange = (featureId: string, versionId: string) => {
    const version = versionTrackerRef.current.getVersion(featureId, versionId);
    
    if (!version) return;
    
    // Update the feature with the version data
    const updatedFeatures = features.map(f => {
      if (f.properties?.id === featureId) {
        return version.feature;
      }
      return f;
    });
    
    handleFeaturesChanged(updatedFeatures);
    
    // Toast notification would go here
  };
  
  // Handle version restoration
  const handleVersionRestore = (version: any) => {
    if (!version?.feature || !version.feature.properties?.id) return;
    
    const featureId = version.feature.properties.id;
    
    // Update the feature with the version data
    const updatedFeatures = features.map(f => {
      if (f.properties?.id === featureId) {
        return version.feature;
      }
      return f;
    });
    
    handleFeaturesChanged(updatedFeatures);
    
    // Toast notification would go here
  };
  
  // Handle rectangle creation
  const handleRectangleCreate = (center: [number, number], width: number, height: number) => {
    const rectangle = createRectangle(center, width, height);
    
    // Add rectangle to features
    handleFeaturesChanged([...features, rectangle]);
    
    // Add to version history
    if (rectangle.properties?.id) {
      versionTrackerRef.current.addVersion(
        rectangle.properties.id,
        rectangle,
        'Created rectangle'
      );
    }
  };
  
  // Handle circle creation
  const handleCircleCreate = (center: [number, number], radius: number) => {
    const circle = createCircle(center, radius);
    
    // Add circle to features
    handleFeaturesChanged([...features, circle]);
    
    // Add to version history
    if (circle.properties?.id) {
      versionTrackerRef.current.addVersion(
        circle.properties.id,
        circle,
        'Created circle'
      );
    }
  };
  
  // Handle legal description generation
  const handleLegalDescriptionGenerate = (description: string, feature: GeoJSONFeature) => {
    setLegalDescription(description);
    setIsLegalDescriptionOpen(true);
  };
  
  // Handle feature creation
  const handleFeatureCreate = (feature: GeoJSONFeature) => {
    // Add feature to the list
    handleFeaturesChanged([...features, feature]);
    
    // Add to version history
    if (feature.properties?.id) {
      versionTrackerRef.current.addVersion(
        feature.properties.id,
        feature,
        'Created feature'
      );
    }
  };
  
  // Handle feature editing - single feature adapter for AdvancedDrawControl
  const handleFeatureEdit = (feature: GeoJSONFeature) => {
    // Call the multi-feature version with an array containing just this feature
    handleFeatureEditBatch([feature]);
  };
  
  // Handle feature editing - batch version for internal use
  const handleFeatureEditBatch = (editedFeatures: GeoJSONFeature[]) => {
    // Update features
    const updatedFeatures = features.map(f => {
      const editedFeature = editedFeatures.find(
        ef => ef.properties?.id === f.properties?.id
      );
      return editedFeature || f;
    });
    
    handleFeaturesChanged(updatedFeatures);
    
    // Add to version history
    editedFeatures.forEach(feature => {
      if (feature.properties?.id) {
        versionTrackerRef.current.addVersion(
          feature.properties.id,
          feature,
          'Edited feature'
        );
      }
    });
  };
  
  // Handle feature deletion - single feature adapter for AdvancedDrawControl
  const handleFeatureDelete = (feature: GeoJSONFeature) => {
    // Call the multi-feature version with an array containing just this feature
    handleFeatureDeleteBatch([feature]);
  };
  
  // Handle feature deletion - batch version for internal use
  const handleFeatureDeleteBatch = (deletedFeatures: GeoJSONFeature[]) => {
    // Remove deleted features
    const deletedIds = deletedFeatures.map(f => f.properties?.id).filter(Boolean);
    const remainingFeatures = features.filter(
      f => !deletedIds.includes(f.properties?.id)
    );
    
    handleFeaturesChanged(remainingFeatures);
    
    // Remove from selection if currently selected
    if (selectedFeature && deletedIds.includes(selectedFeature.properties?.id)) {
      setSelectedFeature(null);
    }
  };
  
  // The UI rendering logic would go here but is omitted for the types file
  
  // Return the component implementation
  return { 
    features, 
    selectedFeature, 
    activeTool,
    handleFeatureCreate,
    handleFeatureEdit,
    handleFeatureDelete,
    handleFeatureClick
  };
}

export default CartographerMap;