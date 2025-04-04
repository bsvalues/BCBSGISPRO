import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

// WebSocket connection status
export enum ConnectionStatus {
  CONNECTED = 'connected',
  CONNECTING = 'connecting',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

// WebSocket message types
export enum MessageType {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  CHAT = 'chat',
  DRAWING = 'drawing',
  DRAWING_UPDATE = 'drawing_update',
  PRESENCE = 'presence',
  ERROR = 'error'
}

// WebSocket message interface
export interface WebSocketMessage {
  id?: string;
  type: MessageType;
  roomId?: string;
  source?: string;
  timestamp?: string;
  data?: any;
}

/**
 * Create a chat message to send via WebSocket
 * 
 * @param content The message content
 * @param userId The user ID sending the message
 * @param roomId The room ID where the message should be sent
 * @returns A WebSocketMessage formatted for chat
 */
export function createChatMessage(content: string, userId: string, roomId: string): WebSocketMessage {
  return {
    id: uuidv4(),
    type: MessageType.CHAT,
    roomId,
    source: userId,
    timestamp: new Date().toISOString(),
    data: {
      message: content
    }
  };
}

// Max reconnection attempts
const MAX_RECONNECT_ATTEMPTS = 10;
// Initial reconnection delay in ms
const INITIAL_RECONNECT_DELAY = 1000;

/**
 * React hook for WebSocket connections with auto-reconnect and room management
 * 
 * @param roomId The room ID to join
 * @returns WebSocket connection utilities
 */
export function useWebSocket(roomId: string = 'default') {
  // Connection status
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  
  // Last received message
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  
  // Error state
  const [error, setError] = useState<Error | null>(null);
  
  // Collaborators in the room
  const [collaborators, setCollaborators] = useState<string[]>([]);
  
  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);
  
  // Reconnection attempts counter
  const reconnectAttemptsRef = useRef(0);
  
  // Reconnection timeout reference
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // User ID (generated once per session)
  const userIdRef = useRef<string>(localStorage.getItem('bentonGisUserId') || uuidv4());
  
  // Generate a random session ID for this connection
  const sessionIdRef = useRef<string>(uuidv4());
  
  // Pending messages queue for when connection is lost
  const pendingMessagesRef = useRef<WebSocketMessage[]>([]);
  
  // Save user ID to localStorage
  useEffect(() => {
    localStorage.setItem('bentonGisUserId', userIdRef.current);
  }, []);
  
  // Create WebSocket connection
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    try {
      // Determine WebSocket protocol (ws or wss)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      // Set status to connecting
      setStatus(ConnectionStatus.CONNECTING);
      
      // Handle WebSocket open event
      ws.onopen = () => {
        // Reset reconnection attempts
        reconnectAttemptsRef.current = 0;
        
        // Set status to connected
        setStatus(ConnectionStatus.CONNECTED);
        
        // Send connection message
        const connectMessage: WebSocketMessage = {
          id: uuidv4(),
          type: MessageType.CONNECT,
          roomId,
          source: userIdRef.current,
          timestamp: new Date().toISOString(),
          data: {
            sessionId: sessionIdRef.current,
            userId: userIdRef.current
          }
        };
        
        ws.send(JSON.stringify(connectMessage));
        
        // Send any pending messages
        if (pendingMessagesRef.current.length > 0) {
          pendingMessagesRef.current.forEach(message => {
            ws.send(JSON.stringify(message));
          });
          pendingMessagesRef.current = [];
        }
      };
      
      // Handle WebSocket message event
      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          
          // Track collaborators when receiving presence messages
          if (message.type === MessageType.PRESENCE && message.roomId === roomId) {
            if (message.data && Array.isArray(message.data.users)) {
              // Filter out current user from collaborators list
              const otherUsers = message.data.users.filter(
                (userId: string) => userId !== userIdRef.current
              );
              setCollaborators(otherUsers);
            }
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      
      // Handle WebSocket close event
      ws.onclose = () => {
        // Skip if closing was intentional
        if (status === ConnectionStatus.DISCONNECTED) return;
        
        // Set status to disconnected
        setStatus(ConnectionStatus.DISCONNECTED);
        
        // Attempt to reconnect
        attemptReconnect();
      };
      
      // Handle WebSocket error event
      ws.onerror = (e) => {
        setError(new Error('WebSocket error'));
        setStatus(ConnectionStatus.ERROR);
        
        console.error('WebSocket error:', e);
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown WebSocket error'));
      setStatus(ConnectionStatus.ERROR);
      
      // Attempt to reconnect
      attemptReconnect();
    }
  }, [roomId, status]);
  
  // Attempt to reconnect with exponential backoff
  const attemptReconnect = useCallback(() => {
    // Clean up any existing reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Check if max reconnection attempts reached
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
      setStatus(ConnectionStatus.ERROR);
      
      // Reset reconnection count after a longer delay and try again
      // This helps if the server was temporarily down but is back up
      setTimeout(() => {
        console.log('Resetting reconnection attempts and trying again...');
        reconnectAttemptsRef.current = 0;
        connect();
      }, INITIAL_RECONNECT_DELAY * 10);
      
      return;
    }
    
    // Increment reconnection attempts
    reconnectAttemptsRef.current++;
    
    // Calculate backoff delay: initial * (2^attempts) with some randomization
    // to prevent thundering herd
    const backoffDelay = 
      INITIAL_RECONNECT_DELAY * 
      Math.pow(1.5, reconnectAttemptsRef.current - 1) * // Use 1.5 instead of 2 for a gentler curve
      (0.75 + Math.random() * 0.5);
    
    // Cap the maximum delay at 15 seconds
    const cappedDelay = Math.min(backoffDelay, 15000);
    
    // Set status to reconnecting
    setStatus(ConnectionStatus.RECONNECTING);
    
    // Schedule reconnection
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...`);
      connect();
    }, cappedDelay);
  }, [connect]);
  
  // Send a message through the WebSocket
  const send = useCallback((message: WebSocketMessage): boolean => {
    // Add ID and timestamp if not provided
    const completeMessage: WebSocketMessage = {
      id: message.id || uuidv4(),
      timestamp: message.timestamp || new Date().toISOString(),
      source: message.source || userIdRef.current,
      ...message
    };
    
    // Check if WebSocket is open
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(completeMessage));
      return true;
    } else {
      // Queue message for later
      pendingMessagesRef.current.push(completeMessage);
      
      // Try to reconnect if not already reconnecting
      if (status !== ConnectionStatus.CONNECTING && status !== ConnectionStatus.RECONNECTING) {
        connect();
      }
      
      return false;
    }
  }, [status, connect]);
  
  // Close the WebSocket connection
  const disconnect = useCallback(() => {
    // Clean up any existing reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Set status to disconnected
    setStatus(ConnectionStatus.DISCONNECTED);
    
    // Close WebSocket if it exists
    if (wsRef.current) {
      // Send disconnect message if WebSocket is open
      if (wsRef.current.readyState === WebSocket.OPEN) {
        const disconnectMessage: WebSocketMessage = {
          id: uuidv4(),
          type: MessageType.DISCONNECT,
          roomId,
          source: userIdRef.current,
          timestamp: new Date().toISOString(),
          data: {
            sessionId: sessionIdRef.current,
            userId: userIdRef.current
          }
        };
        
        wsRef.current.send(JSON.stringify(disconnectMessage));
      }
      
      wsRef.current.close();
      wsRef.current = null;
    }
  }, [roomId]);
  
  // Connect on mount
  useEffect(() => {
    connect();
    
    // Disconnect on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);
  
  // Create an effect to handle status changes and notify through callbacks
  useEffect(() => {
    // Set up status change callback
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      // Create and dispatch a custom event for connection status changes
      const event = new CustomEvent('websocket-status-change', { 
        detail: { status, roomId } 
      });
      window.dispatchEvent(event);
    }
  }, [status, roomId]);
  
  // Return hook values
  return {
    status,
    lastMessage,
    error,
    send,
    connect,
    disconnect,
    userId: userIdRef.current,
    collaborators
  };
}