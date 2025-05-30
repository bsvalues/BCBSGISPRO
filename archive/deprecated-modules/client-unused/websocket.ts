/**
 * WebSocket message types and utilities
 */
import { getWebSocketUrl } from './env';

/**
 * WebSocket connection status enum
 */
export enum ConnectionStatusEnum {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting'
}

/**
 * WebSocket message type enum
 * 
 * These are the supported message types for WebSocket communication.
 */
export enum MessageTypeEnum {
  // Connection management
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  HEARTBEAT = 'heartbeat',
  
  // Room management
  JOIN = 'join',
  LEAVE = 'leave',
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  
  // User activity
  CURSOR_MOVE = 'cursor_move',
  USER_ACTIVITY = 'user_activity',
  
  // Feature management (client to server)
  FEATURE_ADD = 'feature_add',
  FEATURE_UPDATE = 'feature_update',
  FEATURE_DELETE = 'feature_delete',
  
  // Feature management (server to client)
  FEATURE_CREATED = 'feature_created',
  FEATURE_UPDATED = 'feature_updated',
  FEATURE_DELETED = 'feature_deleted',
  
  // Annotation management (client to server)
  ANNOTATION_ADD = 'annotation_add',
  ANNOTATION_UPDATE = 'annotation_update',
  ANNOTATION_DELETE = 'annotation_delete',
  
  // Annotation management (server to client)
  ANNOTATION_CREATED = 'annotation_created',
  ANNOTATION_UPDATED = 'annotation_updated',
  ANNOTATION_DELETED = 'annotation_deleted',
  
  // Chat messaging
  CHAT_MESSAGE = 'chat_message',
  
  // Error handling
  ERROR = 'error'
}

/**
 * WebSocket message interface
 */
export interface WebSocketMessage {
  // Message type (required)
  type: MessageTypeEnum;
  
  // Room ID (for room-specific messages)
  roomId?: string;
  
  // User ID (for user-specific messages)
  userId?: string;
  
  // Username (for display in UI)
  username?: string;
  
  // Message payload (for data messages)
  payload?: any;
  
  // Timestamp of message
  timestamp?: number;
  
  // Error details (for error messages)
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Check if a message is a room message
 */
export function isRoomMessage(message: WebSocketMessage): boolean {
  return !!message.roomId;
}

/**
 * Check if a message is a user message
 */
export function isUserMessage(message: WebSocketMessage): boolean {
  return !!message.userId;
}

/**
 * Check if a message is a feature message
 */
export function isFeatureMessage(message: WebSocketMessage): boolean {
  return [
    MessageTypeEnum.FEATURE_ADD,
    MessageTypeEnum.FEATURE_UPDATE,
    MessageTypeEnum.FEATURE_DELETE,
    MessageTypeEnum.FEATURE_CREATED,
    MessageTypeEnum.FEATURE_UPDATED,
    MessageTypeEnum.FEATURE_DELETED
  ].includes(message.type);
}

/**
 * Check if a message is an annotation message
 */
export function isAnnotationMessage(message: WebSocketMessage): boolean {
  return [
    MessageTypeEnum.ANNOTATION_ADD,
    MessageTypeEnum.ANNOTATION_UPDATE,
    MessageTypeEnum.ANNOTATION_DELETE,
    MessageTypeEnum.ANNOTATION_CREATED,
    MessageTypeEnum.ANNOTATION_UPDATED,
    MessageTypeEnum.ANNOTATION_DELETED
  ].includes(message.type);
}

/**
 * Create a WebSocket connection
 * 
 * @param roomPath - Optional room path to append to the base WebSocket URL, defaults to ''
 * @returns A new WebSocket instance
 */
export function createWebSocket(roomPath: string = ''): WebSocket {
  // Get base URL and ensure the path is correctly formatted
  try {
    // Use WebSocket URL utility which handles the development vs production environments
    const baseUrl = getWebSocketUrl();
    
    // Enhanced logging for debugging purposes
    console.log(`[WS] Creating WebSocket connection`);
    console.log(`[WS] Current URL: ${window.location.href}`);
    console.log(`[WS] Protocol: ${window.location.protocol}`);
    console.log(`[WS] Hostname: ${window.location.hostname}`);
    console.log(`[WS] Port: ${window.location.port}`);
    
    // Construct the complete WebSocket URL with optional room path
    // Note: The base URL already includes the /ws path from getWebSocketUrl()
    // Fix potential double slashes in URL construction
    const wsUrl = roomPath ? `${baseUrl}${roomPath.startsWith('/') ? roomPath : '/' + roomPath}` : baseUrl;
    console.log(`[WS] Attempting WebSocket connection to: ${wsUrl}`);
    
    // Create the WebSocket - use try/catch inside a Promise to handle unhandled rejections
    let ws: WebSocket;
    
    try {
      // Create the WebSocket
      ws = new WebSocket(wsUrl);
      
      // Add event listeners for debugging
      ws.addEventListener('open', () => {
        console.log(`[WS] Connection successfully established to ${wsUrl}`);
      });
      
      ws.addEventListener('error', (error) => {
        console.error(`[WS] Error with connection to ${wsUrl}:`, error);
      });
      
      ws.addEventListener('close', (event) => {
        console.log(`[WS] Connection closed (code: ${event.code}, reason: ${event.reason || 'No reason provided'})`);
      });
      
      return ws;
    } catch (wsError) {
      console.error('[WS] Primary WebSocket creation failed:', wsError);
      
      // Create fallback URL based on current location
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const fallbackUrl = `${protocol}//${host}/ws${roomPath ? (roomPath.startsWith('/') ? roomPath : '/' + roomPath) : ''}`;
      console.log(`[WS] Using fallback WebSocket URL: ${fallbackUrl}`);
      
      try {
        const fallbackWs = new WebSocket(fallbackUrl);
        
        // Add event listeners for debugging
        fallbackWs.addEventListener('open', () => {
          console.log(`[WS] Fallback connection successfully established to ${fallbackUrl}`);
        });
        
        fallbackWs.addEventListener('error', (error) => {
          console.error(`[WS] Error with fallback connection to ${fallbackUrl}:`, error);
        });
        
        return fallbackWs;
      } catch (fallbackError) {
        console.error('[WS] Fallback WebSocket creation failed:', fallbackError);
        
        // Last resort minimal URL
        const minimalUrl = `ws://${window.location.hostname}/ws`;
        console.log(`[WS] Using minimal fallback WebSocket URL: ${minimalUrl}`);
        
        try {
          return new WebSocket(minimalUrl);
        } catch (minimalError) {
          console.error('[WS] Minimal fallback WebSocket creation failed:', minimalError);
          
          // Create a mock WebSocket object that will act as a proper WebSocket but is actually disconnected
          console.error('[WS] Creating mock WebSocket object as final fallback');
          
          // Create a fake WebSocket-like object instead of an actual connection to prevent unhandled rejections
          const mockSocket = {
            readyState: WebSocket.CLOSED,
            send: (data: string) => {
              console.warn('[WS-MOCK] Cannot send data - socket is disconnected:', data);
              return false;
            },
            close: () => {
              console.warn('[WS-MOCK] Socket already closed');
            },
            addEventListener: (event: string, handler: Function) => {
              if (event === 'error') {
                // Immediately trigger the error handler
                setTimeout(() => {
                  handler(new Event('error'));
                }, 100);
              }
              console.warn(`[WS-MOCK] Added listener for ${event} but socket is disconnected`);
            },
            removeEventListener: () => {},
            dispatchEvent: () => false,
            onopen: null,
            onclose: null,
            onmessage: null,
            onerror: null,
            CONNECTING: WebSocket.CONNECTING,
            OPEN: WebSocket.OPEN,
            CLOSING: WebSocket.CLOSING,
            CLOSED: WebSocket.CLOSED,
            url: minimalUrl,
            protocol: '',
            extensions: '',
            bufferedAmount: 0,
            binaryType: 'blob' as BinaryType
          } as unknown as WebSocket;
          
          // Simulate an error event after a short delay
          setTimeout(() => {
            if (mockSocket.onerror) {
              mockSocket.onerror(new Event('error') as Event);
            }
          }, 100);
          
          return mockSocket;
        }
      }
    }
  } catch (error) {
    console.error('Catastrophic error creating WebSocket connection:', error);
    
    // Create a mock WebSocket object instead of a real connection that would throw
    console.error('Creating mock WebSocket object that will simulate connectivity failure');
    
    // Create a fake WebSocket-like object that simulates a disconnected socket
    const mockSocket = {
      readyState: WebSocket.CLOSED,
      send: (data: string) => {
        console.warn('[WS-MOCK] Cannot send data - socket is disconnected:', data);
        return false;
      },
      close: () => {
        console.warn('[WS-MOCK] Socket already closed');
      },
      addEventListener: (event: string, handler: Function) => {
        if (event === 'error') {
          // Immediately trigger the error handler
          setTimeout(() => {
            handler(new Event('error'));
          }, 100);
        }
        console.warn(`[WS-MOCK] Added listener for ${event} but socket is disconnected`);
      },
      removeEventListener: () => {},
      dispatchEvent: () => false,
      onopen: null,
      onclose: null,
      onmessage: null,
      onerror: null,
      CONNECTING: WebSocket.CONNECTING,
      OPEN: WebSocket.OPEN,
      CLOSING: WebSocket.CLOSING,
      CLOSED: WebSocket.CLOSED,
      url: 'ws://disconnected',
      protocol: '',
      extensions: '',
      bufferedAmount: 0,
      binaryType: 'blob' as BinaryType
    } as unknown as WebSocket;
    
    // Simulate an error event after a short delay
    setTimeout(() => {
      if (mockSocket.onerror) {
        mockSocket.onerror(new Event('error') as Event);
      }
    }, 100);
    
    return mockSocket;
  }
}

// Re-export the useWebSocket hook for convenience
export { useWebSocket } from '../hooks/use-websocket';