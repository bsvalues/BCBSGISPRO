import React, { useState } from 'react';
import MapView from './components/maps/MapView';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
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

  return (
    <div className="app">
      <Header onMenuToggle={toggleSidebar} />
      <div className="app-content">
        {sidebarOpen && <Sidebar isOpen={true} />}
        <div className="app-main">
          <MapView 
            initialFeatures={initialFeatures}
            onFeatureSelect={handleFeatureSelect}
          />
        </div>
      </div>
    </div>
  );
};

export default App;