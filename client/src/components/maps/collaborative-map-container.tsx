import { useState, useCallback, useEffect } from 'react';
import { CollaborativeMap, CollaborativeFeature } from './collaborative-map';
import { MapboxMap } from './mapbox/mapbox-map';
import mapboxgl from 'mapbox-gl';
import { ConnectionStatus } from '@/lib/websocket';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, Loader2, WifiOff } from 'lucide-react';
import { CollaborativeSessionManager, SessionData } from './collaborative-session-manager';
import { CollaborativeUserIndicator, UserActivity } from './collaborative-user-indicator';

interface CollaborativeMapContainerProps {
  roomId: string;
  height?: string | number;
}

export function CollaborativeMapContainer({ roomId, height = '500px' }: CollaborativeMapContainerProps) {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [features, setFeatures] = useState<CollaborativeFeature[]>([]);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);

  // Handle map creation
  const handleMapCreated = useCallback((mapInstance: mapboxgl.Map) => {
    setMap(mapInstance);
  }, []);

  // Handle connection status change
  const handleConnectionStatusChange = useCallback((status: ConnectionStatus) => {
    setConnectionStatus(status);
    
    // Show toast notification for connection changes
    if (status === ConnectionStatus.CONNECTED) {
      toast({
        title: "Connected to collaboration server",
        description: "You can now draw and collaborate with others",
        variant: "default",
      });
    } else if (status === ConnectionStatus.DISCONNECTED || status === ConnectionStatus.ERROR) {
      toast({
        title: "Disconnected from collaboration server",
        description: "Attempting to reconnect automatically",
        variant: "destructive",
      });
    }
  }, []);

  // Handle collaborators update
  const handleCollaboratorsChange = useCallback((users: string[]) => {
    setCollaborators(users);
    
    // Show toast for new collaborators
    if (users.length > 0) {
      toast({
        title: "Collaborators present",
        description: `${users.length} people are currently collaborating`,
        variant: "default",
      });
    }
  }, []);
  
  // Handle features update
  const handleFeaturesUpdate = useCallback((updatedFeatures: CollaborativeFeature[]) => {
    setFeatures(updatedFeatures);
  }, []);
  
  // Handle annotations update
  const handleAnnotationsUpdate = useCallback((updatedAnnotations: any[]) => {
    setAnnotations(updatedAnnotations);
  }, []);
  
  // Handle user activity update
  const handleUserActivityUpdate = useCallback((userId: string, activityType: "drawing" | "editing" | "viewing" | "idle", data?: any) => {
    const timestamp = new Date();
    const randomColor = `#${Math.floor(Math.random()*16777215).toString(16)}`;
    
    setUserActivities(prev => {
      // Find existing activity for this user
      const existingIndex = prev.findIndex(a => a.userId === userId);
      
      if (existingIndex >= 0) {
        // Update existing activity
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          activityType,
          lastActivity: timestamp,
          data
        };
        return updated;
      } else {
        // Add new activity
        return [...prev, {
          userId,
          activityType,
          lastActivity: timestamp,
          color: randomColor,
          data
        }];
      }
    });
  }, []);
  
  // Clean up stale user activities (older than 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setUserActivities(prev => 
        prev.filter(activity => 
          now.getTime() - activity.lastActivity.getTime() < 10000
        )
      );
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Initial map location (Benton County, Oregon)
  const initialCenter: [number, number] = [-123.3617, 44.5646];
  const initialZoom = 10;

  const containerStyle = {
    height: typeof height === 'number' ? `${height}px` : height,
    width: '100%',
    position: 'relative' as const,
  };

  // Get connection status icon
  const getStatusIcon = () => {
    switch (connectionStatus) {
      case ConnectionStatus.CONNECTED:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case ConnectionStatus.CONNECTING:
      case ConnectionStatus.RECONNECTING:
        return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />;
      case ConnectionStatus.DISCONNECTED:
      case ConnectionStatus.ERROR:
        return <WifiOff className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Connection status badge variant
  const getStatusVariant = () => {
    switch (connectionStatus) {
      case ConnectionStatus.CONNECTED:
        return "outline";
      case ConnectionStatus.CONNECTING:
      case ConnectionStatus.RECONNECTING:
        return "secondary";
      case ConnectionStatus.DISCONNECTED:
      case ConnectionStatus.ERROR:
        return "destructive";
      default:
        return "outline";
    }
  };

  // Connection status text
  const getStatusText = () => {
    switch (connectionStatus) {
      case ConnectionStatus.CONNECTED:
        return "Connected";
      case ConnectionStatus.CONNECTING:
        return "Connecting";
      case ConnectionStatus.RECONNECTING:
        return "Reconnecting";
      case ConnectionStatus.DISCONNECTED:
        return "Disconnected";
      case ConnectionStatus.ERROR:
        return "Connection Error";
      default:
        return "Unknown";
    }
  };

  // Session save/load handlers
  const handleSessionSave = useCallback((name: string, description?: string) => {
    const sessionData: SessionData = {
      name,
      description,
      features,
      annotations,
      timestamp: new Date().toISOString(),
      center: map ? [map.getCenter().lng, map.getCenter().lat] : initialCenter,
      zoom: map ? map.getZoom() : initialZoom
    };
    
    // In a real app, we'd save this to a database
    localStorage.setItem(`map-session-${roomId}-${name}`, JSON.stringify(sessionData));
    
    toast({
      title: "Session saved",
      description: `Map session "${name}" has been saved`,
      variant: "default"
    });
    
    return sessionData;
  }, [features, annotations, map, roomId, initialCenter, initialZoom]);
  
  const handleSessionLoad = useCallback((sessionName: string) => {
    // In a real app, we'd load this from a database
    const savedSession = localStorage.getItem(`map-session-${roomId}-${sessionName}`);
    
    if (savedSession) {
      try {
        const sessionData: SessionData = JSON.parse(savedSession);
        
        // Update state with loaded data
        setFeatures(sessionData.features || []);
        setAnnotations(sessionData.annotations || []);
        
        // Update map position if available
        if (map && sessionData.center && sessionData.zoom) {
          map.flyTo({
            center: sessionData.center as [number, number],
            zoom: sessionData.zoom
          });
        }
        
        toast({
          title: "Session loaded",
          description: `Map session "${sessionName}" has been loaded`,
          variant: "default"
        });
        
        return sessionData;
      } catch (err) {
        console.error('Error loading session:', err);
        
        toast({
          title: "Error loading session",
          description: "The saved session data could not be loaded",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Session not found",
        description: `No saved session named "${sessionName}" was found`,
        variant: "destructive"
      });
    }
    
    return null;
  }, [map, roomId]);

  return (
    <div className="space-y-3">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Badge variant={getStatusVariant()} className="flex items-center space-x-1">
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </Badge>
          
          {collaborators.length > 0 && (
            <Badge variant="outline" className="flex items-center">
              <span>{collaborators.length} collaborator{collaborators.length !== 1 ? 's' : ''}</span>
            </Badge>
          )}
        </div>
        
        <Badge variant="outline" className="flex items-center">
          <span>Room: {roomId}</span>
        </Badge>
      </div>
      
      {/* Session manager */}
      <div className="flex items-start justify-between gap-2">
        <CollaborativeSessionManager 
          onSave={handleSessionSave}
          onLoad={handleSessionLoad}
          roomId={roomId}
        />
        
        {/* User activity indicator */}
        <CollaborativeUserIndicator 
          activities={userActivities} 
          collaborators={collaborators}
        />
      </div>
      
      {/* Map container */}
      <div style={containerStyle}>
        <MapboxMap
          initialCenter={initialCenter}
          initialZoom={initialZoom}
          onMapCreated={handleMapCreated}
          width="100%"
          height="100%"
        >
          {map && (
            <CollaborativeMap 
              map={map} 
              roomId={roomId} 
              onConnectionStatusChange={handleConnectionStatusChange}
              onCollaboratorsChange={handleCollaboratorsChange}
              onFeaturesUpdate={handleFeaturesUpdate}
              onAnnotationsUpdate={handleAnnotationsUpdate}
              onUserActivity={handleUserActivityUpdate}
            />
          )}
        </MapboxMap>
      </div>
    </div>
  );
}