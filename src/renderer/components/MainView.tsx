import React, { useState } from 'react';
import Header from './layout/Header';
import Sidebar from './layout/Sidebar';
import MapView from './maps/MapView';
import DocumentManager from './documents/DocumentManager';
import './MainView.css';

const MainView: React.FC = () => {
  // State for sidebar visibility
  const [isSidebarOpen, setSidebarOpen] = useState<boolean>(true);
  
  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };
  
  // State for active view (map, documents, workflows, reports)
  const [activeView, setActiveView] = useState<'map' | 'documents' | 'workflows' | 'reports'>('map');
  
  // Handle view change
  const handleViewChange = (view: 'map' | 'documents' | 'workflows' | 'reports') => {
    setActiveView(view);
  };
  
  // Render the active content based on the selected view
  const renderContent = () => {
    switch (activeView) {
      case 'map':
        return <MapView />;
      case 'documents':
        return <DocumentManager />;
      case 'workflows':
        return <div className="placeholder-content">Workflows view is not implemented yet</div>;
      case 'reports':
        return <div className="placeholder-content">Reports view is not implemented yet</div>;
      default:
        return <MapView />;
    }
  };
  
  return (
    <div className="main-view">
      <Header 
        toggleSidebar={toggleSidebar} 
        onViewChange={handleViewChange}
        activeView={activeView}
      />
      
      <div className="content-area">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={toggleSidebar}
        />
        
        <main className="main-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default MainView;