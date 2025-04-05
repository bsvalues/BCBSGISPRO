import React, { useState, useRef } from 'react';
import L from 'leaflet';

interface FileImportExportProps {
  map: L.Map | null;
}

const FileImportExport: React.FC<FileImportExportProps> = ({ map }) => {
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
    setShowDropdown(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !map) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        
        if (fileExtension === 'geojson' || fileExtension === 'json') {
          // Parse and add GeoJSON to map
          const geojsonData = JSON.parse(event.target?.result as string);
          
          const geojsonLayer = L.geoJSON(geojsonData, {
            style: (feature) => {
              // Default styling for polygons
              return {
                color: '#ff7800',
                weight: 2,
                opacity: 0.7,
                fillOpacity: 0.2,
                fillColor: '#ffff00'
              };
            },
            pointToLayer: (feature, latlng) => {
              // Custom marker for points
              return L.marker(latlng);
            },
            onEachFeature: (feature, layer) => {
              // Add popups with feature properties
              if (feature.properties) {
                let popupContent = '<div class="imported-feature-popup">';
                popupContent += '<h3>Feature Properties</h3>';
                popupContent += '<table class="feature-properties">';
                
                for (const key in feature.properties) {
                  popupContent += `<tr><td>${key}:</td><td>${feature.properties[key]}</td></tr>`;
                }
                
                popupContent += '</table></div>';
                layer.bindPopup(popupContent);
              }
            }
          }).addTo(map);
          
          // Fit map bounds to the imported data
          const bounds = geojsonLayer.getBounds();
          if (bounds.isValid()) {
            map.fitBounds(bounds, {
              padding: [50, 50],
              maxZoom: 15
            });
          }
          
          // Display success message
          alert(`Successfully imported GeoJSON with ${getFeatureCount(geojsonData)} features`);
        } else if (fileExtension === 'kml') {
          // If we had a KML parser library...
          alert('KML file support coming soon');
        } else if (fileExtension === 'gpx') {
          // If we had a GPX parser library...
          alert('GPX file support coming soon');
        } else if (fileExtension === 'csv') {
          // For basic CSV with lat/lng columns
          alert('CSV file support coming soon');
        } else {
          alert(`Unsupported file format: ${fileExtension}`);
        }
      } catch (error) {
        console.error('Error importing file:', error);
        alert('Error importing file. Please check the file format and try again.');
      }
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    reader.readAsText(file);
  };

  const getFeatureCount = (geojsonData: any): number => {
    if (geojsonData.type === 'FeatureCollection' && Array.isArray(geojsonData.features)) {
      return geojsonData.features.length;
    } else if (geojsonData.type === 'Feature') {
      return 1;
    }
    return 0;
  };

  const exportToGeoJSON = () => {
    if (!map) return;
    
    // Collect all GeoJSON layers from the map
    const geoJsonLayers: any[] = [];
    
    map.eachLayer((layer: any) => {
      // Check if it's a GeoJSON layer
      if (layer.feature) {
        geoJsonLayers.push(layer.toGeoJSON());
      }
    });
    
    if (geoJsonLayers.length === 0) {
      alert('No features to export. Add some features to the map first.');
      return;
    }
    
    // Create a FeatureCollection
    const featureCollection = {
      type: 'FeatureCollection',
      features: geoJsonLayers
    };
    
    // Convert to string
    const dataStr = JSON.stringify(featureCollection, null, 2);
    
    // Create a blob and download link
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a link and click it
    const a = document.createElement('a');
    a.href = url;
    a.download = `map_export_${new Date().toISOString().slice(0, 10)}.geojson`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    setShowDropdown(false);
  };

  const exportToImage = () => {
    if (!map) return;
    
    alert('Image export feature is in development');
    
    /* This would require html2canvas or similar library
    html2canvas(document.querySelector('.leaflet-container') as HTMLElement).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = imgData;
      a.download = `map_export_${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
    */
    
    setShowDropdown(false);
  };

  return (
    <div className="file-operations">
      <button 
        onClick={toggleDropdown} 
        title="Import/Export Data"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <span>Import/Export</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}>
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      
      {showDropdown && (
        <div className="file-operations-dropdown">
          <button onClick={handleImportClick}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            Import GeoJSON/KML
          </button>
          
          <button onClick={exportToGeoJSON}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export to GeoJSON
          </button>
          
          <button onClick={exportToImage}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            Export as Image
          </button>
        </div>
      )}
      
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept=".geojson,.json,.kml,.gpx,.csv" 
        onChange={handleFileChange} 
      />
    </div>
  );
};

export default FileImportExport;