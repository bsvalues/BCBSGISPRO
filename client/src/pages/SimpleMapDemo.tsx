import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const SimpleMapDemo: React.FC = () => {
  const [parcelData, setParcelData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Benton County center coordinates
  const bentonCountyCenter: [number, number] = [46.2503, -119.2290];
  
  // Fetch parcel data from Benton County GIS service
  useEffect(() => {
    const fetchParcelData = async () => {
      try {
        setLoading(true);
        
        // Access the Benton County ArcGIS REST API for parcels
        const response = await fetch(
          'https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services/Parcels_and_Assess/FeatureServer/0/query?where=1%3D1&outFields=PARCELNBR,OWNER_NAME,FULLADDRESS,ACRES&geometry=-119.3590,46.1503,-119.0990,46.3503&geometryType=esriGeometryEnvelope&spatialRel=esriSpatialRelIntersects&resultRecordCount=100&outSR=4326&f=geojson'
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`);
        }
        
        const data = await response.json();
        setParcelData(data);
      } catch (err) {
        console.error('Error fetching parcel data:', err);
        setError('Failed to load parcel data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchParcelData();
  }, []);
  
  // Style function for parcels
  const parcelStyle = () => {
    return {
      fillColor: '#3388ff',
      weight: 1,
      opacity: 1,
      color: '#666',
      fillOpacity: 0.2
    };
  };
  
  // Handle clicking on a parcel
  const onEachFeature = (feature: any, layer: any) => {
    if (feature.properties) {
      const { PARCELNBR, OWNER_NAME, FULLADDRESS, ACRES } = feature.properties;
      
      layer.bindPopup(`
        <div style="max-width: 300px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px;">Parcel: ${PARCELNBR || 'N/A'}</h3>
          <p style="margin: 0 0 4px 0;"><strong>Owner:</strong> ${OWNER_NAME || 'N/A'}</p>
          <p style="margin: 0 0 4px 0;"><strong>Address:</strong> ${FULLADDRESS || 'N/A'}</p>
          <p style="margin: 0 0 4px 0;"><strong>Acres:</strong> ${ACRES ? ACRES.toFixed(2) : 'N/A'}</p>
        </div>
      `);
      
      // Highlight on hover
      layer.on({
        mouseover: (e: any) => {
          const l = e.target;
          l.setStyle({
            fillOpacity: 0.6,
            fillColor: '#10b981'
          });
        },
        mouseout: (e: any) => {
          const l = e.target;
          l.setStyle({
            fillOpacity: 0.2,
            fillColor: '#3388ff'
          });
        }
      });
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white shadow-sm py-4 px-6">
        <h1 className="text-2xl font-bold text-gray-800">Benton County GIS Map</h1>
        <p className="text-gray-600">Interactive Parcel Viewer</p>
      </header>
      
      <div className="flex-1 p-6 flex flex-col space-y-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-2">About This Map</h2>
          <p className="text-gray-700">
            This map displays real parcel data from Benton County using their official ArcGIS REST services.
            Click on a parcel to view its details. Hover over parcels to highlight them.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 flex-1" style={{ minHeight: '500px' }}>
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 mb-2"></div>
                <p className="text-gray-700">Loading Benton County parcel data...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-red-500">
                <p>{error}</p>
                <button 
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            </div>
          )}
          
          {!loading && !error && (
            <MapContainer 
              center={bentonCountyCenter}
              zoom={12} 
              style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {parcelData && (
                <GeoJSON 
                  data={parcelData} 
                  style={parcelStyle}
                  onEachFeature={onEachFeature}
                />
              )}
            </MapContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleMapDemo;