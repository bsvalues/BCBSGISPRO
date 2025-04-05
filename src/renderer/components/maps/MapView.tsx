import React, { useEffect, useRef } from 'react';
import './MapView.css';

const MapView: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // This is a placeholder for the actual map implementation
    // In a real implementation, we would initialize Leaflet or Mapbox here
    const mapContainer = mapContainerRef.current;
    
    // Create a simple map placeholder
    const placeholderMap = document.createElement('div');
    placeholderMap.className = 'map-placeholder';
    
    // Add some placeholder content
    placeholderMap.innerHTML = `
      <div class="map-grid">
        ${Array(16).fill(0).map((_, i) => `<div class="map-grid-cell"></div>`).join('')}
      </div>
      <div class="map-center-marker"></div>
      <div class="map-controls">
        <button class="map-control-button zoom-in" title="Zoom in">+</button>
        <button class="map-control-button zoom-out" title="Zoom out">−</button>
        <button class="map-control-button home" title="Reset view">⌂</button>
      </div>
      <div class="map-compass">
        <div class="compass-n">N</div>
        <div class="compass-e">E</div>
        <div class="compass-s">S</div>
        <div class="compass-w">W</div>
        <div class="compass-ring"></div>
        <div class="compass-arrow"></div>
      </div>
      <div class="map-overlay-text">Benton County GIS</div>
      <div class="map-scale-indicator">
        <div class="scale-line"></div>
        <div class="scale-text">0 5 10 15 20 km</div>
      </div>
      <div class="map-coordinates">47°32'14.5"N 123°15'16.2"W | Zoom: 12</div>
    `;
    
    // Clear any existing content and add the placeholder
    mapContainer.innerHTML = '';
    mapContainer.appendChild(placeholderMap);
    
    // Add event listeners to simulate basic map interactions
    const zoomInButton = placeholderMap.querySelector('.zoom-in');
    const zoomOutButton = placeholderMap.querySelector('.zoom-out');
    const homeButton = placeholderMap.querySelector('.home');
    
    if (zoomInButton) {
      zoomInButton.addEventListener('click', () => {
        console.log('Zoom in clicked');
      });
    }
    
    if (zoomOutButton) {
      zoomOutButton.addEventListener('click', () => {
        console.log('Zoom out clicked');
      });
    }
    
    if (homeButton) {
      homeButton.addEventListener('click', () => {
        console.log('Reset view clicked');
      });
    }
    
    // Cleanup function
    return () => {
      if (zoomInButton) {
        zoomInButton.removeEventListener('click', () => {
          console.log('Zoom in clicked');
        });
      }
      
      if (zoomOutButton) {
        zoomOutButton.removeEventListener('click', () => {
          console.log('Zoom out clicked');
        });
      }
      
      if (homeButton) {
        homeButton.removeEventListener('click', () => {
          console.log('Reset view clicked');
        });
      }
    };
  }, []);
  
  return (
    <div className="map-view">
      <div className="map-container" ref={mapContainerRef}></div>
      <div className="map-tools">
        <div className="tool-group">
          <button className="tool-button active" title="Pan">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="5 9 2 12 5 15"></polyline>
              <polyline points="9 5 12 2 15 5"></polyline>
              <polyline points="15 19 12 22 9 19"></polyline>
              <polyline points="19 9 22 12 19 15"></polyline>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <line x1="12" y1="2" x2="12" y2="22"></line>
            </svg>
          </button>
          
          <button className="tool-button" title="Select">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path>
              <path d="M13 13l6 6"></path>
            </svg>
          </button>
          
          <button className="tool-button" title="Measure">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          </button>
        </div>
        
        <div className="tool-group">
          <button className="tool-button" title="Draw Rectangle">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            </svg>
          </button>
          
          <button className="tool-button" title="Draw Line">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="17" y1="7" x2="7" y2="17"></line>
              <polyline points="7 7 7 17 17 17"></polyline>
            </svg>
          </button>
          
          <button className="tool-button" title="Draw Polygon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
            </svg>
          </button>
        </div>
        
        <div className="tool-group">
          <button className="tool-button" title="Export">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </button>
          
          <button className="tool-button" title="Print">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapView;