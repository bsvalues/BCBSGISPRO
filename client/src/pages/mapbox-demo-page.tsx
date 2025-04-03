import React from 'react';
import EnhancedMapboxViewer from '@/components/maps/enhanced-mapbox-viewer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function MapboxDemoPage() {
  return (
    <div className="container mx-auto p-4 h-screen flex flex-col">
      <h1 className="text-2xl font-bold mb-4">BentonGeoPro Map Viewer</h1>
      
      <Card className="flex-grow overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle>Interactive Map</CardTitle>
          <CardDescription>
            Use the tools on the left to interact with the map. You can draw features, measure distances, and toggle map layers.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 h-[calc(100%-5rem)]">
          <EnhancedMapboxViewer
            height="100%"
            mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
            initialViewState={{
              longitude: -119.16, // Benton County, WA
              latitude: 46.23,
              zoom: 11
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default MapboxDemoPage;