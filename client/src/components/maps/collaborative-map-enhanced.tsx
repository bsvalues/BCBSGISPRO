import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Users, Layers, Edit3, Ruler, Hand, PenTool, MousePointer } from 'lucide-react';
import { ConnectionStatusEnum, MessageTypeEnum } from '@/lib/websocket';
import mapboxgl from 'mapbox-gl';

// Types for collaborative features
export interface CollaborativeFeature {
  id: string;
  geometry: any;
  properties: any;
  type: string;
  userId?: string;
  timestamp?: string;
}

// Enhanced CollaborativeMap props that accepts a map instance
interface CollaborativeMapProps {
  map: mapboxgl.Map;
  roomId: string;
  onConnectionStatusChange?: (status: ConnectionStatusEnum) => void;
  onCollaboratorsChange?: (users: string[]) => void;
  onFeaturesUpdate?: (features: CollaborativeFeature[]) => void;
  onAnnotationsUpdate?: (annotations: any[]) => void;
  onUserActivity?: (userId: string, activityType: "drawing" | "editing" | "viewing" | "idle", data?: any) => void;
}

export function CollaborativeMap({
  map,
  roomId,
  onConnectionStatusChange,
  onCollaboratorsChange,
  onFeaturesUpdate,
  onAnnotationsUpdate,
  onUserActivity
}: CollaborativeMapProps) {
  const [activeMode, setActiveMode] = useState<string>('view');
  const [showingUsers, setShowingUsers] = useState<boolean>(false);
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [features, setFeatures] = useState<CollaborativeFeature[]>([]);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatusEnum>(ConnectionStatusEnum.DISCONNECTED);

  // Set up WebSocket connection for collaboration
  useEffect(() => {
    // Set up WebSocket connection
    console.log(`Setting up WebSocket connection for room: ${roomId}`);
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    
    // Update connection status
    setConnectionStatus(ConnectionStatusEnum.CONNECTING);
    if (onConnectionStatusChange) {
      onConnectionStatusChange(ConnectionStatusEnum.CONNECTING);
    }
    
    // Connection opened
    ws.addEventListener('open', (event) => {
      console.log('WebSocket connection established');
      setConnectionStatus(ConnectionStatusEnum.CONNECTED);
      if (onConnectionStatusChange) {
        onConnectionStatusChange(ConnectionStatusEnum.CONNECTED);
      }
      
      // Join the specified room
      const joinMessage = {
        type: MessageTypeEnum.JOIN_ROOM,
        roomId: roomId,
        userId: `user-${Math.floor(Math.random() * 10000)}`,
        username: `User ${Math.floor(Math.random() * 100)}`
      };
      ws.send(JSON.stringify(joinMessage));
    });
    
    // Connection closed
    ws.addEventListener('close', (event) => {
      console.log('WebSocket connection closed');
      setConnectionStatus(ConnectionStatusEnum.DISCONNECTED);
      if (onConnectionStatusChange) {
        onConnectionStatusChange(ConnectionStatusEnum.DISCONNECTED);
      }
    });
    
    // Connection error
    ws.addEventListener('error', (event) => {
      console.error('WebSocket error:', event);
      setConnectionStatus(ConnectionStatusEnum.DISCONNECTED);
      if (onConnectionStatusChange) {
        onConnectionStatusChange(ConnectionStatusEnum.DISCONNECTED);
      }
    });
    
    // Listen for messages
    ws.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received message:', message);
        
        switch (message.type) {
          // Handle room users update
          case 'room_users':
            if (message.payload && Array.isArray(message.payload.users)) {
              const users = message.payload.users;
              setCollaborators(users);
              if (onCollaboratorsChange) {
                onCollaboratorsChange(users);
              }
            }
            break;
            
          // Handle feature updates
          case MessageTypeEnum.FEATURE_CREATED:
          case MessageTypeEnum.FEATURE_UPDATED:
          case MessageTypeEnum.FEATURE_DELETED:
            if (message.payload && message.payload.features) {
              setFeatures(message.payload.features);
              if (onFeaturesUpdate) {
                onFeaturesUpdate(message.payload.features);
              }
            }
            break;
            
          // Handle annotation updates
          case MessageTypeEnum.ANNOTATION_CREATED:
          case MessageTypeEnum.ANNOTATION_UPDATED:
          case MessageTypeEnum.ANNOTATION_DELETED:
            if (message.payload && message.payload.annotations) {
              setAnnotations(message.payload.annotations);
              if (onAnnotationsUpdate) {
                onAnnotationsUpdate(message.payload.annotations);
              }
            }
            break;
            
          // Handle user activity
          case MessageTypeEnum.USER_ACTIVITY:
            if (message.userId && message.payload && message.payload.activityType) {
              if (onUserActivity) {
                onUserActivity(
                  message.userId,
                  message.payload.activityType,
                  message.payload.data
                );
              }
            }
            break;
            
          default:
            break;
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    });
    
    // Clean up on unmount
    return () => {
      console.log('Cleaning up WebSocket connection');
      
      // Send leave room message before closing
      if (ws.readyState === WebSocket.OPEN) {
        const leaveMessage = {
          type: MessageTypeEnum.LEAVE_ROOM,
          roomId: roomId
        };
        ws.send(JSON.stringify(leaveMessage));
        ws.close();
      }
    };
  }, [roomId, onConnectionStatusChange, onCollaboratorsChange, onFeaturesUpdate, onAnnotationsUpdate, onUserActivity]);
  
  // Change active mode
  const handleModeChange = (mode: string) => {
    setActiveMode(mode);
    
    // Change cursor based on mode
    if (map) {
      switch (mode) {
        case 'measure':
          map.getCanvas().style.cursor = 'crosshair';
          break;
        case 'draw':
          map.getCanvas().style.cursor = 'crosshair';
          break;
        case 'annotate':
          map.getCanvas().style.cursor = 'text';
          break;
        case 'select':
          map.getCanvas().style.cursor = 'pointer';
          break;
        case 'pan':
        default:
          map.getCanvas().style.cursor = 'grab';
          break;
      }
    }
    
    // Notify about activity change
    if (onUserActivity) {
      onUserActivity('local-user', mode as any);
    }
  };
  
  // Toggle user list visibility
  const toggleUsers = () => {
    setShowingUsers(!showingUsers);
  };
  
  return (
    <div className="relative w-full h-full">
      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <Card className="shadow-md">
          <CardContent className="p-2">
            <div className="flex flex-col gap-2">
              <Button
                variant={activeMode === 'view' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleModeChange('view')}
                title="Pan & Zoom"
              >
                <Hand className="h-4 w-4" />
              </Button>
              <Button
                variant={activeMode === 'select' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleModeChange('select')}
                title="Select Features"
              >
                <MousePointer className="h-4 w-4" />
              </Button>
              <Button
                variant={activeMode === 'draw' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleModeChange('draw')}
                title="Draw Features"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                variant={activeMode === 'measure' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleModeChange('measure')}
                title="Measure Distance"
              >
                <Ruler className="h-4 w-4" />
              </Button>
              <Button
                variant={activeMode === 'annotate' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleModeChange('annotate')}
                title="Add Annotation"
              >
                <PenTool className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Layer Controls */}
      <div className="absolute top-4 right-4 z-10">
        <Card className="shadow-md">
          <CardContent className="p-2">
            <Button
              variant="outline"
              size="sm"
              title="Layer Controls"
            >
              <Layers className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Collaborator Controls */}
      <div className="absolute bottom-4 left-4 z-10">
        <Card className="shadow-md">
          <CardContent className="p-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleUsers}
                className="relative"
                title="Collaborators"
              >
                <Users className="h-4 w-4" />
                {collaborators.length > 0 && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
                    variant="default"
                  >
                    {collaborators.length}
                  </Badge>
                )}
              </Button>
              
              {showingUsers && (
                <div className="bg-background border rounded-md p-2 shadow-md ml-2">
                  <h4 className="text-xs font-medium mb-1">Collaborators</h4>
                  {collaborators.length > 0 ? (
                    <ul className="space-y-1">
                      {collaborators.map((user, index) => (
                        <li key={index} className="flex items-center gap-1 text-xs">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          {user}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">No other users</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}