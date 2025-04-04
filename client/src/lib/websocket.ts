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
 */
export type MessageType = 
  | 'join_room' 
  | 'leave_room' 
  | 'cursor_move' 
  | 'feature_add' 
  | 'feature_update'
  | 'feature_delete'
  | 'annotation_add'
  | 'annotation_update'
  | 'annotation_delete'
  | 'heartbeat'
  | 'chat_message';

/**
 * Message type enum for components that need to reference message types
 */
export enum MessageTypeEnum {
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  CURSOR_MOVE = 'cursor_move',
  FEATURE_ADD = 'feature_add',
  FEATURE_UPDATE = 'feature_update',
  FEATURE_DELETE = 'feature_delete',
  ANNOTATION_ADD = 'annotation_add',
  ANNOTATION_UPDATE = 'annotation_update',
  ANNOTATION_DELETE = 'annotation_delete',
  HEARTBEAT = 'heartbeat',
  CHAT = 'chat_message'
}

/**
 * WebSocket message structure
 */
export interface WebSocketMessage {
  type: MessageType;
  roomId?: string;
  userId?: string;
  username?: string;
  payload?: any;
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
  
  /**
   * Establishes a WebSocket connection
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
        
        // Auto-join room if specified
        if (opts.autoJoinRoom) {
          joinRoom(opts.autoJoinRoom);
        }
      };
      
      socket.onmessage = (event) => {
        if (!isMountedRef.current) return;
        
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          
          // Handle heartbeat separately (don't add to message list)
          if (message.type === 'heartbeat') {
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
        if (opts.autoReconnect && !event.wasClean) {
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
      
      if (opts.autoReconnect) {
        scheduleReconnect();
      }
    }
  }, [opts.autoJoinRoom, opts.autoReconnect]);
  
  /**
   * Schedules a reconnection attempt with exponential backoff
   */
  const scheduleReconnect = useCallback(() => {
    if (!isMountedRef.current || !opts.autoReconnect) return;
    
    // Check if max retries reached
    if (opts.maxRetries && opts.maxRetries > 0 && reconnectAttemptsRef.current >= opts.maxRetries) {
      console.log(`Max reconnection attempts (${opts.maxRetries}) reached. Giving up.`);
      return;
    }
    
    // Calculate delay with exponential backoff
    const delay = Math.min(
      opts.initialRetryDelay! * Math.pow(opts.backoffFactor!, reconnectAttemptsRef.current),
      opts.maxRetryDelay!
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
  }, [connect, opts.autoReconnect, opts.backoffFactor, opts.initialRetryDelay, opts.maxRetries, opts.maxRetryDelay]);
  
  /**
   * Sends a message through the WebSocket
   */
  const sendMessage = useCallback((message: WebSocketMessage): boolean => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return false;
    }
    
    try {
      // Ensure message has required fields
      const fullMessage: WebSocketMessage = {
        ...message,
        timestamp: message.timestamp || Date.now(),
        userId: opts.userId || message.userId,
        username: message.username || opts.username
      };
      
      socketRef.current.send(JSON.stringify(fullMessage));
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  }, [opts.userId, opts.username]);
  
  /**
   * Joins a specific collaboration room
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
    
    const success = sendMessage({
      type: 'join_room',
      roomId,
      username: opts.username
    });
    
    if (success) {
      setCurrentRoom(roomId);
    }
    
    return success;
  }, [opts.username, sendMessage]);
  
  /**
   * Leaves the current collaboration room
   */
  const leaveRoom = useCallback((): boolean => {
    if (!currentRoom) {
      return false;
    }
    
    const success = sendMessage({
      type: 'leave_room',
      roomId: currentRoom
    });
    
    if (success) {
      setCurrentRoom('');
    }
    
    return success;
  }, [currentRoom, sendMessage]);
  
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
  
  // Return the WebSocket interface
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
    userId: opts.userId,
    lastMessage: messages.length > 0 ? messages[messages.length - 1] : null,
    send: sendMessage
  };
}

/**
 * Helper function to create a formatted chat message
 */
export function createChatMessage(
  message: string, 
  userId: string, 
  roomId: string
): WebSocketMessage {
  return {
    type: 'chat_message',
    roomId,
    userId,
    payload: { message },
    timestamp: Date.now()
  };
}