import React, { useRef, useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { toast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { 
  ConfidenceLevel, 
  LegalDescriptionType 
} from '@shared/legal-description-parser';

// Define component props
interface LegalDescriptionAgentProps {}

// API response types
interface ParsingResult {
  type: LegalDescriptionType;
  confidence: ConfidenceLevel;
  feature?: any; // GeoJSON Feature
  errorMessage?: string;
  segments?: any[];
  referencePoint?: [number, number];
  rawText: string;
  processedAt?: Date;
  processingTimeMs?: number;
}

// Example description interface
interface ExampleDescription {
  name: string;
  description: string;
  type: LegalDescriptionType;
}

export function LegalDescriptionAgentPage(props: LegalDescriptionAgentProps) {
  // References
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [descriptionText, setDescriptionText] = useState('');
  const [referencePoint, setReferencePoint] = useState<[number, number] | null>(null);
  const [parsingResult, setParsingResult] = useState<ParsingResult | null>(null);
  const [examples, setExamples] = useState<ExampleDescription[]>([]);
  const [activeTab, setActiveTab] = useState('editor');
  
  // Load examples when component mounts
  useEffect(() => {
    fetchExamples();
  }, []);
  
  // Initialize map
  useEffect(() => {
    initializeMap();
    
    return () => {
      // Cleanup function for map
      if (map.current) {
        map.current.remove();
        map.current = null;
        setMapLoaded(false);
      }
    };
  }, []);
  
  // Update map when parsing result changes
  useEffect(() => {
    if (mapLoaded && parsingResult?.feature) {
      drawFeatureOnMap(parsingResult.feature);
    }
  }, [parsingResult, mapLoaded]);
  
  // Initialize Mapbox map
  const initializeMap = async () => {
    if (!mapContainer.current || map.current) return;
    
    try {
      // Check WebGL support
      if (!mapboxgl.supported()) {
        setError('Your browser does not support WebGL, which is required for the map to display.');
        toast({
          title: 'Browser not supported',
          description: 'Your browser does not support WebGL, which is required for the map to display.',
          variant: 'destructive'
        });
        return;
      }
      
      // Get Mapbox token
      let mapboxToken: string | null = null;
      
      try {
        // First try the direct environment variable approach
        if (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN) {
          mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
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
          
          mapboxToken = data.token;
        }
      } catch (error) {
        console.error('Error getting Mapbox token:', error);
        setError('Failed to get Mapbox access token. Please ensure the token is properly configured.');
        return;
      }
      
      // Set Mapbox token
      mapboxgl.accessToken = mapboxToken;
      
      // Create new map instance
      const newMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [-119.16, 46.23], // Benton County, WA
        zoom: 11,
        attributionControl: true
      });
      
      // Add navigation controls
      newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Add scale control
      newMap.addControl(new mapboxgl.ScaleControl(), 'bottom-left');
      
      // Add fullscreen control
      newMap.addControl(new mapboxgl.FullscreenControl(), 'top-right');
      
      // Initialize draw control
      draw.current = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true,
          point: true
        }
      });
      
      // Add draw control
      newMap.addControl(draw.current, 'top-left');
      
      // Set up event listeners
      newMap.on('load', () => {
        setMapLoaded(true);
        console.log('Map loaded successfully');
        
        // Add point click handler
        newMap.on('click', (e) => {
          if (activeTab === 'reference') {
            // Set reference point
            const { lng, lat } = e.lngLat;
            setReferencePoint([lng, lat]);
            
            // Update map
            if (draw.current) {
              // Clear existing points
              const featureIds = draw.current.getAll().features
                .filter(f => f.geometry.type === 'Point')
                .map(f => f.id as string);
              
              if (featureIds.length > 0) {
                draw.current.delete(featureIds);
              }
              
              // Add new point
              draw.current.add({
                type: 'Feature',
                properties: { name: 'Reference Point' },
                geometry: {
                  type: 'Point',
                  coordinates: [lng, lat]
                }
              });
              
              toast({
                title: 'Reference point set',
                description: `Coordinates: ${lng.toFixed(6)}, ${lat.toFixed(6)}`,
              });
            }
          }
        });
      });
      
      // Set map instance
      map.current = newMap;
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to initialize the map. Please check the console for details.');
    }
  };
  
  // Draw feature on map
  const drawFeatureOnMap = (feature: any) => {
    if (!map.current || !draw.current || !feature) return;
    
    try {
      // Clear existing features
      draw.current.deleteAll();
      
      // Add reference point if available
      if (referencePoint) {
        draw.current.add({
          type: 'Feature',
          properties: { name: 'Reference Point' },
          geometry: {
            type: 'Point',
            coordinates: referencePoint
          }
        });
      }
      
      // Add parsed feature
      draw.current.add(feature);
      
      // Fit map to feature bounds
      const bbox = getBoundingBox(feature);
      if (bbox) {
        map.current.fitBounds(bbox, {
          padding: 50,
          maxZoom: 15
        });
      }
      
    } catch (err) {
      console.error('Error drawing feature on map:', err);
      toast({
        title: 'Error drawing on map',
        description: 'Failed to draw the parsed feature on the map.',
        variant: 'destructive'
      });
    }
  };
  
  // Calculate bounding box for a GeoJSON feature
  const getBoundingBox = (feature: any) => {
    if (!feature || !feature.geometry || !feature.geometry.coordinates) return null;
    
    // Handle different geometry types
    let coords: number[][] = [];
    
    if (feature.geometry.type === 'Point') {
      coords = [feature.geometry.coordinates];
    } else if (feature.geometry.type === 'LineString') {
      coords = feature.geometry.coordinates;
    } else if (feature.geometry.type === 'Polygon') {
      coords = feature.geometry.coordinates[0];
    } else {
      return null;
    }
    
    // Return null if no coordinates
    if (coords.length === 0) return null;
    
    // Calculate bounds
    const bounds = coords.reduce(
      (bounds, coord) => {
        return [
          [Math.min(bounds[0][0], coord[0]), Math.min(bounds[0][1], coord[1])],
          [Math.max(bounds[1][0], coord[0]), Math.max(bounds[1][1], coord[1])]
        ];
      },
      [[coords[0][0], coords[0][1]], [coords[0][0], coords[0][1]]]
    );
    
    // Convert to Mapbox LngLatBoundsLike format [west, south, east, north]
    return [
      bounds[0][0], // west
      bounds[0][1], // south
      bounds[1][0], // east
      bounds[1][1]  // north
    ] as [number, number, number, number];
  };
  
  // Fetch example descriptions
  const fetchExamples = async () => {
    try {
      const response = await fetch('/api/legal-description/examples');
      if (!response.ok) {
        throw new Error(`Failed to fetch examples: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setExamples(data);
    } catch (err) {
      console.error('Error fetching examples:', err);
      toast({
        title: 'Failed to load examples',
        description: 'Could not load example descriptions. Please try again later.',
        variant: 'destructive'
      });
    }
  };
  
  // Parse the legal description
  const parseDescription = async () => {
    if (!descriptionText.trim()) {
      toast({
        title: 'No description provided',
        description: 'Please enter a legal description to parse.',
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/legal-description/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: descriptionText,
          referencePoint
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error parsing description: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      setParsingResult(result);
      
      // Show appropriate toast based on confidence
      if (result.errorMessage) {
        toast({
          title: 'Parsing Error',
          description: result.errorMessage,
          variant: 'destructive'
        });
      } else {
        const confidenceVariant = result.confidence === ConfidenceLevel.HIGH
          ? 'default'
          : result.confidence === ConfidenceLevel.MEDIUM
            ? 'default'
            : 'destructive';
        
        toast({
          title: `Parsed as ${formatDescriptionType(result.type)}`,
          description: `Confidence: ${formatConfidenceLevel(result.confidence)}`,
          variant: confidenceVariant as any
        });
      }
      
    } catch (err) {
      console.error('Error parsing description:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast({
        title: 'Parsing failed',
        description: 'Failed to parse the legal description. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Load example description
  const loadExample = (example: ExampleDescription) => {
    setDescriptionText(example.description);
    toast({
      title: 'Example loaded',
      description: `Loaded: ${example.name}`,
    });
  };
  
  // Format description type for display
  const formatDescriptionType = (type: LegalDescriptionType): string => {
    switch (type) {
      case LegalDescriptionType.METES_AND_BOUNDS:
        return 'Metes and Bounds';
      case LegalDescriptionType.SECTION_TOWNSHIP_RANGE:
        return 'Section-Township-Range';
      case LegalDescriptionType.LOT_BLOCK:
        return 'Lot and Block';
      default:
        return 'Unknown';
    }
  };
  
  // Format confidence level for display
  const formatConfidenceLevel = (level: ConfidenceLevel): string => {
    switch (level) {
      case ConfidenceLevel.HIGH:
        return 'High';
      case ConfidenceLevel.MEDIUM:
        return 'Medium';
      case ConfidenceLevel.LOW:
        return 'Low';
      default:
        return 'Unknown';
    }
  };
  
  // Get confidence level color
  const getConfidenceColor = (level: ConfidenceLevel): string => {
    switch (level) {
      case ConfidenceLevel.HIGH:
        return 'text-green-600';
      case ConfidenceLevel.MEDIUM:
        return 'text-yellow-600';
      case ConfidenceLevel.LOW:
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };
  
  // Render component
  return (
    <div className="container mx-auto p-4 h-screen flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Legal Description Agent</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow overflow-hidden">
        {/* Left column: Controls and input */}
        <div className="flex flex-col space-y-4">
          <Card className="flex-grow overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle>Legal Description</CardTitle>
              <CardDescription>
                Enter a legal property description to be parsed and drawn on the map.
              </CardDescription>
              <Tabs 
                value={activeTab} 
                onValueChange={(value) => setActiveTab(value)}
                className="mt-2"
              >
                <TabsList>
                  <TabsTrigger value="editor">Text Editor</TabsTrigger>
                  <TabsTrigger value="examples">Examples</TabsTrigger>
                  <TabsTrigger value="reference">Set Reference</TabsTrigger>
                </TabsList>
                
                <div className="mt-4">
                  <TabsContent value="editor" className="h-full flex flex-col space-y-4">
                    <Textarea
                      placeholder="Enter legal description here..."
                      className="resize-none flex-grow"
                      value={descriptionText}
                      onChange={(e) => setDescriptionText(e.target.value)}
                    />
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">
                          Reference Point: {referencePoint 
                            ? `${referencePoint[0].toFixed(6)}, ${referencePoint[1].toFixed(6)}` 
                            : 'Not set'}
                        </span>
                      </div>
                      
                      <Button 
                        onClick={parseDescription} 
                        disabled={loading || !descriptionText.trim()}
                      >
                        {loading ? 'Processing...' : 'Parse Description'}
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="examples" className="h-full space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Select an example legal description to load:
                    </p>
                    
                    {examples.length > 0 ? (
                      <div className="space-y-4">
                        {examples.map((example, index) => (
                          <Card key={index} className="cursor-pointer hover:bg-accent/50 transition-colors">
                            <CardHeader className="p-4" onClick={() => loadExample(example)}>
                              <CardTitle className="text-base">{example.name}</CardTitle>
                              <CardDescription>
                                {formatDescriptionType(example.type)}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <p className="text-sm text-muted-foreground line-clamp-3">
                                {example.description}
                              </p>
                            </CardContent>
                            <CardFooter className="p-4 pt-0">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => loadExample(example)}
                              >
                                Load Example
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="flex justify-center items-center h-32">
                        <p className="text-muted-foreground">No examples available</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="reference" className="h-full space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Set a reference point by clicking on the map. This point will be used as the starting point
                      for metes and bounds descriptions.
                    </p>
                    
                    {referencePoint && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="longitude">Longitude</Label>
                            <Input
                              id="longitude"
                              type="number"
                              step="0.000001"
                              value={referencePoint[0]}
                              onChange={(e) => setReferencePoint([parseFloat(e.target.value), referencePoint[1]])}
                            />
                          </div>
                          <div>
                            <Label htmlFor="latitude">Latitude</Label>
                            <Input
                              id="latitude"
                              type="number"
                              step="0.000001"
                              value={referencePoint[1]}
                              onChange={(e) => setReferencePoint([referencePoint[0], parseFloat(e.target.value)])}
                            />
                          </div>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setReferencePoint(null)}
                        >
                          Clear Reference Point
                        </Button>
                      </div>
                    )}
                    
                    {!referencePoint && (
                      <div className="flex justify-center items-center h-32 border-2 border-dashed rounded-md border-muted p-4">
                        <p className="text-muted-foreground text-center">
                          Click on the map to set a reference point
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </CardHeader>
            
            <CardContent className="space-y-4 overflow-auto" style={{ height: 'calc(100% - 8rem)' }}>
            </CardContent>
          </Card>
          
          {/* Results panel */}
          {parsingResult && (
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                  <span>Parsing Results</span>
                  <span className={getConfidenceColor(parsingResult.confidence)}>
                    {formatConfidenceLevel(parsingResult.confidence)} Confidence
                  </span>
                </CardTitle>
                <CardDescription>
                  Detected type: {formatDescriptionType(parsingResult.type)}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4 max-h-64 overflow-auto">
                {parsingResult.errorMessage && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-md">
                    <p className="font-medium">Error:</p>
                    <p>{parsingResult.errorMessage}</p>
                  </div>
                )}
                
                <Accordion type="single" collapsible>
                  {parsingResult.segments && parsingResult.segments.length > 0 && (
                    <AccordionItem value="segments">
                      <AccordionTrigger>Segments ({parsingResult.segments.length})</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {parsingResult.segments.map((segment, index) => (
                            <div key={index} className="p-2 bg-accent/30 rounded-md text-sm">
                              <p><strong>Segment {index + 1}:</strong></p>
                              {segment.startPoint && (
                                <p>Start: {segment.startPoint[0].toFixed(6)}, {segment.startPoint[1].toFixed(6)}</p>
                              )}
                              <p>Bearing: {segment.bearing.degrees}° {segment.bearing.minutes && segment.bearing.minutes + '\''} {segment.bearing.seconds && segment.bearing.seconds + '"'}</p>
                              <p>Distance: {segment.distance} {segment.unit}</p>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                  
                  <AccordionItem value="raw">
                    <AccordionTrigger>Raw GeoJSON</AccordionTrigger>
                    <AccordionContent>
                      <pre className="text-xs overflow-auto p-2 bg-accent/30 rounded-md">
                        {JSON.stringify(parsingResult.feature, null, 2)}
                      </pre>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="metrics">
                    <AccordionTrigger>Processing Metrics</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1 text-sm">
                        {parsingResult.processedAt && (
                          <p>Processed: {new Date(parsingResult.processedAt).toLocaleString()}</p>
                        )}
                        {parsingResult.processingTimeMs !== undefined && (
                          <p>Processing time: {parsingResult.processingTimeMs} ms</p>
                        )}
                        <p>Character count: {parsingResult.rawText.length}</p>
                        <p>Word count: {parsingResult.rawText.split(/\s+/).filter(Boolean).length}</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Right column: Map */}
        <Card className="flex-grow overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle>Visualization</CardTitle>
            <CardDescription>
              Visual representation of the parsed legal description
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
    </div>
  );
}

export default LegalDescriptionAgentPage;