import { useState, useEffect, useCallback, useRef } from 'react';

import { 
  ConnectionStatusEnum, 
  MessageTypeEnum,
  WebSocketMessage as WSMessage,
  createChatMessage
} from '@/lib/websocket';

// Re-export the types 
export { 
  ConnectionStatusEnum, 
  MessageTypeEnum,
  createChatMessage
};

// Define WebSocketMessage for compatibility
export type WebSocketMessage = WSMessage;

// Define WebSocketOptions interface since it's not exported from lib/websocket
export interface WebSocketOptions {
  autoReconnect?: boolean;
  initialRetryDelay?: number;
  maxRetryDelay?: number;
  backoffFactor?: number;
  maxRetries?: number;
  autoJoinRoom?: string;
  roomId?: string;
  userId?: string;
  username?: string;
}

/**
 * Hook for using WebSocket in React components
 */
export function useWebSocket(options = {}) {
  // State to store WebSocket and connection status
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  
  // Use a ref to maintain connection status across renders
  const socketRef = useRef<WebSocket | null>(null);
  
  // Setup WebSocket connection
  useEffect(() => {
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;
    setSocket(ws);
    
    // Setup event handlers
    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
      socketRef.current = null;
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setLastMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, []);
  
  // Reconnect function
  const reconnect = useCallback(() => {
    if (socketRef.current && (
        socketRef.current.readyState === WebSocket.OPEN || 
        socketRef.current.readyState === WebSocket.CONNECTING
    )) {
      socketRef.current.close();
    }
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;
    setSocket(ws);
    
    ws.onopen = () => {
      console.log('WebSocket reconnected');
      setConnected(true);
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
      socketRef.current = null;
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setLastMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }, []);
  
  // Return the WebSocket interface
  return {
    socket,
    connected,
    lastMessage,
    reconnect
  };
}