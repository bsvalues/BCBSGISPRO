import { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCollaborativeDrawing, DrawingActionType } from '@/hooks/use-collaborative-drawing';
import { ConnectionStatus } from '@/lib/websocket';
import { Loader2, Users, Pencil, MousePointer, Trash2, Eye, PenTool, CheckCircle, WifiOff, AlertCircle } from 'lucide-react';
import { MapboxProvider } from './mapbox/mapbox-provider';
import { MapboxMap } from './mapbox/mapbox-map';

// Define prop types
interface CollaborativeMapProps {
  roomId?: string;
  height?: string;
  width?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
}

// Colors for different users
const USER_COLORS = [
  '#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33F0',
  '#33FFF0', '#F0FF33', '#FF8C33', '#8C33FF', '#33FF8C'
];

export function CollaborativeMap({
  roomId = 'default',
  height = '600px',
  width = '100%',
  initialCenter = [-123.2615, 44.5639], // Corvallis, OR as default
  initialZoom = 12
}: CollaborativeMapProps) {
  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  
  // View state
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('view');
  const [drawMode, setDrawMode] = useState<'simple_select' | 'draw_polygon' | 'draw_line_string' | 'draw_point'>('simple_select');
  
  // Custom room ID
  const [customRoomId, setCustomRoomId] = useState(roomId);
  const [joinedRoom, setJoinedRoom] = useState(roomId);
  
  // Get toast to show notifications
  const { toast } = useToast();
  
  // Use our collaborative drawing hook
  const {
    connected,
    connectionStatus,
    connectedUsers,
    userId,
    featureOwnership,
    pendingChanges,
    processPendingChange,
    handleFeatureCreate,
    handleFeatureUpdate,
    handleFeatureDelete,
    handleFeatureSelect,
    handleModeChange
  } = useCollaborativeDrawing(joinedRoom);
  
  // Get a user color from their ID (for feature display)
  const getUserColor = useCallback((id: string) => {
    // Simple hashing function to get a consistent index for the same user
    const hash = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return USER_COLORS[hash % USER_COLORS.length];
  }, []);
  
  // Initialize the Mapbox Draw control when the map loads
  const onMapLoad = useCallback((map: mapboxgl.Map) => {
    mapRef.current = map;
    
    // Create the draw control
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        line_string: true,
        point: true,
        trash: true
      },
      // Custom styles to show which user owns which feature
      styles: [
        // Default styles
        {
          id: 'gl-draw-polygon-fill-inactive',
          type: 'fill',
          filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          paint: {
            'fill-color': [
              'case',
              ['==', ['get', 'user'], userId], '#3b82f6', // Current user's features
              ['has', 'user'], ['string', ['get', 'user_color']], // Other users' features
              '#3b82f6' // Default color
            ],
            'fill-outline-color': '#3b82f6',
            'fill-opacity': 0.1
          }
        },
        {
          id: 'gl-draw-polygon-fill-active',
          type: 'fill',
          filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
          paint: {
            'fill-color': '#3b82f6',
            'fill-outline-color': '#3b82f6',
            'fill-opacity': 0.1
          }
        },
        {
          id: 'gl-draw-polygon-stroke-inactive',
          type: 'line',
          filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          layout: {
            'line-cap': 'round',
            'line-join': 'round'
          },
          paint: {
            'line-color': [
              'case',
              ['==', ['get', 'user'], userId], '#3b82f6', // Current user's features
              ['has', 'user'], ['string', ['get', 'user_color']], // Other users' features
              '#3b82f6' // Default color
            ],
            'line-width': 2
          }
        },
        {
          id: 'gl-draw-polygon-stroke-active',
          type: 'line',
          filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
          layout: {
            'line-cap': 'round',
            'line-join': 'round'
          },
          paint: {
            'line-color': '#3b82f6',
            'line-dasharray': [0.2, 2],
            'line-width': 2
          }
        },
        {
          id: 'gl-draw-line-inactive',
          type: 'line',
          filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
          layout: {
            'line-cap': 'round',
            'line-join': 'round'
          },
          paint: {
            'line-color': [
              'case',
              ['==', ['get', 'user'], userId], '#3b82f6', // Current user's features
              ['has', 'user'], ['string', ['get', 'user_color']], // Other users' features
              '#3b82f6' // Default color
            ],
            'line-width': 2
          }
        },
        {
          id: 'gl-draw-line-active',
          type: 'line',
          filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'LineString']],
          layout: {
            'line-cap': 'round',
            'line-join': 'round'
          },
          paint: {
            'line-color': '#3b82f6',
            'line-dasharray': [0.2, 2],
            'line-width': 2
          }
        },
        {
          id: 'gl-draw-point-inactive',
          type: 'circle',
          filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
          paint: {
            'circle-radius': 5,
            'circle-color': [
              'case',
              ['==', ['get', 'user'], userId], '#3b82f6', // Current user's features
              ['has', 'user'], ['string', ['get', 'user_color']], // Other users' features
              '#3b82f6' // Default color
            ]
          }
        },
        {
          id: 'gl-draw-point-active',
          type: 'circle',
          filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Point']],
          paint: {
            'circle-radius': 7,
            'circle-color': '#3b82f6'
          }
        },
        {
          id: 'gl-draw-polygon-and-line-vertex-inactive',
          type: 'circle',
          filter: ['all', ['==', 'meta', 'vertex'], ['==', 'active', 'false']],
          paint: {
            'circle-radius': 3,
            'circle-color': '#fff',
            'circle-stroke-color': '#3b82f6',
            'circle-stroke-width': 2
          }
        },
        {
          id: 'gl-draw-polygon-and-line-vertex-active',
          type: 'circle',
          filter: ['all', ['==', 'meta', 'vertex'], ['==', 'active', 'true']],
          paint: {
            'circle-radius': 4,
            'circle-color': '#fff',
            'circle-stroke-color': '#3b82f6',
            'circle-stroke-width': 2
          }
        },
        {
          id: 'gl-draw-polygon-midpoint',
          type: 'circle',
          filter: ['all', ['==', 'meta', 'midpoint']],
          paint: {
            'circle-radius': 3,
            'circle-color': '#fff',
            'circle-stroke-color': '#3b82f6',
            'circle-stroke-width': 2
          }
        }
      ]
    });
    
    // Add the draw control to the map
    map.addControl(draw, 'top-left');
    drawRef.current = draw;
    
    // Register events
    map.on('draw.create', (e) => {
      // Add user ID to the feature for ownership tracking
      for (const feature of e.features) {
        // Add ownership data to the feature before sending
        const featureWithMetadata = {
          ...feature,
          properties: {
            ...feature.properties,
            user: userId,
            user_color: getUserColor(userId)
          }
        };
        
        // Update the feature in the draw control
        draw.add(featureWithMetadata);
        
        // Send to other collaborators
        handleFeatureCreate(featureWithMetadata);
      }
    });
    
    map.on('draw.update', (e) => {
      for (const feature of e.features) {
        // Preserve ownership data
        const owner = featureOwnership[feature.id] || userId;
        const featureWithMetadata = {
          ...feature,
          properties: {
            ...feature.properties,
            user: owner,
            user_color: getUserColor(owner)
          }
        };
        
        // Send to other collaborators
        handleFeatureUpdate(featureWithMetadata);
      }
    });
    
    map.on('draw.delete', (e) => {
      const featureIds = e.features.map(f => f.id);
      handleFeatureDelete(featureIds);
    });
    
    map.on('draw.selectionchange', (e) => {
      const featureIds = e.features.map(f => f.id);
      handleFeatureSelect(featureIds);
    });
    
    map.on('draw.modechange', (e) => {
      const mode = e.mode;
      setDrawMode(mode as any);
      handleModeChange(mode);
    });
    
    // Initial mode setup
    if (viewMode === 'view') {
      draw.changeMode('simple_select');
    }
  }, [userId, viewMode, featureOwnership, getUserColor, handleFeatureCreate, handleFeatureUpdate, handleFeatureDelete, handleFeatureSelect, handleModeChange]);
  
  // Process pending changes from other users
  useEffect(() => {
    if (!drawRef.current || !connected || pendingChanges.length === 0) return;
    
    // Process one change per tick to avoid overwhelming the system
    const change = processPendingChange();
    if (!change) return;
    
    const draw = drawRef.current;
    
    try {
      switch (change.action) {
        case DrawingActionType.CREATE:
          if (change.featureData) {
            // Add user color for display
            const featureWithColor = {
              ...change.featureData,
              properties: {
                ...change.featureData.properties,
                user_color: getUserColor(change.source)
              }
            };
            draw.add(featureWithColor);
          }
          break;
          
        case DrawingActionType.UPDATE:
          if (change.featureData) {
            // Add user color for display
            const featureWithColor = {
              ...change.featureData,
              properties: {
                ...change.featureData.properties,
                user_color: getUserColor(change.source)
              }
            };
            
            // Get currently selected feature IDs
            const selectedIds = draw.getSelectedIds();
            
            // Update the feature
            draw.add(featureWithColor);
            
            // Restore selection if needed
            if (selectedIds.length > 0) {
              draw.changeMode('simple_select', { featureIds: selectedIds });
            }
          }
          break;
          
        case DrawingActionType.DELETE:
          if (change.featureIds && change.featureIds.length > 0) {
            draw.delete(change.featureIds);
          }
          break;
          
        case DrawingActionType.SELECT:
          if (change.featureIds) {
            draw.changeMode('simple_select', { featureIds: change.featureIds });
          }
          break;
          
        case DrawingActionType.MODE_CHANGE:
          if (change.mode && viewMode === 'edit') {
            draw.changeMode(change.mode);
          }
          break;
      }
    } catch (error) {
      console.error('Error processing collaborative change:', error);
    }
  }, [connected, pendingChanges, processPendingChange, getUserColor, viewMode]);
  
  // Toggle between view and edit modes
  const toggleViewMode = useCallback(() => {
    if (!drawRef.current) return;
    
    const newMode = viewMode === 'view' ? 'edit' : 'view';
    setViewMode(newMode);
    
    if (newMode === 'view') {
      drawRef.current.changeMode('simple_select');
      drawRef.current.deleteAll();
    } else {
      drawRef.current.changeMode('simple_select');
    }
    
    toast({
      title: newMode === 'view' ? 'View Mode' : 'Edit Mode',
      description: newMode === 'view' 
        ? 'You can now view features but not edit them.' 
        : 'You can now create and edit features collaboratively.',
      variant: 'default'
    });
  }, [viewMode, toast]);
  
  // Set the draw mode
  const setMode = useCallback((mode: 'simple_select' | 'draw_polygon' | 'draw_line_string' | 'draw_point') => {
    if (!drawRef.current || viewMode !== 'edit') return;
    
    drawRef.current.changeMode(mode);
    setDrawMode(mode);
    
    // Notify other users about mode change
    handleModeChange(mode);
  }, [viewMode, handleModeChange]);
  
  // Delete all features
  const deleteAll = useCallback(() => {
    if (!drawRef.current || viewMode !== 'edit') return;
    
    const allFeatures = drawRef.current.getAll();
    const featureIds = allFeatures.features.map(f => f.id as string);
    
    drawRef.current.deleteAll();
    
    // Notify other users about the deletion
    if (featureIds.length > 0) {
      handleFeatureDelete(featureIds);
    }
    
    toast({
      title: 'All Features Deleted',
      description: 'All drawing features have been removed.',
      variant: 'default'
    });
  }, [viewMode, handleFeatureDelete, toast]);
  
  // Join a custom room
  const joinCustomRoom = useCallback(() => {
    if (!customRoomId.trim()) {
      toast({
        title: 'Invalid Room ID',
        description: 'Please enter a valid room ID.',
        variant: 'destructive'
      });
      return;
    }
    
    // Clear existing features before joining new room
    if (drawRef.current) {
      drawRef.current.deleteAll();
    }
    
    setJoinedRoom(customRoomId);
    
    toast({
      title: 'Joined Room',
      description: `You've joined the collaborative room: ${customRoomId}`,
      variant: 'default'
    });
  }, [customRoomId, toast]);
  
  // Connection status indicator
  const ConnectionStatusIndicator = () => {
    let Icon;
    let label;
    let color;
    
    switch (connectionStatus) {
      case ConnectionStatus.CONNECTED:
        Icon = CheckCircle;
        label = 'Connected';
        color = 'bg-green-500';
        break;
      case ConnectionStatus.CONNECTING:
      case ConnectionStatus.RECONNECTING:
        Icon = Loader2;
        label = connectionStatus === ConnectionStatus.CONNECTING ? 'Connecting' : 'Reconnecting';
        color = 'bg-yellow-500';
        break;
      case ConnectionStatus.ERROR:
        Icon = AlertCircle;
        label = 'Connection Error';
        color = 'bg-red-500';
        break;
      default:
        Icon = WifiOff;
        label = 'Disconnected';
        color = 'bg-gray-500';
    }
    
    return (
      <Badge className={`${color} gap-1`}>
        <Icon className="h-3 w-3" />
        <span>{label}</span>
      </Badge>
    );
  };
  
  return (
    <Card className="shadow-lg w-full">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Collaborative Map</CardTitle>
            <CardDescription>Draw and collaborate in real-time with others</CardDescription>
          </div>
          <ConnectionStatusIndicator />
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="flex flex-col gap-4">
          {/* Room controls */}
          <div className="px-6 pt-2 flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="room-id">Room ID</Label>
              <Input 
                id="room-id" 
                placeholder="Enter room ID" 
                value={customRoomId}
                onChange={(e) => setCustomRoomId(e.target.value)}
              />
            </div>
            <Button onClick={joinCustomRoom} disabled={!connected}>
              Join Room
            </Button>
            <div className="flex gap-2 items-center">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">{connectedUsers.length} user{connectedUsers.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          
          <MapboxProvider>
            <div style={{ height, width, position: 'relative' }}>
              <MapboxMap
                initialViewState={{
                  longitude: initialCenter[0],
                  latitude: initialCenter[1],
                  zoom: initialZoom
                }}
                onLoad={onMapLoad}
                style={{ width: '100%', height: '100%', borderRadius: '0' }}
                mapStyle="mapbox://styles/mapbox/streets-v12"
                localFontFamily="Inter, sans-serif"
              />
            </div>
          </MapboxProvider>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-6">
        <div className="flex items-center gap-3">
          <Button 
            variant={viewMode === 'edit' ? 'default' : 'outline'} 
            size="sm"
            onClick={toggleViewMode}
            disabled={!connected}
          >
            {viewMode === 'view' ? (
              <>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Mode
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                View Mode
              </>
            )}
          </Button>
          
          {viewMode === 'edit' && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={deleteAll}
              disabled={!connected}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete All
            </Button>
          )}
        </div>
        
        {viewMode === 'edit' && (
          <div className="flex gap-2">
            <Button
              variant={drawMode === 'simple_select' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('simple_select')}
              disabled={!connected}
            >
              <MousePointer className="h-4 w-4" />
            </Button>
            
            <Button
              variant={drawMode === 'draw_point' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('draw_point')}
              disabled={!connected}
            >
              <span className="text-lg">•</span>
            </Button>
            
            <Button
              variant={drawMode === 'draw_line_string' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('draw_line_string')}
              disabled={!connected}
            >
              <PenTool className="h-4 w-4" />
            </Button>
            
            <Button
              variant={drawMode === 'draw_polygon' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('draw_polygon')}
              disabled={!connected}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.5 2C3.22386 2 3 2.22386 3 2.5C3 2.77614 3.22386 3 3.5 3C3.77614 3 4 2.77614 4 2.5C4 2.22386 3.77614 2 3.5 2ZM3.5 5C3.22386 5 3 5.22386 3 5.5C3 5.77614 3.22386 6 3.5 6C3.77614 6 4 5.77614 4 5.5C4 5.22386 3.77614 5 3.5 5ZM3 8.5C3 8.22386 3.22386 8 3.5 8C3.77614 8 4 8.22386 4 8.5C4 8.77614 3.77614 9 3.5 9C3.22386 9 3 8.77614 3 8.5ZM3.5 11C3.22386 11 3 11.2239 3 11.5C3 11.7761 3.22386 12 3.5 12C3.77614 12 4 11.7761 4 11.5C4 11.2239 3.77614 11 3.5 11ZM6.5 2C6.22386 2 6 2.22386 6 2.5C6 2.77614 6.22386 3 6.5 3C6.77614 3 7 2.77614 7 2.5C7 2.22386 6.77614 2 6.5 2ZM6 11.5C6 11.2239 6.22386 11 6.5 11C6.77614 11 7 11.2239 7 11.5C7 11.7761 6.77614 12 6.5 12C6.22386 12 6 11.7761 6 11.5ZM9.5 2C9.22386 2 9 2.22386 9 2.5C9 2.77614 9.22386 3 9.5 3C9.77614 3 10 2.77614 10 2.5C10 2.22386 9.77614 2 9.5 2ZM9 11.5C9 11.2239 9.22386 11 9.5 11C9.77614 11 10 11.2239 10 11.5C10 11.7761 9.77614 12 9.5 12C9.22386 12 9 11.7761 9 11.5ZM12.5 2C12.2239 2 12 2.22386 12 2.5C12 2.77614 12.2239 3 12.5 3C12.7761 3 13 2.77614 13 2.5C13 2.22386 12.7761 2 12.5 2ZM12 5.5C12 5.22386 12.2239 5 12.5 5C12.7761 5 13 5.22386 13 5.5C13 5.77614 12.7761 6 12.5 6C12.2239 6 12 5.77614 12 5.5ZM12.5 8C12.2239 8 12 8.22386 12 8.5C12 8.77614 12.2239 9 12.5 9C12.7761 9 13 8.77614 13 8.5C13 8.22386 12.7761 8 12.5 8ZM12 11.5C12 11.2239 12.2239 11 12.5 11C12.7761 11 13 11.2239 13 11.5C13 11.7761 12.7761 12 12.5 12C12.2239 12 12 11.7761 12 11.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
              </svg>
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}