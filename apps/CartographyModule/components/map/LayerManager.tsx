/**
 * Layer Manager Component
 * 
 * This component provides a comprehensive interface for managing map layers,
 * including adding, removing, reordering, and configuring layer properties.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Layers, 
  Eye, 
  EyeOff,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Settings,
  Save,
  X,
  Upload,
  Database,
  Map as MapIcon,
  Image as ImageIcon,
  FileText,
  Globe,
  Grid,
  Package
} from 'lucide-react';

import { logger } from '../../../../libs/DevOps/utils/logger';
import { LayerInfo } from './MapControls';

// Create module-specific logger
const layerLogger = logger.withTags(['CartographyModule', 'LayerManager']);

/**
 * Layer type details
 */
export interface LayerTypeInfo {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

/**
 * Layer source information
 */
export interface LayerSourceInfo {
  id: string;
  name: string;
  url: string;
  type: 'vector' | 'raster' | 'terrain' | 'imagery' | 'overlay';
  description?: string;
  provider?: string;
  apiKeyRequired?: boolean;
}

/**
 * Layer group
 */
export interface LayerGroup {
  id: string;
  name: string;
  description?: string;
  expanded?: boolean;
  layers: LayerInfo[];
}

/**
 * Layer manager props
 */
export interface LayerManagerProps {
  // Current layers
  layers: LayerInfo[];
  
  // Available layer types
  availableLayerTypes?: LayerTypeInfo[];
  
  // Available layer sources
  availableLayerSources?: LayerSourceInfo[];
  
  // Layer groups for organization
  layerGroups?: LayerGroup[];
  
  // Event handlers
  onLayerToggle?: (layerId: string, visible: boolean) => void;
  onLayerOpacityChange?: (layerId: string, opacity: number) => void;
  onLayerOrderChange?: (layerId: string, newIndex: number) => void;
  onLayerAdd?: (layer: LayerInfo) => void;
  onLayerRemove?: (layerId: string) => void;
  onLayerUpdate?: (layer: LayerInfo) => void;
  onLayerGroupToggle?: (groupId: string, expanded: boolean) => void;
  
  // Upload capabilities
  allowLayerUpload?: boolean;
  onLayerUpload?: (file: File) => void;
  supportedFileTypes?: string[];
  
  // Component styling
  className?: string;
  style?: React.CSSProperties;
  compact?: boolean;
  width?: string | number;
  height?: string | number;
}

/**
 * Layer Manager Component
 */
export const LayerManager: React.FC<LayerManagerProps> = ({
  layers = [],
  availableLayerTypes = [],
  availableLayerSources = [],
  layerGroups = [],
  onLayerToggle,
  onLayerOpacityChange,
  onLayerOrderChange,
  onLayerAdd,
  onLayerRemove,
  onLayerUpdate,
  onLayerGroupToggle,
  allowLayerUpload = false,
  onLayerUpload,
  supportedFileTypes = ['.geojson', '.json', '.kml', '.gpx', '.csv', '.zip'],
  className = '',
  style = {},
  compact = false,
  width = '300px',
  height = '100%'
}) => {
  // State for layer management
  const [editingLayer, setEditingLayer] = useState<LayerInfo | null>(null);
  const [addingLayer, setAddingLayer] = useState<boolean>(false);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);
  
  // State for layer groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    layerGroups.reduce((acc, group) => ({
      ...acc,
      [group.id]: group.expanded ?? false
    }), {})
  );
  
  // Initialize on component mount
  useEffect(() => {
    layerLogger.info('Layer manager initialized', { 
      layerCount: layers.length,
      groupCount: layerGroups.length
    });
  }, []);
  
  // Update expanded groups when layer groups change
  useEffect(() => {
    setExpandedGroups(prev => {
      const newExpandedGroups = { ...prev };
      
      layerGroups.forEach(group => {
        if (!(group.id in newExpandedGroups)) {
          newExpandedGroups[group.id] = group.expanded ?? false;
        }
      });
      
      return newExpandedGroups;
    });
  }, [layerGroups]);
  
  /**
   * Handle layer visibility toggle
   */
  const handleLayerToggle = useCallback((layerId: string, visible: boolean) => {
    layerLogger.debug(`Toggle layer visibility: ${layerId} = ${visible}`);
    
    if (onLayerToggle) {
      onLayerToggle(layerId, visible);
    }
  }, [onLayerToggle]);
  
  /**
   * Handle layer opacity change
   */
  const handleLayerOpacityChange = useCallback((layerId: string, opacity: number) => {
    layerLogger.debug(`Change layer opacity: ${layerId} = ${opacity}`);
    
    if (onLayerOpacityChange) {
      onLayerOpacityChange(layerId, opacity);
    }
  }, [onLayerOpacityChange]);
  
  /**
   * Handle layer move up in the stack
   */
  const handleLayerMoveUp = useCallback((layerId: string) => {
    const layerIndex = layers.findIndex(layer => layer.id === layerId);
    
    if (layerIndex <= 0) return; // Already at the top
    
    const newIndex = layerIndex - 1;
    
    layerLogger.debug(`Move layer up: ${layerId} (${layerIndex} -> ${newIndex})`);
    
    if (onLayerOrderChange) {
      onLayerOrderChange(layerId, newIndex);
    }
  }, [layers, onLayerOrderChange]);
  
  /**
   * Handle layer move down in the stack
   */
  const handleLayerMoveDown = useCallback((layerId: string) => {
    const layerIndex = layers.findIndex(layer => layer.id === layerId);
    
    if (layerIndex >= layers.length - 1 || layerIndex === -1) return; // Already at the bottom
    
    const newIndex = layerIndex + 1;
    
    layerLogger.debug(`Move layer down: ${layerId} (${layerIndex} -> ${newIndex})`);
    
    if (onLayerOrderChange) {
      onLayerOrderChange(layerId, newIndex);
    }
  }, [layers, onLayerOrderChange]);
  
  /**
   * Handle layer removal
   */
  const handleLayerRemove = useCallback((layerId: string) => {
    layerLogger.debug(`Remove layer: ${layerId}`);
    
    if (onLayerRemove) {
      onLayerRemove(layerId);
    }
    
    // Clear selection if the removed layer was selected
    if (selectedLayerId === layerId) {
      setSelectedLayerId(null);
    }
    
    // Clear editing if the removed layer was being edited
    if (editingLayer && editingLayer.id === layerId) {
      setEditingLayer(null);
    }
  }, [onLayerRemove, selectedLayerId, editingLayer]);
  
  /**
   * Handle layer selection
   */
  const handleLayerSelect = useCallback((layerId: string) => {
    layerLogger.debug(`Select layer: ${layerId}`);
    
    setSelectedLayerId(prev => prev === layerId ? null : layerId);
    
    // Clear editing when selecting a different layer
    if (editingLayer && editingLayer.id !== layerId) {
      setEditingLayer(null);
    }
  }, [editingLayer]);
  
  /**
   * Start editing a layer
   */
  const handleLayerEdit = useCallback((layer: LayerInfo) => {
    layerLogger.debug(`Start editing layer: ${layer.id}`);
    
    setEditingLayer({ ...layer });
    setSelectedLayerId(layer.id);
    setAddingLayer(false);
  }, []);
  
  /**
   * Cancel editing or adding a layer
   */
  const handleEditCancel = useCallback(() => {
    layerLogger.debug('Cancel layer edit/add');
    
    setEditingLayer(null);
    setAddingLayer(false);
  }, []);
  
  /**
   * Save layer changes
   */
  const handleLayerSave = useCallback(() => {
    if (!editingLayer) return;
    
    layerLogger.debug(`Save layer changes: ${editingLayer.id}`);
    
    if (onLayerUpdate) {
      onLayerUpdate(editingLayer);
    }
    
    setEditingLayer(null);
  }, [editingLayer, onLayerUpdate]);
  
  /**
   * Start adding a new layer
   */
  const handleAddLayer = useCallback(() => {
    layerLogger.debug('Start adding layer');
    
    setAddingLayer(true);
    setEditingLayer({
      id: `layer-${Date.now()}`,
      name: 'New Layer',
      type: 'vector',
      visible: true,
      opacity: 1,
      zIndex: layers.length,
      source: ''
    });
    setSelectedLayerId(null);
  }, [layers]);
  
  /**
   * Save new layer
   */
  const handleAddLayerSave = useCallback(() => {
    if (!editingLayer) return;
    
    layerLogger.debug(`Add new layer: ${editingLayer.id}`);
    
    if (onLayerAdd) {
      onLayerAdd(editingLayer);
    }
    
    setAddingLayer(false);
    setEditingLayer(null);
  }, [editingLayer, onLayerAdd]);
  
  /**
   * Handle layer group toggle
   */
  const handleLayerGroupToggle = useCallback((groupId: string) => {
    layerLogger.debug(`Toggle layer group: ${groupId}`);
    
    const newExpanded = !expandedGroups[groupId];
    
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: newExpanded
    }));
    
    if (onLayerGroupToggle) {
      onLayerGroupToggle(groupId, newExpanded);
    }
  }, [expandedGroups, onLayerGroupToggle]);
  
  /**
   * Handle file upload button click
   */
  const handleUploadClick = useCallback(() => {
    setUploadingFile(true);
  }, []);
  
  /**
   * Handle file selection for upload
   */
  const handleFileSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    if (!files || files.length === 0) {
      setUploadingFile(false);
      return;
    }
    
    const file = files[0];
    
    layerLogger.debug(`File selected for upload: ${file.name}`);
    
    if (onLayerUpload) {
      onLayerUpload(file);
    }
    
    setUploadingFile(false);
    
    // Reset the input value so the same file can be selected again
    e.target.value = '';
  }, [onLayerUpload]);
  
  /**
   * Filter layers by search term
   */
  const filteredLayers = useCallback(() => {
    if (!searchTerm) {
      return layers;
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return layers.filter(layer => 
      layer.name.toLowerCase().includes(lowerSearchTerm) ||
      layer.id.toLowerCase().includes(lowerSearchTerm) ||
      layer.type.toLowerCase().includes(lowerSearchTerm)
    );
  }, [layers, searchTerm]);
  
  /**
   * Get layers organized by groups
   */
  const getLayersByGroup = useCallback(() => {
    if (layerGroups.length === 0) {
      return [{ id: 'default', name: 'Layers', layers: filteredLayers() }];
    }
    
    const layersByGroup = layerGroups.map(group => ({
      ...group,
      layers: filteredLayers().filter(layer => 
        layer.attributes?.groupId === group.id
      )
    }));
    
    // Add ungrouped layers
    const ungroupedLayers = filteredLayers().filter(layer => 
      !layer.attributes?.groupId || 
      !layerGroups.some(group => group.id === layer.attributes?.groupId)
    );
    
    if (ungroupedLayers.length > 0) {
      layersByGroup.push({
        id: 'ungrouped',
        name: 'Ungrouped Layers',
        layers: ungroupedLayers
      });
    }
    
    return layersByGroup;
  }, [filteredLayers, layerGroups]);
  
  /**
   * Get icon for layer type
   */
  const getLayerTypeIcon = useCallback((type: string) => {
    const iconSize = 16;
    
    switch (type) {
      case 'vector':
        return <Globe size={iconSize} />;
      case 'raster':
        return <Grid size={iconSize} />;
      case 'terrain':
        return <MapIcon size={iconSize} />;
      case 'imagery':
        return <ImageIcon size={iconSize} />;
      case 'overlay':
        return <Layers size={iconSize} />;
      default:
        return <Package size={iconSize} />;
    }
  }, []);
  
  /**
   * Get appropriate file input accept attribute
   */
  const getFileInputAccept = useCallback(() => {
    if (!supportedFileTypes || supportedFileTypes.length === 0) {
      return undefined;
    }
    
    return supportedFileTypes.join(',');
  }, [supportedFileTypes]);
  
  // Render the layer manager
  return (
    <div 
      className={`layer-manager ${className}`}
      style={{ 
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        overflow: 'hidden',
        ...style
      }}
    >
      {/* Header with title and controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={20} />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
            Layer Manager
          </h3>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={handleAddLayer}
            title="Add Layer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#f1f5f9',
              cursor: 'pointer',
              width: '32px',
              height: '32px'
            }}
          >
            <Plus size={16} />
          </button>
          
          {allowLayerUpload && (
            <>
              <button 
                onClick={handleUploadClick}
                title="Upload Layer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#f1f5f9',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px'
                }}
              >
                <Upload size={16} />
              </button>
              
              {uploadingFile && (
                <input 
                  type="file"
                  accept={getFileInputAccept()}
                  onChange={handleFileSelected}
                  style={{ display: 'none' }}
                  id="layer-file-input"
                  ref={(input) => input && input.click()}
                />
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Search input */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
        <input 
          type="text"
          placeholder="Search layers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
      </div>
      
      {/* Layer list or editing interface */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        padding: editingLayer || addingLayer ? '16px' : '0'
      }}>
        {(editingLayer && !addingLayer) ? (
          <div className="layer-edit-form">
            <h4 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Edit Layer</h4>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>
                Layer Name
              </label>
              <input 
                type="text"
                value={editingLayer.name}
                onChange={(e) => setEditingLayer({ ...editingLayer, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>
                Layer Type
              </label>
              <select
                value={editingLayer.type}
                onChange={(e) => setEditingLayer({ 
                  ...editingLayer, 
                  type: e.target.value as 'vector' | 'raster' | 'terrain' | 'imagery' | 'overlay'
                })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px'
                }}
              >
                <option value="vector">Vector</option>
                <option value="raster">Raster</option>
                <option value="terrain">Terrain</option>
                <option value="imagery">Imagery</option>
                <option value="overlay">Overlay</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>
                Source URL
              </label>
              <input 
                type="text"
                value={editingLayer.source || ''}
                onChange={(e) => setEditingLayer({ ...editingLayer, source: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>
                Opacity: {(editingLayer.opacity * 100).toFixed(0)}%
              </label>
              <input 
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={editingLayer.opacity}
                onChange={(e) => setEditingLayer({ 
                  ...editingLayer, 
                  opacity: parseFloat(e.target.value) 
                })}
                style={{ width: '100%' }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>
                Z-Index (Layer Order)
              </label>
              <input 
                type="number"
                value={editingLayer.zIndex}
                onChange={(e) => setEditingLayer({ 
                  ...editingLayer, 
                  zIndex: parseInt(e.target.value) 
                })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px'
                }}
              />
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                Higher numbers appear on top of lower numbers.
              </p>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginBottom: '4px', 
                fontSize: '14px', 
                fontWeight: 'bold',
                cursor: 'pointer'
              }}>
                <input 
                  type="checkbox"
                  checked={editingLayer.visible}
                  onChange={(e) => setEditingLayer({ 
                    ...editingLayer, 
                    visible: e.target.checked 
                  })}
                />
                Visible
              </label>
            </div>
            
            {/* Additional layer attributes based on type */}
            {editingLayer.type === 'vector' && (
              <div style={{ marginBottom: '16px' }}>
                <h5 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Vector Layer Options</h5>
                
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                    Source Layer
                  </label>
                  <input 
                    type="text"
                    value={editingLayer.attributes?.sourceLayer || ''}
                    onChange={(e) => setEditingLayer({ 
                      ...editingLayer, 
                      attributes: {
                        ...editingLayer.attributes,
                        sourceLayer: e.target.value
                      }
                    })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                    Fill Color
                  </label>
                  <input 
                    type="color"
                    value={editingLayer.attributes?.fillColor || '#000000'}
                    onChange={(e) => setEditingLayer({ 
                      ...editingLayer, 
                      attributes: {
                        ...editingLayer.attributes,
                        fillColor: e.target.value
                      }
                    })}
                    style={{
                      width: '100%',
                      padding: '0',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      height: '40px'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                    Outline Color
                  </label>
                  <input 
                    type="color"
                    value={editingLayer.attributes?.outlineColor || '#000000'}
                    onChange={(e) => setEditingLayer({ 
                      ...editingLayer, 
                      attributes: {
                        ...editingLayer.attributes,
                        outlineColor: e.target.value
                      }
                    })}
                    style={{
                      width: '100%',
                      padding: '0',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      height: '40px'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                    Outline Width
                  </label>
                  <input 
                    type="number"
                    value={editingLayer.attributes?.outlineWidth || 1}
                    onChange={(e) => setEditingLayer({ 
                      ...editingLayer, 
                      attributes: {
                        ...editingLayer.attributes,
                        outlineWidth: parseFloat(e.target.value)
                      }
                    })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>
            )}
            
            {editingLayer.type === 'raster' && (
              <div style={{ marginBottom: '16px' }}>
                <h5 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Raster Layer Options</h5>
                
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                    Hue Rotate (Degrees)
                  </label>
                  <input 
                    type="number"
                    min="0"
                    max="360"
                    value={editingLayer.attributes?.hueRotate || 0}
                    onChange={(e) => setEditingLayer({ 
                      ...editingLayer, 
                      attributes: {
                        ...editingLayer.attributes,
                        hueRotate: parseFloat(e.target.value)
                      }
                    })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                    Saturation
                  </label>
                  <input 
                    type="range"
                    min="-1"
                    max="1"
                    step="0.1"
                    value={editingLayer.attributes?.saturation || 0}
                    onChange={(e) => setEditingLayer({ 
                      ...editingLayer, 
                      attributes: {
                        ...editingLayer.attributes,
                        saturation: parseFloat(e.target.value)
                      }
                    })}
                    style={{ width: '100%' }}
                  />
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '12px', 
                    color: '#64748b' 
                  }}>
                    <span>-1</span>
                    <span>0</span>
                    <span>1</span>
                  </div>
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                    Contrast
                  </label>
                  <input 
                    type="range"
                    min="-1"
                    max="1"
                    step="0.1"
                    value={editingLayer.attributes?.contrast || 0}
                    onChange={(e) => setEditingLayer({ 
                      ...editingLayer, 
                      attributes: {
                        ...editingLayer.attributes,
                        contrast: parseFloat(e.target.value)
                      }
                    })}
                    style={{ width: '100%' }}
                  />
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '12px', 
                    color: '#64748b' 
                  }}>
                    <span>-1</span>
                    <span>0</span>
                    <span>1</span>
                  </div>
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
              <button
                onClick={handleEditCancel}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={handleLayerSave}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#0ea5e9',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Save size={16} />
                Save Changes
              </button>
            </div>
          </div>
        ) : addingLayer ? (
          <div className="layer-add-form">
            <h4 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Add New Layer</h4>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>
                Layer Name
              </label>
              <input 
                type="text"
                value={editingLayer?.name || ''}
                onChange={(e) => setEditingLayer(prev => 
                  prev ? { ...prev, name: e.target.value } : null
                )}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>
                Layer Type
              </label>
              <select
                value={editingLayer?.type || 'vector'}
                onChange={(e) => setEditingLayer(prev => 
                  prev ? { 
                    ...prev, 
                    type: e.target.value as 'vector' | 'raster' | 'terrain' | 'imagery' | 'overlay'
                  } : null
                )}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px'
                }}
              >
                <option value="vector">Vector</option>
                <option value="raster">Raster</option>
                <option value="terrain">Terrain</option>
                <option value="imagery">Imagery</option>
                <option value="overlay">Overlay</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>
                Source URL
              </label>
              <input 
                type="text"
                value={editingLayer?.source || ''}
                onChange={(e) => setEditingLayer(prev => 
                  prev ? { ...prev, source: e.target.value } : null
                )}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px'
                }}
              />
            </div>
            
            {availableLayerSources.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>
                  Predefined Sources
                </label>
                <select
                  value=""
                  onChange={(e) => {
                    if (!e.target.value) return;
                    
                    const selectedSource = availableLayerSources.find(
                      source => source.id === e.target.value
                    );
                    
                    if (selectedSource && editingLayer) {
                      setEditingLayer({
                        ...editingLayer,
                        source: selectedSource.url,
                        type: selectedSource.type,
                        name: `${editingLayer.name} (${selectedSource.name})`
                      });
                    }
                    
                    // Reset selection
                    e.target.value = '';
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px'
                  }}
                >
                  <option value="">-- Select a predefined source --</option>
                  {availableLayerSources.map(source => (
                    <option key={source.id} value={source.id}>
                      {source.name} ({source.type})
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginBottom: '4px', 
                fontSize: '14px', 
                fontWeight: 'bold',
                cursor: 'pointer'
              }}>
                <input 
                  type="checkbox"
                  checked={editingLayer?.visible ?? true}
                  onChange={(e) => setEditingLayer(prev => 
                    prev ? { ...prev, visible: e.target.checked } : null
                  )}
                />
                Visible
              </label>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
              <button
                onClick={handleEditCancel}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={handleAddLayerSave}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#0ea5e9',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Plus size={16} />
                Add Layer
              </button>
            </div>
          </div>
        ) : (
          <div className="layer-list">
            {getLayersByGroup().map(group => (
              <div 
                key={group.id} 
                className="layer-group"
                style={{ marginBottom: '8px' }}
              >
                {/* Group header */}
                {layerGroups.length > 0 && (
                  <div 
                    className="layer-group-header"
                    onClick={() => handleLayerGroupToggle(group.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 16px',
                      backgroundColor: '#f1f5f9',
                      cursor: 'pointer',
                      borderTop: '1px solid #e2e8f0',
                      borderBottom: '1px solid #e2e8f0'
                    }}
                  >
                    <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                      {group.name} ({group.layers.length})
                    </span>
                    {expandedGroups[group.id] ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </div>
                )}
                
                {/* Group layers */}
                {(expandedGroups[group.id] || layerGroups.length === 0) && (
                  <div className="layer-group-content">
                    {group.layers.length === 0 ? (
                      <div style={{ 
                        padding: '16px', 
                        textAlign: 'center', 
                        color: '#64748b',
                        fontSize: '14px'
                      }}>
                        No layers found
                      </div>
                    ) : (
                      group.layers.map(layer => (
                        <div 
                          key={layer.id}
                          className={`layer-item ${selectedLayerId === layer.id ? 'selected' : ''}`}
                          onClick={() => handleLayerSelect(layer.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px 16px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #e2e8f0',
                            backgroundColor: selectedLayerId === layer.id ? '#f0f9ff' : 'transparent'
                          }}
                        >
                          {/* Layer visibility toggle */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLayerToggle(layer.id, !layer.visible);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '28px',
                              height: '28px',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: layer.visible ? '#0ea5e9' : '#94a3b8'
                            }}
                            title={layer.visible ? 'Hide layer' : 'Show layer'}
                          >
                            {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                          
                          {/* Layer type icon */}
                          <div style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            color: '#64748b'
                          }}>
                            {getLayerTypeIcon(layer.type)}
                          </div>
                          
                          {/* Layer name and details */}
                          <div style={{ flex: 1, marginLeft: '8px' }}>
                            <div style={{ 
                              fontSize: '14px',
                              fontWeight: layer.visible ? 'bold' : 'normal',
                              color: layer.visible ? '#0f172a' : '#64748b'
                            }}>
                              {layer.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              {layer.type} | Z-Index: {layer.zIndex}
                            </div>
                          </div>
                          
                          {/* Layer actions */}
                          <div 
                            className="layer-actions"
                            style={{ 
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Move up */}
                            <button
                              onClick={() => handleLayerMoveUp(layer.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '28px',
                                height: '28px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#64748b'
                              }}
                              title="Move up"
                            >
                              <ArrowUp size={16} />
                            </button>
                            
                            {/* Move down */}
                            <button
                              onClick={() => handleLayerMoveDown(layer.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '28px',
                                height: '28px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#64748b'
                              }}
                              title="Move down"
                            >
                              <ArrowDown size={16} />
                            </button>
                            
                            {/* Edit */}
                            <button
                              onClick={() => handleLayerEdit(layer)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '28px',
                                height: '28px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#64748b'
                              }}
                              title="Edit layer"
                            >
                              <Settings size={16} />
                            </button>
                            
                            {/* Remove */}
                            <button
                              onClick={() => handleLayerRemove(layer.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '28px',
                                height: '28px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#ef4444'
                              }}
                              title="Remove layer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {filteredLayers().length === 0 && searchTerm && (
              <div style={{ 
                padding: '16px', 
                textAlign: 'center', 
                color: '#64748b',
                fontSize: '14px'
              }}>
                No layers matching "{searchTerm}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};