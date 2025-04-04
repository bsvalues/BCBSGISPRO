import { useState, useEffect, useCallback, useRef } from 'react';

// Define message types
export enum MessageType {
  CHAT = 'chat',
  DRAWING_UPDATE = 'drawing_update',
  FEATURE_LOCK = 'feature_lock',
  CURSOR_POSITION = 'cursor_position',
  PRESENCE = 'presence',
  SYSTEM = 'system'
}

// Define connection statuses
export enum ConnectionStatus {
  CONNECTED = 'connected',
  CONNECTING = 'connecting',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

// Websocket message interface
export interface WebSocketMessage {
  type: MessageType;
  data?: any;
  source?: string;
  timestamp?: string;
  roomId?: string;
}

// Helper to construct a drawing update message
export function createDrawingUpdateMessage(
  data: any,
  source: string,
  roomId: string = 'default'
): WebSocketMessage {
  return {
    type: MessageType.DRAWING_UPDATE,
    data,
    source,
    roomId,
    timestamp: new Date().toISOString()
  };
}

// Helper to construct a chat message
export function createChatMessage(
  message: string,
  source: string,
  roomId: string = 'default'
): WebSocketMessage {
  return {
    type: MessageType.CHAT,
    data: { message },
    source,
    roomId,
    timestamp: new Date().toISOString()
  };
}

// Custom hook for using WebSockets
export function useWebSocket(
  messageType: MessageType = MessageType.SYSTEM,
  roomId: string = 'default',
  autoReconnect: boolean = true
) {
  // State for connection status
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  
  // State for the last message received
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  
  // State for the last error
  const [error, setError] = useState<Error | null>(null);
  
  // Keep the WebSocket instance in a ref
  const socketRef = useRef<WebSocket | null>(null);
  
  // Track reconnection attempts
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;
  const reconnectTimeoutRef = useRef<number | null>(null);
  
  // Create a WebSocket connection
  const connect = useCallback(() => {
    // Properly handle protocol
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    // Clean up any existing socket
    if (socketRef.current) {
      socketRef.current.close();
    }
    
    try {
      setStatus(ConnectionStatus.CONNECTING);
      
      // Create new WebSocket
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      
      // Connection opened
      socket.addEventListener('open', () => {
        console.log('WebSocket connection established');
        setStatus(ConnectionStatus.CONNECTED);
        reconnectAttemptsRef.current = 0;
        
        // Join the room
        const joinMsg: WebSocketMessage = {
          type: MessageType.SYSTEM,
          data: { action: 'join', roomId },
          timestamp: new Date().toISOString()
        };
        socket.send(JSON.stringify(joinMsg));
      });
      
      // Listen for messages
      socket.addEventListener('message', (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          // Only process messages of the type we're interested in, or system messages
          if (message.type === messageType || message.type === MessageType.SYSTEM) {
            setLastMessage(message);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      });
      
      // Connection closed
      socket.addEventListener('close', (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        setStatus(ConnectionStatus.DISCONNECTED);
        
        // Attempt to reconnect if auto-reconnect is enabled
        if (autoReconnect) {
          reconnect();
        }
      });
      
      // Connection error
      socket.addEventListener('error', (event) => {
        console.error('WebSocket error:', event);
        setStatus(ConnectionStatus.ERROR);
        setError(new Error('WebSocket connection error'));
        
        // Attempt to reconnect if auto-reconnect is enabled
        if (autoReconnect) {
          reconnect();
        }
      });
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setStatus(ConnectionStatus.ERROR);
      setError(err instanceof Error ? err : new Error('Unknown WebSocket error'));
      
      // Attempt to reconnect if auto-reconnect is enabled
      if (autoReconnect) {
        reconnect();
      }
    }
  }, [messageType, roomId, autoReconnect]);
  
  // Reconnect with exponential backoff
  const reconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      setStatus(ConnectionStatus.ERROR);
      setError(new Error('Failed to reconnect after maximum attempts'));
      return;
    }
    
    setStatus(ConnectionStatus.RECONNECTING);
    
    // Clear any existing timeout
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
    }
    
    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    
    // Calculate delay with exponential backoff
    const exponentialDelay = Math.min(
      maxDelay,
      baseDelay * Math.pow(2, reconnectAttemptsRef.current)
    );
    
    // Add jitter to avoid thundering herd problem
    const jitter = Math.random() * 0.5 + 0.75; // Random value between 0.75 and 1.25
    const delay = Math.floor(exponentialDelay * jitter);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
    
    // Set timeout for reconnection
    reconnectTimeoutRef.current = window.setTimeout(() => {
      reconnectAttemptsRef.current += 1;
      connect();
    }, delay);
  }, [connect]);
  
  // Send a message through the WebSocket
  const send = useCallback((message: WebSocketMessage): boolean => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.error('Cannot send message, WebSocket is not open');
      return false;
    }
    
    try {
      socketRef.current.send(JSON.stringify(message));
      return true;
    } catch (err) {
      console.error('Error sending WebSocket message:', err);
      return false;
    }
  }, []);
  
  // Disconnect the WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    
    // Clear any reconnection timeout
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setStatus(ConnectionStatus.DISCONNECTED);
  }, []);
  
  // Connect on component mount and disconnect on unmount
  useEffect(() => {
    connect();
    
    // Cleanup function
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);
  
  return {
    status,
    lastMessage,
    error,
    send,
    connect,
    disconnect
  };
}