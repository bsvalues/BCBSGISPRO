/**
 * Map Editor Component
 * 
 * A comprehensive map editing interface for Benton County GIS data with:
 * - Drawing and editing tools for parcels and features
 * - Integration with the AI agent system for map intelligence
 * - Layer management and styling
 * - Measurement and analysis tools
 * - Export and sharing capabilities
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { 
  Layers, 
  Edit3, 
  Ruler, 
  Trash2, 
  Save, 
  Map as MapIcon, 
  Image, 
  EyeOff, 
  Eye, 
  Download, 
  Share2, 
  Undo2, 
  Redo2,
  HelpCircle,
  MessageSquare
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { useAgentSystem } from '../../context/agent-system-context';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

// Mapbox access token from environment
const MAPBOX_TOKEN = (import.meta as any).env.VITE_MAPBOX_ACCESS_TOKEN || '';

// Interface for editor properties
interface MapEditorProps {
  center?: [number, number];
  zoom?: number;
  style?: string;
  className?: string;
  height?: string;
  showAI?: boolean;
  onSave?: (data: any) => void;
}

/**
 * Map Editor Component
 */
export function MapEditor({
  center = [-119.2984, 46.2587], // Default center at Benton County, WA
  zoom = 12,
  style = 'mapbox://styles/mapbox/streets-v11',
  className = '',
  height = '600px',
  showAI = true,
  onSave
}: MapEditorProps) {
  // References
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  
  // State
  const [loaded, setLoaded] = useState(false);
  const [currentMode, setCurrentMode] = useState<string>('simple_select');
  const [mapStyle, setMapStyle] = useState<string>(style);
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({
    parcels: true,
    zoning: false,
    roads: true,
    water: true
  });
  const [lastAction, setLastAction] = useState<string>('');
  const [showAIPanel, setShowAIPanel] = useState<boolean>(false);
  const [aiQuery, setAiQuery] = useState<string>('');
  const [measurementResults, setMeasurementResults] = useState<{
    distance?: string;
    area?: string;
  }>({});
  
  // Hooks
  const { toast } = useToast();
  const { isAvailable: isAIAvailable, requestAgentAssistance, lastResponse } = useAgentSystem();
  
  // Initialize the map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    // Check for Mapbox token
    if (!MAPBOX_TOKEN) {
      toast({
        title: 'Mapbox Access Token Required',
        description: 'Mapbox access token is missing. Please configure your environment variables.',
        variant: 'destructive'
      });
      return;
    }
    
    // Set the access token
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    // Create the map
    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center,
      zoom,
      attributionControl: true,
      preserveDrawingBuffer: true // Needed for image export
    });
    
    // Add navigation controls
    mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Add scale control
    mapInstance.addControl(
      new mapboxgl.ScaleControl({ unit: 'imperial' }), 
      'bottom-left'
    );
    
    // Add fullscreen control
    mapInstance.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    
    // Add drawing control
    const drawInstance = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        line_string: true,
        point: true,
        trash: true
      }
    });
    
    mapInstance.addControl(drawInstance, 'top-left');
    draw.current = drawInstance;
    
    // Set reference to map
    map.current = mapInstance;
    
    // Add event listeners
    mapInstance.on('load', () => {
      console.log('Map loaded');
      setLoaded(true);
      
      // Add draw event listeners
      mapInstance.on('draw.create', () => {
        setLastAction('Feature created');
        updateMeasurements();
      });
      
      mapInstance.on('draw.update', () => {
        setLastAction('Feature updated');
        updateMeasurements();
      });
      
      mapInstance.on('draw.delete', () => {
        setLastAction('Feature deleted');
        setMeasurementResults({});
      });
      
      mapInstance.on('draw.selectionchange', (e: { features?: { length: number }[] }) => {
        if (e.features && e.features.length > 0) {
          updateMeasurements();
        } else {
          setMeasurementResults({});
        }
      });
      
      // Initialize layers
      initializeLayers();
    });
    
    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [center, zoom, mapStyle, toast]);
  
  // Update measurements for selected features
  const updateMeasurements = useCallback(() => {
    if (!draw.current || !map.current) return;
    
    const selectedFeatures = draw.current.getSelected();
    
    if (selectedFeatures.features.length === 0) {
      setMeasurementResults({});
      return;
    }
    
    const feature = selectedFeatures.features[0];
    let measurements: { distance?: string, area?: string } = {};
    
    if (feature.geometry.type === 'LineString') {
      // Calculate distance for lines
      let totalDistance = 0;
      const coords = feature.geometry.coordinates;
      
      for (let i = 0; i < coords.length - 1; i++) {
        const from = {
          lat: coords[i][1],
          lng: coords[i][0]
        };
        
        const to = {
          lat: coords[i + 1][1],
          lng: coords[i + 1][0]
        };
        
        // Calculate distance using Haversine formula
        const R = 6371e3; // Earth radius in meters
        const φ1 = (from.lat * Math.PI) / 180;
        const φ2 = (to.lat * Math.PI) / 180;
        const Δφ = ((to.lat - from.lat) * Math.PI) / 180;
        const Δλ = ((to.lng - from.lng) * Math.PI) / 180;
        
        const a = 
          Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        totalDistance += distance;
      }
      
      // Format distance
      if (totalDistance < 1000) {
        measurements.distance = `${totalDistance.toFixed(1)} m`;
      } else {
        measurements.distance = `${(totalDistance / 1000).toFixed(2)} km`;
      }
    }
    
    if (feature.geometry.type === 'Polygon') {
      // Calculate area for polygons
      const coords = feature.geometry.coordinates[0];
      let area = 0;
      
      // Implementation of Shoelace formula for polygon area
      for (let i = 0; i < coords.length - 1; i++) {
        area += coords[i][0] * coords[i + 1][1];
        area -= coords[i + 1][0] * coords[i][1];
      }
      
      area = Math.abs(area) / 2;
      
      // Convert to square meters (approximate)
      const lat = coords.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / coords.length;
      const metersPerDegree = 111320 * Math.cos((lat * Math.PI) / 180);
      const squareMeters = area * metersPerDegree * metersPerDegree;
      
      // Format area
      if (squareMeters < 10000) {
        measurements.area = `${squareMeters.toFixed(1)} m²`;
      } else if (squareMeters < 1000000) {
        measurements.area = `${(squareMeters / 10000).toFixed(2)} ha`;
      } else {
        measurements.area = `${(squareMeters / 1000000).toFixed(2)} km²`;
      }
    }
    
    setMeasurementResults(measurements);
  }, []);
  
  // Initialize map layers
  const initializeLayers = useCallback(() => {
    if (!map.current || !loaded) return;
    
    // Add parcel layer
    if (!map.current.getSource('parcels')) {
      map.current.addSource('parcels', {
        type: 'vector',
        url: 'mapbox://examples.8tjbnw64'  // This is a placeholder - use your actual source
      });
      
      map.current.addLayer({
        id: 'parcels-fill',
        type: 'fill',
        source: 'parcels',
        'source-layer': 'original',
        paint: {
          'fill-color': 'rgba(0, 100, 150, 0.1)',
          'fill-opacity': 0.6
        },
        layout: {
          visibility: layerVisibility.parcels ? 'visible' : 'none'
        }
      });
      
      map.current.addLayer({
        id: 'parcels-line',
        type: 'line',
        source: 'parcels',
        'source-layer': 'original',
        paint: {
          'line-color': 'rgba(0, 100, 150, 0.8)',
          'line-width': 1
        },
        layout: {
          visibility: layerVisibility.parcels ? 'visible' : 'none'
        }
      });
    }
    
    // Add zoning layer
    if (!map.current.getSource('zoning')) {
      map.current.addSource('zoning', {
        type: 'vector',
        url: 'mapbox://examples.8tjbnw64'  // This is a placeholder - use your actual source
      });
      
      map.current.addLayer({
        id: 'zoning-fill',
        type: 'fill',
        source: 'zoning',
        'source-layer': 'original',
        paint: {
          'fill-color': [
            'match',
            ['get', 'zone_type'],
            'residential', 'rgba(255, 180, 180, 0.5)',
            'commercial', 'rgba(180, 180, 255, 0.5)',
            'industrial', 'rgba(180, 255, 180, 0.5)',
            'agricultural', 'rgba(200, 230, 180, 0.5)',
            'rgba(180, 180, 180, 0.5)'  // default
          ],
          'fill-opacity': 0.6
        },
        layout: {
          visibility: layerVisibility.zoning ? 'visible' : 'none'
        }
      });
    }
    
    // Add road layer
    if (!map.current.getSource('roads')) {
      // Roads are already in the base map, but you could add custom road data here
      // This is just for the visibility toggle to work
      map.current.setLayoutProperty('road-label', 'visibility', layerVisibility.roads ? 'visible' : 'none');
      map.current.setLayoutProperty('road-simple', 'visibility', layerVisibility.roads ? 'visible' : 'none');
    }
    
    // Add water layer
    if (!map.current.getSource('water')) {
      // Water features are already in the base map, but you could add custom water data here
      // This is just for the visibility toggle to work
      map.current.setLayoutProperty('water', 'visibility', layerVisibility.water ? 'visible' : 'none');
      map.current.setLayoutProperty('water-label', 'visibility', layerVisibility.water ? 'visible' : 'none');
    }
  }, [loaded, layerVisibility]);
  
  // Update layer visibility when toggles change
  useEffect(() => {
    if (!map.current || !loaded) return;
    
    // Update parcel layer visibility
    if (map.current.getLayer('parcels-fill')) {
      map.current.setLayoutProperty(
        'parcels-fill', 
        'visibility', 
        layerVisibility.parcels ? 'visible' : 'none'
      );
      
      map.current.setLayoutProperty(
        'parcels-line', 
        'visibility', 
        layerVisibility.parcels ? 'visible' : 'none'
      );
    }
    
    // Update zoning layer visibility
    if (map.current.getLayer('zoning-fill')) {
      map.current.setLayoutProperty(
        'zoning-fill', 
        'visibility', 
        layerVisibility.zoning ? 'visible' : 'none'
      );
    }
    
    // Update road visibility
    map.current.setLayoutProperty(
      'road-label', 
      'visibility', 
      layerVisibility.roads ? 'visible' : 'none'
    );
    
    map.current.setLayoutProperty(
      'road-simple', 
      'visibility', 
      layerVisibility.roads ? 'visible' : 'none'
    );
    
    // Update water visibility
    map.current.setLayoutProperty(
      'water', 
      'visibility', 
      layerVisibility.water ? 'visible' : 'none'
    );
    
    map.current.setLayoutProperty(
      'water-label', 
      'visibility', 
      layerVisibility.water ? 'visible' : 'none'
    );
  }, [loaded, layerVisibility]);
  
  // Handle draw mode changes
  const setDrawMode = (mode: string) => {
    if (!draw.current) return;
    
    draw.current.changeMode(mode);
    setCurrentMode(mode);
    
    // Show user feedback
    toast({
      title: 'Tool Selected',
      description: `${mode.replace('_', ' ')} mode activated`,
    });
  };
  
  // Delete all features
  const deleteAllFeatures = () => {
    if (!draw.current) return;
    
    const allFeatures = draw.current.getAll();
    if (allFeatures.features.length === 0) return;
    
    const featureIds = allFeatures.features.map(f => f.id).filter(id => typeof id === 'string') as string[];
    draw.current.delete(featureIds);
    
    setMeasurementResults({});
    setLastAction('All features deleted');
  };
  
  // Save the current map state
  const saveMap = () => {
    if (!draw.current || !onSave) return;
    
    const data = draw.current.getAll();
    onSave(data);
    
    toast({
      title: 'Map Saved',
      description: `Saved ${data.features.length} features successfully`,
    });
    
    setLastAction('Map saved');
  };
  
  // Export the current map as an image
  const exportImage = () => {
    if (!map.current) return;
    
    const canvas = map.current.getCanvas();
    const dataUrl = canvas.toDataURL('image/png');
    
    // Create a download link
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `benton-county-map-${new Date().toISOString().split('T')[0]}.png`;
    link.click();
    
    toast({
      title: 'Map Exported',
      description: 'Map exported as PNG image',
    });
  };
  
  // Share map link (in a real app, this would generate a shareable link)
  const shareMap = () => {
    const shareUrl = window.location.href;
    
    // In a real implementation, you would:
    // 1. Save the current map state to the server
    // 2. Generate a unique ID for this map
    // 3. Return a shareable link with that ID
    
    // For now, just copy the current URL
    navigator.clipboard.writeText(shareUrl);
    
    toast({
      title: 'Link Copied',
      description: 'Map link copied to clipboard',
    });
  };
  
  // Handle AI query submission
  const handleAIQuery = () => {
    if (!isAIAvailable || !aiQuery) return;
    
    // Get current map state for context
    const mapState = draw.current ? draw.current.getAll() : null;
    const viewState = map.current ? {
      center: map.current.getCenter(),
      zoom: map.current.getZoom(),
      bearing: map.current.getBearing(),
      pitch: map.current.getPitch()
    } : null;
    
    // Create context object
    const context = JSON.stringify({
      mapState,
      viewState,
      layers: layerVisibility,
      lastAction
    });
    
    // Request assistance from the Map Intelligence agent
    requestAgentAssistance('map_intelligence', aiQuery, context);
    
    toast({
      title: 'Processing Query',
      description: 'Asking AI for assistance...',
    });
  };
  
  // Update map style
  const changeMapStyle = (newStyle: string) => {
    setMapStyle(newStyle);
    
    if (map.current) {
      map.current.setStyle(`mapbox://styles/mapbox/${newStyle}`);
      
      // Re-add custom layers after style change
      map.current.once('style.load', () => {
        initializeLayers();
      });
    }
  };
  
  // Toggle layer visibility
  const toggleLayer = (layer: string) => {
    setLayerVisibility(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };
  
  return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* Map container */}
      <div ref={mapContainer} className="absolute inset-0 rounded-md overflow-hidden"></div>
      
      {/* Top toolbar */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
        <Card className="shadow-md bg-background/95 backdrop-blur-sm border-0">
          <CardContent className="p-2 flex space-x-1">
            <Button 
              variant={currentMode === 'simple_select' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setDrawMode('simple_select')}
              title="Select Mode"
            >
              <MapIcon className="h-4 w-4" />
            </Button>
            
            <Button 
              variant={currentMode === 'draw_polygon' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setDrawMode('draw_polygon')}
              title="Draw Polygon"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            
            <Button 
              variant={currentMode === 'draw_line_string' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setDrawMode('draw_line_string')}
              title="Draw Line"
            >
              <Ruler className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-8" />
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={deleteAllFeatures}
              title="Delete All Features"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={saveMap}
              title="Save Map"
              disabled={!onSave}
            >
              <Save className="h-4 w-4" />
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  title="Export Map"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Export Map</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <Button onClick={exportImage} className="w-full">
                    <Image className="h-4 w-4 mr-2" />
                    Export as Image
                  </Button>
                  <Button onClick={shareMap} className="w-full">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Map Link
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
      
      {/* Sidebar panel */}
      <div className="absolute top-2 right-2 bottom-2 w-72 z-10 flex flex-col gap-2">
        {/* Layers panel */}
        <Card className="shadow-md bg-background/95 backdrop-blur-sm border-0 flex-shrink-0">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-base flex items-center">
              <Layers className="h-4 w-4 mr-2" />
              Layers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="parcels" className="cursor-pointer flex items-center gap-2">
                  {layerVisibility.parcels ? (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  Property Parcels
                </Label>
                <Switch 
                  id="parcels" 
                  checked={layerVisibility.parcels} 
                  onChange={() => toggleLayer('parcels')} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="zoning" className="cursor-pointer flex items-center gap-2">
                  {layerVisibility.zoning ? (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  Zoning Districts
                </Label>
                <Switch 
                  id="zoning" 
                  checked={layerVisibility.zoning} 
                  onChange={() => toggleLayer('zoning')} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="roads" className="cursor-pointer flex items-center gap-2">
                  {layerVisibility.roads ? (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  Roads
                </Label>
                <Switch 
                  id="roads" 
                  checked={layerVisibility.roads} 
                  onChange={() => toggleLayer('roads')} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="water" className="cursor-pointer flex items-center gap-2">
                  {layerVisibility.water ? (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  Water Features
                </Label>
                <Switch 
                  id="water" 
                  checked={layerVisibility.water} 
                  onChange={() => toggleLayer('water')} 
                />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="map-style" className="text-xs text-muted-foreground">Map Style</Label>
                <Tabs defaultValue="streets-v11" value={mapStyle} onValueChange={changeMapStyle}>
                  <TabsList className="grid grid-cols-3 h-auto">
                    <TabsTrigger value="streets-v11" className="text-xs py-1 px-2 h-auto">Streets</TabsTrigger>
                    <TabsTrigger value="satellite-v9" className="text-xs py-1 px-2 h-auto">Satellite</TabsTrigger>
                    <TabsTrigger value="light-v10" className="text-xs py-1 px-2 h-auto">Light</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Measurements panel */}
        {(measurementResults.distance || measurementResults.area) && (
          <Card className="shadow-md bg-background/95 backdrop-blur-sm border-0 flex-shrink-0">
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-base flex items-center">
                <Ruler className="h-4 w-4 mr-2" />
                Measurements
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <div className="space-y-2">
                {measurementResults.distance && (
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span className="text-sm text-muted-foreground">Distance:</span>
                    <span className="col-span-2 text-sm font-medium">{measurementResults.distance}</span>
                  </div>
                )}
                
                {measurementResults.area && (
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span className="text-sm text-muted-foreground">Area:</span>
                    <span className="col-span-2 text-sm font-medium">{measurementResults.area}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Action history */}
        {lastAction && (
          <Card className="shadow-md bg-background/95 backdrop-blur-sm border-0 flex-shrink-0">
            <CardContent className="p-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Last action:</span>
                <span className="text-xs font-medium">{lastAction}</span>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* AI Assistant panel */}
        {showAI && (
          <Card className="shadow-md bg-background/95 backdrop-blur-sm border-0 flex-shrink-0 mt-auto">
            <CardHeader className="p-3 pb-0">
              <CardTitle 
                className="text-base flex items-center cursor-pointer"
                onClick={() => setShowAIPanel(!showAIPanel)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Map Intelligence AI
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-5 w-5 ml-auto p-0"
                >
                  {showAIPanel ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            
            {showAIPanel && (
              <CardContent className="p-3">
                <div className="space-y-3">
                  {!isAIAvailable ? (
                    <div className="text-sm text-muted-foreground">
                      AI assistance is not available. Please check your API key configuration.
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Ask about this map..."
                          value={aiQuery}
                          onChange={(e) => setAiQuery(e.target.value)}
                          className="text-sm"
                        />
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={handleAIQuery}
                          disabled={!aiQuery}
                        >
                          Ask
                        </Button>
                      </div>
                      
                      {lastResponse && lastResponse.agentId === 'map_intelligence' && (
                        <div className="bg-muted/50 rounded-md p-2 text-sm">
                          <p className="font-medium text-xs mb-1">AI Assistant:</p>
                          <p className="text-xs">{lastResponse.response}</p>
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        Example queries: "Suggest map elements to add", "Help me improve this map", "What zoning applies here?"
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        )}
      </div>
      
      {/* Help button */}
      <div className="absolute bottom-2 left-2 z-10">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-full bg-background/80">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Map Editor Help</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <h3 className="font-medium">Map Navigation</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Zoom with mouse wheel or pinch gesture</li>
                <li>Pan by clicking and dragging the map</li>
                <li>Double-click to zoom in</li>
              </ul>
              
              <h3 className="font-medium">Drawing Tools</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>Select:</strong> Click to select existing features</li>
                <li><strong>Draw Polygon:</strong> Click to add points, double-click to finish</li>
                <li><strong>Draw Line:</strong> Click to add points, double-click to finish</li>
                <li><strong>Delete All:</strong> Remove all drawn features</li>
              </ul>
              
              <h3 className="font-medium">Layer Controls</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Toggle layers on/off using the switches</li>
                <li>Change the basemap style using the tabs</li>
              </ul>
              
              <h3 className="font-medium">AI Assistant</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Ask for help with map creation</li>
                <li>Request suggestions for map improvements</li>
                <li>Get information about features and layers</li>
              </ul>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Chevron icons for the AI panel
const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

export default MapEditor;