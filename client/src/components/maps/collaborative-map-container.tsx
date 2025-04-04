import { useState, useCallback, useEffect } from 'react';
import { CollaborativeMap } from './collaborative-map';
import { MapboxMap } from './mapbox/mapbox-map';
import mapboxgl from 'mapbox-gl';
import { ConnectionStatus } from '@/lib/websocket';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, Loader2, WifiOff } from 'lucide-react';

interface CollaborativeMapContainerProps {
  roomId: string;
  height?: string | number;
}

export function CollaborativeMapContainer({ roomId, height = '500px' }: CollaborativeMapContainerProps) {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [collaborators, setCollaborators] = useState<string[]>([]);

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
            />
          )}
        </MapboxMap>
      </div>
    </div>
  );
}