import React, { useState } from 'react';
import MapView from './components/maps/MapView';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import DocumentManager from './components/documents/DocumentManager';
import './styles/App.css';

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  // Feature data for Benton County, WA
  const initialFeatures = [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-119.2670, 46.2275]
      },
      properties: {
        id: '1',
        name: 'Benton County Courthouse',
        address: '620 Market St, Prosser, WA 99350',
        type: 'Government',
        parcelId: '109891000001000'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-119.3020, 46.2980],
          [-119.3020, 46.3080],
          [-119.2920, 46.3080],
          [-119.2920, 46.2980],
          [-119.3020, 46.2980]
        ]]
      },
      properties: {
        id: '2',
        name: 'Horn Rapids Area',
        zone: 'Industrial',
        acres: 745,
        parcelId: 'Multiple'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-119.1710, 46.2055]
      },
      properties: {
        id: '3',
        name: 'Benton County Fairgrounds',
        address: '1500 S Oak St, Kennewick, WA 99337',
        type: 'Recreation',
        parcelId: '117971000000000'
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
      <Header toggleSidebar={toggleSidebar} />
      <div className="app-content">
        {sidebarOpen && <Sidebar visible={true} />}
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