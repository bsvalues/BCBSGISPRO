import { useState, useEffect, useCallback, useRef } from 'react';
import { createWebSocket } from '../lib/websocket';

/**
 * WebSocket hook options
 */
export interface UseWebSocketOptions {
  // Optional room path to append to the base WebSocket URL
  roomPath?: string;
  
  // Auto connect on mount
  autoConnect?: boolean;
  
  // Auto reconnect on close/error
  autoReconnect?: boolean;
  
  // Maximum reconnect attempts
  maxReconnectAttempts?: number;
  
  // Base reconnect delay in ms
  reconnectDelay?: number;
  
  // Event handlers
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  
  // User ID for user-specific messages
  userId?: string;
  
  // Room ID for room-specific messages
  roomId?: string;
  
  // Auto join room on connection
  autoJoinRoom?: boolean;
}

/**
 * WebSocket connection status
 */
export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

/**
 * WebSocket hook result
 */
export interface UseWebSocketResult {
  // WebSocket instance (null when disconnected)
  socket: WebSocket | null;
  
  // Connection status
  status: WebSocketStatus;
  
  // Connection status helpers
  connected: boolean;
  
  // Last received message
  lastMessage: any;
  
  // All messages received (for components that need message history)
  messages: any[];
  
  // Connection operations
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  
  // Send message (accepts string or object that will be JSON stringified)
  sendMessage: (message: any) => boolean;
  
  // Alias for sendMessage for backwards compatibility
  send: (message: any) => boolean;
  
  // Optional room and user ID for room-based messaging
  roomId?: string;
  userId?: string;
}

/**
 * React hook for WebSocket connections
 */
export function useWebSocket({
  roomPath = '',
  autoConnect = true,
  autoReconnect = true,
  maxReconnectAttempts = 5,
  reconnectDelay = 1000,
  onOpen,
  onMessage,
  onClose,
  onError,
  userId = undefined,
  roomId = undefined,
  autoJoinRoom = false
}: UseWebSocketOptions = {}): UseWebSocketResult {
  // WebSocket connection state
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  
  // References for reconnection
  const reconnectAttempts = useRef<number>(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  
  // Forward reference for reconnect function to solve circular dependency
  const reconnectFnRef = useRef<() => void>();
  
  // Forward reference for connect function to solve circular dependency
  const connectFnRef = useRef<() => WebSocket | null>();
  
  // Function to handle reconnection with exponential backoff
  const doReconnect = useCallback(() => {
    // Cancel any pending reconnection
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Check if maximum reconnect attempts reached
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.warn(`[WS-HOOK] Maximum reconnect attempts (${maxReconnectAttempts}) reached`);
      setStatus('disconnected');
      return;
    }
    
    // Calculate backoff delay with jitter
    const delay = Math.min(
      reconnectDelay * Math.pow(1.5, reconnectAttempts.current) + Math.random() * 1000,
      30000 // Maximum 30 seconds
    );
    
    // Update state
    setStatus('reconnecting');
    reconnectAttempts.current += 1;
    
    console.log(`[WS-HOOK] Scheduling reconnection attempt ${reconnectAttempts.current}/${maxReconnectAttempts} in ${delay}ms`);
    
    // Schedule reconnection
    reconnectTimeoutRef.current = window.setTimeout(() => {
      console.log(`[WS-HOOK] Executing reconnection attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`);
      
      // Clear socket reference to ensure a fresh connection
      setSocket(null);
      
      // Use the ref to get the latest connect function
      if (connectFnRef.current) {
        connectFnRef.current();
      }
    }, delay);
  }, [maxReconnectAttempts, reconnectDelay]);
  
  // Store the latest reconnect function in the ref
  useEffect(() => {
    reconnectFnRef.current = doReconnect;
  }, [doReconnect]);
  
  // Helper function to set up WebSocket event listeners
  const setupSocketEventListeners = useCallback((newSocket: WebSocket) => {
    // Set up event handlers with improved error handling
    newSocket.addEventListener('open', (event) => {
      console.log(`[WS-HOOK] WebSocket connection established successfully to ${newSocket.url}`);
      setStatus('connected');
      reconnectAttempts.current = 0;
      if (onOpen) {
        try {
          onOpen(event);
        } catch (handlerError) {
          console.error('[WS-HOOK] Error in onOpen handler:', handlerError);
        }
      }
    });
    
    newSocket.addEventListener('message', (event) => {
      const now = new Date().toISOString();
      console.log(`[WS-HOOK] ${now} WebSocket message received`);
      
      let parsedData;
      
      // Try to parse the data if it's a string
      if (typeof event.data === 'string') {
        try {
          parsedData = JSON.parse(event.data);
          console.log(`[WS-HOOK] Parsed WebSocket message:`, parsedData);
        } catch (parseError) {
          console.log(`[WS-HOOK] Received non-JSON message:`, event.data);
          parsedData = event.data;
        }
      } else {
        console.log(`[WS-HOOK] Received non-string message type:`, typeof event.data);
        parsedData = event.data;
      }
      
      // Create message object
      const messageObject = {
        data: parsedData,
        original: event,
        timestamp: new Date()
      };
      
      // Update last message state
      setLastMessage(messageObject);
      
      // Add to messages array
      setMessages(prevMessages => [...prevMessages, messageObject]);
      
      // Call user message handler if provided
      if (onMessage) {
        try {
          onMessage(event);
        } catch (handlerError) {
          console.error('Error in onMessage handler:', handlerError);
        }
      }
    });
    
    newSocket.addEventListener('close', (event) => {
      console.log(`[WS-HOOK] WebSocket connection closed: Code=${event.code}, Reason=${event.reason || 'No reason provided'}, Clean=${event.wasClean}`);
      
      // Provide more detailed diagnostics based on close code
      switch (event.code) {
        case 1000:
          console.log('[WS-HOOK] Normal closure - the connection successfully completed operation');
          break;
        case 1001:
          console.log('[WS-HOOK] Endpoint going away - server is shutting down or browser navigated away');
          break;
        case 1002:
          console.log('[WS-HOOK] Protocol error - endpoint terminated connection due to protocol error');
          break;
        case 1003:
          console.log('[WS-HOOK] Unsupported data - endpoint received data of a type it cannot accept');
          break;
        case 1005:
          console.log('[WS-HOOK] No status received - used when there is no status code in the close frame');
          break;
        case 1006:
          console.log('[WS-HOOK] Abnormal closure - connection was closed abnormally without a close frame');
          break;
        case 1007:
          console.log('[WS-HOOK] Invalid frame payload data - endpoint received message with inconsistent data');
          break;
        case 1008:
          console.log('[WS-HOOK] Policy violation - endpoint terminated connection due to message violating policy');
          break;
        case 1009:
          console.log('[WS-HOOK] Message too big - message too large to process');
          break;
        case 1010:
          console.log('[WS-HOOK] Mandatory extension - client terminated because server did not negotiate extension');
          break;
        case 1011:
          console.log('[WS-HOOK] Internal error - server encountered unexpected condition preventing request');
          break;
        case 1012:
          console.log('[WS-HOOK] Service restart - server is restarting');
          break;
        case 1013:
          console.log('[WS-HOOK] Try again later - server is temporarily unable to service the request');
          break;
        case 1014:
          console.log('[WS-HOOK] Bad gateway - server acting as gateway received invalid response');
          break;
        case 1015:
          console.log('[WS-HOOK] TLS handshake failure');
          break;
        default:
          console.log(`[WS-HOOK] Unknown close code: ${event.code}`);
      }
      
      setStatus('disconnected');
      
      if (onClose) {
        try {
          onClose(event);
        } catch (handlerError) {
          console.error('[WS-HOOK] Error in onClose handler:', handlerError);
        }
      }
      
      // Attempt reconnection if enabled and not explicitly closed
      if (autoReconnect && (!event.wasClean || event.code !== 1000)) {
        console.log('[WS-HOOK] Attempting automatic reconnection after close...');
        // Use the ref to call the current reconnectFn
        if (reconnectFnRef.current) {
          reconnectFnRef.current();
        }
      }
    });
    
    newSocket.addEventListener('error', (event) => {
      console.error('[WS-HOOK] WebSocket error occurred:', event);
      
      // Try to extract more information from the error event
      try {
        // @ts-ignore - Accessing error details that might be available
        const errorMessage = event.message || 'No error message available';
        console.error(`[WS-HOOK] Error details: ${errorMessage}`);
        
        // Log network information that might help diagnose the issue
        console.log(`[WS-HOOK] Network information - Online: ${navigator.onLine}`);
        console.log(`[WS-HOOK] WebSocket URL: ${newSocket.url}`);
      } catch (diagnosticError) {
        console.error('[WS-HOOK] Error while accessing error details:', diagnosticError);
      }
      
      setStatus('disconnected');
      
      if (onError) {
        try {
          onError(event);
        } catch (handlerError) {
          console.error('[WS-HOOK] Error in onError handler:', handlerError);
        }
      }
      
      // Error handling improved - don't try to reconnect here as the close handler will do it
      // The close event will fire after the error event and handle reconnection
    });
  }, [onOpen, onMessage, onClose, onError, autoReconnect]);
  
  // Create a new WebSocket connection
  const connect = useCallback(() => {
    try {
      // Clean up any existing connection
      if (socket) {
        try {
          socket.close();
        } catch (closeError) {
          console.warn('Error closing existing WebSocket:', closeError);
        }
      }
      
      // Update status
      setStatus('connecting');
      
      // Enhanced logging for debugging
      console.log(`[WS-HOOK] Connecting to WebSocket with roomPath: ${roomPath}`);
      console.log(`[WS-HOOK] Current URL: ${window.location.href}`);
      console.log(`[WS-HOOK] Protocol: ${window.location.protocol}`);
      console.log(`[WS-HOOK] Hostname: ${window.location.hostname}`);
      console.log(`[WS-HOOK] Port: ${window.location.port}`);
      console.log(`[WS-HOOK] Network status - Online: ${navigator.onLine}`);
      
      // Create new connection with error handling
      let newSocket: WebSocket;
      try {
        newSocket = createWebSocket(roomPath);
        console.log('[WS-HOOK] WebSocket object created successfully');
      } catch (socketCreationError) {
        console.error('[WS-HOOK] Failed to create WebSocket object:', socketCreationError);
        setStatus('disconnected');
        if (autoReconnect && reconnectFnRef.current) {
          reconnectFnRef.current();
        }
        return null;
      }
      
      // Check if WebSocket was properly instantiated
      if (!newSocket) {
        console.error('[WS-HOOK] WebSocket creation failed with no exception');
        setStatus('disconnected');
        if (autoReconnect && reconnectFnRef.current) {
          reconnectFnRef.current();
        }
        return null;
      }
      
      // Set up the event listeners using our helper function
      setupSocketEventListeners(newSocket);
      
      // Update state
      setSocket(newSocket);
      
      return newSocket;
    } catch (error) {
      console.error('[WS-HOOK] Unhandled error creating WebSocket connection:', error);
      setStatus('disconnected');
      
      // Attempt reconnection if enabled
      if (autoReconnect && reconnectFnRef.current) {
        reconnectFnRef.current();
      }
      
      return null;
    }
  }, [roomPath, socket, autoReconnect, setupSocketEventListeners]);
  
  // Store the latest connect function in the ref
  useEffect(() => {
    connectFnRef.current = connect;
  }, [connect]);
  
  // Disconnect the WebSocket
  const disconnect = useCallback(() => {
    if (!socket) return;
    
    // Log the current socket state
    const readyStateMap = {
      [WebSocket.CONNECTING]: 'CONNECTING',
      [WebSocket.OPEN]: 'OPEN',
      [WebSocket.CLOSING]: 'CLOSING',
      [WebSocket.CLOSED]: 'CLOSED'
    };
    
    console.log(`[WS-HOOK] Disconnecting socket in state: ${readyStateMap[socket.readyState] || socket.readyState}`);
    
    try {
      socket.close(1000, 'Normal closure');
      console.log('[WS-HOOK] Socket closed normally');
    } catch (error) {
      console.error('[WS-HOOK] Error closing WebSocket:', error);
    }
    
    setSocket(null);
    setStatus('disconnected');
    
    // Cancel any pending reconnection
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
      console.log('[WS-HOOK] Canceled pending reconnection');
    }
  }, [socket]);
  
  // Manually trigger reconnection
  const reconnect = useCallback(() => {
    console.log('[WS-HOOK] Manual reconnection requested');
    disconnect();
    
    // Reset reconnect attempts
    reconnectAttempts.current = 0;
    
    // Connect immediately
    connect();
  }, [disconnect, connect]);
  
  // Send a message through the WebSocket
  const sendMessage = useCallback((message: any): boolean => {
    if (!socket) {
      console.warn('[WS-HOOK] Cannot send message: WebSocket is null');
      return false;
    }
    
    // Get readable ready state
    const readyStateMap = {
      [WebSocket.CONNECTING]: 'CONNECTING',
      [WebSocket.OPEN]: 'OPEN',
      [WebSocket.CLOSING]: 'CLOSING',
      [WebSocket.CLOSED]: 'CLOSED'
    };
    
    if (socket.readyState !== WebSocket.OPEN) {
      console.warn(`[WS-HOOK] Cannot send message: WebSocket not in OPEN state (current state: ${readyStateMap[socket.readyState]})`);
      return false;
    }
    
    try {
      // Convert to string if object
      const messageData = typeof message === 'string' 
        ? message 
        : JSON.stringify(message);
      
      socket.send(messageData);
      return true;
    } catch (error) {
      console.error('[WS-HOOK] Error sending WebSocket message:', error);
      return false;
    }
  }, [socket]);
  
  // Connect on mount
  useEffect(() => {
    if (autoConnect) {
      console.log('[WS-HOOK] Auto-connecting on mount');
      connect();
    } else {
      console.log('[WS-HOOK] Auto-connect disabled, waiting for manual connection');
    }
    
    // Clean up on unmount
    return () => {
      console.log('[WS-HOOK] Component unmounting, cleaning up WebSocket');
      
      if (socket) {
        try {
          socket.close(1000, 'Component unmounted');
          console.log('[WS-HOOK] Socket closed due to unmount');
        } catch (closeError) {
          console.error('[WS-HOOK] Error closing socket on unmount:', closeError);
        }
      }
      
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
        console.log('[WS-HOOK] Canceled reconnection timeout on unmount');
      }
    };
  }, [autoConnect, connect, socket]);
  
  // Compute the connected state from the status
  const connected = status === 'connected';
  
  // Create the send alias for backwards compatibility
  const send = sendMessage;
  
  return {
    // Connection state
    socket,
    status,
    connected,
    
    // Message data
    lastMessage,
    messages,
    
    // Room and user information
    roomId,
    userId,
    
    // Connection operations
    connect,
    disconnect,
    reconnect,
    
    // Send message functions (both original and alias)
    sendMessage,
    send
  };
}