import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

// Simple direct implementation that doesn't rely on other components
export function MapboxDemoPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // First check for WebGL support before doing anything else
    if (!mapboxgl.supported()) {
      setError('Your browser does not support WebGL, which is required for the map to display.');
      toast({
        title: 'Browser not supported',
        description: 'Your browser does not support WebGL, which is required for the map to display.',
        variant: 'destructive'
      });
      return;
    }
    
    // Initialize mapbox with access token
    // Try direct method, fallback to API if needed
    const initMapbox = async () => {
      try {
        // First try the direct environment variable approach
        if (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN) {
          mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
          initMap();
        } else {
          // Fallback to API endpoint
          console.log("VITE_MAPBOX_ACCESS_TOKEN not available, trying API endpoint");
          const response = await fetch('/api/mapbox-token');
          
          if (!response.ok) {
            throw new Error(`Failed to get Mapbox token: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          
          if (!data.token) {
            throw new Error('No token returned from server');
          }
          
          mapboxgl.accessToken = data.token;
          initMap();
        }
      } catch (error) {
        console.error('Error initializing Mapbox:', error);
        setError('Failed to get Mapbox access token. Please ensure the token is properly configured.');
        toast({
          title: 'Mapbox token error',
          description: 'Could not retrieve Mapbox access token. Please check console for details.',
          variant: 'destructive'
        });
      }
    };
    
    const initMap = () => {
      // Only create the map if one doesn't already exist and container is ready
      if (!map.current && mapContainer.current) {
        try {
          console.log("Initializing Mapbox map with token:", mapboxgl.accessToken.substring(0, 8) + "...");
          
          // Create a new map instance
          const newMap = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/satellite-streets-v12',
            center: [-119.16, 46.23], // Benton County, WA
            zoom: 11,
            attributionControl: true
          });
          
          // Add navigation controls (zoom in/out buttons)
          newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
          
          // Add scale control
          newMap.addControl(new mapboxgl.ScaleControl(), 'bottom-left');
          
          // Add fullscreen control
          newMap.addControl(new mapboxgl.FullscreenControl(), 'top-right');
          
          // Wait for map to load
          newMap.on('load', () => {
            console.log('Map loaded successfully');
            toast({
              title: 'Map loaded',
              description: 'The Mapbox map has been successfully loaded.',
            });
          });
          
          // Add error handler
          newMap.on('error', (e) => {
            console.error('Mapbox error:', e);
            setError('An error occurred with the map. Please check the console for details.');
          });
          
          // Set the map instance
          map.current = newMap;
        } catch (error) {
          console.error('Error initializing Mapbox map:', error);
          setError('Failed to initialize the map. Please check the console for details.');
        }
      }
    };
    
    // Start the initialization process
    initMapbox();
    
    // Cleanup function to remove the map instance
    return () => {
      if (map.current) {
        console.log("Cleaning up map instance");
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div className="container mx-auto p-4 h-screen flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Mapbox Demo</h1>
      
      <Card className="flex-grow overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle>Mapbox GL JS Map</CardTitle>
          <CardDescription>
            A simple demonstration of Mapbox GL JS integration.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 h-[calc(100%-5rem)]">
          {error ? (
            <div className="flex items-center justify-center h-full bg-red-50 text-red-700 p-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Error Loading Map</h3>
                <p>{error}</p>
              </div>
            </div>
          ) : (
            <div 
              ref={mapContainer} 
              className="h-full w-full"
              style={{ background: '#e5e7eb' }} // Light gray background while loading
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default MapboxDemoPage;