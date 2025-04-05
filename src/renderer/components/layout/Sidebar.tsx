import React, { useState } from 'react';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  activeView: 'map' | 'documents' | 'workflows' | 'reports';
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, activeView }) => {
  // State for tracking expanded workflow categories
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['boundary-adjustment']);
  
  // Toggle category expansion
  const toggleCategory = (category: string) => {
    if (expandedCategories.includes(category)) {
      setExpandedCategories(expandedCategories.filter(c => c !== category));
    } else {
      setExpandedCategories([...expandedCategories, category]);
    }
  };
  
  // Check if a category is expanded
  const isCategoryExpanded = (category: string) => {
    return expandedCategories.includes(category);
  };
  
  // Render workflows section
  const renderWorkflowsSection = () => {
    return (
      <div className="sidebar-section">
        <h2 className="sidebar-section-title">Workflows</h2>
        
        {/* Workflow Categories */}
        <div className="workflow-categories">
          {/* Boundary Adjustment */}
          <div className="workflow-category">
            <button 
              className="category-header" 
              onClick={() => toggleCategory('boundary-adjustment')}
            >
              <span className="category-title">Boundary Adjustment</span>
              <span className={`category-arrow ${isCategoryExpanded('boundary-adjustment') ? 'expanded' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </button>
            
            {isCategoryExpanded('boundary-adjustment') && (
              <div className="category-items">
                <button className="workflow-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                  </svg>
                  New Boundary Adjustment
                </button>
                <button className="workflow-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                  Pending Approvals (3)
                </button>
                <button className="workflow-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  Recent Activity
                </button>
              </div>
            )}
          </div>
          
          {/* Ownership Transfer */}
          <div className="workflow-category">
            <button 
              className="category-header" 
              onClick={() => toggleCategory('ownership-transfer')}
            >
              <span className="category-title">Ownership Transfer</span>
              <span className={`category-arrow ${isCategoryExpanded('ownership-transfer') ? 'expanded' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </button>
            
            {isCategoryExpanded('ownership-transfer') && (
              <div className="category-items">
                <button className="workflow-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                  </svg>
                  New Transfer Request
                </button>
                <button className="workflow-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  Pending Transfers (5)
                </button>
              </div>
            )}
          </div>
          
          {/* Zoning Change */}
          <div className="workflow-category">
            <button 
              className="category-header" 
              onClick={() => toggleCategory('zoning-change')}
            >
              <span className="category-title">Zoning Change</span>
              <span className={`category-arrow ${isCategoryExpanded('zoning-change') ? 'expanded' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </button>
            
            {isCategoryExpanded('zoning-change') && (
              <div className="category-items">
                <button className="workflow-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                  </svg>
                  New Zoning Request
                </button>
                <button className="workflow-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                  </svg>
                  Zoning Map
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Render reports section
  const renderReportsSection = () => {
    return (
      <div className="sidebar-section">
        <h2 className="sidebar-section-title">Reports</h2>
        
        <div className="report-templates">
          <button className="report-template">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Monthly Activity Summary
          </button>
          
          <button className="report-template">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Property Valuation Report
          </button>
          
          <button className="report-template">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Zoning Distribution Analysis
          </button>
          
          <button className="report-template new-report">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="8" y1="12" x2="16" y2="12"></line>
              <line x1="12" y1="8" x2="12" y2="16"></line>
            </svg>
            Create Custom Report
          </button>
        </div>
      </div>
    );
  };
  
  // Render map layers section when map view is active
  const renderMapLayersSection = () => {
    if (activeView === 'map') {
      return (
        <div className="sidebar-section">
          <h2 className="sidebar-section-title">Map Layers</h2>
          
          <div className="layer-controls">
            <label className="layer-control">
              <input type="checkbox" defaultChecked={true} />
              <span className="layer-name">Parcels</span>
            </label>
            
            <label className="layer-control">
              <input type="checkbox" defaultChecked={true} />
              <span className="layer-name">Roads</span>
            </label>
            
            <label className="layer-control">
              <input type="checkbox" defaultChecked={true} />
              <span className="layer-name">Zoning</span>
            </label>
            
            <label className="layer-control">
              <input type="checkbox" defaultChecked={false} />
              <span className="layer-name">Topography</span>
            </label>
            
            <label className="layer-control">
              <input type="checkbox" defaultChecked={false} />
              <span className="layer-name">Flood Zones</span>
            </label>
            
            <label className="layer-control">
              <input type="checkbox" defaultChecked={false} />
              <span className="layer-name">Aerial Imagery</span>
            </label>
          </div>
        </div>
      );
    }
    return null;
  };
  
  // Conditional class for sidebar visibility
  const sidebarClasses = `sidebar ${isOpen ? 'open' : 'closed'}`;
  
  return (
    <div className={sidebarClasses}>
      {renderMapLayersSection()}
      {renderWorkflowsSection()}
      {renderReportsSection()}
      
      <div className="sidebar-footer">
        <button className="help-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          Help & Documentation
        </button>
      </div>
    </div>
  );
};

export default Sidebar;