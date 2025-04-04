import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// Message types that can be received from the server
export enum MessageTypeEnum {
  // Room management
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  JOIN = 'join',       // Client-side format
  LEAVE = 'leave',     // Client-side format
  
  // Cursor tracking
  CURSOR_MOVE = 'cursor_move',
  
  // Feature management (server-side format)
  FEATURE_ADD = 'feature_add',
  FEATURE_UPDATE = 'feature_update',
  FEATURE_DELETE = 'feature_delete',
  
  // Feature management (client-side format)
  FEATURE_CREATED = 'feature_created',
  FEATURE_UPDATED = 'feature_updated',
  FEATURE_DELETED = 'feature_deleted',
  
  // Annotation management (server-side format)
  ANNOTATION_ADD = 'annotation_add',
  ANNOTATION_UPDATE = 'annotation_update',
  ANNOTATION_DELETE = 'annotation_delete',
  
  // Annotation management (client-side format)
  ANNOTATION_CREATED = 'annotation_created',
  ANNOTATION_UPDATED = 'annotation_updated',
  ANNOTATION_DELETED = 'annotation_deleted',
  
  // System messages
  HEARTBEAT = 'heartbeat',
  CHAT_MESSAGE = 'chat_message',
  CHAT = 'chat',       // Client-side format
  STATUS = 'status'
}

// WebSocket message interface that can be used for both sending and receiving
export interface WebSocketMessage {
  type: MessageTypeEnum | string;
  roomId?: string;
  userId?: string;
  username?: string;
  payload?: any;        // Server-side format
  data?: any;           // Client-side format
  source?: string;      // Source ID for client-side messaging
  timestamp?: number;
}

interface WebSocketOptions {
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
}

export function useWebSocket(options: WebSocketOptions = {}) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  
  // Default options
  const {
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
    onOpen,
    onClose,
    onError,
    onMessage
  } = options;

  // Initialize WebSocket connection
  const connect = useCallback(() => {
    try {
      // Clean up any existing connection
      if (socket) {
        socket.close();
      }
      
      // Clear any pending reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      setConnecting(true);
      
      // Determine the correct WebSocket URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      // Create a new WebSocket connection
      const newSocket = new WebSocket(wsUrl);
      
      // Set up event handlers
      newSocket.onopen = (event) => {
        console.log('WebSocket connection opened');
        setConnected(true);
        setConnecting(false);
        setReconnectAttempts(0);
        if (onOpen) onOpen(event);
      };
      
      newSocket.onclose = (event) => {
        console.log('WebSocket connection closed', event);
        setConnected(false);
        setConnecting(false);
        if (onClose) onClose(event);
        
        // Attempt to reconnect if enabled
        if (autoReconnect && reconnectAttempts < maxReconnectAttempts) {
          console.log(`Attempting to reconnect (${reconnectAttempts + 1}/${maxReconnectAttempts})...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts((prev) => prev + 1);
            connect();
          }, reconnectInterval);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          console.error('Max reconnect attempts reached.');
          toast({
            title: 'Connection Lost',
            description: 'Unable to reconnect to the collaboration server. Please refresh the page to try again.',
            variant: 'destructive',
          });
        }
      };
      
      newSocket.onerror = (event) => {
        console.error('WebSocket error:', event);
        if (onError) onError(event);
      };
      
      newSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          if (onMessage) onMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      setSocket(newSocket);
      
      // Clean up on unmount
      return () => {
        newSocket.close();
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      setConnecting(false);
      
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to the collaboration server. Please try again later.',
        variant: 'destructive',
      });
      
      return () => {};
    }
  }, [
    socket, 
    autoReconnect, 
    reconnectInterval, 
    maxReconnectAttempts, 
    reconnectAttempts, 
    onOpen, 
    onClose, 
    onError, 
    onMessage,
    toast
  ]);
  
  // Connect on component mount
  useEffect(() => {
    const cleanup = connect();
    
    // Clean up on unmount
    return () => {
      cleanup();
      if (socket) {
        socket.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);
  
  // Utility function to send a message
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return false;
    }
    
    try {
      // Ensure timestamp is set
      if (!message.timestamp) {
        message.timestamp = Date.now();
      }
      
      socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }, [socket]);
  
  // Utility function to disconnect
  const disconnect = useCallback(() => {
    if (socket) {
      socket.close();
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setConnected(false);
    setSocket(null);
  }, [socket]);
  
  return {
    socket,
    connected,
    connecting,
    reconnectAttempts,
    lastMessage,
    connect,
    disconnect,
    sendMessage
  };
}