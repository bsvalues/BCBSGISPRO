import React, { useState } from 'react';
import './Sidebar.css';

interface SidebarProps {
  visible: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ visible }) => {
  const [activeSection, setActiveSection] = useState<string>('workflows');
  const [expandedWorkflow, setExpandedWorkflow] = useState<string | null>('boundary');
  
  const toggleWorkflow = (workflow: string) => {
    if (expandedWorkflow === workflow) {
      setExpandedWorkflow(null);
    } else {
      setExpandedWorkflow(workflow);
    }
  };
  
  const changeSection = (section: string) => {
    setActiveSection(section);
  };
  
  return (
    <aside className={`sidebar ${visible ? 'visible' : 'hidden'}`}>
      <div className="sidebar-tabs">
        <button 
          className={`sidebar-tab ${activeSection === 'workflows' ? 'active' : ''}`}
          onClick={() => changeSection('workflows')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <span>Workflows</span>
        </button>
        <button 
          className={`sidebar-tab ${activeSection === 'templates' ? 'active' : ''}`}
          onClick={() => changeSection('templates')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <span>Templates</span>
        </button>
        <button 
          className={`sidebar-tab ${activeSection === 'layers' ? 'active' : ''}`}
          onClick={() => changeSection('layers')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
            <line x1="8" y1="2" x2="8" y2="18"></line>
            <line x1="16" y1="6" x2="16" y2="22"></line>
          </svg>
          <span>Layers</span>
        </button>
      </div>
      
      <div className="sidebar-content">
        {activeSection === 'workflows' && (
          <div className="workflows-section">
            <h3 className="section-title">Active Workflows</h3>
            
            <div className="workflow-list">
              <div className="workflow-item">
                <button 
                  className={`workflow-header ${expandedWorkflow === 'boundary' ? 'expanded' : ''}`}
                  onClick={() => toggleWorkflow('boundary')}
                >
                  <div className="workflow-title">
                    <span className="workflow-icon">🔄</span>
                    <span>Boundary Adjustment</span>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points={expandedWorkflow === 'boundary' ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
                  </svg>
                </button>
                
                {expandedWorkflow === 'boundary' && (
                  <div className="workflow-details">
                    <div className="workflow-info">
                      <div className="info-item">
                        <span className="info-label">ID:</span>
                        <span className="info-value">BND-2023-001</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Status:</span>
                        <span className="info-value status in-progress">In Progress</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Parcels:</span>
                        <span className="info-value">T10N R5W Sec 23</span>
                      </div>
                    </div>
                    
                    <div className="workflow-steps">
                      <div className="step completed">
                        <div className="step-marker">✓</div>
                        <div className="step-content">
                          <div className="step-title">Initial Review</div>
                          <div className="step-meta">Completed on Apr 2, 2025</div>
                        </div>
                      </div>
                      <div className="step active">
                        <div className="step-marker">2</div>
                        <div className="step-content">
                          <div className="step-title">Map Drawing</div>
                          <div className="step-meta">In progress</div>
                        </div>
                      </div>
                      <div className="step">
                        <div className="step-marker">3</div>
                        <div className="step-content">
                          <div className="step-title">Legal Description</div>
                          <div className="step-meta">Pending</div>
                        </div>
                      </div>
                      <div className="step">
                        <div className="step-marker">4</div>
                        <div className="step-content">
                          <div className="step-title">Final Approval</div>
                          <div className="step-meta">Pending</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="workflow-actions">
                      <button className="action-button primary">Edit Boundary</button>
                      <button className="action-button">View History</button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="workflow-item">
                <button 
                  className={`workflow-header ${expandedWorkflow === 'ownership' ? 'expanded' : ''}`}
                  onClick={() => toggleWorkflow('ownership')}
                >
                  <div className="workflow-title">
                    <span className="workflow-icon">📝</span>
                    <span>Ownership Transfer</span>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points={expandedWorkflow === 'ownership' ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
                  </svg>
                </button>
                
                {expandedWorkflow === 'ownership' && (
                  <div className="workflow-details">
                    <div className="workflow-info">
                      <div className="info-item">
                        <span className="info-label">ID:</span>
                        <span className="info-value">OWN-2023-042</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Status:</span>
                        <span className="info-value status pending">Pending Docs</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Parcels:</span>
                        <span className="info-value">T11N R5W Sec 14</span>
                      </div>
                    </div>
                    
                    <div className="workflow-actions">
                      <button className="action-button primary">Add Documents</button>
                      <button className="action-button">View Details</button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="workflow-item">
                <button 
                  className={`workflow-header ${expandedWorkflow === 'zoning' ? 'expanded' : ''}`}
                  onClick={() => toggleWorkflow('zoning')}
                >
                  <div className="workflow-title">
                    <span className="workflow-icon">🏙️</span>
                    <span>Zoning Change</span>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points={expandedWorkflow === 'zoning' ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
                  </svg>
                </button>
                
                {expandedWorkflow === 'zoning' && (
                  <div className="workflow-details">
                    <div className="workflow-info">
                      <div className="info-item">
                        <span className="info-label">ID:</span>
                        <span className="info-value">ZON-2023-015</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Status:</span>
                        <span className="info-value status approved">Approved</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Parcels:</span>
                        <span className="info-value">T9N R4W Sec 12</span>
                      </div>
                    </div>
                    
                    <div className="workflow-actions">
                      <button className="action-button primary">Generate Report</button>
                      <button className="action-button">View Details</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="action-bar">
              <button className="create-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>Create New Workflow</span>
              </button>
            </div>
          </div>
        )}
        
        {activeSection === 'templates' && (
          <div className="templates-section">
            <h3 className="section-title">Report Templates</h3>
            
            <div className="template-list">
              <div className="template-item">
                <div className="template-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
                <div className="template-info">
                  <div className="template-name">SM00 Report</div>
                  <div className="template-meta">Standard parcel report</div>
                </div>
                <button className="template-action">Use</button>
              </div>
              
              <div className="template-item">
                <div className="template-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
                <div className="template-info">
                  <div className="template-name">Boundary Report</div>
                  <div className="template-meta">Boundary adjustment details</div>
                </div>
                <button className="template-action">Use</button>
              </div>
              
              <div className="template-item">
                <div className="template-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
                <div className="template-info">
                  <div className="template-name">Monthly Summary</div>
                  <div className="template-meta">Monthly activity report</div>
                </div>
                <button className="template-action">Use</button>
              </div>
            </div>
            
            <div className="action-bar">
              <button className="create-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>Create New Template</span>
              </button>
            </div>
          </div>
        )}
        
        {activeSection === 'layers' && (
          <div className="layers-section">
            <h3 className="section-title">Map Layers</h3>
            
            <div className="layer-list">
              <div className="layer-group">
                <div className="group-header">Base Layers</div>
                <div className="layer-item">
                  <input type="checkbox" id="satellite" checked />
                  <label htmlFor="satellite">Satellite Imagery</label>
                </div>
                <div className="layer-item">
                  <input type="checkbox" id="topo" />
                  <label htmlFor="topo">Topographic</label>
                </div>
                <div className="layer-item">
                  <input type="checkbox" id="street" />
                  <label htmlFor="street">Street Map</label>
                </div>
              </div>
              
              <div className="layer-group">
                <div className="group-header">Parcel Layers</div>
                <div className="layer-item">
                  <input type="checkbox" id="parcels" checked />
                  <label htmlFor="parcels">Parcel Boundaries</label>
                </div>
                <div className="layer-item">
                  <input type="checkbox" id="zoning" checked />
                  <label htmlFor="zoning">Zoning</label>
                </div>
                <div className="layer-item">
                  <input type="checkbox" id="ownership" />
                  <label htmlFor="ownership">Ownership</label>
                </div>
              </div>
              
              <div className="layer-group">
                <div className="group-header">Other Layers</div>
                <div className="layer-item">
                  <input type="checkbox" id="water" />
                  <label htmlFor="water">Water Features</label>
                </div>
                <div className="layer-item">
                  <input type="checkbox" id="elevation" />
                  <label htmlFor="elevation">Elevation</label>
                </div>
                <div className="layer-item">
                  <input type="checkbox" id="utilities" />
                  <label htmlFor="utilities">Utilities</label>
                </div>
              </div>
            </div>
            
            <div className="layer-opacity">
              <label htmlFor="opacity-slider">Layer Opacity</label>
              <input 
                type="range" 
                id="opacity-slider" 
                min="0" 
                max="100" 
                value="75" 
                className="opacity-slider"
              />
              <div className="opacity-value">75%</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;