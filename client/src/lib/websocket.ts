import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Connection status for the WebSocket
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

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
interface WebSocketOptions {
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
const defaultOptions: Required<WebSocketOptions> = {
  autoReconnect: true,
  initialRetryDelay: 1000,
  maxRetryDelay: 30000,
  backoffFactor: 1.5,
  maxRetries: 0, // 0 means unlimited
  autoJoinRoom: '',
  userId: '',
  username: 'Anonymous',
};

/**
 * Hook for managing WebSocket connections with robust reconnection logic
 */
export function useWebSocket(options: WebSocketOptions = {}) {
  const opts = { ...defaultOptions, ...options };
  
  // WebSocket instance reference
  const socketRef = useRef<WebSocket | null>(null);
  
  // Connection state
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const retries = useRef(0);
  const retryTimeoutRef = useRef<number | null>(null);
  const currentRoomRef = useRef<string>('');
  
  /**
   * Establishes a WebSocket connection
   */
  const connect = useCallback(() => {
    // Clean up any existing connection
    if (socketRef.current) {
      socketRef.current.close();
    }
    
    try {
      // Determine the WebSocket URL based on the current protocol (ws or wss)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      setStatus('connecting');
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      
      socket.onopen = () => {
        setStatus('connected');
        retries.current = 0;
        
        // Automatically join room if specified
        if (opts.autoJoinRoom) {
          joinRoom(opts.autoJoinRoom);
        }
      };
      
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          setMessages((prev) => [...prev, message]);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };
      
      socket.onclose = (event) => {
        setStatus('disconnected');
        
        // Attempt to reconnect if enabled
        if (opts.autoReconnect && !event.wasClean) {
          scheduleReconnect();
        }
      };
      
      socket.onerror = () => {
        setStatus('error');
        
        // We don't close the socket here as the onclose handler will be called
      };
    } catch (err) {
      console.error('WebSocket connection error:', err);
      setStatus('error');
      
      if (opts.autoReconnect) {
        scheduleReconnect();
      }
    }
  }, [opts.autoReconnect, opts.autoJoinRoom]);
  
  /**
   * Schedules a reconnection attempt with exponential backoff
   */
  const scheduleReconnect = useCallback(() => {
    if (retryTimeoutRef.current) {
      window.clearTimeout(retryTimeoutRef.current);
    }
    
    // Check if max retries has been reached
    if (opts.maxRetries > 0 && retries.current >= opts.maxRetries) {
      console.log('Maximum WebSocket reconnection attempts reached');
      return;
    }
    
    // Calculate delay with exponential backoff
    const delay = Math.min(
      opts.initialRetryDelay * Math.pow(opts.backoffFactor, retries.current),
      opts.maxRetryDelay
    );
    
    console.log(`Reconnecting WebSocket in ${delay}ms (attempt ${retries.current + 1})`);
    
    retryTimeoutRef.current = window.setTimeout(() => {
      retries.current += 1;
      connect();
    }, delay);
  }, [
    connect, 
    opts.initialRetryDelay, 
    opts.backoffFactor, 
    opts.maxRetryDelay, 
    opts.maxRetries
  ]);
  
  /**
   * Sends a message through the WebSocket
   */
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      // Add timestamp and user info if not present
      const fullMessage: WebSocketMessage = {
        ...message,
        timestamp: message.timestamp || Date.now(),
        userId: message.userId || opts.userId,
        username: message.username || opts.username,
        roomId: message.roomId || currentRoomRef.current,
      };
      
      socketRef.current.send(JSON.stringify(fullMessage));
      return true;
    }
    return false;
  }, [opts.userId, opts.username]);
  
  /**
   * Joins a specific collaboration room
   */
  const joinRoom = useCallback((roomId: string) => {
    if (roomId) {
      currentRoomRef.current = roomId;
      
      return sendMessage({
        type: 'join_room',
        roomId,
        userId: opts.userId,
        username: opts.username,
      });
    }
    return false;
  }, [sendMessage, opts.userId, opts.username]);
  
  /**
   * Leaves the current collaboration room
   */
  const leaveRoom = useCallback(() => {
    if (currentRoomRef.current) {
      const result = sendMessage({
        type: 'leave_room',
        roomId: currentRoomRef.current,
        userId: opts.userId,
        username: opts.username,
      });
      
      if (result) {
        currentRoomRef.current = '';
      }
      
      return result;
    }
    return false;
  }, [sendMessage, opts.userId, opts.username]);
  
  /**
   * Manually disconnect the WebSocket connection
   */
  const disconnect = useCallback(() => {
    if (retryTimeoutRef.current) {
      window.clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    
    setStatus('disconnected');
  }, []);
  
  // Clear messages state
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);
  
  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);
  
  // Set up heartbeat interval to keep connection alive
  useEffect(() => {
    if (status !== 'connected') return;
    
    const heartbeatInterval = window.setInterval(() => {
      sendMessage({
        type: 'heartbeat',
        timestamp: Date.now(),
      });
    }, 30000); // Send heartbeat every 30 seconds
    
    return () => {
      window.clearInterval(heartbeatInterval);
    };
  }, [status, sendMessage]);
  
  return {
    status,
    messages,
    sendMessage,
    joinRoom,
    leaveRoom,
    connect,
    disconnect,
    clearMessages,
    currentRoom: currentRoomRef.current,
  };
}