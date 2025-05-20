/**
 * Map Controls Component
 * 
 * This component provides control panels for the CartographyModule map interface,
 * including layer management, basemap selection, and map tools.
 */

import React, { useState } from 'react';
import { BasemapStyle, MapProvider } from './CountyMapViewer';

interface Layer {
  id: string;
  name: string;
  description?: string;
  category: 'boundaries' | 'parcels' | 'taxCodes' | 'zoning' | 'aerial' | 'other';
  visible: boolean;
  icon?: string; // CSS class for icon
}

interface Tool {
  id: string;
  name: string;
  description?: string;
  icon?: string; // CSS class for icon
  shortcut?: string; // Keyboard shortcut
}

interface MapControlsProps {
  layers: Layer[];
  activeTool?: string;
  activeBasemap: BasemapStyle;
  isReadOnly?: boolean;
  showLegend?: boolean;
  onLayerToggle?: (layerId: string, visible: boolean) => void;
  onBasemapChange?: (style: BasemapStyle) => void;
  onToolSelect?: (toolId: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Map Controls Component
 */
export const MapControls: React.FC<MapControlsProps> = ({
  layers = [],
  activeTool = '',
  activeBasemap = BasemapStyle.STREETS,
  isReadOnly = false,
  showLegend = true,
  onLayerToggle,
  onBasemapChange,
  onToolSelect,
  className = '',
  style = {}
}) => {
  // State for panel visibility
  const [activePanel, setActivePanel] = useState<string>('layers');
  
  // Group layers by category
  const layersByCategory = layers.reduce((acc, layer) => {
    if (!acc[layer.category]) {
      acc[layer.category] = [];
    }
    acc[layer.category].push(layer);
    return acc;
  }, {} as Record<string, Layer[]>);
  
  // Handle layer toggle
  const handleLayerToggle = (layerId: string, visible: boolean) => {
    if (onLayerToggle) {
      onLayerToggle(layerId, visible);
    }
  };
  
  // Handle basemap change
  const handleBasemapChange = (style: BasemapStyle) => {
    if (onBasemapChange) {
      onBasemapChange(style);
    }
  };
  
  // Handle tool selection
  const handleToolSelect = (toolId: string) => {
    if (onToolSelect) {
      onToolSelect(toolId);
    }
  };
  
  // Category labels
  const categoryLabels: Record<string, string> = {
    boundaries: 'Boundaries',
    parcels: 'Parcels',
    taxCodes: 'Tax Codes',
    zoning: 'Zoning',
    aerial: 'Aerial Imagery',
    other: 'Other Layers'
  };
  
  // Available basemaps
  const basemaps = [
    { id: BasemapStyle.STREETS, name: 'Streets', icon: 'map' },
    { id: BasemapStyle.SATELLITE, name: 'Satellite', icon: 'satellite' },
    { id: BasemapStyle.TERRAIN, name: 'Terrain', icon: 'terrain' },
    { id: BasemapStyle.LIGHT, name: 'Light', icon: 'brightness_5' },
    { id: BasemapStyle.DARK, name: 'Dark', icon: 'brightness_2' },
    { id: BasemapStyle.OUTDOORS, name: 'Outdoors', icon: 'forest' },
    { id: BasemapStyle.TOPO, name: 'Topographic', icon: 'landscape' }
  ];
  
  // Available tools
  const tools: Tool[] = [
    { id: 'pan', name: 'Pan', icon: 'pan_tool', shortcut: 'P' },
    { id: 'select', name: 'Select', icon: 'select_all', shortcut: 'S' },
    { id: 'draw', name: 'Draw', icon: 'edit', shortcut: 'D' },
    { id: 'measure', name: 'Measure', icon: 'straighten', shortcut: 'M' },
    { id: 'identify', name: 'Identify', icon: 'info', shortcut: 'I' },
    { id: 'print', name: 'Print', icon: 'print', shortcut: 'Ctrl+P' }
  ];
  
  return (
    <div 
      className={`map-controls ${className}`}
      style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        backgroundColor: 'white',
        borderRadius: '4px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        maxHeight: 'calc(100% - 20px)',
        ...style
      }}
    >
      {/* Panel tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #ccc' }}>
        <button
          className={`panel-tab ${activePanel === 'layers' ? 'active' : ''}`}
          onClick={() => setActivePanel('layers')}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: 'none',
            background: activePanel === 'layers' ? '#f0f0f0' : 'white',
            borderBottom: activePanel === 'layers' ? '2px solid #0080ff' : 'none',
            cursor: 'pointer'
          }}
        >
          Layers
        </button>
        <button
          className={`panel-tab ${activePanel === 'basemaps' ? 'active' : ''}`}
          onClick={() => setActivePanel('basemaps')}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: 'none',
            background: activePanel === 'basemaps' ? '#f0f0f0' : 'white',
            borderBottom: activePanel === 'basemaps' ? '2px solid #0080ff' : 'none',
            cursor: 'pointer'
          }}
        >
          Basemaps
        </button>
        <button
          className={`panel-tab ${activePanel === 'tools' ? 'active' : ''}`}
          onClick={() => setActivePanel('tools')}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: 'none',
            background: activePanel === 'tools' ? '#f0f0f0' : 'white',
            borderBottom: activePanel === 'tools' ? '2px solid #0080ff' : 'none',
            cursor: 'pointer'
          }}
        >
          Tools
        </button>
      </div>
      
      {/* Panel content */}
      <div 
        style={{ 
          padding: '10px', 
          overflowY: 'auto',
          maxHeight: '400px'
        }}
      >
        {/* Layers panel */}
        {activePanel === 'layers' && (
          <div className="layers-panel">
            {Object.entries(layersByCategory).map(([category, categoryLayers]) => (
              <div key={category} className="layer-category" style={{ marginBottom: '15px' }}>
                <h3 style={{ fontSize: '14px', margin: '0 0 8px 0' }}>
                  {categoryLabels[category] || category}
                </h3>
                <div className="layer-list">
                  {categoryLayers.map(layer => (
                    <div 
                      key={layer.id} 
                      className="layer-item"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '6px 0',
                        borderBottom: '1px solid #eee'
                      }}
                    >
                      <input
                        type="checkbox"
                        id={`layer-${layer.id}`}
                        checked={layer.visible}
                        disabled={isReadOnly}
                        onChange={(e) => handleLayerToggle(layer.id, e.target.checked)}
                        style={{ margin: '0 8px 0 0' }}
                      />
                      <label 
                        htmlFor={`layer-${layer.id}`}
                        style={{ 
                          fontSize: '13px',
                          cursor: isReadOnly ? 'default' : 'pointer'
                        }}
                      >
                        {layer.name}
                      </label>
                      {layer.description && (
                        <div 
                          className="layer-info"
                          title={layer.description}
                          style={{
                            marginLeft: 'auto',
                            fontSize: '12px',
                            color: '#666',
                            cursor: 'help'
                          }}
                        >
                          ⓘ
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {Object.keys(layersByCategory).length === 0 && (
              <div style={{ padding: '20px 0', textAlign: 'center', color: '#666', fontSize: '13px' }}>
                No layers available
              </div>
            )}
          </div>
        )}
        
        {/* Basemaps panel */}
        {activePanel === 'basemaps' && (
          <div className="basemaps-panel">
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px' 
              }}
            >
              {basemaps.map(basemap => (
                <div
                  key={basemap.id}
                  className={`basemap-item ${activeBasemap === basemap.id ? 'active' : ''}`}
                  onClick={() => !isReadOnly && handleBasemapChange(basemap.id as BasemapStyle)}
                  style={{
                    padding: '10px',
                    border: activeBasemap === basemap.id ? '2px solid #0080ff' : '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: isReadOnly ? 'default' : 'pointer',
                    backgroundColor: activeBasemap === basemap.id ? '#f0f7ff' : 'white',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ marginBottom: '5px' }}>
                    {basemap.icon && (
                      <span 
                        className="material-icons"
                        style={{ fontSize: '24px' }}
                      >
                        {basemap.icon}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px' }}>
                    {basemap.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Tools panel */}
        {activePanel === 'tools' && (
          <div className="tools-panel">
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px' 
              }}
            >
              {tools.map(tool => (
                <div
                  key={tool.id}
                  className={`tool-item ${activeTool === tool.id ? 'active' : ''}`}
                  onClick={() => !isReadOnly && handleToolSelect(tool.id)}
                  style={{
                    padding: '10px',
                    border: activeTool === tool.id ? '2px solid #0080ff' : '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: isReadOnly ? 'default' : 'pointer',
                    backgroundColor: activeTool === tool.id ? '#f0f7ff' : 'white',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ marginBottom: '5px' }}>
                    {tool.icon && (
                      <span 
                        className="material-icons"
                        style={{ fontSize: '20px' }}
                      >
                        {tool.icon}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px' }}>
                    {tool.name}
                  </div>
                  {tool.shortcut && (
                    <div style={{ fontSize: '10px', color: '#666', marginTop: '3px' }}>
                      {tool.shortcut}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {isReadOnly && (
              <div style={{ 
                marginTop: '15px', 
                padding: '8px', 
                backgroundColor: '#fff8e1',
                border: '1px solid #ffe082',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                Tool selection is disabled in read-only mode
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Legend */}
      {showLegend && activePanel === 'layers' && (
        <div 
          className="map-legend"
          style={{
            padding: '10px',
            borderTop: '1px solid #ccc',
            fontSize: '12px'
          }}
        >
          <h4 style={{ margin: '0 0 8px 0', fontSize: '13px' }}>Legend</h4>
          
          {/* Parcel styling */}
          <div style={{ marginBottom: '10px' }}>
            <h5 style={{ margin: '0 0 5px 0', fontSize: '12px' }}>Parcels (by value)</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '20px', height: '10px', backgroundColor: '#0e51a2', marginRight: '5px' }}></div>
                <span>$1M+</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '20px', height: '10px', backgroundColor: '#2167a8', marginRight: '5px' }}></div>
                <span>$750K-$1M</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '20px', height: '10px', backgroundColor: '#3a7eb9', marginRight: '5px' }}></div>
                <span>$500K-$750K</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '20px', height: '10px', backgroundColor: '#5fa1ca', marginRight: '5px' }}></div>
                <span>$400K-$500K</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '20px', height: '10px', backgroundColor: '#8fc2dd', marginRight: '5px' }}></div>
                <span>$300K-$400K</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '20px', height: '10px', backgroundColor: '#c7dcef', marginRight: '5px' }}></div>
                <span>$200K-$300K</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '20px', height: '10px', backgroundColor: '#f7fbff', marginRight: '5px' }}></div>
                <span>&lt;$200K</span>
              </div>
            </div>
          </div>
          
          {/* Zoning legend */}
          <div>
            <h5 style={{ margin: '0 0 5px 0', fontSize: '12px' }}>Zoning</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '20px', height: '10px', backgroundColor: '#bdffb8', marginRight: '5px' }}></div>
                <span>R1 - Residential Single Family</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '20px', height: '10px', backgroundColor: '#9aeb94', marginRight: '5px' }}></div>
                <span>R2 - Residential Medium Density</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '20px', height: '10px', backgroundColor: '#caaef0', marginRight: '5px' }}></div>
                <span>C1 - Commercial</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '20px', height: '10px', backgroundColor: '#ff9e9e', marginRight: '5px' }}></div>
                <span>I1 - Industrial</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '20px', height: '10px', backgroundColor: '#f1dfad', marginRight: '5px' }}></div>
                <span>AG - Agricultural</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};