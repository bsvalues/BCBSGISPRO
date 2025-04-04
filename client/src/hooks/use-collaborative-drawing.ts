import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useWebSocket, MessageTypeEnum, ConnectionStatusEnum } from '@/lib/websocket';

// Drawing modes that match MapboxDraw
export enum DrawMode {
  SIMPLE_SELECT = 'simple_select',
  DIRECT_SELECT = 'direct_select',
  DRAW_POINT = 'draw_point',
  DRAW_POLYGON = 'draw_polygon',
  DRAW_LINE = 'draw_line_string',
  STATIC = 'static',
  FREEHAND = 'draw_freehand'
}

// Drawing action types
export enum DrawActionType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete'
}

// Re-export the ConnectionStatus enum from websocket
export { ConnectionStatusEnum } from '@/lib/websocket';

// Basic GeoJSON types
type Point = {
  type: 'Point';
  coordinates: number[];
};

type LineString = {
  type: 'LineString';
  coordinates: number[][];
};

type Polygon = {
  type: 'Polygon';
  coordinates: number[][][];
};

type Geometry = Point | LineString | Polygon;

export type Feature = {
  id?: string;
  type: 'Feature';
  geometry: Geometry;
  properties?: {
    [key: string]: any;
  };
};

export type FeatureCollection = {
  type: 'FeatureCollection';
  features: Feature[];
};

export interface DrawingChange {
  action: DrawActionType;
  feature: Feature;
  userId: string;
  timestamp: string;
}

/**
 * Hook for collaborative drawing using WebSockets
 */
export function useCollaborativeDrawing(roomId: string = 'default') {
  // WebSocket connection hook
  const { 
    send, 
    lastMessage, 
    status, 
    userId 
  } = useWebSocket(roomId);
  
  // Collection of features
  const [featureCollection, setFeatureCollection] = useState<FeatureCollection>({
    type: 'FeatureCollection',
    features: []
  });
  
  // Keep track of local changes to prevent echoing
  const localChangeIds = useRef(new Set<string>());
  
  // Process incoming messages
  useEffect(() => {
    if (!lastMessage) return;
    
    // Only process DRAWING messages
    if (lastMessage.type !== MessageTypeEnum.FEATURE_ADD && lastMessage.type !== MessageTypeEnum.FEATURE_UPDATE) return;
    
    try {
      // Check if this is a change we initiated to prevent echoing
      const change = lastMessage.data as DrawingChange;
      if (!change) return;
      
      const changeId = `${change.action}-${change.feature.id}-${change.timestamp}`;
      
      // Skip if this is a change we initiated
      if (localChangeIds.current.has(changeId)) {
        localChangeIds.current.delete(changeId);
        return;
      }
      
      // Process the change based on the action type
      switch (change.action) {
        case DrawActionType.CREATE:
          setFeatureCollection(prev => ({
            ...prev,
            features: [...prev.features, {
              ...change.feature,
              properties: {
                ...change.feature.properties,
                userColor: getUserColor(change.userId),
                userId: change.userId
              }
            }]
          }));
          break;
          
        case DrawActionType.UPDATE:
          setFeatureCollection(prev => ({
            ...prev,
            features: prev.features.map(feature => 
              feature.id === change.feature.id 
                ? {
                    ...change.feature,
                    properties: {
                      ...change.feature.properties,
                      userColor: getUserColor(change.userId),
                      userId: change.userId
                    }
                  }
                : feature
            )
          }));
          break;
          
        case DrawActionType.DELETE:
          setFeatureCollection(prev => ({
            ...prev,
            features: prev.features.filter(feature => feature.id !== change.feature.id)
          }));
          break;
          
        default:
          console.warn('Unknown drawing action:', change.action);
      }
    } catch (err) {
      console.error('Error processing WebSocket drawing message:', err);
    }
  }, [lastMessage]);
  
  // Add a new feature
  const addFeature = useCallback((feature: Feature) => {
    // Ensure feature has a unique id
    const featureWithId = {
      ...feature,
      id: feature.id || uuidv4(),
      properties: {
        ...feature.properties,
        userColor: getUserColor(userId),
        userId: userId
      }
    };
    
    // Update local state
    setFeatureCollection(prev => ({
      ...prev,
      features: [...prev.features, featureWithId]
    }));
    
    // Generate change timestamp
    const timestamp = new Date().toISOString();
    
    // Create change id to prevent echo
    const changeId = `${DrawActionType.CREATE}-${featureWithId.id}-${timestamp}`;
    localChangeIds.current.add(changeId);
    
    // Send to server
    send({
      type: MessageTypeEnum.FEATURE_ADD,
      data: {
        action: DrawActionType.CREATE,
        feature: featureWithId,
        userId,
        timestamp
      },
      roomId,
      source: userId,
      timestamp
    });
    
    return featureWithId;
  }, [userId, roomId, send]);
  
  // Update an existing feature
  const updateFeature = useCallback((id: string, feature: Feature) => {
    // Update feature properties
    const updatedFeature = {
      ...feature,
      id,
      properties: {
        ...feature.properties,
        userColor: getUserColor(userId),
        userId: userId
      }
    };
    
    // Update local state
    setFeatureCollection(prev => ({
      ...prev,
      features: prev.features.map(f => 
        f.id === id ? updatedFeature : f
      )
    }));
    
    // Generate change timestamp
    const timestamp = new Date().toISOString();
    
    // Create change id to prevent echo
    const changeId = `${DrawActionType.UPDATE}-${id}-${timestamp}`;
    localChangeIds.current.add(changeId);
    
    // Send to server
    send({
      type: MessageTypeEnum.FEATURE_UPDATE,
      data: {
        action: DrawActionType.UPDATE,
        feature: updatedFeature,
        userId,
        timestamp
      },
      roomId,
      source: userId,
      timestamp
    });
    
    return updatedFeature;
  }, [userId, roomId, send]);
  
  // Delete a feature
  const deleteFeature = useCallback((id: string) => {
    // Find the feature
    const feature = featureCollection.features.find(f => f.id === id);
    if (!feature) return null;
    
    // Update local state
    setFeatureCollection(prev => ({
      ...prev,
      features: prev.features.filter(f => f.id !== id)
    }));
    
    // Generate change timestamp
    const timestamp = new Date().toISOString();
    
    // Create change id to prevent echo
    const changeId = `${DrawActionType.DELETE}-${id}-${timestamp}`;
    localChangeIds.current.add(changeId);
    
    // Send to server
    send({
      type: MessageTypeEnum.FEATURE_DELETE,
      data: {
        action: DrawActionType.DELETE,
        feature,
        userId,
        timestamp
      },
      roomId,
      source: userId,
      timestamp
    });
    
    return feature;
  }, [featureCollection, userId, roomId, send]);
  
  return {
    featureCollection,
    addFeature,
    updateFeature,
    deleteFeature,
    connectionStatus: status
  };
}

// Helper function to generate a color from a user ID
function getUserColor(userId: string): string {
  // Generate a color based on the hash of the user ID
  const hash = Array.from(userId).reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  const h = Math.abs(hash) % 360; // Hue (0-360)
  const s = 70 + (Math.abs(hash) % 20); // Saturation (70-90%)
  const l = 40 + (Math.abs(hash) % 10); // Lightness (40-50%)
  
  return `hsl(${h}, ${s}%, ${l}%)`;
}