import React, { useState } from 'react';

const Sidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState('maps');

  return (
    <div className="sidebar">
      <div className="sidebar-tabs">
        <button 
          className={`sidebar-tab ${activeTab === 'maps' ? 'active' : ''}`}
          onClick={() => setActiveTab('maps')}
        >
          Maps
        </button>
        <button 
          className={`sidebar-tab ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          Documents
        </button>
        <button 
          className={`sidebar-tab ${activeTab === 'workflows' ? 'active' : ''}`}
          onClick={() => setActiveTab('workflows')}
        >
          Workflows
        </button>
      </div>

      <div className="sidebar-content">
        {activeTab === 'maps' && (
          <div className="sidebar-section">
            <h3>Parcel Search</h3>
            <div className="form-group">
              <input type="text" placeholder="Search by parcel ID or owner" />
              <button>Search</button>
            </div>
            <div className="sidebar-section">
              <h3>Map Layers</h3>
              <div className="layer-item">
                <input type="checkbox" id="layer-parcels" defaultChecked />
                <label htmlFor="layer-parcels">Parcels</label>
              </div>
              <div className="layer-item">
                <input type="checkbox" id="layer-zoning" defaultChecked />
                <label htmlFor="layer-zoning">Zoning</label>
              </div>
              <div className="layer-item">
                <input type="checkbox" id="layer-aerial" />
                <label htmlFor="layer-aerial">Aerial Imagery</label>
              </div>
              <div className="layer-item">
                <input type="checkbox" id="layer-floodplain" />
                <label htmlFor="layer-floodplain">Floodplain</label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="sidebar-section">
            <h3>Documents</h3>
            <div className="form-group">
              <input type="text" placeholder="Search documents" />
              <button>Search</button>
            </div>
            <button className="full-width-btn">Upload Document</button>
            
            <div className="document-list">
              <div className="document-item">
                <div className="document-icon">📄</div>
                <div className="document-info">
                  <div className="document-name">Deed - Smith Property</div>
                  <div className="document-meta">Added: 10/15/2023</div>
                </div>
              </div>
              <div className="document-item">
                <div className="document-icon">📄</div>
                <div className="document-info">
                  <div className="document-name">Survey - Lot 42</div>
                  <div className="document-meta">Added: 09/12/2023</div>
                </div>
              </div>
              <div className="document-item">
                <div className="document-icon">📄</div>
                <div className="document-info">
                  <div className="document-name">Tax Assessment 2023</div>
                  <div className="document-meta">Added: 01/10/2023</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'workflows' && (
          <div className="sidebar-section">
            <h3>Active Workflows</h3>
            <button className="full-width-btn">New Workflow</button>
            
            <div className="workflow-list">
              <div className="workflow-item">
                <div className="workflow-status in-progress"></div>
                <div className="workflow-info">
                  <div className="workflow-name">Smith Property Split</div>
                  <div className="workflow-meta">Started: 10/20/2023</div>
                </div>
              </div>
              <div className="workflow-item">
                <div className="workflow-status pending"></div>
                <div className="workflow-info">
                  <div className="workflow-name">Johnson Rezoning</div>
                  <div className="workflow-meta">Started: 09/15/2023</div>
                </div>
              </div>
              <div className="workflow-item">
                <div className="workflow-status completed"></div>
                <div className="workflow-info">
                  <div className="workflow-name">Wilson Lot Line Adjustment</div>
                  <div className="workflow-meta">Completed: 08/30/2023</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;