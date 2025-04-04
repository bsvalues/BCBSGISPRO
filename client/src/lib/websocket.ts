import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Connection status for the WebSocket
 * @deprecated Use ConnectionStatusEnum instead
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';

/**
 * Connection status enum for components that need to reference status values
 */
export enum ConnectionStatusEnum {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  RECONNECTING = 'reconnecting'
}

/**
 * Message types that can be sent/received over WebSocket
 * @deprecated Use MessageTypeEnum instead
 */
export type MessageType = 
  | 'join' 
  | 'leave' 
  | 'cursor_move' 
  | 'feature_created' 
  | 'feature_updated'
  | 'feature_deleted'
  | 'annotation_created'
  | 'annotation_updated'
  | 'annotation_deleted'
  | 'heartbeat'
  | 'chat'
  | 'status';

/**
 * Message type enum for components that need to reference message types
 */
export enum MessageTypeEnum {
  JOIN = 'join',
  LEAVE = 'leave',
  JOIN_ROOM = 'join_room',  // Server-side format
  LEAVE_ROOM = 'leave_room', // Server-side format
  CURSOR_MOVE = 'cursor_move',
  // Feature events (legacy client format)
  FEATURE_CREATED = 'feature_created',
  FEATURE_UPDATED = 'feature_updated',
  FEATURE_DELETED = 'feature_deleted',
  // Feature events (new client format)
  FEATURE_ADD = 'feature_add',
  FEATURE_UPDATE = 'feature_update',
  FEATURE_DELETE = 'feature_delete',
  // Annotation events
  ANNOTATION_CREATED = 'annotation_created',
  ANNOTATION_UPDATED = 'annotation_updated',
  ANNOTATION_DELETED = 'annotation_deleted',
  ANNOTATION_ADD = 'annotation_add',    // Server-side format
  ANNOTATION_UPDATE = 'annotation_update', // Server-side format
  ANNOTATION_DELETE = 'annotation_delete', // Server-side format
  // System events
  HEARTBEAT = 'heartbeat',
  CHAT = 'chat',
  CHAT_MESSAGE = 'chat_message', // Server-side format
  STATUS = 'status'
}

/**
 * WebSocket message structure
 */
export interface WebSocketMessage {
  type: MessageTypeEnum;
  roomId?: string;
  userId?: string;
  username?: string;
  payload?: any;
  data?: any;  // Support for data field used in collaborative features
  source?: string; // Source ID for the message
  timestamp?: number;
}

/**
 * Configuration options for the WebSocket hook
 */
export interface WebSocketOptions {
  /** Automatic reconnection */
  autoReconnect?: boolean;
  /** Initial retry delay in ms */
  initialRetryDelay?: number;
  /** Maximum retry delay in ms */
  maxRetryDelay?: number;
  /** Reconnection backoff factor */
  backoffFactor?: number;
  /** Maximum number of reconnection attempts (0 for unlimited) */
  maxRetries?: number;
  /** Room ID to join automatically when connected */
  autoJoinRoom?: string;
  /** Room ID to use (alias for autoJoinRoom for compatibility) */
  roomId?: string;
  /** User identity information */
  userId?: string;
  username?: string;
}

/**
 * Default options for WebSocket connection
 */
const defaultOptions: WebSocketOptions = {
  autoReconnect: true,
  initialRetryDelay: 1000,
  maxRetryDelay: 30000,
  backoffFactor: 1.5,
  maxRetries: 5,
  autoJoinRoom: '',
  userId: '',
  username: ''
};

/**
 * Hook for managing WebSocket connections with robust reconnection logic
 */
export function useWebSocket(options: WebSocketOptions = {}) {
  // Merge provided options with defaults
  const opts = { ...defaultOptions, ...options };
  
  // State for connection status and messages
  const [status, setStatus] = useState<ConnectionStatusEnum>(ConnectionStatusEnum.DISCONNECTED);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string>('');
  
  // Refs for WebSocket instance and reconnection state
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  
  // Clear reconnection timeout on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);
  
  // Store options in refs to avoid dependency changes triggering reconnects
  const optionsRef = useRef(opts);
  
  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = opts;
  }, [opts]);
  
  /**
   * Join room function reference - needed because connect references joinRoom
   * but joinRoom is defined after connect creating a circular dependency issue
   */
  const joinRoomRef = useRef((roomId: string): boolean => {
    return false; // Will be properly initialized later
  });
  
  /**
   * Establishes a WebSocket connection with stable option references
   */
  const connect = useCallback(() => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.CONNECTING || 
                              socketRef.current.readyState === WebSocket.OPEN)) {
      return;
    }
    
    try {
      setStatus(ConnectionStatusEnum.CONNECTING);
      
      // Determine WebSocket URL based on current protocol (ws or wss)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      // Create WebSocket connection
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      
      socket.onopen = () => {
        if (!isMountedRef.current) return;
        
        console.log('WebSocket connection established');
        setStatus(ConnectionStatusEnum.CONNECTED);
        reconnectAttemptsRef.current = 0;
        
        // Auto-join room if specified, using the ref to access current value
        if (optionsRef.current.autoJoinRoom) {
          joinRoomRef.current(optionsRef.current.autoJoinRoom);
        }
      };
      
      socket.onmessage = (event) => {
        if (!isMountedRef.current) return;
        
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          
          // Handle heartbeat separately (don't add to message list)
          if (message.type === MessageTypeEnum.HEARTBEAT) {
            return;
          }
          
          setMessages(prev => [...prev, message]);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      socket.onclose = (event) => {
        if (!isMountedRef.current) return;
        
        console.log(`WebSocket connection closed (code: ${event.code}, clean: ${event.wasClean})`);
        socketRef.current = null;
        setStatus(ConnectionStatusEnum.DISCONNECTED);
        
        // Attempt reconnection if enabled and not a clean closure
        if (optionsRef.current.autoReconnect && !event.wasClean) {
          scheduleReconnect();
        }
      };
      
      socket.onerror = (error) => {
        if (!isMountedRef.current) return;
        
        console.error('WebSocket error:', error);
        setStatus(ConnectionStatusEnum.ERROR);
        
        // Socket will close itself after an error
      };
    } catch (error) {
      if (!isMountedRef.current) return;
      
      console.error('Failed to create WebSocket connection:', error);
      setStatus(ConnectionStatusEnum.ERROR);
      
      if (optionsRef.current.autoReconnect) {
        scheduleReconnect();
      }
    }
  }, []); // No dependencies needed now since we use refs
  
  /**
   * Schedules a reconnection attempt with exponential backoff
   */
  const scheduleReconnect = useCallback(() => {
    if (!isMountedRef.current || !optionsRef.current.autoReconnect) return;
    
    // Check if max retries reached using the options ref
    if (optionsRef.current.maxRetries && 
        optionsRef.current.maxRetries > 0 && 
        reconnectAttemptsRef.current >= optionsRef.current.maxRetries) {
      console.log(`Max reconnection attempts (${optionsRef.current.maxRetries}) reached. Giving up.`);
      return;
    }
    
    // Calculate delay with exponential backoff using the options ref
    const delay = Math.min(
      optionsRef.current.initialRetryDelay! * 
      Math.pow(optionsRef.current.backoffFactor!, reconnectAttemptsRef.current),
      optionsRef.current.maxRetryDelay!
    );
    
    console.log(`Scheduling reconnection attempt #${reconnectAttemptsRef.current + 1} in ${delay}ms`);
    
    // Clear any existing timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    // Schedule reconnection
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current++;
      connect();
    }, delay);
  }, [connect]); // Only depend on connect function
  
  /**
   * Sends a message through the WebSocket with stable user references
   */
  const sendMessage = useCallback((message: WebSocketMessage): boolean => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return false;
    }
    
    try {
      // Ensure message has required fields using the options ref for stable references
      const fullMessage: WebSocketMessage = {
        ...message,
        timestamp: message.timestamp || Date.now(),
        userId: optionsRef.current.userId || message.userId,
        username: message.username || optionsRef.current.username
      };
      
      socketRef.current.send(JSON.stringify(fullMessage));
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  }, []); // No dependencies since we use optionsRef
  
  /**
   * Joins a specific collaboration room with stable references
   * Supports both client-side (JOIN) and server-side (JOIN_ROOM) message types
   */
  const joinRoom = useCallback((roomId: string): boolean => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return false;
    }
    
    if (!roomId) {
      console.error('Room ID is required');
      return false;
    }
    
    // Try both client and server message types (server should respond to both)
    // The server-side format (JOIN_ROOM) is more reliable for the backend
    const success = sendMessage({
      type: MessageTypeEnum.JOIN_ROOM,
      roomId,
      userId: optionsRef.current.userId,
      username: optionsRef.current.username
    });
    
    if (success) {
      setCurrentRoom(roomId);
    }
    
    return success;
  }, [sendMessage]); // Only depend on sendMessage
  
  // Initialize the joinRoomRef now that joinRoom is defined
  useEffect(() => {
    joinRoomRef.current = joinRoom;
  }, [joinRoom]);
  
  // Reference to current room to avoid dependency on currentRoom state
  const currentRoomRef = useRef<string>('');
  
  // Update room ref when currentRoom changes
  useEffect(() => {
    currentRoomRef.current = currentRoom;
  }, [currentRoom]);
  
  /**
   * Leaves the current collaboration room with stable references
   * Supports both client-side (LEAVE) and server-side (LEAVE_ROOM) message types
   */
  const leaveRoom = useCallback((): boolean => {
    // Get currentRoom from ref to avoid stale closure issues
    const roomToLeave = currentRoomRef.current;
    if (!roomToLeave) {
      return false;
    }
    
    // Use server-side format (LEAVE_ROOM) for better compatibility
    const success = sendMessage({
      type: MessageTypeEnum.LEAVE_ROOM,
      roomId: roomToLeave,
      userId: optionsRef.current.userId
    });
    
    if (success) {
      setCurrentRoom('');
    }
    
    return success;
  }, [sendMessage]); // Only depend on sendMessage
  
  /**
   * Manually disconnect the WebSocket connection
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.close(1000, 'User-initiated disconnection');
      socketRef.current = null;
      setStatus(ConnectionStatusEnum.DISCONNECTED);
    }
  }, []);
  
  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);
  
  // Return the WebSocket interface with stable reference values
  return {
    status,
    messages,
    sendMessage,
    joinRoom,
    leaveRoom,
    connect,
    disconnect,
    clearMessages,
    currentRoom,
    userId: optionsRef.current.userId, // Use the reference value
    lastMessage: messages.length > 0 ? messages[messages.length - 1] : null,
    send: sendMessage
  };
}

/**
 * Helper function to create a formatted chat message
 * Uses server-compatible CHAT_MESSAGE type
 */
export function createChatMessage(
  message: string, 
  userId: string, 
  roomId: string,
  username?: string
): WebSocketMessage {
  return {
    type: MessageTypeEnum.CHAT_MESSAGE,
    roomId,
    userId,
    username,
    payload: { message, text: message }, // Support both payload formats
    timestamp: Date.now()
  };
}