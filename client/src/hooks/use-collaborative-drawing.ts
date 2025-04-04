import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  useWebSocket, 
  MessageType, 
  ConnectionStatus,
  createDrawingUpdateMessage
} from '@/lib/websocket';

// Define drawing action types
export enum DrawingActionType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  SELECT = 'select',
  COMBINE = 'combine',
  UNCOMBINE = 'uncombine',
  MODE_CHANGE = 'mode_change'
}

// Define the feature change payload
export interface FeatureChange {
  action: DrawingActionType;
  featureId?: string;
  featureIds?: string[];
  featureData?: any;
  mode?: string;
  source: string;
  timestamp: string;
}

// Main collaborative drawing hook
export function useCollaborativeDrawing(roomId: string = 'default') {
  // Generate a consistent user ID for this session
  const [userId] = useState(() => {
    const storedId = localStorage.getItem('bentonGisUserId');
    if (storedId) return storedId;
    
    const newId = uuidv4();
    localStorage.setItem('bentonGisUserId', newId);
    return newId;
  });
  
  // Track connected users
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
  
  // Track feature ownerships (which user created/last modified which feature)
  const [featureOwnership, setFeatureOwnership] = useState<Record<string, string>>({});
  
  // Track remote changes queue
  const [pendingChanges, setPendingChanges] = useState<FeatureChange[]>([]);
  
  // Track local changes to avoid echo effects
  const [localChangeIds] = useState<Set<string>>(new Set());
  
  // Connect to WebSocket
  const { status, lastMessage, send } = useWebSocket(MessageType.DRAWING_UPDATE);
  
  // Process incoming messages
  useEffect(() => {
    if (!lastMessage || lastMessage.type !== MessageType.DRAWING_UPDATE) return;
    
    try {
      const { data, source } = lastMessage;
      
      // Ignore our own messages to prevent echo effects
      if (source === userId || !data) return;
      
      // Check if this is a feature change message
      if (data.action && data.featureData) {
        const changeId = `${data.action}-${data.featureId || data.featureIds?.join('-')}-${data.timestamp}`;
        
        // Prevent duplicate processing
        if (localChangeIds.has(changeId)) return;
        
        // Update ownership information
        if (data.featureId && (data.action === DrawingActionType.CREATE || data.action === DrawingActionType.UPDATE)) {
          setFeatureOwnership(prev => ({
            ...prev,
            [data.featureId]: source
          }));
        }
        
        // Add to pending changes queue
        setPendingChanges(prev => [
          ...prev, 
          {
            action: data.action,
            featureId: data.featureId,
            featureIds: data.featureIds,
            featureData: data.featureData,
            mode: data.mode,
            source,
            timestamp: data.timestamp
          }
        ]);
      }
      
      // If it's a user presence message, update connected users
      if (data.presence) {
        setConnectedUsers(data.presence.users || []);
      }
    } catch (error) {
      console.error('Error processing drawing update:', error);
    }
  }, [lastMessage, userId, localChangeIds]);
  
  // Send drawing changes to all users in the room
  const sendDrawingUpdate = useCallback((
    action: DrawingActionType,
    featureId?: string,
    featureIds?: string[],
    featureData?: any,
    mode?: string
  ) => {
    // Only send if connected
    if (status !== ConnectionStatus.CONNECTED) return false;
    
    const timestamp = new Date().toISOString();
    const changeId = `${action}-${featureId || featureIds?.join('-')}-${timestamp}`;
    
    // Remember this change came from us
    localChangeIds.add(changeId);
    
    // Trim the local change cache to prevent memory leaks
    if (localChangeIds.size > 100) {
      const idsToRemove = Array.from(localChangeIds).slice(0, 50);
      idsToRemove.forEach(id => localChangeIds.delete(id));
    }
    
    // Create and send the message
    const message = createDrawingUpdateMessage({
      action,
      featureId,
      featureIds,
      featureData,
      mode,
      roomId,
      timestamp
    }, userId);
    
    return send(message);
  }, [status, userId, roomId, send, localChangeIds]);
  
  // Helper to handle feature creation
  const handleFeatureCreate = useCallback((feature: any) => {
    return sendDrawingUpdate(
      DrawingActionType.CREATE,
      feature.id,
      undefined,
      feature
    );
  }, [sendDrawingUpdate]);
  
  // Helper to handle feature update
  const handleFeatureUpdate = useCallback((feature: any) => {
    return sendDrawingUpdate(
      DrawingActionType.UPDATE,
      feature.id,
      undefined,
      feature
    );
  }, [sendDrawingUpdate]);
  
  // Helper to handle feature deletion
  const handleFeatureDelete = useCallback((featureIds: string[]) => {
    return sendDrawingUpdate(
      DrawingActionType.DELETE,
      undefined,
      featureIds
    );
  }, [sendDrawingUpdate]);
  
  // Helper to handle feature selection
  const handleFeatureSelect = useCallback((featureIds: string[]) => {
    return sendDrawingUpdate(
      DrawingActionType.SELECT,
      undefined,
      featureIds
    );
  }, [sendDrawingUpdate]);
  
  // Helper to handle mode changes
  const handleModeChange = useCallback((mode: string) => {
    return sendDrawingUpdate(
      DrawingActionType.MODE_CHANGE,
      undefined,
      undefined,
      undefined,
      mode
    );
  }, [sendDrawingUpdate]);
  
  // Helper to send presence update
  const updatePresence = useCallback(() => {
    if (status !== ConnectionStatus.CONNECTED) return false;
    
    const message = createDrawingUpdateMessage({
      presence: {
        user: userId,
        status: 'active',
        room: roomId,
        timestamp: new Date().toISOString()
      }
    }, userId);
    
    return send(message);
  }, [status, userId, roomId, send]);
  
  // Send periodic presence updates
  useEffect(() => {
    if (status !== ConnectionStatus.CONNECTED) return;
    
    // Send initial presence
    updatePresence();
    
    // Send periodic updates
    const interval = setInterval(updatePresence, 30000);
    
    return () => clearInterval(interval);
  }, [status, updatePresence]);
  
  // Process and clear a pending change
  const processPendingChange = useCallback(() => {
    if (pendingChanges.length === 0) return null;
    
    // Get and remove the first pending change
    const change = pendingChanges[0];
    setPendingChanges(prev => prev.slice(1));
    
    return change;
  }, [pendingChanges]);
  
  return {
    connected: status === ConnectionStatus.CONNECTED,
    connectionStatus: status,
    connectedUsers,
    userId,
    featureOwnership,
    pendingChanges,
    processPendingChange,
    sendDrawingUpdate,
    handleFeatureCreate,
    handleFeatureUpdate,
    handleFeatureDelete,
    handleFeatureSelect,
    handleModeChange,
    updatePresence
  };
}