import React, { useState } from 'react';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  // State for expandable sections
  const [expandedSections, setExpandedSections] = useState<{
    basemaps: boolean;
    layers: boolean;
    favorites: boolean;
    tools: boolean;
  }>({
    basemaps: true,
    layers: true,
    favorites: false,
    tools: true
  });
  
  // State for layer visibility and opacity
  const [layers, setLayers] = useState<{
    [key: string]: {
      visible: boolean;
      opacity: number;
      expanded: boolean;
    }
  }>({
    'parcels': { visible: true, opacity: 100, expanded: true },
    'zoning': { visible: true, opacity: 80, expanded: false },
    'imagery': { visible: true, opacity: 70, expanded: false },
    'streets': { visible: true, opacity: 100, expanded: false },
    'tax_districts': { visible: false, opacity: 60, expanded: false },
    'floodplains': { visible: false, opacity: 50, expanded: false },
    'topography': { visible: false, opacity: 70, expanded: false }
  });
  
  // Toggle section expansion
  const toggleSection = (section: 'basemaps' | 'layers' | 'favorites' | 'tools') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Toggle layer visibility
  const toggleLayerVisibility = (layerName: string) => {
    setLayers(prev => ({
      ...prev,
      [layerName]: {
        ...prev[layerName],
        visible: !prev[layerName].visible
      }
    }));
  };
  
  // Toggle layer controls expansion
  const toggleLayerExpanded = (layerName: string) => {
    setLayers(prev => ({
      ...prev,
      [layerName]: {
        ...prev[layerName],
        expanded: !prev[layerName].expanded
      }
    }));
  };
  
  // Update layer opacity
  const updateLayerOpacity = (layerName: string, opacity: number) => {
    setLayers(prev => ({
      ...prev,
      [layerName]: {
        ...prev[layerName],
        opacity
      }
    }));
  };
  
  // Select basemap
  const [selectedBasemap, setSelectedBasemap] = useState<string>('streets');
  
  const selectBasemap = (basemap: string) => {
    setSelectedBasemap(basemap);
  };
  
  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
    // Implement search functionality
  };
  
  return (
    <div className={`sidebar ${isOpen ? '' : 'closed'}`}>
      <div className="sidebar-sections">
        <button className="section-button active">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
            <line x1="8" y1="2" x2="8" y2="18"></line>
            <line x1="16" y1="6" x2="16" y2="22"></line>
          </svg>
          <span>Layers</span>
        </button>
        
        <button className="section-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span>Parcels</span>
        </button>
        
        <button className="section-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <span>Data</span>
        </button>
        
        <button className="section-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="21" x2="4" y2="14"></line>
            <line x1="4" y1="10" x2="4" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12" y2="3"></line>
            <line x1="20" y1="21" x2="20" y2="16"></line>
            <line x1="20" y1="12" x2="20" y2="3"></line>
            <line x1="1" y1="14" x2="7" y2="14"></line>
            <line x1="9" y1="8" x2="15" y2="8"></line>
            <line x1="17" y1="16" x2="23" y2="16"></line>
          </svg>
          <span>Settings</span>
        </button>
      </div>
      
      <div className="sidebar-content">
        {/* Parcel Search */}
        <div className="parcel-search">
          <form onSubmit={handleSearchSubmit}>
            <input 
              type="text" 
              placeholder="Search parcel ID or address..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <button type="submit" className="search-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </form>
        </div>
        
        {/* Basemaps section */}
        <div className="expandable-section">
          <div 
            className="expandable-header" 
            onClick={() => toggleSection('basemaps')}
          >
            <svg className={`expand-icon ${expandedSections.basemaps ? 'expanded' : ''}`} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
            <span>Basemap</span>
          </div>
          
          {expandedSections.basemaps && (
            <div className="expandable-content">
              <div 
                className={`expandable-item ${selectedBasemap === 'streets' ? 'active' : ''}`} 
                onClick={() => selectBasemap('streets')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
                Streets
              </div>
              
              <div 
                className={`expandable-item ${selectedBasemap === 'satellite' ? 'active' : ''}`} 
                onClick={() => selectBasemap('satellite')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
                Satellite
              </div>
              
              <div 
                className={`expandable-item ${selectedBasemap === 'hybrid' ? 'active' : ''}`} 
                onClick={() => selectBasemap('hybrid')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
                Hybrid
              </div>
              
              <div 
                className={`expandable-item ${selectedBasemap === 'topographic' ? 'active' : ''}`} 
                onClick={() => selectBasemap('topographic')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
                Topographic
              </div>
            </div>
          )}
        </div>
        
        {/* Layers section */}
        <div className="expandable-section">
          <div 
            className="expandable-header" 
            onClick={() => toggleSection('layers')}
          >
            <svg className={`expand-icon ${expandedSections.layers ? 'expanded' : ''}`} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
            <span>Layers</span>
          </div>
          
          {expandedSections.layers && (
            <div className="expandable-content">
              {/* Parcels layer */}
              <div className="layer-item">
                <div className="layer-header" onClick={() => toggleLayerExpanded('parcels')}>
                  <input 
                    type="checkbox" 
                    id="layer-parcels" 
                    checked={layers.parcels.visible}
                    onChange={() => toggleLayerVisibility('parcels')}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <label htmlFor="layer-parcels">Parcels</label>
                </div>
                {layers.parcels.expanded && (
                  <div className="layer-controls">
                    <div className="layer-opacity">
                      <span>Opacity:</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={layers.parcels.opacity}
                        onChange={(e) => updateLayerOpacity('parcels', parseInt(e.target.value))}
                      />
                      <span>{layers.parcels.opacity}%</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Zoning layer */}
              <div className="layer-item">
                <div className="layer-header" onClick={() => toggleLayerExpanded('zoning')}>
                  <input 
                    type="checkbox" 
                    id="layer-zoning" 
                    checked={layers.zoning.visible}
                    onChange={() => toggleLayerVisibility('zoning')}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <label htmlFor="layer-zoning">Zoning</label>
                </div>
                {layers.zoning.expanded && (
                  <div className="layer-controls">
                    <div className="layer-opacity">
                      <span>Opacity:</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={layers.zoning.opacity}
                        onChange={(e) => updateLayerOpacity('zoning', parseInt(e.target.value))}
                      />
                      <span>{layers.zoning.opacity}%</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Imagery layer */}
              <div className="layer-item">
                <div className="layer-header" onClick={() => toggleLayerExpanded('imagery')}>
                  <input 
                    type="checkbox" 
                    id="layer-imagery" 
                    checked={layers.imagery.visible}
                    onChange={() => toggleLayerVisibility('imagery')}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <label htmlFor="layer-imagery">Aerial Imagery</label>
                </div>
                {layers.imagery.expanded && (
                  <div className="layer-controls">
                    <div className="layer-opacity">
                      <span>Opacity:</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={layers.imagery.opacity}
                        onChange={(e) => updateLayerOpacity('imagery', parseInt(e.target.value))}
                      />
                      <span>{layers.imagery.opacity}%</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Streets layer */}
              <div className="layer-item">
                <div className="layer-header" onClick={() => toggleLayerExpanded('streets')}>
                  <input 
                    type="checkbox" 
                    id="layer-streets" 
                    checked={layers.streets.visible}
                    onChange={() => toggleLayerVisibility('streets')}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <label htmlFor="layer-streets">Streets</label>
                </div>
                {layers.streets.expanded && (
                  <div className="layer-controls">
                    <div className="layer-opacity">
                      <span>Opacity:</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={layers.streets.opacity}
                        onChange={(e) => updateLayerOpacity('streets', parseInt(e.target.value))}
                      />
                      <span>{layers.streets.opacity}%</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Tax Districts layer */}
              <div className="layer-item">
                <div className="layer-header" onClick={() => toggleLayerExpanded('tax_districts')}>
                  <input 
                    type="checkbox" 
                    id="layer-tax_districts" 
                    checked={layers.tax_districts.visible}
                    onChange={() => toggleLayerVisibility('tax_districts')}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <label htmlFor="layer-tax_districts">Tax Districts</label>
                </div>
                {layers.tax_districts.expanded && (
                  <div className="layer-controls">
                    <div className="layer-opacity">
                      <span>Opacity:</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={layers.tax_districts.opacity}
                        onChange={(e) => updateLayerOpacity('tax_districts', parseInt(e.target.value))}
                      />
                      <span>{layers.tax_districts.opacity}%</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Floodplains layer */}
              <div className="layer-item">
                <div className="layer-header" onClick={() => toggleLayerExpanded('floodplains')}>
                  <input 
                    type="checkbox" 
                    id="layer-floodplains" 
                    checked={layers.floodplains.visible}
                    onChange={() => toggleLayerVisibility('floodplains')}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <label htmlFor="layer-floodplains">Floodplains</label>
                </div>
                {layers.floodplains.expanded && (
                  <div className="layer-controls">
                    <div className="layer-opacity">
                      <span>Opacity:</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={layers.floodplains.opacity}
                        onChange={(e) => updateLayerOpacity('floodplains', parseInt(e.target.value))}
                      />
                      <span>{layers.floodplains.opacity}%</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Topography layer */}
              <div className="layer-item">
                <div className="layer-header" onClick={() => toggleLayerExpanded('topography')}>
                  <input 
                    type="checkbox" 
                    id="layer-topography" 
                    checked={layers.topography.visible}
                    onChange={() => toggleLayerVisibility('topography')}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <label htmlFor="layer-topography">Topography</label>
                </div>
                {layers.topography.expanded && (
                  <div className="layer-controls">
                    <div className="layer-opacity">
                      <span>Opacity:</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={layers.topography.opacity}
                        onChange={(e) => updateLayerOpacity('topography', parseInt(e.target.value))}
                      />
                      <span>{layers.topography.opacity}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Tools section */}
        <div className="expandable-section">
          <div 
            className="expandable-header" 
            onClick={() => toggleSection('tools')}
          >
            <svg className={`expand-icon ${expandedSections.tools ? 'expanded' : ''}`} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
            <span>Tools</span>
          </div>
          
          {expandedSections.tools && (
            <div className="expandable-content">
              <div className="expandable-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                Measurement
              </div>
              
              <div className="expandable-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="14 2 18 6 7 17 3 17 3 13 14 2"></polygon>
                  <line x1="3" y1="22" x2="21" y2="22"></line>
                </svg>
                Draw
              </div>
              
              <div className="expandable-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
                  <path d="M12 12v9"></path>
                  <path d="M8 17h8"></path>
                </svg>
                Export
              </div>
              
              <div className="expandable-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                About
              </div>
            </div>
          )}
        </div>
        
        {/* Favorites section */}
        <div className="expandable-section">
          <div 
            className="expandable-header" 
            onClick={() => toggleSection('favorites')}
          >
            <svg className={`expand-icon ${expandedSections.favorites ? 'expanded' : ''}`} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
            <span>Favorites</span>
          </div>
          
          {expandedSections.favorites && (
            <div className="expandable-content">
              <div className="favorite-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                Downtown Parcels
              </div>
              
              <div className="favorite-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                Recent Subdivisions
              </div>
              
              <div className="favorite-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                Floodplain Analysis
              </div>
            </div>
          )}
        </div>
        
        {/* Recent parcels */}
        <div className="section-header">
          <h2>Recent Parcels</h2>
        </div>
        
        <div className="section-content">
          <div className="parcel-item">
            <div className="parcel-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                <line x1="8" y1="2" x2="8" y2="18"></line>
                <line x1="16" y1="6" x2="16" y2="22"></line>
              </svg>
            </div>
            <div className="parcel-info">
              <div className="parcel-id">Parcel 10-12345</div>
              <div className="parcel-address">123 Main St, Corvallis</div>
            </div>
          </div>
          
          <div className="parcel-item">
            <div className="parcel-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                <line x1="8" y1="2" x2="8" y2="18"></line>
                <line x1="16" y1="6" x2="16" y2="22"></line>
              </svg>
            </div>
            <div className="parcel-info">
              <div className="parcel-id">Parcel 10-23456</div>
              <div className="parcel-address">456 Oak Ave, Corvallis</div>
            </div>
          </div>
          
          <div className="parcel-item">
            <div className="parcel-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                <line x1="8" y1="2" x2="8" y2="18"></line>
                <line x1="16" y1="6" x2="16" y2="22"></line>
              </svg>
            </div>
            <div className="parcel-info">
              <div className="parcel-id">Parcel 10-34567</div>
              <div className="parcel-address">789 Pine St, Corvallis</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;