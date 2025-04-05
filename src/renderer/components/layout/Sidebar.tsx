import React, { useState } from 'react';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const [activeItem, setActiveItem] = useState<string>('map');
  const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({
    parcelManagement: true,
    dataLayers: false,
    documents: false,
    workflows: false,
    reports: false,
    administration: false
  });
  
  const toggleMenu = (menu: string) => {
    setExpandedMenus({
      ...expandedMenus,
      [menu]: !expandedMenus[menu]
    });
  };
  
  const handleMenuItemClick = (item: string) => {
    setActiveItem(item);
  };
  
  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-content">
        <div className="sidebar-section main-nav">
          <ul className="nav-list">
            <li 
              className={`nav-item ${activeItem === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleMenuItemClick('dashboard')}
            >
              <div className="nav-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="9"></rect>
                  <rect x="14" y="3" width="7" height="5"></rect>
                  <rect x="14" y="12" width="7" height="9"></rect>
                  <rect x="3" y="16" width="7" height="5"></rect>
                </svg>
              </div>
              <span className="nav-label">Dashboard</span>
            </li>
            
            <li 
              className={`nav-item ${activeItem === 'map' ? 'active' : ''}`}
              onClick={() => handleMenuItemClick('map')}
            >
              <div className="nav-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                  <line x1="8" y1="2" x2="8" y2="18"></line>
                  <line x1="16" y1="6" x2="16" y2="22"></line>
                </svg>
              </div>
              <span className="nav-label">Map</span>
            </li>
            
            <li 
              className={`nav-item ${activeItem === 'search' ? 'active' : ''}`}
              onClick={() => handleMenuItemClick('search')}
            >
              <div className="nav-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              <span className="nav-label">Search</span>
            </li>
          </ul>
        </div>
        
        <div className="sidebar-divider"></div>
        
        <div className="sidebar-section">
          <div 
            className={`nav-category ${expandedMenus.parcelManagement ? 'expanded' : ''}`}
            onClick={() => toggleMenu('parcelManagement')}
          >
            <div className="nav-category-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18"></path>
                <path d="M3 15l4-4a3 3 0 0 1 3 0l4 4"></path>
                <path d="M14 14l3-3a3 3 0 0 1 3 0l1 1"></path>
                <line x1="3" y1="10" x2="4" y2="10"></line>
                <line x1="3" y1="6" x2="4" y2="6"></line>
              </svg>
              <span>Parcel Management</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`dropdown-arrow ${expandedMenus.parcelManagement ? 'open' : ''}`}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            
            {expandedMenus.parcelManagement && (
              <ul className="nav-submenu">
                <li 
                  className={`nav-item ${activeItem === 'parcels' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuItemClick('parcels');
                  }}
                >
                  <span className="nav-label">Parcels</span>
                </li>
                <li 
                  className={`nav-item ${activeItem === 'propertyRecords' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuItemClick('propertyRecords');
                  }}
                >
                  <span className="nav-label">Property Records</span>
                </li>
                <li 
                  className={`nav-item ${activeItem === 'landDivisions' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuItemClick('landDivisions');
                  }}
                >
                  <span className="nav-label">Land Divisions</span>
                </li>
                <li 
                  className={`nav-item ${activeItem === 'addresses' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuItemClick('addresses');
                  }}
                >
                  <span className="nav-label">Addresses</span>
                </li>
              </ul>
            )}
          </div>
          
          <div 
            className={`nav-category ${expandedMenus.dataLayers ? 'expanded' : ''}`}
            onClick={() => toggleMenu('dataLayers')}
          >
            <div className="nav-category-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                <line x1="8" y1="2" x2="8" y2="18"></line>
                <line x1="16" y1="6" x2="16" y2="22"></line>
              </svg>
              <span>Map Layers</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`dropdown-arrow ${expandedMenus.dataLayers ? 'open' : ''}`}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            
            {expandedMenus.dataLayers && (
              <ul className="nav-submenu">
                <li 
                  className={`nav-item ${activeItem === 'parcelsLayer' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuItemClick('parcelsLayer');
                  }}
                >
                  <span className="nav-label">Parcels</span>
                </li>
                <li 
                  className={`nav-item ${activeItem === 'zoningLayer' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuItemClick('zoningLayer');
                  }}
                >
                  <span className="nav-label">Zoning</span>
                </li>
                <li 
                  className={`nav-item ${activeItem === 'floodplainLayer' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuItemClick('floodplainLayer');
                  }}
                >
                  <span className="nav-label">Floodplain</span>
                </li>
                <li 
                  className={`nav-item ${activeItem === 'topographyLayer' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuItemClick('topographyLayer');
                  }}
                >
                  <span className="nav-label">Topography</span>
                </li>
                <li 
                  className={`nav-item ${activeItem === 'transportationLayer' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuItemClick('transportationLayer');
                  }}
                >
                  <span className="nav-label">Transportation</span>
                </li>
              </ul>
            )}
          </div>
          
          <div 
            className={`nav-category ${expandedMenus.documents ? 'expanded' : ''}`}
            onClick={() => toggleMenu('documents')}
          >
            <div className="nav-category-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <span>Documents</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`dropdown-arrow ${expandedMenus.documents ? 'open' : ''}`}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            
            {expandedMenus.documents && (
              <ul className="nav-submenu">
                <li 
                  className={`nav-item ${activeItem === 'allDocuments' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuItemClick('allDocuments');
                  }}
                >
                  <span className="nav-label">All Documents</span>
                </li>
                <li 
                  className={`nav-item ${activeItem === 'deeds' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuItemClick('deeds');
                  }}
                >
                  <span className="nav-label">Deeds</span>
                </li>
                <li 
                  className={`nav-item ${activeItem === 'surveys' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuItemClick('surveys');
                  }}
                >
                  <span className="nav-label">Surveys</span>
                </li>
                <li 
                  className={`nav-item ${activeItem === 'plats' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuItemClick('plats');
                  }}
                >
                  <span className="nav-label">Plats</span>
                </li>
                <li 
                  className={`nav-item ${activeItem === 'uploadDocument' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuItemClick('uploadDocument');
                  }}
                >
                  <span className="nav-label">Upload Document</span>
                </li>
              </ul>
            )}
          </div>
          
          <div 
            className={`nav-category ${expandedMenus.workflows ? 'expanded' : ''}`}
            onClick={() => toggleMenu('workflows')}
          >
            <div className="nav-category-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
              <span>Workflows</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`dropdown-arrow ${expandedMenus.workflows ? 'open' : ''}`}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            
            {expandedMenus.workflows && (
              <ul className="nav-submenu">
                <li 
                  className={`nav-item ${activeItem === 'activeWorkflows' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuItemClick('activeWorkflows');
                  }}
                >
                  <span className="nav-label">Active Workflows</span>
                </li>
                <li 
                  className={`nav-item ${activeItem === 'myTasks' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuItemClick('myTasks');
                  }}
                >
                  <span className="nav-label">My Tasks</span>
                  <span className="badge">5</span>
                </li>
                <li 
                  className={`nav-item ${activeItem === 'completedWorkflows' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuItemClick('completedWorkflows');
                  }}
                >
                  <span className="nav-label">Completed Workflows</span>
                </li>
                <li 
                  className={`nav-item ${activeItem === 'createWorkflow' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuItemClick('createWorkflow');
                  }}
                >
                  <span className="nav-label">Create Workflow</span>
                </li>
              </ul>
            )}
          </div>
          
          <div 
            className={`nav-category ${expandedMenus.reports ? 'expanded' : ''}`}
            onClick={() => toggleMenu('reports')}
          >
            <div className="nav-category-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <path d="M14 2v6h6"></path>
                <path d="M16 13H8"></path>
                <path d="M16 17H8"></path>
                <path d="M10 9H8"></path>
              </svg>
              <span>Reports</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`dropdown-arrow ${expandedMenus.reports ? 'open' : ''}`}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            
            {expandedMenus.reports && (
              <ul className="nav-submenu">
                <li 
                  className={`nav-item ${activeItem === 'parcelReports' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuItemClick('parcelReports');
                  }}
                >
                  <span className="nav-label">Parcel Reports</span>
                </li>
                <li 
                  className={`nav-item ${activeItem === 'activityReports' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuItemClick('activityReports');
                  }}
                >
                  <span className="nav-label">Activity Reports</span>
                </li>
                <li 
                  className={`nav-item ${activeItem === 'customReports' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuItemClick('customReports');
                  }}
                >
                  <span className="nav-label">Custom Reports</span>
                </li>
                <li 
                  className={`nav-item ${activeItem === 'scheduledReports' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuItemClick('scheduledReports');
                  }}
                >
                  <span className="nav-label">Scheduled Reports</span>
                </li>
              </ul>
            )}
          </div>
          
          <div 
            className={`nav-category ${expandedMenus.administration ? 'expanded' : ''}`}
            onClick={() => toggleMenu('administration')}
          >
            <div className="nav-category-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              <span>Administration</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`dropdown-arrow ${expandedMenus.administration ? 'open' : ''}`}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            
            {expandedMenus.administration && (
              <ul className="nav-submenu">
                <li 
                  className={`nav-item ${activeItem === 'users' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuItemClick('users');
                  }}
                >
                  <span className="nav-label">Users</span>
                </li>
                <li 
                  className={`nav-item ${activeItem === 'roles' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuItemClick('roles');
                  }}
                >
                  <span className="nav-label">Roles & Permissions</span>
                </li>
                <li 
                  className={`nav-item ${activeItem === 'system' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuItemClick('system');
                  }}
                >
                  <span className="nav-label">System Settings</span>
                </li>
                <li 
                  className={`nav-item ${activeItem === 'dataSync' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuItemClick('dataSync');
                  }}
                >
                  <span className="nav-label">Data Synchronization</span>
                </li>
                <li 
                  className={`nav-item ${activeItem === 'logs' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuItemClick('logs');
                  }}
                >
                  <span className="nav-label">Logs & Audit Trails</span>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
      
      <div className="sidebar-footer">
        <div className="sidebar-collapse">
          <div className="help-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span>Help & Support</span>
          </div>
          <div className="version-info">v1.0.0</div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;