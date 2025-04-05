import React, { useState } from 'react';
import Header from './layout/Header';
import Sidebar from './layout/Sidebar';
import MapView from './maps/MapView';
import './MainView.css';

const MainView: React.FC = () => {
  // State for sidebar visibility
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // State for active view
  const [activeView, setActiveView] = useState<'map' | 'documents' | 'workflows' | 'reports'>('map');
  
  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  // Determine content based on active view
  const renderActiveContent = () => {
    switch (activeView) {
      case 'map':
        return <MapView />;
      case 'documents':
        return <div className="placeholder-content">Documents View (Under Development)</div>;
      case 'workflows':
        return <div className="placeholder-content">Workflows View (Under Development)</div>;
      case 'reports':
        return <div className="placeholder-content">Reports View (Under Development)</div>;
      default:
        return <MapView />;
    }
  };
  
  return (
    <div className="main-view">
      <Header 
        toggleSidebar={toggleSidebar}
        activeView={activeView}
        setActiveView={setActiveView}
      />
      <div className="content-area">
        <Sidebar 
          isOpen={isSidebarOpen}
          activeView={activeView}
        />
        <div className={`main-content ${isSidebarOpen ? 'with-sidebar' : ''}`}>
          {renderActiveContent()}
        </div>
      </div>
    </div>
  );
};

export default MainView;