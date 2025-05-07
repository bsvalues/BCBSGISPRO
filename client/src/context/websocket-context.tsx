import React, { createContext, useContext, useEffect } from 'react';
import { useWebSocket } from '../hooks/use-websocket';
import { useAuth } from './auth-context';

// WebSocket context type
interface WebSocketContextType {
  status: 'disconnected' | 'connecting' | 'connected';
  connect: () => void;
  disconnect: () => void;
  subscribeToAchievements: (userId: number) => void;
  subscribeToWorkflow: (workflowId: number) => void;
  unsubscribe: (channel: string) => void;
}

// Create the context with default values
const WebSocketContext = createContext<WebSocketContextType>({
  status: 'disconnected',
  connect: () => {},
  disconnect: () => {},
  subscribeToAchievements: () => {},
  subscribeToWorkflow: () => {},
  unsubscribe: () => {}
});

// Custom hook to use the WebSocket context
export const useWebSocketContext = () => useContext(WebSocketContext);

// WebSocket provider component
export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { status, connect, disconnect, subscribeToAchievements, subscribeToWorkflow, unsubscribe } = useWebSocket();
  const { user } = useAuth();

  // Auto-subscribe to user's achievement channel when user is available
  useEffect(() => {
    if (user && typeof user.id === 'string') {
      // Convert string ID to number for the WebSocket subscription 
      const userId = parseInt(user.id);
      if (!isNaN(userId)) {
        subscribeToAchievements(userId);
      }
    }
  }, [user, subscribeToAchievements]);

  return (
    <WebSocketContext.Provider
      value={{
        status,
        connect,
        disconnect,
        subscribeToAchievements,
        subscribeToWorkflow,
        unsubscribe
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};