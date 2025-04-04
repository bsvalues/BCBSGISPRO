import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useWebSocket } from '@/hooks/use-websocket';
import { MessageTypeEnum } from '@/lib/websocket';
import { getSessionManager, CollaborativeUser, CollaborativeRoom } from '@/lib/websocket-session-manager';

// Types
export interface UseEnhancedWebSocketOptions {
  // Room ID to join (optional, if not provided, will use generated ID)
  roomId?: string;
  
  // User display name (optional)
  username?: string;
  
  // Auto-join the room on connect (default: false)
  autoJoin?: boolean;
  
  // Throttle cursor position updates (ms, default: 50)
  cursorUpdateThrottle?: number;
  
  // Heartbeat interval (ms, default: 30000 - 30 seconds)
  heartbeatInterval?: number;
}

export interface UseEnhancedWebSocketResult {
  // WebSocket connection status
  status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  
  // Generated user ID
  userId: string;
  
  // Room information
  roomId: string;
  roomUsers: CollaborativeUser[];
  currentRoomData: CollaborativeRoom | undefined;
  
  // Connection operations
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  
  // Room operations
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  
  // Message operations
  sendMessage: (type: MessageTypeEnum, payload?: any) => void;
  
  // Collaborative operations
  sendCursorPosition: (lng: number, lat: number) => void;
  addFeature: (feature: any) => void;
  updateFeature: (feature: any) => void;
  deleteFeature: (featureId: string) => void;
  addAnnotation: (annotation: any) => void;
  updateAnnotation: (annotation: any) => void;
  deleteAnnotation: (annotationId: string) => void;
}

/**
 * Enhanced WebSocket hook for collaborative editing
 */
export function useEnhancedWebSocket({
  roomId: initialRoomId,
  username,
  autoJoin = false,
  cursorUpdateThrottle = 50,
  heartbeatInterval = 30000
}: UseEnhancedWebSocketOptions = {}): UseEnhancedWebSocketResult {
  // Generate a stable user ID for this session
  const userIdRef = useRef<string>(uuidv4());
  const userId = userIdRef.current;
  
  // Room ID - either provided or generated
  const [roomId, setRoomId] = useState<string>(initialRoomId || 'default-room');
  
  // Throttle state for cursor updates
  const lastCursorUpdateRef = useRef<number>(0);
  
  // Session manager for collaborative state
  const sessionManager = getSessionManager();
  
  // Current room users state
  const [roomUsers, setRoomUsers] = useState<CollaborativeUser[]>([]);
  const [currentRoomData, setCurrentRoomData] = useState<CollaborativeRoom | undefined>();
  
  // Initialize base WebSocket connection
  const {
    status,
    connect,
    disconnect,
    reconnect,
    sendMessage
  } = useWebSocket({
    onOpen: () => {
      console.log('Enhanced WebSocket connected');
      
      // Set current user in session manager
      sessionManager.setCurrentUser(userId, username || `User-${userId.substring(0, 4)}`);
      
      // Auto-join room if enabled
      if (autoJoin) {
        joinRoom(roomId);
      }
    },
    onMessage: (event) => {
      try {
        // Parse and process message
        const message = JSON.parse(event.data);
        sessionManager.processMessage(message);
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    },
    onClose: () => {
      console.log('Enhanced WebSocket disconnected');
    },
    onError: (error) => {
      console.error('Enhanced WebSocket error:', error);
    }
  });
  
  // Join a room
  const joinRoom = useCallback((roomId: string) => {
    if (status !== 'connected') {
      console.warn('Cannot join room: WebSocket not connected');
      return;
    }
    
    // Update room ID
    setRoomId(roomId);
    
    // Send join message
    sendMessage({
      type: MessageTypeEnum.JOIN_ROOM,
      roomId,
      userId,
      username: username || `User-${userId.substring(0, 4)}`
    });
    
    console.log(`Joined room: ${roomId}`);
  }, [status, userId, username, sendMessage]);
  
  // Leave the current room
  const leaveRoom = useCallback(() => {
    if (status !== 'connected') {
      console.warn('Cannot leave room: WebSocket not connected');
      return;
    }
    
    // Send leave message
    sendMessage({
      type: MessageTypeEnum.LEAVE_ROOM,
      roomId,
      userId
    });
    
    console.log(`Left room: ${roomId}`);
  }, [status, roomId, userId, sendMessage]);
  
  // Enhanced message sender with room ID included
  const sendRoomMessage = useCallback((type: MessageTypeEnum, payload?: any) => {
    if (status !== 'connected') {
      console.warn('Cannot send message: WebSocket not connected');
      return;
    }
    
    sendMessage({
      type,
      roomId,
      userId,
      payload
    });
  }, [status, roomId, userId, sendMessage]);
  
  // Send cursor position (throttled)
  const sendCursorPosition = useCallback((lng: number, lat: number) => {
    const now = Date.now();
    
    // Throttle updates
    if (now - lastCursorUpdateRef.current < cursorUpdateThrottle) {
      return;
    }
    
    lastCursorUpdateRef.current = now;
    
    sendRoomMessage(MessageTypeEnum.CURSOR_MOVE, {
      lng,
      lat
    });
  }, [sendRoomMessage, cursorUpdateThrottle]);
  
  // Feature operations
  const addFeature = useCallback((feature: any) => {
    sendRoomMessage(MessageTypeEnum.FEATURE_ADD, feature);
  }, [sendRoomMessage]);
  
  const updateFeature = useCallback((feature: any) => {
    sendRoomMessage(MessageTypeEnum.FEATURE_UPDATE, feature);
  }, [sendRoomMessage]);
  
  const deleteFeature = useCallback((featureId: string) => {
    sendRoomMessage(MessageTypeEnum.FEATURE_DELETE, { id: featureId });
  }, [sendRoomMessage]);
  
  // Annotation operations
  const addAnnotation = useCallback((annotation: any) => {
    sendRoomMessage(MessageTypeEnum.ANNOTATION_ADD, annotation);
  }, [sendRoomMessage]);
  
  const updateAnnotation = useCallback((annotation: any) => {
    sendRoomMessage(MessageTypeEnum.ANNOTATION_UPDATE, annotation);
  }, [sendRoomMessage]);
  
  const deleteAnnotation = useCallback((annotationId: string) => {
    sendRoomMessage(MessageTypeEnum.ANNOTATION_DELETE, { id: annotationId });
  }, [sendRoomMessage]);
  
  // Heartbeat to keep connection alive
  useEffect(() => {
    if (status !== 'connected') return;
    
    const intervalId = setInterval(() => {
      sendMessage({
        type: MessageTypeEnum.HEARTBEAT,
        userId,
        timestamp: Date.now()
      });
    }, heartbeatInterval);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [status, userId, sendMessage, heartbeatInterval]);
  
  // Handle room updates from session manager
  useEffect(() => {
    const onRoomUpdated = (updatedRoomId: string, room: CollaborativeRoom) => {
      if (updatedRoomId === roomId) {
        setCurrentRoomData(room);
        setRoomUsers(Array.from(room.users.values()));
      }
    };
    
    // Subscribe to room updates
    const unsubscribe = sessionManager.onRoomUpdated(onRoomUpdated);
    
    return unsubscribe;
  }, [sessionManager, roomId]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Leave room when component unmounts
      if (status === 'connected') {
        leaveRoom();
      }
    };
  }, [status, leaveRoom]);
  
  return {
    status,
    userId,
    roomId,
    roomUsers,
    currentRoomData,
    connect,
    disconnect,
    reconnect,
    joinRoom,
    leaveRoom,
    sendMessage: sendRoomMessage,
    sendCursorPosition,
    addFeature,
    updateFeature,
    deleteFeature,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation
  };
}