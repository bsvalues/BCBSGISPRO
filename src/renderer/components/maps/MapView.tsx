import React, { useEffect, useRef } from 'react';
import './MapView.css';

const MapView: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // This is a placeholder for map initialization
    // In a real implementation, we would initialize Leaflet or Mapbox here
    const initMap = () => {
      const mockMapElement = document.createElement('div');
      mockMapElement.className = 'mock-map';
      mockMapElement.innerHTML = `
        <div class="mock-map-content">
          <div class="mock-map-overlay">
            <h3>Map View</h3>
            <p>The map component will load Benton County GIS data here.</p>
          </div>
          <div class="mock-map-grid">
            ${Array(20).fill(0).map((_, i) => 
              Array(20).fill(0).map((_, j) => 
                `<div class="mock-grid-cell" style="opacity: ${Math.random() * 0.4 + 0.1}"></div>`
              ).join('')
            ).join('')}
          </div>
        </div>
      `;
      
      if (mapContainerRef.current) {
        mapContainerRef.current.innerHTML = '';
        mapContainerRef.current.appendChild(mockMapElement);
      }
    };
    
    initMap();
    
    return () => {
      // Cleanup function would dismount the map in a real implementation
      if (mapContainerRef.current) {
        mapContainerRef.current.innerHTML = '';
      }
    };
  }, []);
  
  return (
    <div className="map-view">
      <div className="map-controls">
        <div className="map-control-group">
          <button className="map-control" title="Zoom In">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
          <button className="map-control" title="Zoom Out">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
        </div>
        
        <div className="map-control-group">
          <button className="map-control" title="Select Area">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3h18v18H3z"></path>
            </svg>
          </button>
          <button className="map-control" title="Measure Distance">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12h20"></path>
              <path d="M6 8v8"></path>
              <path d="M18 8v8"></path>
              <path d="M10 7v10"></path>
              <path d="M14 7v10"></path>
            </svg>
          </button>
          <button className="map-control" title="Draw Shape">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"></polygon>
              <line x1="12" y1="22" x2="12" y2="15.5"></line>
              <polyline points="22 8.5 12 15.5 2 8.5"></polyline>
            </svg>
          </button>
        </div>
        
        <div className="map-control-group">
          <button className="map-control" title="Reset View">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6"></path>
              <path d="M2.5 12.5l5-5c1.4-1.4 3.6-1.4 5 0 .7.7 1 1.6 1 2.5s-.3 1.8-1 2.5c-1.4 1.4-3.6 1.4-5 0l-5-5"></path>
              <path d="M15.5 22v-6h6"></path>
            </svg>
          </button>
          <button className="map-control" title="Print Map">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
          </button>
          <button className="map-control" title="Export Data">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="map-container" ref={mapContainerRef}></div>
      
      <div className="map-info-panel">
        <div className="map-coordinates">
          <span>Lat: 44.5646° N</span>
          <span>Long: 123.2620° W</span>
          <span>Zoom: 14</span>
        </div>
        <div className="map-scale">
          <div className="scale-bar"></div>
          <span>500 ft</span>
        </div>
      </div>
    </div>
  );
};

export default MapView;