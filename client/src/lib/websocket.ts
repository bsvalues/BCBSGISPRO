/**
 * WebSocket message types and utilities
 */
import { getWebSocketUrl } from '@/lib/env';

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
 * @param path - WebSocket endpoint path, defaults to '/ws'
 * @param roomId - Optional room ID to add to the path
 * @returns A new WebSocket instance
 */
export function createWebSocket(path: string = '/ws'): WebSocket {
  // Get base URL and ensure the path is correctly formatted
  try {
    // Use WebSocket URL utility which handles the development vs production environments
    const baseUrl = getWebSocketUrl();
    
    // If for some reason the URL is malformed, construct a safe fallback
    if (!baseUrl || baseUrl.includes('undefined')) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const safeUrl = `${protocol}//${host}${path}`;
      console.log(`Using safe fallback WebSocket URL: ${safeUrl}`);
      return new WebSocket(safeUrl);
    }
    
    console.log(`Creating WebSocket connection to: ${baseUrl}`);
    return new WebSocket(baseUrl);
  } catch (error) {
    console.error('Error creating WebSocket connection:', error);
    // Last resort fallback with minimal assumptions
    const fallbackUrl = `ws://${window.location.hostname}/ws`;
    console.log(`Using emergency fallback WebSocket URL: ${fallbackUrl}`);
    return new WebSocket(fallbackUrl);
  }
}

// Re-export the useWebSocket hook for convenience
export { useWebSocket } from '@/hooks/use-websocket';