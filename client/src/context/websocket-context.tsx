/**
 * WebSocket Context
 * 
 * This context provides application-wide access to the WebSocket connection
 * and related functionality for real-time communication.
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import useWebSocket, { ConnectionStatus, UseWebSocketReturn } from '../hooks/use-websocket';
import { useToast } from '../hooks/use-toast';

// AI Agent channel subscriptions
const AGENT_CHANNELS = [
  'agent-updates',
  'system-announcements'
];

// Context interface
interface WebSocketContextValue extends UseWebSocketReturn {
  // Additional context-specific properties
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  isReconnecting: boolean;
  hasConnectionError: boolean;
  reconnectionAttempts: number;
}

// Create context with default values
const WebSocketContext = createContext<WebSocketContextValue | null>(null);

// Props for the provider component
interface WebSocketProviderProps {
  children: React.ReactNode;
}

// Provider component
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [reconnectionAttempts, setReconnectionAttempts] = useState(0);
  const { toast } = useToast();
  
  // Initialize the WebSocket hook with auto-connect and agent channels
  const websocket = useWebSocket(true, AGENT_CHANNELS);
  
  // Compute additional status indicators
  const connectionStatus = websocket.status;
  const isConnected = connectionStatus === 'connected';
  const isReconnecting = connectionStatus === 'connecting';
  const hasConnectionError = !!websocket.lastError;
  
  // Handle connection status changes
  useEffect(() => {
    if (connectionStatus === 'connected') {
      // Reset reconnection attempts on successful connection
      if (reconnectionAttempts > 0) {
        // Show reconnection success toast only if we were previously disconnected
        toast({
          title: 'Connection Restored',
          description: 'Real-time connection has been re-established.',
          variant: 'success',
          duration: 3000
        });
        setReconnectionAttempts(0);
      }
    } 
    else if (connectionStatus === 'connecting') {
      // Increment reconnection attempts when trying to reconnect
      setReconnectionAttempts(prev => prev + 1);
      
      // Show reconnection toast if attempts are greater than 1
      if (reconnectionAttempts > 0) {
        toast({
          title: 'Reconnecting...',
          description: `Attempting to restore real-time connection (${reconnectionAttempts})`,
          variant: 'loading',
          duration: 5000
        });
      }
    } 
    else if (connectionStatus === 'disconnected' && reconnectionAttempts > 0) {
      // Only show disconnection toast if we were previously connected
      toast({
        title: 'Connection Lost',
        description: 'Real-time connection has been lost. Attempting to reconnect...',
        variant: 'warning',
        duration: 5000
      });
    }
  }, [connectionStatus, reconnectionAttempts, toast]);

  // Handle critical connection errors
  useEffect(() => {
    if (websocket.lastError && reconnectionAttempts > 5) {
      toast({
        title: 'Connection Error',
        description: 'Unable to establish real-time connection. Some features may be limited.',
        variant: 'destructive',
        duration: 10000
      });
    }
  }, [websocket.lastError, reconnectionAttempts, toast]);
  
  // Create context value with additional properties
  const contextValue = useMemo(() => ({
    ...websocket,
    connectionStatus,
    isConnected,
    isReconnecting,
    hasConnectionError,
    reconnectionAttempts
  }), [
    websocket,
    connectionStatus,
    isConnected,
    isReconnecting,
    hasConnectionError,
    reconnectionAttempts
  ]);
  
  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom hook to use the WebSocket context
export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  
  return context;
};

export default WebSocketContext;