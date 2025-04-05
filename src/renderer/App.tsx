import React, { useState } from 'react';
import MapView from './components/maps/MapView';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import './styles/App.css';

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="app-container">
      <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="content-container">
        {sidebarOpen && <Sidebar />}
        <main className="main-content">
          <MapView />
        </main>
      </div>
    </div>
  );
};

export default App;