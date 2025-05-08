/**
 * WebSocket Context
 * 
 * This context provides a centralized way to manage WebSocket connections throughout the application,
 * handling connection state, message sending/receiving, and automatic reconnection.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '../hooks/use-toast';
import { useAuth } from './auth-context';

// WebSocket message interface
export interface WebSocketMessage {
  type: string;
  userId?: number;
  agentId?: string;
  content?: any;
  timestamp?: string;
  metadata?: Record<string, any>;
}

// WebSocket message listener type
export type WebSocketListener = (data: WebSocketMessage) => void;

// WebSocket context interface
interface WebSocketContextValue {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: WebSocketMessage) => boolean;
  addMessageListener: (listener: WebSocketListener) => () => void;
  removeMessageListener: (listener: WebSocketListener) => void;
}

// Create context with default values
const WebSocketContext = createContext<WebSocketContextValue>({
  isConnected: false,
  lastMessage: null,
  sendMessage: () => false,
  addMessageListener: () => () => {},
  removeMessageListener: () => {}
});

// Export hook to use the WebSocket context
export const useWebSocketContext = () => useContext(WebSocketContext);

// WebSocket Provider component
export const WebSocketProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageQueueRef = useRef<WebSocketMessage[]>([]);
  const listenersRef = useRef<Set<WebSocketListener>>(new Set());
  const reconnectAttemptsRef = useRef(0);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Create WebSocket connection
  const createConnection = useCallback(() => {
    try {
      // Close existing socket if any
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
      
      // Clear any pending reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Determine WebSocket URL based on current location
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      // Create new WebSocket connection
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      
      // Socket open handler
      socket.onopen = () => {
        console.log('WebSocket connection established');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        
        // Send any queued messages
        if (messageQueueRef.current.length > 0) {
          console.log(`Sending ${messageQueueRef.current.length} queued messages`);
          messageQueueRef.current.forEach(message => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify(message));
            }
          });
          messageQueueRef.current = [];
        }
        
        // Send heartbeat to keep connection alive
        socket.send(JSON.stringify({ type: 'heartbeat' }));
      };
      
      // Socket message handler
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketMessage;
          setLastMessage(data);
          
          // Notify all listeners
          listenersRef.current.forEach(listener => {
            try {
              listener(data);
            } catch (error) {
              console.error('Error in WebSocket listener:', error);
            }
          });
          
          // Handle specific message types
          if (data.type === 'notification') {
            toast({
              title: data.content?.title || 'Notification',
              description: data.content?.message || '',
              variant: data.content?.variant || 'default'
            });
          }
          else if (data.type === 'error') {
            toast({
              title: 'Error',
              description: data.content?.message || 'An error occurred',
              variant: 'destructive'
            });
          }
          else if (data.type === 'achievement') {
            toast({
              title: '🏆 Achievement Unlocked!',
              description: data.content?.name || 'New achievement',
              variant: 'success',
              duration: 5000
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error, event.data);
        }
      };
      
      // Socket close handler
      socket.onclose = (event) => {
        console.log('WebSocket connection closed', event.code, event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect if not a clean close
        if (event.code !== 1000) {
          const delay = Math.min(1000 * Math.pow(1.5, reconnectAttemptsRef.current), 30000);
          console.log(`Attempting to reconnect in ${delay}ms...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            createConnection();
          }, delay);
        }
      };
      
      // Socket error handler
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
      
      return socket;
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setIsConnected(false);
      return null;
    }
  }, [toast]);
  
  // Send WebSocket message
  const sendMessage = useCallback((message: WebSocketMessage): boolean => {
    // Add timestamp if not provided
    if (!message.timestamp) {
      message.timestamp = new Date().toISOString();
    }
    
    // Add user ID if authenticated and not provided
    if (user?.id && !message.userId) {
      message.userId = user.id;
    }
    
    // Check if socket is open
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        // Queue message for retry
        messageQueueRef.current.push(message);
        return false;
      }
    } else {
      // Queue message for when connection is established
      console.log('WebSocket not connected, queueing message', message);
      messageQueueRef.current.push(message);
      
      // Try to reconnect if socket is closed
      if (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED) {
        createConnection();
      }
      
      return false;
    }
  }, [user, createConnection]);
  
  // Add WebSocket message listener
  const addMessageListener = useCallback((listener: WebSocketListener) => {
    listenersRef.current.add(listener);
    
    // Return function to remove listener
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);
  
  // Remove WebSocket message listener
  const removeMessageListener = useCallback((listener: WebSocketListener) => {
    listenersRef.current.delete(listener);
  }, []);
  
  // Initialize WebSocket connection
  useEffect(() => {
    const socket = createConnection();
    
    // Setup heartbeat interval to keep connection alive
    const heartbeatInterval = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'heartbeat' }));
      }
    }, 30000); // 30 seconds
    
    // Cleanup on unmount
    return () => {
      clearInterval(heartbeatInterval);
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (socket) {
        socket.close();
      }
    };
  }, [createConnection]);
  
  // Context value
  const value: WebSocketContextValue = {
    isConnected,
    lastMessage,
    sendMessage,
    addMessageListener,
    removeMessageListener
  };
  
  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext;