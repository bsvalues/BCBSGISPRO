import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Initialize MapBox token - you'll need to provide this
const MAPBOX_TOKEN = "pk.eyJ1IjoiZGVtby1hY2NvdW50IiwiYSI6ImNrbmhyeTBtMzBpMWoydm8waW9uaG5wOXkifQ.dlJf2e-YK1psIJ_awCIxXw";

// Sample Benton County GeoJSON data
const SAMPLE_PARCELS = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        PARCEL_NUM: '12345-000',
        OWNER: 'Smith, John',
        ACRES: 5.2,
        SITUS: '123 Main St, Richland, WA'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-119.2290, 46.2503],
          [-119.2270, 46.2503],
          [-119.2270, 46.2483],
          [-119.2290, 46.2483],
          [-119.2290, 46.2503]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        PARCEL_NUM: '23456-000',
        OWNER: 'Johnson, Mary',
        ACRES: 2.8,
        SITUS: '456 Oak St, Kennewick, WA'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-119.2190, 46.2403],
          [-119.2170, 46.2403],
          [-119.2170, 46.2383],
          [-119.2190, 46.2383],
          [-119.2190, 46.2403]
        ]]
      }
    }
  ]
};

const SAMPLE_ZONING = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        ZONE_CODE: 'R-1',
        ZONE_TYPE: 'Residential',
        DESCRIPTION: 'Single-family residential'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-119.2390, 46.2603],
          [-119.2350, 46.2603],
          [-119.2350, 46.2553],
          [-119.2390, 46.2553],
          [-119.2390, 46.2603]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        ZONE_CODE: 'C-1',
        ZONE_TYPE: 'Commercial',
        DESCRIPTION: 'General commercial'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-119.2190, 46.2603],
          [-119.2150, 46.2603],
          [-119.2150, 46.2553],
          [-119.2190, 46.2553],
          [-119.2190, 46.2603]
        ]]
      }
    }
  ]
};

const BentonMapPage: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<any | null>(null);
  const [showParcels, setShowParcels] = useState(true);
  const [showZoning, setShowZoning] = useState(true);
  const [parcelSearch, setParcelSearch] = useState('');

  // Initialize map
  useEffect(() => {
    if (map.current) return; // don't initialize if already initialized

    // Initialize MapBox only if we have a token
    if (!MAPBOX_TOKEN) {
      console.error("MapBox token is missing!");
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    if (mapContainer.current) {
      // Create the map instance
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-119.2290, 46.2503], // Benton County, WA
        zoom: 10
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl());

      // When the map loads, add data sources
      map.current.on('load', () => {
        const mapInstance = map.current;
        if (!mapInstance) return;

        // Add parcel layer
        mapInstance.addSource('parcels', {
          type: 'geojson',
          data: SAMPLE_PARCELS
        });

        mapInstance.addLayer({
          id: 'parcels-fill',
          type: 'fill',
          source: 'parcels',
          paint: {
            'fill-color': 'rgba(0, 128, 255, 0.2)',
            'fill-outline-color': 'rgba(0, 128, 255, 1)'
          }
        });

        mapInstance.addLayer({
          id: 'parcels-outline',
          type: 'line',
          source: 'parcels',
          paint: {
            'line-color': 'rgba(0, 128, 255, 1)',
            'line-width': 1
          }
        });

        // Add zoning layer
        mapInstance.addSource('zoning', {
          type: 'geojson',
          data: SAMPLE_ZONING
        });

        mapInstance.addLayer({
          id: 'zoning-fill',
          type: 'fill',
          source: 'zoning',
          paint: {
            'fill-color': [
              'match',
              ['get', 'ZONE_TYPE'],
              'Residential', 'rgba(255, 128, 0, 0.2)',
              'Commercial', 'rgba(255, 0, 0, 0.2)',
              'Industrial', 'rgba(128, 0, 128, 0.2)',
              'Agricultural', 'rgba(0, 128, 0, 0.2)',
              'rgba(100, 100, 100, 0.2)' // Default
            ],
            'fill-outline-color': 'rgba(0, 0, 0, 0.5)'
          }
        });

        // Add click handler for parcels
        mapInstance.on('click', 'parcels-fill', (e) => {
          if (!e.features || e.features.length === 0) return;
          
          const feature = e.features[0];
          setSelectedFeature(feature.properties);
        });

        // Add click handler for zoning
        mapInstance.on('click', 'zoning-fill', (e) => {
          if (!e.features || e.features.length === 0) return;
          
          const feature = e.features[0];
          setSelectedFeature(feature.properties);
        });
      });
    }

    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Handle layer toggling
  useEffect(() => {
    if (!map.current) return;

    const visibility = showParcels ? 'visible' : 'none';
    if (map.current.getLayer('parcels-fill')) {
      map.current.setLayoutProperty('parcels-fill', 'visibility', visibility);
      map.current.setLayoutProperty('parcels-outline', 'visibility', visibility);
    }
  }, [showParcels]);

  useEffect(() => {
    if (!map.current) return;

    const visibility = showZoning ? 'visible' : 'none';
    if (map.current.getLayer('zoning-fill')) {
      map.current.setLayoutProperty('zoning-fill', 'visibility', visibility);
    }
  }, [showZoning]);

  // Handle parcel search
  const handleSearch = () => {
    if (!map.current || !parcelSearch) return;

    // Filter the map to show only matching parcel
    map.current.setFilter('parcels-fill', ['==', 'PARCEL_NUM', parcelSearch]);
    map.current.setFilter('parcels-outline', ['==', 'PARCEL_NUM', parcelSearch]);

    // Find the feature to highlight and zoom to
    const features = map.current.querySourceFeatures('parcels', {
      filter: ['==', 'PARCEL_NUM', parcelSearch]
    });

    if (features.length > 0) {
      setSelectedFeature(features[0].properties);

      // Get bounds of the feature for zooming
      if (features[0].geometry.type === 'Polygon') {
        const coordinates = features[0].geometry.coordinates[0];
        const bounds = coordinates.reduce((bounds: mapboxgl.LngLatBounds, coord: [number, number]) => {
          return bounds.extend(coord as mapboxgl.LngLatLike);
        }, new mapboxgl.LngLatBounds(coordinates[0] as mapboxgl.LngLatLike, coordinates[0] as mapboxgl.LngLatLike));

        map.current.fitBounds(bounds, { padding: 50 });
      }
    } else {
      alert('Parcel not found. Try "12345-000" or "23456-000".');
    }
  };

  const resetFilters = () => {
    if (!map.current) return;
    
    // Clear filters
    map.current.setFilter('parcels-fill', null);
    map.current.setFilter('parcels-outline', null);
    setParcelSearch('');
    
    // Reset view to show all of Benton County
    map.current.flyTo({
      center: [-119.2290, 46.2503],
      zoom: 10
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-primary text-white p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Benton County GIS Viewer</h1>
        </div>
      </header>

      <main className="flex-grow p-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Left sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Map Layers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="parcelLayer" 
                      checked={showParcels} 
                      onCheckedChange={(checked) => setShowParcels(checked as boolean)} 
                    />
                    <Label htmlFor="parcelLayer">Parcels</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="zoningLayer" 
                      checked={showZoning} 
                      onCheckedChange={(checked) => setShowZoning(checked as boolean)} 
                    />
                    <Label htmlFor="zoningLayer">Zoning</Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Search</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="parcelSearch">Parcel Number</Label>
                    <div className="flex space-x-2 mt-1">
                      <Input 
                        id="parcelSearch" 
                        placeholder="e.g. 12345-000" 
                        value={parcelSearch}
                        onChange={(e) => setParcelSearch(e.target.value)}
                      />
                      <Button onClick={handleSearch}>Search</Button>
                    </div>
                    <Button 
                      variant="outline" 
                      className="mt-2 w-full"
                      onClick={resetFilters}
                    >
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Selected feature information */}
              {selectedFeature && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {selectedFeature.PARCEL_NUM 
                        ? `Parcel #${selectedFeature.PARCEL_NUM}` 
                        : selectedFeature.ZONE_CODE 
                          ? `${selectedFeature.ZONE_TYPE} Zone (${selectedFeature.ZONE_CODE})` 
                          : 'Feature Information'
                      }
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(selectedFeature).map(([key, value]) => (
                        <div key={key} className="grid grid-cols-2 gap-2">
                          <div className="font-medium text-sm">{key.replace(/_/g, ' ')}</div>
                          <div className="text-sm">{String(value)}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Map container */}
            <div className="lg:col-span-3">
              <Card className="h-[600px]">
                <div ref={mapContainer} className="w-full h-full rounded-md" />
              </Card>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-100 p-4 text-center text-gray-600">
        <div className="container mx-auto">
          <p>Benton County GIS Viewer &copy; 2025</p>
        </div>
      </footer>
    </div>
  );
};

export default BentonMapPage;