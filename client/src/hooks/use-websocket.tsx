import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

type WebSocketMessage = {
  type: string;
  [key: string]: any;
};

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  // Function to establish WebSocket connection
  const connect = useCallback(() => {
    try {
      // Determine the correct protocol (ws or wss) based on page protocol
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      // Create WebSocket connection
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      // Connection opened
      socket.addEventListener('open', () => {
        setIsConnected(true);
        toast({
          title: 'WebSocket Connected',
          description: 'Real-time connection established',
          variant: 'default',
        });
      });

      // Listen for messages
      socket.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          setMessages(prev => [...prev, data]);
          
          // Process specific message types if needed
          if (data.type === 'map_update') {
            // Handle map updates
            console.log('Map update received:', data.data);
          }
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
        }
      });

      // Connection closed
      socket.addEventListener('close', () => {
        setIsConnected(false);
        toast({
          title: 'WebSocket Disconnected',
          description: 'Real-time connection lost',
          variant: 'destructive',
        });
        
        // Attempt to reconnect after a delay
        setTimeout(() => {
          if (socketRef.current?.readyState !== WebSocket.OPEN) {
            connect();
          }
        }, 5000);
      });

      // Connection error
      socket.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: 'WebSocket Error',
          description: 'Error in real-time connection',
          variant: 'destructive',
        });
      });

      return socket;
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
      return null;
    }
  }, [toast]);

  // Send a message through the WebSocket
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Send a ping to keep the connection alive
  const ping = useCallback(() => {
    return sendMessage({
      type: 'ping',
      timestamp: Date.now()
    });
  }, [sendMessage]);

  // Connect when component mounts
  useEffect(() => {
    const socket = connect();
    
    // Set up regular ping to keep connection alive
    const pingInterval = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        ping();
      }
    }, 30000); // 30 seconds

    // Cleanup on unmount
    return () => {
      clearInterval(pingInterval);
      if (socket) {
        socket.close();
      }
    };
  }, [connect, ping]);

  return {
    isConnected,
    messages,
    sendMessage,
    // Function to send map updates
    sendMapUpdate: useCallback((mapData: any) => {
      return sendMessage({
        type: 'map_update',
        data: mapData
      });
    }, [sendMessage])
  };
}