import React, { useState, useEffect, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  MousePointer,
  Pencil,
  Circle,
  Square,
  SplitSquareHorizontal,
  Save,
  Trash2,
  Hand,
  Copy,
  Undo2,
  Move
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useWebSocket, MessageType, ConnectionStatus } from '@/lib/websocket';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import * as turf from '@turf/turf';
import { CollaborativeCursor } from './collaborative-cursor';

// Drawing modes
export enum DrawMode {
  NONE = 'none',
  PAN = 'pan',
  POINT = 'point',
  LINE = 'line',
  POLYGON = 'polygon',
  RECTANGLE = 'rectangle',
  CIRCLE = 'circle',
  FREEHAND = 'freehand'
}

// Feature type for collaborative features
export interface CollaborativeFeature {
  id: string;
  type: 'Feature';
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon';
    coordinates: number[] | number[][] | number[][][] | number[][][][];
  };
  properties: {
    id?: string;
    creator: string;
    createdAt: string;
    featureType: string;
    color: string;
    label?: string;
    description?: string;
  };
}

// Props for the collaborative map component
export interface CollaborativeMapProps {
  map: mapboxgl.Map;
  roomId: string;
  onConnectionStatusChange?: (status: ConnectionStatus) => void;
  onCollaboratorsChange?: (users: string[]) => void;
  onFeaturesUpdate?: (features: CollaborativeFeature[]) => void;
  onAnnotationsUpdate?: (annotations: any[]) => void;
  onUserActivity?: (userId: string, activityType: "drawing" | "editing" | "viewing" | "idle", data?: any) => void;
}

// Main component
export function CollaborativeMap({ 
  map, 
  roomId,
  onConnectionStatusChange,
  onCollaboratorsChange,
  onFeaturesUpdate,
  onAnnotationsUpdate,
  onUserActivity
}: CollaborativeMapProps) {
  // Drawing state
  const [drawMode, setDrawMode] = useState<DrawMode>(DrawMode.NONE);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<[number, number][]>([]);
  const [currentFeature, setCurrentFeature] = useState<CollaborativeFeature | null>(null);
  const [drawnFeatures, setDrawnFeatures] = useState<CollaborativeFeature[]>([]);
  
  // Selection state
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  
  // WebSocket connection
  const { send, lastMessage, userId, status, collaborators } = useWebSocket(roomId);
  
  // Pass connection status to parent component
  useEffect(() => {
    if (onConnectionStatusChange) {
      onConnectionStatusChange(status);
    }
  }, [status, onConnectionStatusChange]);
  
  // Pass collaborators to parent component
  useEffect(() => {
    if (onCollaboratorsChange) {
      onCollaboratorsChange(collaborators);
    }
  }, [collaborators, onCollaboratorsChange]);
  
  // Feature source and layer names
  const sourceName = 'collaborative-features';
  const layerName = 'collaborative-features-layer';
  const selectedLayerName = 'collaborative-features-selected-layer';
  
  // Random color generator for features
  const getRandomColor = () => {
    const colors = [
      '#FF4136', // Red
      '#0074D9', // Blue
      '#2ECC40', // Green
      '#FFDC00', // Yellow
      '#B10DC9', // Purple
      '#FF851B', // Orange
      '#7FDBFF', // Light Blue
      '#01FF70', // Light Green
      '#F012BE', // Magenta
      '#39CCCC'  // Teal
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  // Convert current points to a feature
  const pointsToFeature = useCallback((points: [number, number][], type: string): CollaborativeFeature => {
    const color = getRandomColor();
    let geometry: {
      type: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon';
      coordinates: number[] | number[][] | number[][][] | number[][][][];
    };
    
    switch (type) {
      case 'point':
        geometry = {
          type: 'Point',
          coordinates: points[0]
        };
        break;
      case 'line':
        geometry = {
          type: 'LineString',
          coordinates: points
        };
        break;
      case 'polygon':
      case 'rectangle':
        // Close the polygon by adding the first point at the end
        const closedPoints = [...points];
        if (points.length > 0 && (points[0][0] !== points[points.length - 1][0] || 
                                  points[0][1] !== points[points.length - 1][1])) {
          closedPoints.push(points[0]);
        }
        
        geometry = {
          type: 'Polygon',
          coordinates: [closedPoints]
        };
        break;
      case 'circle':
        // For circles, we store the center and use turf to create a circle
        const center = points[0];
        const radius = points.length > 1 
          ? turf.distance(turf.point(center), turf.point(points[1]), { units: 'kilometers' })
          : 0.1; // Default small radius
        
        const circleFeature = turf.circle(center, radius, {
          steps: 64,
          units: 'kilometers'
        });
        
        // Cast the turf geometry to our expected type
        geometry = {
          type: 'Polygon',
          coordinates: circleFeature.geometry.coordinates
        };
        break;
      default:
        geometry = {
          type: 'Point',
          coordinates: points[0]
        };
    }
    
    return {
      id: uuidv4(),
      type: 'Feature',
      geometry,
      properties: {
        creator: userId,
        createdAt: new Date().toISOString(),
        featureType: type,
        color
      }
    };
  }, [userId]);
  
  // Initialize map layers
  useEffect(() => {
    if (!map) return;
    
    // Add source and layers if they don't exist
    if (!map.getSource(sourceName)) {
      map.addSource(sourceName, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });
      
      // Add layer for features
      map.addLayer({
        id: layerName,
        type: 'fill',
        source: sourceName,
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.5,
          'fill-outline-color': ['get', 'color']
        },
        filter: ['==', '$type', 'Polygon']
      });
      
      // Add line layer
      map.addLayer({
        id: `${layerName}-line`,
        type: 'line',
        source: sourceName,
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2
        },
        filter: ['==', '$type', 'LineString']
      });
      
      // Add point layer
      map.addLayer({
        id: `${layerName}-point`,
        type: 'circle',
        source: sourceName,
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': 6,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        },
        filter: ['==', '$type', 'Point']
      });
      
      // Add polygon outline layer
      map.addLayer({
        id: `${layerName}-outline`,
        type: 'line',
        source: sourceName,
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2
        },
        filter: ['==', '$type', 'Polygon']
      });
      
      // Add selected feature layer
      map.addLayer({
        id: selectedLayerName,
        type: 'line',
        source: sourceName,
        paint: {
          'line-color': '#ffffff',
          'line-width': 3,
          'line-dasharray': [2, 2]
        },
        filter: ['==', 'id', '']
      });
    }
    
    // Set up click event for selecting features
    map.on('click', (e) => {
      if (drawMode !== DrawMode.NONE && drawMode !== DrawMode.PAN) return;
      
      // Query rendered features at the click location
      const features = map.queryRenderedFeatures(e.point, {
        layers: [layerName, `${layerName}-line`, `${layerName}-point`, `${layerName}-outline`]
      });
      
      if (features.length > 0) {
        const feature = features[0];
        const featureId = feature.properties?.id;
        
        if (featureId) {
          // Toggle selection
          setSelectedFeatureId(selectedFeatureId === featureId ? null : featureId);
          
          // Update selected feature filter
          map.setFilter(selectedLayerName, selectedFeatureId === featureId
            ? ['==', 'id', ''] // Deselect
            : ['==', 'id', featureId] // Select
          );
        }
      } else {
        // Clear selection when clicking empty space
        setSelectedFeatureId(null);
        map.setFilter(selectedLayerName, ['==', 'id', '']);
      }
    });
    
    // Set up mouse events for drawing
    map.on('mousedown', onMouseDown);
    map.on('mousemove', onMouseMove);
    map.on('mouseup', onMouseUp);
    
    // Cleanup event listeners on unmount
    return () => {
      map.off('mousedown', onMouseDown);
      map.off('mousemove', onMouseMove);
      map.off('mouseup', onMouseUp);
      
      // Get the click handler we set up earlier to remove it specifically
      const mapClickHandler = (e: mapboxgl.MapMouseEvent) => {
        if (drawMode !== DrawMode.NONE && drawMode !== DrawMode.PAN) return;
        
        // Query rendered features at the click location
        const features = map.queryRenderedFeatures(e.point, {
          layers: [layerName, `${layerName}-line`, `${layerName}-point`, `${layerName}-outline`]
        });
        
        if (features.length > 0) {
          // Handle feature selection (already defined above)
        } else {
          // Clear selection (already defined above)
        }
      };
      
      // Remove the click handler
      map.off('click', mapClickHandler);
    };
  }, [map, drawMode, selectedFeatureId]);
  
  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage || !map) return;
    
    try {
      if (lastMessage.type === MessageType.DRAWING) {
        const feature = lastMessage.data;
        
        // Add the received feature to our state if it doesn't already exist
        setDrawnFeatures(prev => {
          if (prev.some(f => f.id === feature.id)) {
            return prev;
          }
          return [...prev, feature];
        });
      } else if (lastMessage.type === MessageType.DRAWING_UPDATE) {
        // Handle feature updates/deletes
        const { action, featureId } = lastMessage.data;
        
        if (action === 'delete' && featureId) {
          setDrawnFeatures(prev => prev.filter(f => f.id !== featureId));
          
          if (selectedFeatureId === featureId) {
            setSelectedFeatureId(null);
            map.setFilter(selectedLayerName, ['==', 'id', '']);
          }
        }
      }
    } catch (err) {
      console.error('Error processing drawing message:', err);
    }
  }, [lastMessage, map, selectedFeatureId]);
  
  // Update the map source data when features change
  useEffect(() => {
    if (!map || !map.getSource(sourceName)) return;
    
    const source = map.getSource(sourceName) as mapboxgl.GeoJSONSource;
    
    source.setData({
      type: 'FeatureCollection',
      features: drawnFeatures as any
    });
    
    // Pass features to parent component
    if (onFeaturesUpdate) {
      onFeaturesUpdate(drawnFeatures);
    }
  }, [map, drawnFeatures, onFeaturesUpdate]);
  
  // Pass user activity updates to parent
  useEffect(() => {
    if (!onUserActivity || !map) return;
    
    // Report initial viewing activity
    onUserActivity(userId, "viewing");
    
    // Report drawing activity when drawing mode changes
    if (drawMode !== DrawMode.NONE && drawMode !== DrawMode.PAN) {
      onUserActivity(userId, "drawing", { mode: drawMode });
    }
    
    // Report when editing (selecting features)
    if (selectedFeatureId) {
      onUserActivity(userId, "editing", { featureId: selectedFeatureId });
    }
    
    const reportMouseMove = (e: mapboxgl.MapMouseEvent) => {
      // Only send occasional updates to avoid flooding
      onUserActivity(userId, "viewing", { 
        position: [e.lngLat.lng, e.lngLat.lat]
      });
    };
    
    // Throttled mouse move handler
    let lastReportTime = 0;
    const REPORT_INTERVAL = 1000; // Once per second at most
    
    const throttledReportMouseMove = (e: mapboxgl.MapMouseEvent) => {
      const now = Date.now();
      if (now - lastReportTime > REPORT_INTERVAL) {
        reportMouseMove(e);
        lastReportTime = now;
      }
    };
    
    // Add mouse move listener
    map.on('mousemove', throttledReportMouseMove);
    
    return () => {
      map.off('mousemove', throttledReportMouseMove);
    };
  }, [map, onUserActivity, userId, drawMode, selectedFeatureId]);
  
  // Mouse event handlers for drawing
  const onMouseDown = useCallback((e: mapboxgl.MapMouseEvent) => {
    if (drawMode === DrawMode.NONE || drawMode === DrawMode.PAN) return;
    
    // Start drawing
    setIsDrawing(true);
    
    // Get mouse coordinates
    const point: [number, number] = [e.lngLat.lng, e.lngLat.lat];
    
    // For POINT mode, create and complete the feature immediately
    if (drawMode === DrawMode.POINT) {
      const feature = pointsToFeature([point], 'point');
      setCurrentFeature(feature);
      setDrawnFeatures(prev => [...prev, feature]);
      
      // Send via WebSocket
      send({
        type: MessageType.DRAWING,
        roomId,
        source: userId,
        data: feature
      });
      
      // Reset drawing state
      setIsDrawing(false);
      setCurrentPoints([]);
      setCurrentFeature(null);
      
      // Show success toast
      toast({
        title: "Point created",
        description: "Point has been created and shared with collaborators",
        variant: "default"
      });
      
      return;
    }
    
    // For other modes, start collecting points
    setCurrentPoints([point]);
    
    // For rectangles, we need to track start point
    if (drawMode === DrawMode.RECTANGLE) {
      map.getCanvas().style.cursor = 'crosshair';
    }
  }, [drawMode, map, pointsToFeature, roomId, send, userId]);
  
  const onMouseMove = useCallback((e: mapboxgl.MapMouseEvent) => {
    if (!isDrawing || drawMode === DrawMode.NONE || drawMode === DrawMode.PAN) return;
    
    const point: [number, number] = [e.lngLat.lng, e.lngLat.lat];
    
    // Different behavior based on draw mode
    switch (drawMode) {
      case DrawMode.LINE:
      case DrawMode.POLYGON:
      case DrawMode.FREEHAND:
        // Add point to current points
        setCurrentPoints(prev => [...prev, point]);
        break;
      
      case DrawMode.RECTANGLE:
        // For rectangle, we use the first point and current point to create a rectangle
        if (currentPoints.length > 0) {
          const startPoint = currentPoints[0];
          const points: [number, number][] = [
            startPoint,
            [point[0], startPoint[1]],
            point,
            [startPoint[0], point[1]],
            startPoint // Close the polygon
          ];
          setCurrentPoints(points);
        }
        break;
      
      case DrawMode.CIRCLE:
        // For circle, we use the first point as center and distance to current point as radius
        if (currentPoints.length > 0) {
          setCurrentPoints([currentPoints[0], point]);
        }
        break;
    }
    
    // Preview the feature being drawn
    if (currentPoints.length > 0) {
      let featureType = '';
      
      switch (drawMode) {
        case DrawMode.LINE:
          featureType = 'line';
          break;
        case DrawMode.POLYGON:
        case DrawMode.RECTANGLE:
          featureType = 'polygon';
          break;
        case DrawMode.CIRCLE:
          featureType = 'circle';
          break;
        case DrawMode.FREEHAND:
          featureType = 'line';
          break;
        default:
          featureType = 'point';
      }
      
      // Create a preview feature
      const feature = pointsToFeature(currentPoints, featureType);
      setCurrentFeature(feature);
      
      // Update the map source with preview feature
      if (map && map.getSource(sourceName)) {
        const source = map.getSource(sourceName) as mapboxgl.GeoJSONSource;
        source.setData({
          type: 'FeatureCollection',
          features: [...drawnFeatures, feature] as any
        });
      }
    }
  }, [isDrawing, drawMode, currentPoints, map, drawnFeatures, pointsToFeature]);
  
  const onMouseUp = useCallback(() => {
    if (!isDrawing || drawMode === DrawMode.NONE || drawMode === DrawMode.PAN) return;
    
    // Complete the drawing
    if (currentFeature && currentPoints.length > 0) {
      // Minimum points check
      let isValid = true;
      
      switch (drawMode) {
        case DrawMode.LINE:
          isValid = currentPoints.length >= 2;
          break;
        case DrawMode.POLYGON:
          isValid = currentPoints.length >= 3;
          break;
        case DrawMode.RECTANGLE:
        case DrawMode.CIRCLE:
          isValid = currentPoints.length >= 2;
          break;
      }
      
      if (isValid) {
        setDrawnFeatures(prev => [...prev, currentFeature]);
        
        // Send via WebSocket
        send({
          type: MessageType.DRAWING,
          roomId,
          source: userId,
          data: currentFeature
        });
        
        // Show success toast
        const featureType = drawMode.toLowerCase();
        toast({
          title: `${featureType.charAt(0).toUpperCase() + featureType.slice(1)} created`,
          description: `${featureType} has been created and shared with collaborators`,
          variant: "default"
        });
      }
    }
    
    // Reset drawing state
    setIsDrawing(false);
    setCurrentPoints([]);
    setCurrentFeature(null);
    
    if (map) {
      map.getCanvas().style.cursor = '';
    }
  }, [isDrawing, drawMode, currentFeature, currentPoints, map, roomId, send, userId]);
  
  // Set draw mode
  const setDrawingMode = (mode: DrawMode) => {
    setDrawMode(mode);
    setSelectedFeatureId(null);
    
    if (map) {
      // Update cursor
      map.getCanvas().style.cursor = mode === DrawMode.PAN ? 'grab' : '';
      
      // Clear selection
      map.setFilter(selectedLayerName, ['==', 'id', '']);
    }
  };
  
  // Delete selected feature
  const deleteSelectedFeature = () => {
    if (!selectedFeatureId) return;
    
    // Remove feature from local state
    setDrawnFeatures(prev => prev.filter(f => f.id !== selectedFeatureId));
    
    // Send delete message via WebSocket
    send({
      type: MessageType.DRAWING_UPDATE,
      roomId,
      source: userId,
      data: {
        action: 'delete',
        featureId: selectedFeatureId
      }
    });
    
    // Clear selection
    setSelectedFeatureId(null);
    
    if (map) {
      map.setFilter(selectedLayerName, ['==', 'id', '']);
    }
    
    // Show success toast
    toast({
      title: "Feature deleted",
      description: "Feature has been deleted and removed for all collaborators",
      variant: "default"
    });
  };
  
  // Add collaborative cursor component 
  // This is a non-visual component that renders cursors of other users
  const CursorComponent = map ? (
    <CollaborativeCursor 
      map={map} 
      roomId={roomId} 
      userId={userId}
      enabled={true}
    />
  ) : null;
  
  return (
    <React.Fragment>
      {/* Render cursor component outside the card */}
      {CursorComponent}
      
      <Card className="w-auto">
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium">Drawing Tools</CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <div className="flex flex-wrap gap-2">
            <TooltipProvider>
            {/* Navigation modes */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={drawMode === DrawMode.PAN ? "default" : "outline"} 
                  size="icon"
                  onClick={() => setDrawingMode(DrawMode.PAN)}
                >
                  <Hand className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Pan Mode</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={drawMode === DrawMode.NONE ? "default" : "outline"} 
                  size="icon"
                  onClick={() => setDrawingMode(DrawMode.NONE)}
                >
                  <MousePointer className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Select Mode</p>
              </TooltipContent>
            </Tooltip>
            
            <Separator orientation="vertical" className="h-8" />
            
            {/* Drawing modes */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={drawMode === DrawMode.POINT ? "default" : "outline"} 
                  size="icon"
                  onClick={() => setDrawingMode(DrawMode.POINT)}
                >
                  <Circle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Draw Point</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={drawMode === DrawMode.LINE ? "default" : "outline"} 
                  size="icon"
                  onClick={() => setDrawingMode(DrawMode.LINE)}
                >
                  <SplitSquareHorizontal className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Draw Line</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={drawMode === DrawMode.POLYGON ? "default" : "outline"} 
                  size="icon"
                  onClick={() => setDrawingMode(DrawMode.POLYGON)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Draw Polygon</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={drawMode === DrawMode.RECTANGLE ? "default" : "outline"} 
                  size="icon"
                  onClick={() => setDrawingMode(DrawMode.RECTANGLE)}
                >
                  <Square className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Draw Rectangle</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={drawMode === DrawMode.CIRCLE ? "default" : "outline"} 
                  size="icon"
                  onClick={() => setDrawingMode(DrawMode.CIRCLE)}
                >
                  <Circle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Draw Circle</p>
              </TooltipContent>
            </Tooltip>
            
            <Separator orientation="vertical" className="h-8" />
            
            {/* Feature operations */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button 
                    variant="outline" 
                    size="icon"
                    disabled={!selectedFeatureId}
                    onClick={deleteSelectedFeature}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete Selected Feature</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
      <CardFooter className="py-2 px-6 justify-between">
        <Badge variant="outline" className="text-xs">
          Features: {drawnFeatures.length}
        </Badge>
        <Badge 
          variant="outline" 
          className={`text-xs ${
            drawMode !== DrawMode.NONE 
              ? 'bg-primary text-primary-foreground' 
              : ''
          }`}
        >
          Mode: {drawMode.charAt(0).toUpperCase() + drawMode.slice(1)}
        </Badge>
      </CardFooter>
    </Card>
    </React.Fragment>
  );
}