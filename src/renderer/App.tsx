import React, { useState } from 'react';
import MapView from './components/maps/MapView';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import DocumentManager from './components/documents/DocumentManager';
import './styles/App.css';

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  // Mock feature data for testing
  const initialFeatures = [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-123.2620, 44.5646]
      },
      properties: {
        id: '1',
        name: 'Benton County Courthouse',
        address: '120 NW 4th St, Corvallis, OR 97330',
        type: 'Government'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-123.2720, 44.5746],
          [-123.2720, 44.5846],
          [-123.2620, 44.5846],
          [-123.2620, 44.5746],
          [-123.2720, 44.5746]
        ]]
      },
      properties: {
        id: '2',
        name: 'OSU Campus Area',
        zone: 'Educational',
        acres: 422
      }
    }
  ];

  // Handle feature selection from map
  const handleFeatureSelect = (feature: any) => {
    console.log('Selected feature:', feature);
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // State to toggle between map and document views
  const [currentView, setCurrentView] = useState<'map' | 'documents'>('map');

  // Handler to switch between views
  const handleViewSwitch = (view: 'map' | 'documents') => {
    setCurrentView(view);
  };

  return (
    <div className="app">
      <Header onMenuToggle={toggleSidebar} />
      <div className="app-content">
        {sidebarOpen && <Sidebar isOpen={true} />}
        <div className="app-main">
          {/* View selection tabs */}
          <div className="view-tabs">
            <button 
              className={`view-tab ${currentView === 'map' ? 'active' : ''}`} 
              onClick={() => handleViewSwitch('map')}
            >
              Map View
            </button>
            <button 
              className={`view-tab ${currentView === 'documents' ? 'active' : ''}`} 
              onClick={() => handleViewSwitch('documents')}
            >
              Document Manager
            </button>
          </div>
          
          {/* Conditional rendering based on selected view */}
          {currentView === 'map' ? (
            <MapView 
              initialFeatures={initialFeatures}
              onFeatureSelect={handleFeatureSelect}
            />
          ) : (
            <DocumentManager />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;