/**
 * WebSocket Context
 * 
 * This context provides WebSocket functionality throughout the application,
 * including connection management, message sending, and message listening.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './auth-context';

// WebSocket message interface
export interface WebSocketMessage {
  id?: string;
  type: string;
  userId?: string;
  agentId?: string;
  content?: any;
  timestamp?: string;
}

// Message listener type
type MessageListener = (message: WebSocketMessage) => void;

// WebSocket context interface
interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: WebSocketMessage) => void;
  addMessageListener: (listener: MessageListener) => () => void;
}

// Create the context
const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  lastMessage: null,
  sendMessage: () => {},
  addMessageListener: () => () => {},
});

// Hook for using the WebSocket context
export const useWebSocketContext = () => useContext(WebSocketContext);

// Provider component
export const WebSocketProvider: React.FC<{
  children: React.ReactNode;
  reconnectInterval?: number;
}> = ({ children, reconnectInterval = 3000 }) => {
  // State
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [messageQueue, setMessageQueue] = useState<WebSocketMessage[]>([]);
  
  // Refs
  const messageListeners = useRef<Set<MessageListener>>(new Set());
  const reconnectTimeoutRef = useRef<number | null>(null);
  
  // Auth context for user ID
  const { user } = useAuth();
  
  /**
   * Establishes a WebSocket connection
   */
  const connect = useCallback(() => {
    // Clear any pending reconnect timeout
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Determine WebSocket URL based on current protocol (http/https)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    // Create new WebSocket connection
    const newSocket = new WebSocket(wsUrl);
    
    // Setup event handlers
    newSocket.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setSocket(newSocket);
      
      // Process any queued messages
      if (messageQueue.length > 0) {
        messageQueue.forEach(msg => {
          try {
            newSocket.send(JSON.stringify(msg));
          } catch (error) {
            console.error('Error sending queued message:', error);
          }
        });
        setMessageQueue([]);
      }
    };
    
    newSocket.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      setIsConnected(false);
      setSocket(null);
      
      // Attempt reconnection after delay
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connect();
      }, reconnectInterval);
    };
    
    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    newSocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        setLastMessage(message);
        
        // Notify all listeners
        messageListeners.current.forEach(listener => {
          try {
            listener(message);
          } catch (listenerError) {
            console.error('Error in message listener:', listenerError);
          }
        });
      } catch (parseError) {
        console.error('Error parsing WebSocket message:', parseError);
      }
    };
    
    return newSocket;
  }, [messageQueue, reconnectInterval]);
  
  // Connect on component mount and reconnect when needed
  useEffect(() => {
    const newSocket = connect();
    
    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (newSocket.readyState === WebSocket.OPEN) {
        newSocket.close();
      }
    };
  }, [connect]);
  
  /**
   * Sends a message through the WebSocket connection
   * 
   * @param message The message to send
   */
  const sendMessage = useCallback((message: WebSocketMessage) => {
    // Add ID, timestamp, and user ID if not provided
    const enhancedMessage: WebSocketMessage = {
      id: message.id || uuidv4(),
      timestamp: message.timestamp || new Date().toISOString(),
      userId: message.userId || (user?.id?.toString() || undefined),
      ...message,
    };
    
    // If connected, send immediately
    if (socket && isConnected && socket.readyState === WebSocket.OPEN) {
      try {
        socket.send(JSON.stringify(enhancedMessage));
      } catch (error) {
        console.error('Error sending message:', error);
        
        // Queue message if sending fails
        setMessageQueue(prev => [...prev, enhancedMessage]);
      }
    } else {
      // Queue message if not connected
      setMessageQueue(prev => [...prev, enhancedMessage]);
      
      // Attempt reconnection if not already trying
      if (!reconnectTimeoutRef.current && (!socket || socket.readyState !== WebSocket.CONNECTING)) {
        connect();
      }
    }
  }, [socket, isConnected, user, connect]);
  
  /**
   * Adds a message listener
   * 
   * @param listener The listener function to add
   * @returns A function to remove the listener
   */
  const addMessageListener = useCallback((listener: MessageListener) => {
    messageListeners.current.add(listener);
    
    // Return function to remove listener
    return () => {
      messageListeners.current.delete(listener);
    };
  }, []);
  
  // Context value
  const contextValue: WebSocketContextType = {
    isConnected,
    lastMessage,
    sendMessage,
    addMessageListener,
  };
  
  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};