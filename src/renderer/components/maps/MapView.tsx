import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, ZoomControl, FeatureGroup, useMap, useMapEvents } from 'react-leaflet';
import { LatLngTuple, Map as LeafletMap, LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import './MapView.css';

// This fixes the Leaflet icon issue in React
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  initialFeatures?: any[];
  onFeatureSelect?: (feature: any) => void;
}

const MapView: React.FC<MapViewProps> = ({ initialFeatures = [], onFeatureSelect }) => {
  // Benton County, WA approximate center coordinates
  const defaultCenter: LatLngTuple = [46.2681, -119.2815];
  const defaultZoom = 11;
  const mapRef = useRef<L.Map | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<any | null>(null);
  // State for tracking mouse coordinates
  const [coordinates, setCoordinates] = useState<LatLng | null>(null);
  
  // Handle feature selection
  const handleFeatureClick = (feature: any) => {
    setSelectedFeature(feature);
    if (onFeatureSelect) {
      onFeatureSelect(feature);
    }
  };

  // Style for GeoJSON features
  const featureStyle = {
    color: '#3388ff',
    weight: 2,
    opacity: 0.8,
    fillColor: '#3388ff',
    fillOpacity: 0.3,
  };

  // Style for selected features
  const selectedFeatureStyle = {
    color: '#ff4433',
    weight: 3,
    opacity: 1,
    fillColor: '#ff4433',
    fillOpacity: 0.5,
  };

  // Feature styling function
  const style = (feature: any) => {
    if (selectedFeature && selectedFeature === feature) {
      return selectedFeatureStyle;
    }
    return featureStyle;
  };

  // Event handlers for GeoJSON features
  const onEachFeature = (feature: any, layer: L.Layer) => {
    if (feature.properties) {
      let popupContent = '<div class="feature-popup">';
      
      // Display feature properties in popup
      Object.keys(feature.properties).forEach(key => {
        popupContent += `<strong>${key}:</strong> ${feature.properties[key]}<br/>`;
      });
      
      popupContent += '</div>';
      layer.bindPopup(popupContent);
    }

    // Add click handler
    layer.on({
      click: () => handleFeatureClick(feature)
    });
  };

  // Log features when they change
  useEffect(() => {
    if (initialFeatures && initialFeatures.length > 0) {
      console.log('Initializing map with features:', initialFeatures);
    }
  }, [initialFeatures]);

  // Reset view handler
  const handleResetView = () => {
    if (mapRef.current) {
      mapRef.current.setView(defaultCenter, defaultZoom);
    }
  };

  // MapContainer reference handler component
  const MapRef = ({ setMapRef }: { setMapRef: (map: LeafletMap) => void }) => {
    const map = useMap();
    
    useEffect(() => {
      setMapRef(map);
    }, [map, setMapRef]);
    
    return null;
  };
  
  // Coordinates tracker component
  const CoordinatesTracker = () => {
    const map = useMapEvents({
      mousemove: (e) => {
        setCoordinates(e.latlng);
      },
      mouseout: () => {
        setCoordinates(null);
      }
    });
    
    return null;
  };

  return (
    <div className="map-view">
      <div className="map-container">
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          ref={mapRef as React.RefObject<LeafletMap>}
        >
          <MapRef setMapRef={(map) => { mapRef.current = map; }} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ZoomControl position="topright" />
          
          {/* Render GeoJSON features if available */}
          {initialFeatures && initialFeatures.length > 0 && (
            <FeatureGroup>
              {initialFeatures.map((feature, index) => (
                <GeoJSON 
                  key={`feature-${index}`}
                  data={feature}
                  style={() => style(feature)}
                  onEachFeature={onEachFeature}
                />
              ))}
            </FeatureGroup>
          )}
          
          {/* Coordinates tracker */}
          <CoordinatesTracker />
        </MapContainer>
        <div className="map-overlay-text">Benton County, WA GIS</div>
        {coordinates && (
          <div className="coordinates-display">
            Lat: {coordinates.lat.toFixed(6)}, Lng: {coordinates.lng.toFixed(6)}
          </div>
        )}
      </div>

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
          
          <button 
            className="tool-button" 
            title="Select"
            onClick={() => {
              if (initialFeatures && initialFeatures.length > 0 && onFeatureSelect) {
                // In the real implementation, this would be triggered by clicking on a feature on the map
                // For now, just simulate selecting the first feature
                console.log('Feature selected:', initialFeatures[0]);
                onFeatureSelect(initialFeatures[0]);
                setSelectedFeature(initialFeatures[0]);
              }
            }}
          >
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
          <button className="tool-button" title="Reset View" onClick={handleResetView}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="8 12 12 16 16 12"></polyline>
              <line x1="12" y1="8" x2="12" y2="16"></line>
            </svg>
          </button>
          
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