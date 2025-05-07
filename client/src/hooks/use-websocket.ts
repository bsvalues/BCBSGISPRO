/**
 * Enhanced WebSocket Hook
 * 
 * This hook provides a React interface to the WebSocket service with
 * connection status tracking, message handling, and channel subscription
 * management for the AI agent system.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import websocketService, { 
  WebSocketService, 
  WebSocketMessage, 
  WebSocketEvent 
} from '../services/websocket-service';
import { useCurrentUser } from './use-current-user';

// Connection status type
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

// Hook return type
export interface UseWebSocketReturn {
  // Connection status and management
  status: ConnectionStatus;
  connect: () => Promise<void>;
  disconnect: (reason?: string) => void;
  reconnect: () => Promise<void>;
  
  // Message handling
  sendMessage: (message: WebSocketMessage) => boolean;
  lastMessage: any | null;
  lastError: Error | null;
  
  // Channel management
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
  
  // Event handling
  addMessageListener: (callback: (data: any) => void) => () => void;
}

// Main hook function
export function useWebSocket(
  autoConnect: boolean = true,
  channels: string[] = []
): UseWebSocketReturn {
  const [status, setStatus] = useState<ConnectionStatus>(
    websocketService.isConnected() ? 'connected' : 'disconnected'
  );
  const [lastMessage, setLastMessage] = useState<any | null>(null);
  const [lastError, setLastError] = useState<Error | null>(null);
  const subscribedChannelsRef = useRef<Set<string>>(new Set(channels));
  const messageListenersRef = useRef<Set<(data: any) => void>>(new Set());
  const { user } = useCurrentUser();

  // Set user ID in the WebSocket service when user changes
  useEffect(() => {
    if (user?.id) {
      websocketService.setUserId(user.id);
    } else {
      websocketService.setUserId(null);
    }
  }, [user]);

  // Event handler for WebSocket events
  const handleWebSocketEvent = useCallback((event: WebSocketEvent) => {
    switch (event.type) {
      case 'connected':
        setStatus('connected');
        break;
      
      case 'disconnected':
        setStatus('disconnected');
        break;
      
      case 'reconnecting':
        setStatus('connecting');
        break;
      
      case 'message':
        setLastMessage(event.data);
        // Notify all message listeners
        messageListenersRef.current.forEach(listener => {
          try {
            listener(event.data);
          } catch (error) {
            console.error('Error in WebSocket message listener:', error);
          }
        });
        break;
      
      case 'error':
        setLastError(event.error);
        break;
    }
  }, []);

  // Setup WebSocket event listener
  useEffect(() => {
    const cleanup = websocketService.addEventListener(handleWebSocketEvent);
    
    // Auto-connect if enabled
    if (autoConnect) {
      websocketService.connect().catch(error => {
        console.error('Failed to auto-connect WebSocket:', error);
      });
    }
    
    // Initialize connection status
    setStatus(websocketService.getState());
    
    return () => {
      cleanup();
    };
  }, [autoConnect, handleWebSocketEvent]);

  // Subscribe to channels
  useEffect(() => {
    // Subscribe to new channels
    channels.forEach(channel => {
      if (!subscribedChannelsRef.current.has(channel)) {
        subscribedChannelsRef.current.add(channel);
        websocketService.subscribe(channel);
      }
    });
    
    // Unsubscribe from removed channels
    subscribedChannelsRef.current.forEach(channel => {
      if (!channels.includes(channel)) {
        subscribedChannelsRef.current.delete(channel);
        websocketService.unsubscribe(channel);
      }
    });
    
    // Update the ref
    subscribedChannelsRef.current = new Set(channels);
    
    // Cleanup: unsubscribe from all channels
    return () => {
      subscribedChannelsRef.current.forEach(channel => {
        websocketService.unsubscribe(channel);
      });
    };
  }, [channels]);

  // Connection functions
  const connect = useCallback(() => {
    setStatus('connecting');
    return websocketService.connect();
  }, []);
  
  const disconnect = useCallback((reason?: string) => {
    websocketService.disconnect(reason);
  }, []);
  
  const reconnect = useCallback(() => {
    setStatus('connecting');
    return websocketService.reset();
  }, []);

  // Message functions
  const sendMessage = useCallback((message: WebSocketMessage) => {
    return websocketService.send(message);
  }, []);

  // Channel functions
  const subscribe = useCallback((channel: string) => {
    subscribedChannelsRef.current.add(channel);
    websocketService.subscribe(channel);
  }, []);
  
  const unsubscribe = useCallback((channel: string) => {
    subscribedChannelsRef.current.delete(channel);
    websocketService.unsubscribe(channel);
  }, []);

  // Add message listener
  const addMessageListener = useCallback((callback: (data: any) => void) => {
    messageListenersRef.current.add(callback);
    
    // Return function to remove the listener
    return () => {
      messageListenersRef.current.delete(callback);
    };
  }, []);

  return {
    status,
    connect,
    disconnect,
    reconnect,
    sendMessage,
    lastMessage,
    lastError,
    subscribe,
    unsubscribe,
    addMessageListener
  };
}

export default useWebSocket;