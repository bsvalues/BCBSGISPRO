/**
 * Map Controls Component
 * 
 * This component provides a comprehensive set of controls for interacting with maps,
 * including layer management, measurement tools, drawing tools, and more.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  Ruler, 
  Home, 
  Pencil, 
  Map as MapIcon, 
  Eye, 
  EyeOff,
  Search,
  Compass,
  Maximize2,
  Minimize2,
  PlusSquare,
  Trash2,
  RotateCcw,
  Save,
  Download,
  Printer,
  Share2,
  Sliders,
  FileText
} from 'lucide-react';

import { logger } from '../../../../libs/DevOps/utils/logger';

// Create module-specific logger
const mapLogger = logger.withTags(['CartographyModule', 'MapControls']);

/**
 * Layer information
 */
export interface LayerInfo {
  id: string;
  name: string;
  type: 'vector' | 'raster' | 'terrain' | 'imagery' | 'overlay';
  visible: boolean;
  opacity: number; // 0 to 1
  zIndex: number;
  source?: string;
  attributes?: Record<string, any>; // Additional layer attributes
  metadata?: Record<string, any>; // Layer metadata
}

/**
 * Measurement type
 */
export enum MeasurementType {
  DISTANCE = 'distance',
  AREA = 'area',
  PERIMETER = 'perimeter',
  BEARING = 'bearing',
  ANGLE = 'angle',
  ELEVATION = 'elevation'
}

/**
 * Drawing tool type
 */
export enum DrawingToolType {
  POINT = 'point',
  LINE = 'line',
  POLYGON = 'polygon',
  RECTANGLE = 'rectangle',
  CIRCLE = 'circle',
  MARKER = 'marker',
  TEXT = 'text',
  FREEHAND = 'freehand'
}

/**
 * Map view information
 */
export interface MapView {
  center: { lat: number; lng: number };
  zoom: number;
  bearing: number;
  pitch: number;
}

/**
 * Map control props
 */
export interface MapControlsProps {
  // Map instance (can be mapbox, leaflet, etc.)
  mapInstance?: any;
  
  // Available layers
  layers: LayerInfo[];
  
  // Current map view
  view: MapView;
  
  // Control visibility options
  showLayerControl?: boolean;
  showMeasurementTools?: boolean;
  showDrawingTools?: boolean;
  showNavigationControls?: boolean;
  showMapSettings?: boolean;
  showPrintExport?: boolean;
  
  // Event handlers
  onLayerToggle?: (layerId: string, visible: boolean) => void;
  onLayerOpacityChange?: (layerId: string, opacity: number) => void;
  onLayerOrderChange?: (layerId: string, newIndex: number) => void;
  
  onMeasurementStart?: (type: MeasurementType) => void;
  onMeasurementComplete?: (measurement: any) => void;
  onMeasurementCancel?: () => void;
  
  onDrawingStart?: (tool: DrawingToolType) => void;
  onDrawingComplete?: (feature: any) => void;
  onDrawingCancel?: () => void;
  onDrawingDelete?: (featureId: string) => void;
  
  onViewChange?: (view: MapView) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetNorth?: () => void;
  onResetView?: () => void;
  
  onPrint?: () => void;
  onExport?: (format: 'png' | 'jpg' | 'svg' | 'pdf') => void;
  onShare?: () => void;
  
  // Component styling
  className?: string;
  style?: React.CSSProperties;
  orientation?: 'horizontal' | 'vertical';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  expandedByDefault?: boolean;
}

/**
 * Map Controls Component
 */
export const MapControls: React.FC<MapControlsProps> = ({
  mapInstance,
  layers = [],
  view,
  showLayerControl = true,
  showMeasurementTools = true,
  showDrawingTools = true,
  showNavigationControls = true,
  showMapSettings = true,
  showPrintExport = true,
  onLayerToggle,
  onLayerOpacityChange,
  onLayerOrderChange,
  onMeasurementStart,
  onMeasurementComplete,
  onMeasurementCancel,
  onDrawingStart,
  onDrawingComplete,
  onDrawingCancel,
  onDrawingDelete,
  onViewChange,
  onZoomIn,
  onZoomOut,
  onResetNorth,
  onResetView,
  onPrint,
  onExport,
  onShare,
  className = '',
  style = {},
  orientation = 'vertical',
  position = 'top-right',
  expandedByDefault = false
}) => {
  // State for component visibility
  const [controlsExpanded, setControlsExpanded] = useState<boolean>(expandedByDefault);
  
  // State for active panels
  const [activePanel, setActivePanel] = useState<string | null>(null);
  
  // State for measurements
  const [activeMeasurement, setActiveMeasurement] = useState<MeasurementType | null>(null);
  
  // State for drawing
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingToolType | null>(null);
  
  // Initialize on component mount
  useEffect(() => {
    mapLogger.info('Map controls initialized', { position, orientation });
    
    return () => {
      // Clean up any active interactions on unmount
      if (activeMeasurement && onMeasurementCancel) {
        onMeasurementCancel();
      }
      
      if (activeDrawingTool && onDrawingCancel) {
        onDrawingCancel();
      }
    };
  }, []);
  
  // Handler for layer visibility toggle
  const handleLayerToggle = useCallback((layerId: string, visible: boolean) => {
    mapLogger.debug(`Toggle layer visibility: ${layerId} = ${visible}`);
    
    if (onLayerToggle) {
      onLayerToggle(layerId, visible);
    }
  }, [onLayerToggle]);
  
  // Handler for layer opacity change
  const handleLayerOpacityChange = useCallback((layerId: string, opacity: number) => {
    mapLogger.debug(`Change layer opacity: ${layerId} = ${opacity}`);
    
    if (onLayerOpacityChange) {
      onLayerOpacityChange(layerId, opacity);
    }
  }, [onLayerOpacityChange]);
  
  // Handler for layer order change
  const handleLayerOrderChange = useCallback((layerId: string, newIndex: number) => {
    mapLogger.debug(`Change layer order: ${layerId} to index ${newIndex}`);
    
    if (onLayerOrderChange) {
      onLayerOrderChange(layerId, newIndex);
    }
  }, [onLayerOrderChange]);
  
  // Handler for measurement tool selection
  const handleMeasurementSelect = useCallback((type: MeasurementType) => {
    mapLogger.debug(`Select measurement tool: ${type}`);
    
    // Cancel any active drawing
    if (activeDrawingTool && onDrawingCancel) {
      onDrawingCancel();
      setActiveDrawingTool(null);
    }
    
    // Toggle measurement tool
    if (activeMeasurement === type) {
      // Deactivate if already active
      if (onMeasurementCancel) {
        onMeasurementCancel();
      }
      setActiveMeasurement(null);
    } else {
      // Cancel current measurement if there is one
      if (activeMeasurement && onMeasurementCancel) {
        onMeasurementCancel();
      }
      
      // Activate new measurement
      if (onMeasurementStart) {
        onMeasurementStart(type);
      }
      setActiveMeasurement(type);
    }
  }, [activeMeasurement, activeDrawingTool, onMeasurementStart, onMeasurementCancel, onDrawingCancel]);
  
  // Handler for drawing tool selection
  const handleDrawingSelect = useCallback((tool: DrawingToolType) => {
    mapLogger.debug(`Select drawing tool: ${tool}`);
    
    // Cancel any active measurement
    if (activeMeasurement && onMeasurementCancel) {
      onMeasurementCancel();
      setActiveMeasurement(null);
    }
    
    // Toggle drawing tool
    if (activeDrawingTool === tool) {
      // Deactivate if already active
      if (onDrawingCancel) {
        onDrawingCancel();
      }
      setActiveDrawingTool(null);
    } else {
      // Cancel current drawing if there is one
      if (activeDrawingTool && onDrawingCancel) {
        onDrawingCancel();
      }
      
      // Activate new drawing tool
      if (onDrawingStart) {
        onDrawingStart(tool);
      }
      setActiveDrawingTool(tool);
    }
  }, [activeDrawingTool, activeMeasurement, onDrawingStart, onDrawingCancel, onMeasurementCancel]);
  
  // Handler for navigation actions
  const handleNavigationAction = useCallback((action: 'zoomIn' | 'zoomOut' | 'resetNorth' | 'resetView') => {
    mapLogger.debug(`Navigation action: ${action}`);
    
    switch (action) {
      case 'zoomIn':
        if (onZoomIn) onZoomIn();
        break;
      case 'zoomOut':
        if (onZoomOut) onZoomOut();
        break;
      case 'resetNorth':
        if (onResetNorth) onResetNorth();
        break;
      case 'resetView':
        if (onResetView) onResetView();
        break;
    }
  }, [onZoomIn, onZoomOut, onResetNorth, onResetView]);
  
  // Handler for print/export actions
  const handlePrintExport = useCallback((action: 'print' | 'export' | 'share', format?: 'png' | 'jpg' | 'svg' | 'pdf') => {
    mapLogger.debug(`Print/Export action: ${action}${format ? ` (${format})` : ''}`);
    
    switch (action) {
      case 'print':
        if (onPrint) onPrint();
        break;
      case 'export':
        if (onExport && format) onExport(format);
        break;
      case 'share':
        if (onShare) onShare();
        break;
    }
  }, [onPrint, onExport, onShare]);
  
  // Toggle panel visibility
  const togglePanel = useCallback((panelName: string) => {
    mapLogger.debug(`Toggle panel: ${panelName}`);
    setActivePanel(prevPanel => prevPanel === panelName ? null : panelName);
  }, []);
  
  // Toggle controls expansion
  const toggleControlsExpanded = useCallback(() => {
    mapLogger.debug(`Toggle controls expanded: ${!controlsExpanded}`);
    setControlsExpanded(prev => !prev);
  }, [controlsExpanded]);
  
  // Determine container classes based on position and orientation
  const containerClasses = `map-controls ${position} ${orientation} ${controlsExpanded ? 'expanded' : 'collapsed'} ${className}`;
  
  // Get icon size based on orientation
  const iconSize = 20;
  
  return (
    <div className={containerClasses} style={{ 
      position: 'absolute',
      ...getPositionStyle(position),
      display: 'flex',
      flexDirection: orientation === 'vertical' ? 'column' : 'row',
      backgroundColor: 'white',
      borderRadius: '4px',
      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
      zIndex: 1000,
      padding: '6px',
      ...style
    }}>
      {/* Collapse/Expand button */}
      <button 
        className="toggle-button"
        onClick={toggleControlsExpanded}
        style={{
          position: 'absolute',
          ...getToggleButtonPosition(position, orientation),
          width: '24px',
          height: '24px',
          backgroundColor: 'white',
          border: 'none',
          borderRadius: '50%',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 1001
        }}
      >
        {controlsExpanded ? 
          (orientation === 'vertical' ? '›' : '‹') : 
          (orientation === 'vertical' ? '‹' : '›')}
      </button>
      
      {/* Control panels */}
      {controlsExpanded && (
        <>
          {/* Layers control */}
          {showLayerControl && (
            <div className="control-section">
              <button 
                className={`control-button ${activePanel === 'layers' ? 'active' : ''}`}
                onClick={() => togglePanel('layers')}
                title="Layers"
                style={getControlButtonStyle(activePanel === 'layers')}
              >
                <Layers size={iconSize} />
              </button>
              
              {activePanel === 'layers' && (
                <div className="panel layers-panel" style={getPanelStyle(position, orientation)}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Layers</h3>
                  
                  {layers.length === 0 ? (
                    <p style={{ color: '#666', fontSize: '13px' }}>No layers available</p>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {[...layers]
                        .sort((a, b) => b.zIndex - a.zIndex)
                        .map(layer => (
                          <li 
                            key={layer.id} 
                            style={{ 
                              marginBottom: '8px', 
                              padding: '8px',
                              backgroundColor: '#f5f5f5',
                              borderRadius: '4px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{layer.name}</span>
                              
                              <button
                                onClick={() => handleLayerToggle(layer.id, !layer.visible)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '4px'
                                }}
                                title={layer.visible ? 'Hide layer' : 'Show layer'}
                              >
                                {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                              </button>
                            </div>
                            
                            {layer.visible && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '12px', minWidth: '60px' }}>Opacity:</span>
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.1"
                                  value={layer.opacity}
                                  onChange={(e) => handleLayerOpacityChange(layer.id, parseFloat(e.target.value))}
                                  style={{ flex: 1 }}
                                />
                                <span style={{ fontSize: '12px', width: '30px', textAlign: 'right' }}>
                                  {Math.round(layer.opacity * 100)}%
                                </span>
                              </div>
                            )}
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Measurement tools */}
          {showMeasurementTools && (
            <div className="control-section">
              <button 
                className={`control-button ${activePanel === 'measurement' ? 'active' : ''}`}
                onClick={() => togglePanel('measurement')}
                title="Measurement"
                style={getControlButtonStyle(activePanel === 'measurement')}
              >
                <Ruler size={iconSize} />
              </button>
              
              {activePanel === 'measurement' && (
                <div className="panel measurement-panel" style={getPanelStyle(position, orientation)}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Measurement Tools</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button 
                      onClick={() => handleMeasurementSelect(MeasurementType.DISTANCE)}
                      style={getToolButtonStyle(activeMeasurement === MeasurementType.DISTANCE)}
                      title="Measure distance"
                    >
                      <Ruler size={16} style={{ marginRight: '8px' }} />
                      Distance
                    </button>
                    
                    <button 
                      onClick={() => handleMeasurementSelect(MeasurementType.AREA)}
                      style={getToolButtonStyle(activeMeasurement === MeasurementType.AREA)}
                      title="Measure area"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                        <path d="M3 3h18v18H3z"/>
                      </svg>
                      Area
                    </button>
                    
                    <button 
                      onClick={() => handleMeasurementSelect(MeasurementType.PERIMETER)}
                      style={getToolButtonStyle(activeMeasurement === MeasurementType.PERIMETER)}
                      title="Measure perimeter"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                        <path d="M3 3h18v18H3z"/>
                        <path d="M21 3v18M3 21h18M3 3v18"/>
                      </svg>
                      Perimeter
                    </button>
                    
                    <button 
                      onClick={() => handleMeasurementSelect(MeasurementType.BEARING)}
                      style={getToolButtonStyle(activeMeasurement === MeasurementType.BEARING)}
                      title="Measure bearing"
                    >
                      <Compass size={16} style={{ marginRight: '8px' }} />
                      Bearing
                    </button>
                    
                    {activeMeasurement && (
                      <button 
                        onClick={() => {
                          if (onMeasurementCancel) onMeasurementCancel();
                          setActiveMeasurement(null);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '8px 12px',
                          backgroundColor: '#fee2e2',
                          color: '#b91c1c',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          marginTop: '8px'
                        }}
                      >
                        <Trash2 size={16} style={{ marginRight: '8px' }} />
                        Cancel Measurement
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Drawing tools */}
          {showDrawingTools && (
            <div className="control-section">
              <button 
                className={`control-button ${activePanel === 'drawing' ? 'active' : ''}`}
                onClick={() => togglePanel('drawing')}
                title="Drawing"
                style={getControlButtonStyle(activePanel === 'drawing')}
              >
                <Pencil size={iconSize} />
              </button>
              
              {activePanel === 'drawing' && (
                <div className="panel drawing-panel" style={getPanelStyle(position, orientation)}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Drawing Tools</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button 
                      onClick={() => handleDrawingSelect(DrawingToolType.POINT)}
                      style={getToolButtonStyle(activeDrawingTool === DrawingToolType.POINT)}
                      title="Draw point"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      Point
                    </button>
                    
                    <button 
                      onClick={() => handleDrawingSelect(DrawingToolType.LINE)}
                      style={getToolButtonStyle(activeDrawingTool === DrawingToolType.LINE)}
                      title="Draw line"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                        <path d="M5 19l14-14"/>
                      </svg>
                      Line
                    </button>
                    
                    <button 
                      onClick={() => handleDrawingSelect(DrawingToolType.POLYGON)}
                      style={getToolButtonStyle(activeDrawingTool === DrawingToolType.POLYGON)}
                      title="Draw polygon"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                        <path d="M12 3L3 12l5 9h8l5-9z"/>
                      </svg>
                      Polygon
                    </button>
                    
                    <button 
                      onClick={() => handleDrawingSelect(DrawingToolType.RECTANGLE)}
                      style={getToolButtonStyle(activeDrawingTool === DrawingToolType.RECTANGLE)}
                      title="Draw rectangle"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      </svg>
                      Rectangle
                    </button>
                    
                    <button 
                      onClick={() => handleDrawingSelect(DrawingToolType.CIRCLE)}
                      style={getToolButtonStyle(activeDrawingTool === DrawingToolType.CIRCLE)}
                      title="Draw circle"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                        <circle cx="12" cy="12" r="10"/>
                      </svg>
                      Circle
                    </button>
                    
                    <button 
                      onClick={() => handleDrawingSelect(DrawingToolType.TEXT)}
                      style={getToolButtonStyle(activeDrawingTool === DrawingToolType.TEXT)}
                      title="Add text"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                        <polyline points="4 7 4 4 20 4 20 7"/>
                        <line x1="9" y1="20" x2="15" y2="20"/>
                        <line x1="12" y1="4" x2="12" y2="20"/>
                      </svg>
                      Text
                    </button>
                    
                    {activeDrawingTool && (
                      <>
                        <button 
                          onClick={() => {
                            if (onDrawingCancel) onDrawingCancel();
                            setActiveDrawingTool(null);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '8px 12px',
                            backgroundColor: '#fee2e2',
                            color: '#b91c1c',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginTop: '8px'
                          }}
                        >
                          <Trash2 size={16} style={{ marginRight: '8px' }} />
                          Cancel Drawing
                        </button>
                        
                        <button 
                          onClick={() => {
                            if (onDrawingComplete) onDrawingComplete({});
                            setActiveDrawingTool(null);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '8px 12px',
                            backgroundColor: '#e0f2fe',
                            color: '#0369a1',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          <Save size={16} style={{ marginRight: '8px' }} />
                          Complete Drawing
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Navigation controls */}
          {showNavigationControls && (
            <div className="control-section">
              <button 
                className="control-button"
                onClick={() => handleNavigationAction('zoomIn')}
                title="Zoom in"
                style={getControlButtonStyle(false)}
              >
                <ZoomIn size={iconSize} />
              </button>
              
              <button 
                className="control-button"
                onClick={() => handleNavigationAction('zoomOut')}
                title="Zoom out"
                style={getControlButtonStyle(false)}
              >
                <ZoomOut size={iconSize} />
              </button>
              
              <button 
                className="control-button"
                onClick={() => handleNavigationAction('resetNorth')}
                title="Reset north"
                style={getControlButtonStyle(false)}
              >
                <Compass size={iconSize} />
              </button>
              
              <button 
                className="control-button"
                onClick={() => handleNavigationAction('resetView')}
                title="Reset view"
                style={getControlButtonStyle(false)}
              >
                <Home size={iconSize} />
              </button>
            </div>
          )}
          
          {/* Map settings */}
          {showMapSettings && (
            <div className="control-section">
              <button 
                className={`control-button ${activePanel === 'settings' ? 'active' : ''}`}
                onClick={() => togglePanel('settings')}
                title="Map Settings"
                style={getControlButtonStyle(activePanel === 'settings')}
              >
                <Sliders size={iconSize} />
              </button>
              
              {activePanel === 'settings' && (
                <div className="panel settings-panel" style={getPanelStyle(position, orientation)}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Map Settings</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '14px' }}>
                        Zoom Level: {view.zoom.toFixed(1)}
                      </label>
                      <input 
                        type="range" 
                        min="1" 
                        max="20" 
                        step="0.1" 
                        value={view.zoom}
                        onChange={(e) => {
                          if (onViewChange) {
                            onViewChange({
                              ...view,
                              zoom: parseFloat(e.target.value)
                            });
                          }
                        }}
                        style={{ width: '100%' }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '14px' }}>
                        Bearing: {view.bearing.toFixed(1)}°
                      </label>
                      <input 
                        type="range" 
                        min="0" 
                        max="360" 
                        value={view.bearing}
                        onChange={(e) => {
                          if (onViewChange) {
                            onViewChange({
                              ...view,
                              bearing: parseFloat(e.target.value)
                            });
                          }
                        }}
                        style={{ width: '100%' }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '14px' }}>
                        Pitch: {view.pitch.toFixed(1)}°
                      </label>
                      <input 
                        type="range" 
                        min="0" 
                        max="60" 
                        value={view.pitch}
                        onChange={(e) => {
                          if (onViewChange) {
                            onViewChange({
                              ...view,
                              pitch: parseFloat(e.target.value)
                            });
                          }
                        }}
                        style={{ width: '100%' }}
                      />
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginTop: '8px'
                    }}>
                      <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                        Center: {view.center.lat.toFixed(5)}, {view.center.lng.toFixed(5)}
                      </span>
                      
                      <button
                        onClick={() => {
                          if (onResetView) onResetView();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '6px 8px',
                          backgroundColor: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <RotateCcw size={14} style={{ marginRight: '4px' }} />
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Print and export */}
          {showPrintExport && (
            <div className="control-section">
              <button 
                className={`control-button ${activePanel === 'export' ? 'active' : ''}`}
                onClick={() => togglePanel('export')}
                title="Print & Export"
                style={getControlButtonStyle(activePanel === 'export')}
              >
                <Printer size={iconSize} />
              </button>
              
              {activePanel === 'export' && (
                <div className="panel export-panel" style={getPanelStyle(position, orientation)}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Print & Export</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button 
                      onClick={() => handlePrintExport('print')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Printer size={16} style={{ marginRight: '8px' }} />
                      Print Map
                    </button>
                    
                    <button 
                      onClick={() => handlePrintExport('export', 'png')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Download size={16} style={{ marginRight: '8px' }} />
                      Export as PNG
                    </button>
                    
                    <button 
                      onClick={() => handlePrintExport('export', 'pdf')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <FileText size={16} style={{ marginRight: '8px' }} />
                      Export as PDF
                    </button>
                    
                    <button 
                      onClick={() => handlePrintExport('share')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Share2 size={16} style={{ marginRight: '8px' }} />
                      Share Map
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Helper function to get positioning style based on position prop
function getPositionStyle(position: string): React.CSSProperties {
  switch (position) {
    case 'top-left':
      return { top: '10px', left: '10px' };
    case 'top-right':
      return { top: '10px', right: '10px' };
    case 'bottom-left':
      return { bottom: '10px', left: '10px' };
    case 'bottom-right':
      return { bottom: '10px', right: '10px' };
    default:
      return { top: '10px', right: '10px' };
  }
}

// Helper function to get toggle button position
function getToggleButtonPosition(position: string, orientation: string): React.CSSProperties {
  if (orientation === 'vertical') {
    return position.includes('left') 
      ? { left: '100%', top: '0' }
      : { right: '100%', top: '0' };
  } else {
    return position.includes('top')
      ? { top: '100%', left: '0' }
      : { bottom: '100%', left: '0' };
  }
}

// Helper function to get control button style
function getControlButtonStyle(isActive: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    margin: '4px',
    backgroundColor: isActive ? '#e0f2fe' : 'transparent',
    color: isActive ? '#0369a1' : '#4b5563',
    border: isActive ? '1px solid #bae6fd' : '1px solid #e5e7eb',
    borderRadius: '4px',
    cursor: 'pointer'
  };
}

// Helper function to get panel style
function getPanelStyle(position: string, orientation: string): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: '4px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
    padding: '12px',
    zIndex: 1002,
    minWidth: '240px',
    maxWidth: '280px',
    maxHeight: '400px',
    overflowY: 'auto'
  };
  
  // Adjust position based on control position and orientation
  if (orientation === 'vertical') {
    if (position.includes('right')) {
      return { ...baseStyle, right: '100%', top: '0', marginRight: '10px' };
    } else {
      return { ...baseStyle, left: '100%', top: '0', marginLeft: '10px' };
    }
  } else {
    if (position.includes('top')) {
      return { ...baseStyle, top: '100%', left: '0', marginTop: '10px' };
    } else {
      return { ...baseStyle, bottom: '100%', left: '0', marginBottom: '10px' };
    }
  }
}

// Helper function to get tool button style
function getToolButtonStyle(isActive: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: isActive ? '#e0f2fe' : '#f1f5f9',
    color: isActive ? '#0369a1' : '#4b5563',
    border: isActive ? '1px solid #bae6fd' : '1px solid #cbd5e1',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: isActive ? 'bold' : 'normal'
  };
}