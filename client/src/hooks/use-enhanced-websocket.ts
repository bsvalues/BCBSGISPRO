import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket, WebSocketMessage, MessageTypeEnum, ConnectionStatusEnum } from '@/lib/websocket';
import { getSessionManager, CollaborativeUser, CollaborativeRoom } from '@/lib/websocket-session-manager';

/**
 * Enhanced WebSocket options
 */
export interface EnhancedWebSocketOptions {
  roomId?: string;
  userId?: string;
  username?: string;
  autoJoin?: boolean;
  onRoomJoined?: (roomId: string) => void;
  onRoomLeft?: (roomId: string) => void;
  onUserJoined?: (user: CollaborativeUser) => void;
  onUserLeft?: (user: CollaborativeUser) => void;
  onStatusChange?: (status: ConnectionStatusEnum) => void;
}

/**
 * Enhanced WebSocket hook with session management and callbacks
 */
export function useEnhancedWebSocket(options: EnhancedWebSocketOptions = {}) {
  // Default values for options
  const {
    roomId = '',
    userId = crypto.randomUUID().substring(0, 8),
    username = `User_${Math.floor(Math.random() * 1000)}`,
    autoJoin = true,
    onRoomJoined,
    onRoomLeft,
    onUserJoined,
    onUserLeft,
    onStatusChange
  } = options;

  // State for room users and room data
  const [roomUsers, setRoomUsers] = useState<CollaborativeUser[]>([]);
  const [currentRoom, setCurrentRoom] = useState<CollaborativeRoom | null>(null);
  const [joinedRooms, setJoinedRooms] = useState<string[]>([]);
  
  // Use the base WebSocket hook
  const websocket = useWebSocket({
    autoReconnect: true,
    userId,
    username
  });
  
  // Access session manager
  const sessionManager = getSessionManager();
  
  // Track if we've joined a room
  const hasJoinedRef = useRef(false);
  
  // Set current user in session manager
  useEffect(() => {
    sessionManager.setCurrentUser(userId, username);
  }, [userId, username, sessionManager]);
  
  // Process room updates
  useEffect(() => {
    const unsubscribe = sessionManager.onRoomUpdated((updatedRoomId, room) => {
      if (roomId && updatedRoomId === roomId) {
        setCurrentRoom(room);
        setRoomUsers(Array.from(room.users.values()));
      }
    });
    
    return unsubscribe;
  }, [roomId, sessionManager]);
  
  // Process user updates
  useEffect(() => {
    const unsubscribe = sessionManager.onUserUpdated((updatedUserId, user) => {
      if (roomId && user.rooms.has(roomId)) {
        // User is in current room, update room users list
        setRoomUsers(prev => {
          const existingIndex = prev.findIndex(u => u.id === updatedUserId);
          if (existingIndex >= 0) {
            // Replace existing user
            const newUsers = [...prev];
            newUsers[existingIndex] = user;
            return newUsers;
          } else {
            // Add new user
            if (onUserJoined) onUserJoined(user);
            return [...prev, user];
          }
        });
      } else if (roomId) {
        // User left current room, remove from list
        setRoomUsers(prev => {
          const existingUser = prev.find(u => u.id === updatedUserId);
          if (existingUser && onUserLeft) onUserLeft(existingUser);
          return prev.filter(u => u.id !== updatedUserId);
        });
      }
    });
    
    return unsubscribe;
  }, [roomId, onUserJoined, onUserLeft, sessionManager]);
  
  // Update session manager with incoming messages
  useEffect(() => {
    if (websocket.lastMessage) {
      sessionManager.processMessage(websocket.lastMessage);
    }
  }, [websocket.lastMessage]);
  
  // Auto-join room when connected
  useEffect(() => {
    if (
      autoJoin && 
      roomId && 
      websocket.status === ConnectionStatusEnum.CONNECTED && 
      !websocket.currentRoom && 
      !hasJoinedRef.current
    ) {
      hasJoinedRef.current = true;
      websocket.joinRoom(roomId);
    }
  }, [autoJoin, roomId, websocket, websocket.status]);
  
  // Track room membership
  useEffect(() => {
    if (websocket.currentRoom) {
      if (!joinedRooms.includes(websocket.currentRoom)) {
        setJoinedRooms(prev => [...prev, websocket.currentRoom]);
        if (onRoomJoined) onRoomJoined(websocket.currentRoom);
      }
    }
  }, [websocket.currentRoom, joinedRooms, onRoomJoined]);
  
  // Update status change callback
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(websocket.status);
    }
  }, [websocket.status, onStatusChange]);
  
  // Join a room
  const joinRoom = useCallback((roomToJoin: string) => {
    hasJoinedRef.current = true;
    return websocket.joinRoom(roomToJoin);
  }, [websocket]);
  
  // Leave current room
  const leaveRoom = useCallback(() => {
    hasJoinedRef.current = false;
    const result = websocket.leaveRoom();
    
    if (result && websocket.currentRoom && onRoomLeft) {
      onRoomLeft(websocket.currentRoom);
      setJoinedRooms(prev => prev.filter(room => room !== websocket.currentRoom));
    }
    
    return result;
  }, [websocket, onRoomLeft]);
  
  // Send a cursor position update
  const sendCursorPosition = useCallback((x: number, y: number) => {
    if (!websocket.currentRoom || websocket.status !== ConnectionStatusEnum.CONNECTED) {
      return false;
    }
    
    return websocket.sendMessage({
      type: MessageTypeEnum.CURSOR_MOVE,
      roomId: websocket.currentRoom,
      payload: {
        position: { x, y }
      }
    });
  }, [websocket]);
  
  // Send a chat message
  const sendChatMessage = useCallback((text: string) => {
    if (!websocket.currentRoom || websocket.status !== ConnectionStatusEnum.CONNECTED) {
      return false;
    }
    
    return websocket.sendMessage({
      type: MessageTypeEnum.CHAT,
      roomId: websocket.currentRoom,
      payload: {
        text
      }
    });
  }, [websocket]);

  // Return enhanced functionality
  return {
    // Base WebSocket properties
    ...websocket,
    
    // Enhanced properties
    roomUsers,
    currentRoomData: currentRoom,
    joinedRooms,
    
    // Enhanced methods
    joinRoom,
    leaveRoom,
    sendCursorPosition,
    sendChatMessage
  };
}