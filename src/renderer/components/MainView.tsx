import React, { useState } from 'react';
import './MainView.css';
import Header from './layout/Header';
import Sidebar from './layout/Sidebar';
import MapView from '../components/maps/MapView';

const MainView: React.FC = () => {
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(true);
  
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };
  
  return (
    <div className="main-view">
      <Header toggleSidebar={toggleSidebar} />
      <div className="content-area">
        <Sidebar visible={sidebarVisible} />
        <main className={`main-content ${sidebarVisible ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
          <MapView />
        </main>
      </div>
    </div>
  );
};

export default MainView;