import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// WebSocket message types
export enum MessageTypeEnum {
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  CHAT = 'chat',
  CURSOR_POSITION = 'cursor_position',
  DRAWING = 'drawing',
  FEATURE_EDIT = 'feature_edit',
  ANNOTATION = 'annotation',
  USER_PRESENCE = 'user_presence',
  SYSTEM = 'system',
  ERROR = 'error'
}

// WebSocket connection status
export enum ConnectionStatusEnum {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

// Type for WebSocket messages
export interface WebSocketMessage {
  type: MessageTypeEnum;
  roomId?: string;
  userId?: string;
  username?: string;
  timestamp?: number;
  payload?: any;
}

// Interface for collaborative room
export interface CollaborativeRoom {
  id: string;
  name: string;
  userCount: number;
  type: 'map' | 'document' | 'chat' | 'general';
  createdAt: Date;
  createdBy?: string;
}

// Options for useEnhancedWebSocket hook
export interface UseEnhancedWebSocketOptions {
  url?: string;
  reconnectInterval?: number;
  reconnectAttempts?: number;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (event: Event) => void;
  autoReconnect?: boolean;
  autoReconnectOnError?: boolean;
  userId?: string; // User identifier
  username?: string; // User display name
}

// Return type for useEnhancedWebSocket hook
export interface UseEnhancedWebSocketResult {
  send: (message: WebSocketMessage) => void;
  status: ConnectionStatusEnum;
  lastMessage: WebSocketMessage | null;
  messages: WebSocketMessage[];
  clearMessages: () => void;
  joinRoom: (roomId: string, roomName?: string, roomType?: 'map' | 'document' | 'chat' | 'general') => void;
  leaveRoom: (roomId: string) => void;
  currentRoom: string | null;
  connected: boolean;
  disconnect: () => void;
  reconnect: () => void;
  userId: string;
  username: string;
}

/**
 * Enhanced WebSocket hook with reconnection, room management, and message handling
 */
export function useEnhancedWebSocket(options: UseEnhancedWebSocketOptions = {}): UseEnhancedWebSocketResult {
  // Default options
  const {
    url = getWebSocketUrl(),
    reconnectInterval = 3000,
    reconnectAttempts = 10,
    onOpen,
    onClose,
    onMessage,
    onError,
    autoReconnect = true,
    autoReconnectOnError = true,
    userId: providedUserId,
    username: providedUsername
  } = options;

  // Generate user ID and username if not provided
  const userId = useRef<string>(providedUserId || uuidv4()).current;
  const username = useRef<string>(providedUsername || `User-${userId.slice(0, 5)}`).current;
  
  // State variables
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [status, setStatus] = useState<ConnectionStatusEnum>(ConnectionStatusEnum.DISCONNECTED);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  
  // Refs for reconnection logic
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const socketRef = useRef<WebSocket | null>(null);

  /**
   * Get the WebSocket URL based on the current window location
   */
  function getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    return wsUrl;
  }

  /**
   * Connect to the WebSocket server
   */
  const connect = useCallback(() => {
    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    try {
      // Close existing socket if any
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
      
      setStatus(ConnectionStatusEnum.CONNECTING);
      const newSocket = new WebSocket(url);
      
      newSocket.addEventListener('open', (event) => {
        reconnectAttemptsRef.current = 0;
        setStatus(ConnectionStatusEnum.CONNECTED);
        setSocket(newSocket);
        if (onOpen) onOpen(event);
      });
      
      newSocket.addEventListener('close', (event) => {
        setStatus(ConnectionStatusEnum.DISCONNECTED);
        setSocket(null);
        
        if (onClose) onClose(event);
        
        // Attempt to reconnect if enabled
        if (autoReconnect && !event.wasClean) {
          scheduleReconnect();
        }
      });
      
      newSocket.addEventListener('error', (event) => {
        setStatus(ConnectionStatusEnum.ERROR);
        
        if (onError) onError(event);
        
        // Attempt to reconnect on error if enabled
        if (autoReconnectOnError) {
          scheduleReconnect();
        }
      });
      
      newSocket.addEventListener('message', (event) => {
        try {
          const parsedMessage: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(parsedMessage);
          
          // Special handling for system messages (like room joined)
          if (parsedMessage.type === MessageTypeEnum.SYSTEM && 
              parsedMessage.payload?.action === 'joined' &&
              parsedMessage.roomId) {
            setCurrentRoom(parsedMessage.roomId);
          }
          
          // Add message to history
          setMessages(prev => [...prev, parsedMessage]);
          
          if (onMessage) onMessage(parsedMessage);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
      
      socketRef.current = newSocket;
    } catch (error) {
      console.error('Error connecting to WebSocket server:', error);
      setStatus(ConnectionStatusEnum.ERROR);
      
      // Attempt to reconnect on connection error
      if (autoReconnectOnError) {
        scheduleReconnect();
      }
    }
  }, [url, onOpen, onClose, onMessage, onError, autoReconnect, autoReconnectOnError]);

  /**
   * Schedule a reconnection attempt
   */
  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= reconnectAttempts) {
      console.warn(`Maximum reconnection attempts (${reconnectAttempts}) reached`);
      return;
    }
    
    reconnectAttemptsRef.current += 1;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`Reconnecting (attempt ${reconnectAttemptsRef.current}/${reconnectAttempts})...`);
      connect();
    }, reconnectInterval);
  }, [connect, reconnectAttempts, reconnectInterval]);

  /**
   * Send a message through the WebSocket connection
   */
  const send = useCallback((message: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      // Add user identifiers if not already in the message
      const enhancedMessage = {
        ...message,
        userId: message.userId || userId,
        username: message.username || username,
        timestamp: message.timestamp || Date.now()
      };
      
      socketRef.current.send(JSON.stringify(enhancedMessage));
    } else {
      console.warn('Cannot send message: WebSocket is not connected');
    }
  }, [userId, username]);

  /**
   * Join a collaborative room
   */
  const joinRoom = useCallback((
    roomId: string, 
    roomName?: string,
    roomType: 'map' | 'document' | 'chat' | 'general' = 'general'
  ) => {
    // Leave current room if any
    if (currentRoom && currentRoom !== roomId) {
      leaveRoom(currentRoom);
    }
    
    send({
      type: MessageTypeEnum.JOIN_ROOM,
      roomId,
      userId,
      username,
      payload: {
        roomName,
        roomType
      }
    });
  }, [currentRoom, send, userId, username]);

  /**
   * Leave a collaborative room
   */
  const leaveRoom = useCallback((roomId: string) => {
    send({
      type: MessageTypeEnum.LEAVE_ROOM,
      roomId,
      userId,
      username
    });
    
    if (currentRoom === roomId) {
      setCurrentRoom(null);
    }
  }, [currentRoom, send, userId, username]);

  /**
   * Clear message history
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setLastMessage(null);
  }, []);

  /**
   * Manually disconnect from the WebSocket server
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      setSocket(null);
      setStatus(ConnectionStatusEnum.DISCONNECTED);
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  /**
   * Manually trigger a reconnection
   */
  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect, disconnect]);

  // Connect on initial mount
  useEffect(() => {
    connect();
    
    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return {
    send,
    status,
    lastMessage,
    messages,
    clearMessages,
    joinRoom,
    leaveRoom,
    currentRoom,
    connected: status === ConnectionStatusEnum.CONNECTED,
    disconnect,
    reconnect,
    userId,
    username
  };
}

export default useEnhancedWebSocket;