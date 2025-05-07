import { useEffect, useRef, useState, useCallback } from 'react';
import { useToast } from './use-toast';
import { useAuth } from '../context/auth-context';

// Message types from WebSocket server
interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

// Achievement notification message
interface AchievementMessage extends WebSocketMessage {
  type: 'achievement-earned';
  achievement: {
    id: number;
    title: string;
    description: string;
    points: number;
    icon: string;
    category: string;
  };
  userAchievement: {
    id: number;
    userId: number;
    achievementId: number;
    progress: number;
    earnedAt?: string;
    metadata?: any;
  };
}

// Workflow update message
interface WorkflowUpdateMessage extends WebSocketMessage {
  type: 'workflow-update';
  status: string;
  data: any;
}

// System notification message
interface SystemNotificationMessage extends WebSocketMessage {
  type: 'system-notification';
  title: string;
  message: string;
  level: 'info' | 'warning' | 'error';
  timestamp: string;
}

// Connection status
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

/**
 * Custom hook for WebSocket communication
 */
export function useWebSocket() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const socketRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  // Convert string ID from auth context to number for WebSocket
  const userId = user ? parseInt(user.id) : undefined;
  
  // Connect to WebSocket server
  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }
    
    try {
      setStatus('connecting');
      
      // Determine WebSocket URL based on current window location
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log(`Connecting to WebSocket server at ${wsUrl}`);
      
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log('WebSocket connection established');
        setStatus('connected');
        
        // Subscribe to achievement notifications if user is logged in
        if (userId) {
          subscribeToAchievements(userId);
        }
      };
      
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      socket.onclose = (event) => {
        console.log(`WebSocket connection closed: ${event.code} - ${event.reason}`);
        setStatus('disconnected');
        
        // Try to reconnect after a delay if not closed intentionally
        if (event.code !== 1000) {
          setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, 5000); // 5 second delay
        }
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      socketRef.current = socket;
    } catch (error) {
      console.error('Error connecting to WebSocket server:', error);
      setStatus('disconnected');
    }
  }, [userId]);
  
  // Subscribe to achievement notifications for a user
  const subscribeToAchievements = useCallback((userId: number) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const message = {
        type: 'subscribe',
        channel: `user-achievements-${userId}`
      };
      
      socketRef.current.send(JSON.stringify(message));
      console.log(`Subscribed to achievements for user ${userId}`);
    }
  }, []);
  
  // Subscribe to workflow updates
  const subscribeToWorkflow = useCallback((workflowId: number) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const message = {
        type: 'subscribe',
        channel: `workflow-${workflowId}`
      };
      
      socketRef.current.send(JSON.stringify(message));
      console.log(`Subscribed to workflow ${workflowId} updates`);
    }
  }, []);
  
  // Unsubscribe from a channel
  const unsubscribe = useCallback((channel: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const message = {
        type: 'unsubscribe',
        channel
      };
      
      socketRef.current.send(JSON.stringify(message));
      console.log(`Unsubscribed from ${channel}`);
    }
  }, []);
  
  // Handle incoming WebSocket messages
  const handleMessage = useCallback((message: WebSocketMessage) => {
    console.log('Received WebSocket message:', message);
    
    switch (message.type) {
      case 'achievement-earned': {
        const achievementMsg = message as AchievementMessage;
        
        // Show achievement notification
        toast({
          title: `Achievement Unlocked: ${achievementMsg.achievement.title}`,
          description: achievementMsg.achievement.description,
          duration: 5000,
          variant: 'success',
        });
        
        // Trigger any achievement-specific events (like animations or sounds)
        const achievementEvent = new CustomEvent('achievement-earned', { 
          detail: achievementMsg 
        });
        
        window.dispatchEvent(achievementEvent);
        break;
      }
      
      case 'workflow-update': {
        const workflowMsg = message as WorkflowUpdateMessage;
        
        // Trigger workflow update event
        const workflowEvent = new CustomEvent('workflow-update', { 
          detail: workflowMsg 
        });
        
        window.dispatchEvent(workflowEvent);
        break;
      }
      
      case 'system-notification': {
        const notificationMsg = message as SystemNotificationMessage;
        
        // Show system notification
        toast({
          title: notificationMsg.title,
          description: notificationMsg.message,
          duration: 5000,
          // Map notification level to appropriate toast variant
          variant: notificationMsg.level === 'error' ? 'error' : 
                  notificationMsg.level === 'warning' ? 'warning' : 'info',
        });
        break;
      }
      
      case 'connected':
        console.log('Received connected confirmation:', message);
        break;
        
      case 'subscribed':
        console.log('Subscription confirmed:', message);
        break;
        
      case 'unsubscribed':
        console.log('Unsubscription confirmed:', message);
        break;
        
      default:
        console.log('Unhandled message type:', message.type);
        break;
    }
  }, [toast]);
  
  // Disconnect from WebSocket server
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close(1000, 'User initiated disconnect');
      socketRef.current = null;
      setStatus('disconnected');
    }
  }, []);
  
  // Connect on initial render and when user changes
  useEffect(() => {
    // Disconnect existing connection if the user changes
    if (socketRef.current) {
      disconnect();
    }
    
    // Connect only if there's a logged-in user
    if (userId) {
      connect();
    }
    
    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [userId, connect, disconnect]);
  
  return {
    status,
    connect,
    disconnect,
    subscribeToAchievements,
    subscribeToWorkflow,
    unsubscribe
  };
}