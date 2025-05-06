import React, { useState, useRef } from 'react';
import { ModernLayout } from '../components/layout/modern-layout';
import { LegalDescriptionAnalyzer } from '../components/legal-description/legal-description-analyzer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { LegalDescriptionVisualization } from '../../shared/schema';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Info, Map, FileType } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Sample real legal descriptions from Benton County
const SAMPLE_DESCRIPTIONS = [
  `LOT 1, BLOCK 1, MEADOW HILLS PHASE 5, ACCORDING TO THE PLAT THEREOF RECORDED IN VOLUME 15 OF PLATS, PAGE 45, RECORDS OF BENTON COUNTY, WASHINGTON.`,
  `THE EAST HALF OF THE NORTHEAST QUARTER OF SECTION 23, TOWNSHIP 9 NORTH, RANGE 28 EAST, W.M., BENTON COUNTY, WASHINGTON.`,
  `THAT PORTION OF THE SOUTHEAST QUARTER OF THE SOUTHEAST QUARTER OF SECTION 28, TOWNSHIP 8 NORTH, RANGE 29 EAST, W.M., BENTON COUNTY, WASHINGTON, DESCRIBED AS FOLLOWS:
BEGINNING AT THE SOUTHEAST CORNER OF SAID SECTION 28;
THENCE NORTH 89°57'30" WEST ALONG THE SOUTH LINE OF SAID SECTION, 330.00 FEET;
THENCE NORTH 0°02'30" EAST, PARALLEL WITH THE EAST LINE OF SAID SECTION, 660.00 FEET;
THENCE SOUTH 89°57'30" EAST, PARALLEL WITH THE SOUTH LINE OF SAID SECTION, 330.00 FEET TO THE EAST LINE OF SAID SECTION;
THENCE SOUTH 0°02'30" WEST ALONG SAID EAST LINE, 660.00 FEET TO THE POINT OF BEGINNING.`,
  `LOT 7, BLOCK 3, KENNEWICK IRRIGATION DISTRICT SUBDIVISION HIGHLANDS, ACCORDING TO THE PLAT THEREOF RECORDED IN VOLUME 1 OF PLATS, PAGE 93, RECORDS OF BENTON COUNTY, WASHINGTON.`
];

// Mapbox token from environment
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

export default function LegalDescriptionPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('analyzer');
  const [visualizationData, setVisualizationData] = useState<LegalDescriptionVisualization | null>(null);
  const [loading, setLoading] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [sampleDescription, setSampleDescription] = useState('');
  
  // Handle when visualization is generated from the analyzer
  const handleVisualizationGenerated = (data: LegalDescriptionVisualization) => {
    setVisualizationData(data);
    setActiveTab('map');
    
    // Initialize or update the map with visualization data
    setTimeout(() => {
      initializeMap(data);
    }, 100);
  };
  
  // Initialize the map with visualization data
  const initializeMap = (data: LegalDescriptionVisualization) => {
    if (!mapContainerRef.current) return;
    
    setLoading(true);
    
    try {
      // Check if map already exists
      if (mapRef.current) {
        // Update existing map
        updateMapWithVisualization(data);
        return;
      }
      
      // Initialize the map
      mapboxgl.accessToken = MAPBOX_TOKEN;
      
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/satellite-v9',
        center: data.coordinates[0] || [-119.3030, 46.2115], // Default to Benton County
        zoom: 15,
        pitch: 45
      });
      
      mapRef.current = map;
      
      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Setup map when loaded
      map.on('load', () => {
        updateMapWithVisualization(data);
      });
      
      // Handle errors
      map.on('error', (e) => {
        console.error('Mapbox error:', e);
        toast({
          title: 'Map Error',
          description: `Error loading map: ${e.error?.message || 'Unknown error'}`,
          variant: 'destructive'
        });
      });
    } catch (error) {
      console.error('Error initializing map:', error);
      toast({
        title: 'Map Error',
        description: `Failed to initialize map: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Update the map with visualization data
  const updateMapWithVisualization = (data: LegalDescriptionVisualization) => {
    const map = mapRef.current;
    if (!map) return;
    
    try {
      // Remove existing sources if they exist
      if (map.getSource('parcel-boundary')) {
        map.removeLayer('parcel-boundary-line');
        map.removeLayer('parcel-boundary-fill');
        map.removeSource('parcel-boundary');
      }
      
      // Add data points as a source
      if (data.coordinates && data.coordinates.length > 0) {
        // Create a closed polygon from the coordinates
        const coordinates = [...data.coordinates];
        if (coordinates.length > 2 && 
            coordinates[0][0] !== coordinates[coordinates.length - 1][0] && 
            coordinates[0][1] !== coordinates[coordinates.length - 1][1]) {
          coordinates.push(coordinates[0]); // Close the polygon
        }
        
        // Create geojson data
        const geojsonData = {
          type: 'Feature',
          properties: {},
          geometry: data.geometry || {
            type: 'Polygon',
            coordinates: [coordinates]
          }
        };
        
        // Add source
        map.addSource('parcel-boundary', {
          type: 'geojson',
          data: geojsonData as any
        });
        
        // Add fill layer
        map.addLayer({
          id: 'parcel-boundary-fill',
          type: 'fill',
          source: 'parcel-boundary',
          paint: {
            'fill-color': '#0080ff',
            'fill-opacity': 0.3
          }
        });
        
        // Add line layer
        map.addLayer({
          id: 'parcel-boundary-line',
          type: 'line',
          source: 'parcel-boundary',
          paint: {
            'line-color': '#0080ff',
            'line-width': 2
          }
        });
        
        // Fit map to the polygon bounds
        if (coordinates.length > 1) {
          const bounds = coordinates.reduce((bounds, coord) => {
            return bounds.extend(coord as mapboxgl.LngLatLike);
          }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
          
          map.fitBounds(bounds, {
            padding: 50,
            maxZoom: 17
          });
        }
      }
    } catch (error) {
      console.error('Error updating map:', error);
      toast({
        title: 'Map Error',
        description: `Failed to visualize parcel: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const loadSampleDescription = (index: number) => {
    setSampleDescription(SAMPLE_DESCRIPTIONS[index]);
  };
  
  return (
    <ModernLayout>
      <div className="container mx-auto py-6 max-w-6xl">
        <div className="mb-6 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">AI-Enhanced Legal Description Analysis</h1>
          <p className="text-muted-foreground">
            Analyze and visualize property legal descriptions from Benton County, Washington
          </p>
        </div>
        
        <div className="mb-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Authentic Benton County Data</AlertTitle>
            <AlertDescription>
              This tool works with real legal descriptions from Benton County property records. You can visualize parcels, 
              detect issues, and convert text descriptions into map coordinates.
            </AlertDescription>
          </Alert>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Sample Descriptions</CardTitle>
                <CardDescription>
                  Real Benton County property legal descriptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {SAMPLE_DESCRIPTIONS.map((desc, index) => (
                    <button
                      key={index}
                      onClick={() => loadSampleDescription(index)}
                      className="text-left p-3 border rounded-md text-sm hover:bg-slate-50 w-full transition-colors"
                    >
                      <div className="font-medium mb-1">Sample {index + 1}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {desc.substring(0, 60)}...
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="analyzer">
                  <FileType className="h-4 w-4 mr-2" />
                  Legal Description Analyzer
                </TabsTrigger>
                <TabsTrigger value="map">
                  <Map className="h-4 w-4 mr-2" />
                  Map Visualization
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="analyzer">
                <LegalDescriptionAnalyzer 
                  initialDescription={sampleDescription}
                  onVisualizationGenerated={handleVisualizationGenerated}
                  baseCoordinate={[-119.3030, 46.2115]} // Benton County coordinates
                />
              </TabsContent>
              
              <TabsContent value="map">
                <Card>
                  <CardHeader>
                    <CardTitle>Legal Description Map Visualization</CardTitle>
                    <CardDescription>
                      Visual representation of the parcel boundaries from the legal description
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <div 
                        ref={mapContainerRef} 
                        className="h-[500px] w-full rounded-md overflow-hidden"
                      ></div>
                      
                      {loading && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className="bg-white p-4 rounded-md flex items-center space-x-2">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <span>Loading map visualization...</span>
                          </div>
                        </div>
                      )}
                      
                      {!visualizationData && !loading && (
                        <div className="absolute inset-0 bg-slate-50/90 flex items-center justify-center">
                          <div className="text-center p-6 max-w-md">
                            <Map className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
                            <h3 className="text-lg font-medium mb-2">No Visualization Available</h3>
                            <p className="text-sm text-muted-foreground">
                              Analyze a legal description first to generate visualization data for this parcel.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </ModernLayout>
  );
}