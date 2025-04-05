import React, { useState } from 'react';
import './Header.css';

interface HeaderProps {
  toggleSidebar: () => void;
  onViewChange?: (view: 'map' | 'documents' | 'workflows' | 'reports') => void;
  activeView?: 'map' | 'documents' | 'workflows' | 'reports';
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, onViewChange, activeView = 'map' }) => {
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [notificationCount, setNotificationCount] = useState<number>(3);
  
  // Toggle notification panel
  const toggleNotifications = () => {
    setShowNotifications(prev => !prev);
    if (showUserMenu) setShowUserMenu(false);
  };
  
  // Toggle user menu
  const toggleUserMenu = () => {
    setShowUserMenu(prev => !prev);
    if (showNotifications) setShowNotifications(false);
  };
  
  // Mark all notifications as read
  const clearNotifications = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNotificationCount(0);
  };

  // Navigate to different views
  const handleViewChange = (view: 'map' | 'documents' | 'workflows' | 'reports') => {
    if (onViewChange) {
      onViewChange(view);
    }
  };
  
  return (
    <header className="app-header">
      <div className="header-left">
        <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        
        <div className="brand">
          <img src="/assets/benton-county-logo.png" alt="Benton County" className="logo" />
          <h1>BentonGeoPro</h1>
        </div>
        
        <nav className="main-nav">
          <button 
            className={`nav-button ${activeView === 'map' ? 'active' : ''}`}
            onClick={() => handleViewChange('map')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
              <line x1="8" y1="2" x2="8" y2="18"></line>
              <line x1="16" y1="6" x2="16" y2="22"></line>
            </svg>
            <span>Map</span>
          </button>
          
          <button 
            className={`nav-button ${activeView === 'documents' ? 'active' : ''}`}
            onClick={() => handleViewChange('documents')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span>Documents</span>
          </button>
          
          <button 
            className={`nav-button ${activeView === 'workflows' ? 'active' : ''}`}
            onClick={() => handleViewChange('workflows')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
            <span>Workflows</span>
          </button>
          
          <button 
            className={`nav-button ${activeView === 'reports' ? 'active' : ''}`}
            onClick={() => handleViewChange('reports')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <polyline points="16 13 8 13"></polyline>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span>Reports</span>
          </button>
        </nav>
      </div>
      
      <div className="header-right">
        <form className="search-form">
          <input type="text" placeholder="Search parcels, documents, or addresses..." />
          <button type="submit" aria-label="Search">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </form>
        
        <div className="header-actions">
          <div className="notification-container">
            <button 
              className="notification-button" 
              onClick={toggleNotifications}
              aria-label="Notifications"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {notificationCount > 0 && (
                <span className="notification-badge">{notificationCount}</span>
              )}
            </button>
            
            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <h3>Notifications</h3>
                  {notificationCount > 0 && (
                    <button 
                      className="clear-notifications"
                      onClick={clearNotifications}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                
                <div className="notification-list">
                  {notificationCount === 0 ? (
                    <div className="no-notifications">
                      <p>No new notifications</p>
                    </div>
                  ) : (
                    <>
                      <div className="notification-item">
                        <div className="notification-icon workflow">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                          </svg>
                        </div>
                        <div className="notification-content">
                          <div className="notification-title">Workflow Updated</div>
                          <div className="notification-desc">
                            Parcel split for 10-12345 has been moved to "Review" stage.
                          </div>
                          <div className="notification-time">15 min ago</div>
                        </div>
                      </div>
                      
                      <div className="notification-item">
                        <div className="notification-icon document">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                          </svg>
                        </div>
                        <div className="notification-content">
                          <div className="notification-title">New Document Uploaded</div>
                          <div className="notification-desc">
                            Sarah Johnson uploaded a new survey document for parcel 10-56789.
                          </div>
                          <div className="notification-time">1 hour ago</div>
                        </div>
                      </div>
                      
                      <div className="notification-item">
                        <div className="notification-icon alert">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                          </svg>
                        </div>
                        <div className="notification-content">
                          <div className="notification-title">System Maintenance</div>
                          <div className="notification-desc">
                            Scheduled system maintenance on Saturday, April 10 from 10 PM to 2 AM.
                          </div>
                          <div className="notification-time">Yesterday</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="user-profile-container">
            <button 
              className="user-profile-button" 
              onClick={toggleUserMenu}
              aria-label="User menu"
            >
              <div className="user-avatar">JS</div>
            </button>
            
            {showUserMenu && (
              <div className="user-dropdown">
                <div className="user-info">
                  <div className="user-name">John Smith</div>
                  <div className="user-title">GIS Specialist</div>
                </div>
                
                <div className="user-menu">
                  <a href="#profile" className="user-menu-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Profile
                  </a>
                  <a href="#settings" className="user-menu-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                    Settings
                  </a>
                  <a href="#help" className="user-menu-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    Help &amp; Support
                  </a>
                  
                  <div className="menu-divider"></div>
                  
                  <a href="#theme" className="user-menu-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="5"></circle>
                      <line x1="12" y1="1" x2="12" y2="3"></line>
                      <line x1="12" y1="21" x2="12" y2="23"></line>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                      <line x1="1" y1="12" x2="3" y2="12"></line>
                      <line x1="21" y1="12" x2="23" y2="12"></line>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                    Theme
                  </a>
                  
                  <div className="menu-divider"></div>
                  
                  <a href="#logout" className="user-menu-item logout">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Logout
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;