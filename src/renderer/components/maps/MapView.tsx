import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-measure/dist/leaflet-measure.css';
import './MapView.css';
import FileImportExport from './FileImportExport';

// Needed to fix an issue with webpack and leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const MapView: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [center, setCenter] = useState<L.LatLngExpression>([44.5646, -123.2620]); // Benton County, OR
  const [zoom, setZoom] = useState(13);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [drawingLayer, setDrawingLayer] = useState<L.FeatureGroup | null>(null);
  const [coordinates, setCoordinates] = useState<string>('');

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !map) {
      // Create the Leaflet map instance
      const mapInstance = L.map(mapRef.current, {
        center,
        zoom,
        zoomControl: false,
        attributionControl: false
      });

      // Base tile layers
      const streetsLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      });
      
      const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      });
      
      const topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors'
      });

      // Add the default base layer
      streetsLayer.addTo(mapInstance);

      // Create layer groups for organization
      const baseMaps = {
        "Streets": streetsLayer,
        "Satellite": satelliteLayer,
        "Topographic": topoLayer
      };
      
      // Set up overlay layers (these would be your GIS layers)
      const parcelLayer = L.layerGroup().addTo(mapInstance);
      const zoningLayer = L.layerGroup();
      const floodplainLayer = L.layerGroup();
      const addressesLayer = L.layerGroup();
      
      const overlayMaps = {
        "Parcels": parcelLayer,
        "Zoning": zoningLayer,
        "Floodplain": floodplainLayer,
        "Addresses": addressesLayer
      };
      
      // Add layer control
      L.control.layers(baseMaps, overlayMaps, {
        position: 'topright',
        collapsed: true
      }).addTo(mapInstance);

      // Add zoom control
      L.control.zoom({
        position: 'bottomright'
      }).addTo(mapInstance);
      
      // Add scale control
      L.control.scale({
        imperial: true,
        metric: true,
        position: 'bottomleft'
      }).addTo(mapInstance);
      
      // Add attribution control
      L.control.attribution({
        position: 'bottomright',
        prefix: 'BentonGeoPro | Leaflet'
      }).addTo(mapInstance);

      // Create drawing layer
      const drawingLayerInstance = new L.FeatureGroup();
      mapInstance.addLayer(drawingLayerInstance);
      setDrawingLayer(drawingLayerInstance);
      
      // Set up map move handler for coordinate display
      mapInstance.on('mousemove', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        setCoordinates(`Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`);
      });
      
      // Save the map instance
      setMap(mapInstance);

      // Add sample GeoJSON data (this would be replaced with real data)
      addSampleParcels(mapInstance, parcelLayer);
      
      // Clean up on unmount
      return () => {
        mapInstance.remove();
      };
    }
  }, [mapRef, map, center, zoom]);

  // Function to add sample parcel boundaries
  const addSampleParcels = (mapInstance: L.Map, layerGroup: L.LayerGroup) => {
    // Sample GeoJSON data for a few parcels in Benton County
    // In a real application, this would come from your GIS database
    const sampleParcels = {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "properties": {
            "parcelId": "11525DC00100",
            "owner": "Smith, John",
            "address": "123 Main St",
            "acreage": 1.25
          },
          "geometry": {
            "type": "Polygon",
            "coordinates": [[
              [-123.2620, 44.5646],
              [-123.2610, 44.5646],
              [-123.2610, 44.5656],
              [-123.2620, 44.5656],
              [-123.2620, 44.5646]
            ]]
          }
        },
        {
          "type": "Feature",
          "properties": {
            "parcelId": "11525DC00200",
            "owner": "Doe, Jane",
            "address": "125 Main St",
            "acreage": 0.87
          },
          "geometry": {
            "type": "Polygon",
            "coordinates": [[
              [-123.2610, 44.5646],
              [-123.2600, 44.5646],
              [-123.2600, 44.5656],
              [-123.2610, 44.5656],
              [-123.2610, 44.5646]
            ]]
          }
        },
        {
          "type": "Feature",
          "properties": {
            "parcelId": "11525DC00300",
            "owner": "Johnson, Robert",
            "address": "127 Main St",
            "acreage": 1.05
          },
          "geometry": {
            "type": "Polygon",
            "coordinates": [[
              [-123.2600, 44.5646],
              [-123.2590, 44.5646],
              [-123.2590, 44.5656],
              [-123.2600, 44.5656],
              [-123.2600, 44.5646]
            ]]
          }
        }
      ]
    };
    
    // Create GeoJSON layer with style and popups
    const parcels = L.geoJSON(sampleParcels, {
      style: function(feature) {
        return {
          color: "#ff7800",
          weight: 2,
          opacity: 0.7,
          fillOpacity: 0.2,
          fillColor: "#ffff00"
        };
      },
      onEachFeature: function(feature, layer) {
        if (feature.properties) {
          let popupContent = '<div class="parcel-popup">';
          popupContent += `<h3>Parcel: ${feature.properties.parcelId}</h3>`;
          popupContent += '<table class="parcel-info">';
          popupContent += `<tr><td>Owner:</td><td>${feature.properties.owner}</td></tr>`;
          popupContent += `<tr><td>Address:</td><td>${feature.properties.address}</td></tr>`;
          popupContent += `<tr><td>Acreage:</td><td>${feature.properties.acreage}</td></tr>`;
          popupContent += '</table>';
          popupContent += '<div class="parcel-actions">';
          popupContent += '<button class="parcel-action-btn">View Details</button>';
          popupContent += '<button class="parcel-action-btn">Related Documents</button>';
          popupContent += '</div>';
          popupContent += '</div>';
          
          layer.bindPopup(popupContent);
        }
      }
    });
    
    layerGroup.addLayer(parcels);
  };
  
  // Handle activating drawing tools
  const activateDrawingTool = (tool: string) => {
    if (!map || !drawingLayer) return;
    
    // Clear any active tool
    deactivateTools();
    
    setActiveTool(tool);
    
    switch (tool) {
      case 'point':
        map.on('click', addPoint);
        break;
      case 'line':
        map.on('click', startLine);
        break;
      case 'polygon':
        map.on('click', startPolygon);
        break;
      case 'circle':
        map.on('click', startCircle);
        break;
      default:
        break;
    }
  };
  
  // Deactivate all tools
  const deactivateTools = () => {
    if (!map) return;
    
    setActiveTool(null);
    
    // Remove all event handlers
    map.off('click', addPoint);
    map.off('click', startLine);
    map.off('click', startPolygon);
    map.off('click', startCircle);
    map.off('mousemove', updateLine);
    map.off('mousemove', updatePolygon);
    map.off('mousemove', updateCircle);
    
    // Clear temporary drawing state
    setCurrentLine(null);
    setCurrentPolygon(null);
    setCurrentCircle(null);
    setLinePoints([]);
    setPolygonPoints([]);
  };
  
  // Point drawing
  const addPoint = (e: L.LeafletMouseEvent) => {
    if (!map || !drawingLayer) return;
    
    const marker = L.marker(e.latlng).addTo(drawingLayer);
    marker.bindPopup(`<b>Point</b><br>Lat: ${e.latlng.lat.toFixed(6)}<br>Lng: ${e.latlng.lng.toFixed(6)}`);
    
    // Deactivate tool after adding a point
    deactivateTools();
  };
  
  // Line drawing
  const [linePoints, setLinePoints] = useState<L.LatLng[]>([]);
  const [currentLine, setCurrentLine] = useState<L.Polyline | null>(null);
  
  const startLine = (e: L.LeafletMouseEvent) => {
    if (!map) return;
    
    if (linePoints.length === 0) {
      // Start a new line
      setLinePoints([e.latlng]);
      
      // Create a temporary line
      const line = L.polyline([e.latlng], {
        color: '#3388ff',
        weight: 3,
        dashArray: '5, 5',
        opacity: 0.7
      }).addTo(map);
      
      setCurrentLine(line);
      
      // Enable moving preview
      map.on('mousemove', updateLine);
      
    } else {
      // Add a point to the line
      const newPoints = [...linePoints, e.latlng];
      setLinePoints(newPoints);
      
      if (currentLine) {
        currentLine.setLatLngs(newPoints);
      }
      
      // Double-click to finish the line
      if (e.originalEvent.detail === 2 && linePoints.length > 0) {
        finishLine();
      }
    }
  };
  
  const updateLine = (e: L.LeafletMouseEvent) => {
    if (currentLine && linePoints.length > 0) {
      const tempPoints = [...linePoints, e.latlng];
      currentLine.setLatLngs(tempPoints);
    }
  };
  
  const finishLine = () => {
    if (!map || !drawingLayer || !currentLine || linePoints.length < 2) return;
    
    // Remove the temporary line
    map.removeLayer(currentLine);
    
    // Create the final line
    const finalLine = L.polyline(linePoints, {
      color: '#3388ff',
      weight: 3,
      opacity: 0.7
    }).addTo(drawingLayer);
    
    // Calculate length
    let length = 0;
    for (let i = 1; i < linePoints.length; i++) {
      length += linePoints[i-1].distanceTo(linePoints[i]);
    }
    
    // Convert to appropriate units
    let lengthText = '';
    if (length < 1000) {
      lengthText = `${length.toFixed(2)} m`;
    } else {
      lengthText = `${(length / 1000).toFixed(2)} km`;
    }
    
    finalLine.bindPopup(`<b>Line</b><br>Length: ${lengthText}<br>Points: ${linePoints.length}`);
    
    // Reset state
    setLinePoints([]);
    setCurrentLine(null);
    map.off('mousemove', updateLine);
    deactivateTools();
  };
  
  // Polygon drawing
  const [polygonPoints, setPolygonPoints] = useState<L.LatLng[]>([]);
  const [currentPolygon, setCurrentPolygon] = useState<L.Polygon | null>(null);
  
  const startPolygon = (e: L.LeafletMouseEvent) => {
    if (!map) return;
    
    if (polygonPoints.length === 0) {
      // Start a new polygon
      setPolygonPoints([e.latlng]);
      
      // Create a temporary polygon preview
      const polygon = L.polygon([e.latlng, e.latlng], {
        color: '#3388ff',
        weight: 2,
        dashArray: '5, 5',
        opacity: 0.7,
        fillOpacity: 0.2
      }).addTo(map);
      
      setCurrentPolygon(polygon);
      
      // Enable moving preview
      map.on('mousemove', updatePolygon);
      
    } else {
      // Add a point to the polygon
      const newPoints = [...polygonPoints, e.latlng];
      setPolygonPoints(newPoints);
      
      if (currentPolygon) {
        currentPolygon.setLatLngs([...newPoints, newPoints[0]]);
      }
      
      // Double-click to finish the polygon
      if (e.originalEvent.detail === 2 && polygonPoints.length > 1) {
        finishPolygon();
      }
    }
  };
  
  const updatePolygon = (e: L.LeafletMouseEvent) => {
    if (currentPolygon && polygonPoints.length > 0) {
      const tempPoints = [...polygonPoints, e.latlng];
      if (tempPoints.length > 1) {
        currentPolygon.setLatLngs([...tempPoints, tempPoints[0]]);
      }
    }
  };
  
  const finishPolygon = () => {
    if (!map || !drawingLayer || !currentPolygon || polygonPoints.length < 3) return;
    
    // Remove the temporary polygon
    map.removeLayer(currentPolygon);
    
    // Create the final polygon
    const finalPolygon = L.polygon(polygonPoints, {
      color: '#3388ff',
      weight: 2,
      opacity: 0.7,
      fillColor: '#3388ff',
      fillOpacity: 0.2
    }).addTo(drawingLayer);
    
    // Calculate area (approximate using the Leaflet method)
    const latlngs = finalPolygon.getLatLngs();
    let area = 0;
    
    if (Array.isArray(latlngs[0]) && latlngs[0].length > 2) {
      // For multipolygons
      const latLngArr = latlngs[0] as L.LatLng[];
      area = L.GeometryUtil ? L.GeometryUtil.geodesicArea(latLngArr) : 0;
    }
    
    // Convert to appropriate units
    let areaText = '';
    if (area < 10000) {
      areaText = `${area.toFixed(2)} m²`;
    } else {
      areaText = `${(area / 10000).toFixed(2)} ha`;
    }
    
    finalPolygon.bindPopup(`<b>Polygon</b><br>Area: ${areaText}<br>Vertices: ${polygonPoints.length}`);
    
    // Reset state
    setPolygonPoints([]);
    setCurrentPolygon(null);
    map.off('mousemove', updatePolygon);
    deactivateTools();
  };
  
  // Circle drawing
  const [circleCenter, setCircleCenter] = useState<L.LatLng | null>(null);
  const [currentCircle, setCurrentCircle] = useState<L.Circle | null>(null);
  
  const startCircle = (e: L.LeafletMouseEvent) => {
    if (!map) return;
    
    if (!circleCenter) {
      // Set the center of the circle
      setCircleCenter(e.latlng);
      
      // Create a temporary circle with 0 radius
      const circle = L.circle(e.latlng, {
        radius: 0,
        color: '#3388ff',
        weight: 2,
        dashArray: '5, 5',
        opacity: 0.7,
        fillColor: '#3388ff',
        fillOpacity: 0.2
      }).addTo(map);
      
      setCurrentCircle(circle);
      
      // Enable moving preview for the radius
      map.on('mousemove', updateCircle);
      
    } else {
      // Finish the circle
      finishCircle(e);
    }
  };
  
  const updateCircle = (e: L.LeafletMouseEvent) => {
    if (currentCircle && circleCenter) {
      const radius = circleCenter.distanceTo(e.latlng);
      currentCircle.setRadius(radius);
    }
  };
  
  const finishCircle = (e: L.LeafletMouseEvent) => {
    if (!map || !drawingLayer || !currentCircle || !circleCenter) return;
    
    // Calculate the final radius
    const radius = circleCenter.distanceTo(e.latlng);
    
    // Remove the temporary circle
    map.removeLayer(currentCircle);
    
    // Create the final circle
    const finalCircle = L.circle(circleCenter, {
      radius: radius,
      color: '#3388ff',
      weight: 2,
      opacity: 0.7,
      fillColor: '#3388ff',
      fillOpacity: 0.2
    }).addTo(drawingLayer);
    
    // Format radius for display
    let radiusText = '';
    if (radius < 1000) {
      radiusText = `${radius.toFixed(2)} m`;
    } else {
      radiusText = `${(radius / 1000).toFixed(2)} km`;
    }
    
    // Calculate area
    const area = Math.PI * Math.pow(radius, 2);
    let areaText = '';
    if (area < 10000) {
      areaText = `${area.toFixed(2)} m²`;
    } else if (area < 1000000) {
      areaText = `${(area / 10000).toFixed(2)} ha`;
    } else {
      areaText = `${(area / 1000000).toFixed(2)} km²`;
    }
    
    finalCircle.bindPopup(`<b>Circle</b><br>Radius: ${radiusText}<br>Area: ${areaText}`);
    
    // Reset state
    setCircleCenter(null);
    setCurrentCircle(null);
    map.off('mousemove', updateCircle);
    deactivateTools();
  };
  
  // Clear all drawings
  const clearDrawings = () => {
    if (!drawingLayer) return;
    
    drawingLayer.clearLayers();
    deactivateTools();
  };
  
  // Identify features under a point
  const identifyFeatures = () => {
    if (!map) return;
    
    deactivateTools();
    setActiveTool('identify');
    
    const handleIdentifyClick = (e: L.LeafletMouseEvent) => {
      // Get all layers at the clicked point
      const point = e.latlng;
      const bounds = L.latLngBounds(
        L.latLng(point.lat - 0.0001, point.lng - 0.0001),
        L.latLng(point.lat + 0.0001, point.lng + 0.0001)
      );
      
      const layers = [];
      
      map.eachLayer((layer: any) => {
        // Check if layer is a GeoJSON layer
        if (layer.feature && layer.getBounds && bounds.intersects(layer.getBounds())) {
          layers.push(layer);
        }
      });
      
      if (layers.length > 0) {
        // Show results in a popup
        let popupContent = '<div class="identify-popup">';
        popupContent += `<h3>${layers.length} Features Found</h3>`;
        popupContent += '<div class="feature-list">';
        
        layers.forEach((layer, index) => {
          const feature = layer.feature;
          popupContent += `<div class="feature-item">`;
          popupContent += `<h4>Feature ${index + 1}</h4>`;
          
          if (feature.properties) {
            const props = feature.properties;
            popupContent += '<table class="feature-properties">';
            for (const key in props) {
              popupContent += `<tr><td>${key}:</td><td>${props[key]}</td></tr>`;
            }
            popupContent += '</table>';
          }
          
          popupContent += `</div>`;
        });
        
        popupContent += '</div></div>';
        
        // Create popup at the clicked point
        L.popup()
          .setLatLng(point)
          .setContent(popupContent)
          .openOn(map);
      } else {
        // No features found
        L.popup()
          .setLatLng(point)
          .setContent('<div class="identify-popup"><p>No features found at this location.</p></div>')
          .openOn(map);
      }
      
      // Deactivate identify tool after one use
      map.off('click', handleIdentifyClick);
      setActiveTool(null);
    };
    
    map.once('click', handleIdentifyClick);
  };

  return (
    <div className="map-container">
      <div className="map-wrapper">
        <div ref={mapRef} className="map"></div>
        <div className="coordinate-display">{coordinates}</div>
        <FileImportExport map={map} />
      </div>
      
      <div className="map-tools">
        <div className="tool-section">
          <h3>Measurement</h3>
          <button 
            className={`tool-button ${activeTool === 'measure-distance' ? 'active' : ''}`} 
            onClick={() => activateDrawingTool('line')}
            title="Measure Distance"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12h20"></path>
              <path d="M6 8v8"></path>
              <path d="M18 8v8"></path>
              <path d="M14 8v8"></path>
              <path d="M10 8v8"></path>
            </svg>
            <span>Measure Distance</span>
          </button>
          <button 
            className={`tool-button ${activeTool === 'measure-area' ? 'active' : ''}`} 
            onClick={() => activateDrawingTool('polygon')}
            title="Measure Area"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3h18v18H3z"></path>
            </svg>
            <span>Measure Area</span>
          </button>
        </div>
        
        <div className="tool-section">
          <h3>Drawing</h3>
          <button 
            className={`tool-button ${activeTool === 'point' ? 'active' : ''}`} 
            onClick={() => activateDrawingTool('point')}
            title="Draw Point"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"></circle>
            </svg>
            <span>Draw Point</span>
          </button>
          <button 
            className={`tool-button ${activeTool === 'line' ? 'active' : ''}`} 
            onClick={() => activateDrawingTool('line')}
            title="Draw Line"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3l18 18"></path>
            </svg>
            <span>Draw Line</span>
          </button>
          <button 
            className={`tool-button ${activeTool === 'polygon' ? 'active' : ''}`} 
            onClick={() => activateDrawingTool('polygon')}
            title="Draw Polygon"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"></path>
              <path d="M3 12h18"></path>
              <path d="M3 18h18"></path>
            </svg>
            <span>Draw Polygon</span>
          </button>
          <button 
            className={`tool-button ${activeTool === 'circle' ? 'active' : ''}`} 
            onClick={() => activateDrawingTool('circle')}
            title="Draw Circle"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
            </svg>
            <span>Draw Circle</span>
          </button>
          <button 
            className="tool-button danger"
            onClick={clearDrawings}
            title="Clear All Drawings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
            </svg>
            <span>Clear All</span>
          </button>
        </div>
        
        <div className="tool-section">
          <h3>Selection</h3>
          <button 
            className={`tool-button ${activeTool === 'identify' ? 'active' : ''}`} 
            onClick={identifyFeatures}
            title="Identify Features"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3l7 7"></path>
              <path d="M10 10l-7 7"></path>
              <path d="M21 21l-7-7"></path>
              <path d="M14 14l7-7"></path>
              <path d="M8 8l8 8"></path>
              <path d="M16 8l-8 8"></path>
            </svg>
            <span>Identify Features</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapView;