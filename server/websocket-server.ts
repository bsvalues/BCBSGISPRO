import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';

/**
 * WebSocket message type enum
 */
export enum MessageTypeEnum {
  // Room management
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  JOIN = 'join',       // Client-side format
  LEAVE = 'leave',     // Client-side format
  
  // Cursor tracking
  CURSOR_MOVE = 'cursor_move',
  
  // Feature management (server-side format)
  FEATURE_ADD = 'feature_add',
  FEATURE_UPDATE = 'feature_update',
  FEATURE_DELETE = 'feature_delete',
  
  // Feature management (client-side format)
  FEATURE_CREATED = 'feature_created',
  FEATURE_UPDATED = 'feature_updated',
  FEATURE_DELETED = 'feature_deleted',
  
  // Annotation management (server-side format)
  ANNOTATION_ADD = 'annotation_add',
  ANNOTATION_UPDATE = 'annotation_update',
  ANNOTATION_DELETE = 'annotation_delete',
  
  // Annotation management (client-side format)
  ANNOTATION_CREATED = 'annotation_created',
  ANNOTATION_UPDATED = 'annotation_updated',
  ANNOTATION_DELETED = 'annotation_deleted',
  
  // System messages
  HEARTBEAT = 'heartbeat',
  CHAT_MESSAGE = 'chat_message',
  CHAT = 'chat',       // Client-side format
  STATUS = 'status'
}

/**
 * WebSocket message type
 * @deprecated Use MessageTypeEnum instead
 */
export type MessageType = 
  | 'join_room' 
  | 'leave_room' 
  | 'cursor_move' 
  | 'feature_add' 
  | 'feature_update' 
  | 'feature_delete'
  | 'annotation_add'
  | 'annotation_update'
  | 'annotation_delete'
  | 'heartbeat'
  | 'chat_message';

/**
 * WebSocket message interface
 */
export interface WebSocketMessage {
  type: MessageTypeEnum;
  roomId?: string;
  userId?: string;
  username?: string;
  payload?: any;        // Server-side format
  data?: any;           // Client-side format
  source?: string;      // Source ID for client-side messaging
  timestamp?: number;
}

/**
 * Extended WebSocket interface with additional metadata
 */
interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
  userId: string;
  username: string;
  rooms: Set<string>;
  lastActivity: number;
}

/**
 * Room information including connected clients and data
 */
interface Room {
  id: string;
  clients: Set<ExtendedWebSocket>;
  features: Record<string, any>; // GeoJSON features
  annotations: Record<string, any>; // Annotation data
  createdAt: number;
  lastActivity: number;
}

/**
 * Room status information for health check
 */
export interface RoomStatus {
  id: string;
  clientCount: number;
  featureCount: number;
  annotationCount: number;
  lastActivity: number;
}

/**
 * WebSocket server manager
 */
export class WebSocketManager {
  private wss: WebSocketServer;
  private rooms: Map<string, Room> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;
  
  // Singleton instance - accessible directly
  public static instance: WebSocketManager | null = null;
  
  /**
   * Initialize the WebSocket server
   */
  constructor(server: Server) {
    // Create WebSocket server attached to the HTTP server
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
    });
    
    // Set up event handlers
    this.wss.on('connection', this.handleConnection.bind(this));
    
    // Set up ping interval (30 seconds)
    this.pingInterval = setInterval(this.pingClients.bind(this), 30000);
    
    // Set singleton instance
    WebSocketManager.instance = this;
    
    console.log('WebSocket server initialized');
  }
  
  /**
   * Get active connections count
   */
  public getActiveConnectionsCount(): number {
    return this.wss.clients.size;
  }
  
  /**
   * Get status information about all rooms
   */
  public getRoomsStatus(): RoomStatus[] {
    const roomStatus: RoomStatus[] = [];
    
    this.rooms.forEach((room) => {
      roomStatus.push({
        id: room.id,
        clientCount: room.clients.size,
        featureCount: Object.keys(room.features).length,
        annotationCount: Object.keys(room.annotations).length,
        lastActivity: room.lastActivity
      });
    });
    
    return roomStatus;
  }
  
  /**
   * Handle new WebSocket connections
   */
  private handleConnection(ws: WebSocket, request: IncomingMessage) {
    console.log('New WebSocket connection established');
    
    // Extend the WebSocket with custom properties
    const extWs = ws as ExtendedWebSocket;
    extWs.isAlive = true;
    extWs.userId = Math.random().toString(36).substring(2, 15); // Generate random ID 
    extWs.username = `User_${extWs.userId.substring(0, 5)}`;   // Generate default username
    extWs.rooms = new Set();
    extWs.lastActivity = Date.now();
    
    // Handle pong messages (keep-alive)
    extWs.on('pong', () => {
      extWs.isAlive = true;
    });
    
    // Handle incoming messages
    extWs.on('message', (data) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        this.handleMessage(extWs, message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    // Handle client disconnection
    extWs.on('close', () => {
      this.handleDisconnect(extWs);
    });
    
    // Send welcome message to client
    const message: WebSocketMessage = {
      type: MessageTypeEnum.HEARTBEAT,
      userId: extWs.userId,
      username: extWs.username,
      timestamp: Date.now(),
      payload: { message: 'Welcome to the BentonGeoPro WebSocket server' }
    };
    
    extWs.send(JSON.stringify(message));
  }
  
  /**
   * Handle messages received from clients
   */
  private handleMessage(ws: ExtendedWebSocket, message: WebSocketMessage) {
    ws.lastActivity = Date.now();
    
    // Add user ID and timestamp if not provided
    if (!message.userId) message.userId = ws.userId;
    if (!message.username) message.username = ws.username;
    if (!message.timestamp) message.timestamp = Date.now();
    
    // Support both payload and data formats (client-side uses data)
    const payload = message.payload || message.data;
    const feature = payload?.feature || payload;
    
    // Handle different message types
    switch (message.type) {
      // Handle room management (both formats)
      case MessageTypeEnum.JOIN_ROOM:
      case MessageTypeEnum.JOIN:
        if (message.roomId) {
          if (message.username) ws.username = message.username;
          this.joinRoom(ws, message.roomId);
        }
        break;
        
      case MessageTypeEnum.LEAVE_ROOM:
      case MessageTypeEnum.LEAVE:
        if (message.roomId) {
          this.leaveRoom(ws, message.roomId);
        }
        break;
        
      // Handle cursor movement
      case MessageTypeEnum.CURSOR_MOVE:
        if (message.roomId && payload) {
          this.broadcastToRoom(message.roomId, message, ws);
        }
        break;
        
      // Handle feature management (server-side format)
      case MessageTypeEnum.FEATURE_ADD:
        if (message.roomId && payload && payload.id) {
          const room = this.rooms.get(message.roomId);
          if (room) {
            room.features[payload.id] = payload;
            room.lastActivity = Date.now();
            this.broadcastToRoom(message.roomId, message);
          }
        }
        break;
        
      // Handle feature management (client-side format)
      case MessageTypeEnum.FEATURE_CREATED:
        if (message.roomId && feature && feature.id) {
          const room = this.rooms.get(message.roomId);
          if (room) {
            room.features[feature.id] = feature;
            room.lastActivity = Date.now();
            
            // Convert to server format for broadcasting
            const serverMessage: WebSocketMessage = {
              type: MessageTypeEnum.FEATURE_ADD,
              roomId: message.roomId,
              userId: message.userId,
              username: message.username,
              timestamp: message.timestamp,
              payload: feature
            };
            
            this.broadcastToRoom(message.roomId, serverMessage);
          }
        }
        break;
        
      // Handle feature updates (server-side format)
      case MessageTypeEnum.FEATURE_UPDATE:
        if (message.roomId && payload && payload.id) {
          this.updateFeature(message.roomId, payload.id, message);
        }
        break;
        
      // Handle feature updates (client-side format)
      case MessageTypeEnum.FEATURE_UPDATED:
        if (message.roomId && feature && feature.id) {
          const room = this.rooms.get(message.roomId);
          if (room && room.features[feature.id]) {
            room.features[feature.id] = {
              ...room.features[feature.id],
              ...feature
            };
            room.lastActivity = Date.now();
            
            // Convert to server format for broadcasting
            const serverMessage: WebSocketMessage = {
              type: MessageTypeEnum.FEATURE_UPDATE,
              roomId: message.roomId,
              userId: message.userId,
              username: message.username,
              timestamp: message.timestamp,
              payload: room.features[feature.id]
            };
            
            this.broadcastToRoom(message.roomId, serverMessage);
          }
        }
        break;
        
      // Handle feature deletion (server-side format)
      case MessageTypeEnum.FEATURE_DELETE:
        if (message.roomId && payload && payload.id) {
          const room = this.rooms.get(message.roomId);
          if (room && room.features[payload.id]) {
            delete room.features[payload.id];
            room.lastActivity = Date.now();
            this.broadcastToRoom(message.roomId, message);
          }
        }
        break;
        
      // Handle feature deletion (client-side format)
      case MessageTypeEnum.FEATURE_DELETED:
        if (message.roomId && feature && feature.id) {
          const room = this.rooms.get(message.roomId);
          if (room && room.features[feature.id]) {
            // Save a copy of the feature before deletion for the broadcast
            const deletedFeature = room.features[feature.id];
            
            // Delete the feature
            delete room.features[feature.id];
            room.lastActivity = Date.now();
            
            // Convert to server format for broadcasting
            const serverMessage: WebSocketMessage = {
              type: MessageTypeEnum.FEATURE_DELETE,
              roomId: message.roomId,
              userId: message.userId,
              username: message.username,
              timestamp: message.timestamp,
              payload: deletedFeature
            };
            
            this.broadcastToRoom(message.roomId, serverMessage);
          }
        }
        break;
        
      // Handle annotation management (server-side format)
      case MessageTypeEnum.ANNOTATION_ADD:
        if (message.roomId && payload && payload.id) {
          const room = this.rooms.get(message.roomId);
          if (room) {
            room.annotations[payload.id] = payload;
            room.lastActivity = Date.now();
            this.broadcastToRoom(message.roomId, message);
          }
        }
        break;
        
      // Handle annotation management (client-side format)
      case MessageTypeEnum.ANNOTATION_CREATED:
        if (message.roomId && payload?.annotation && payload.annotation.id) {
          const room = this.rooms.get(message.roomId);
          if (room) {
            const annotation = payload.annotation;
            room.annotations[annotation.id] = annotation;
            room.lastActivity = Date.now();
            
            // Convert to server format for broadcasting
            const serverMessage: WebSocketMessage = {
              type: MessageTypeEnum.ANNOTATION_ADD,
              roomId: message.roomId,
              userId: message.userId,
              username: message.username,
              timestamp: message.timestamp,
              payload: annotation
            };
            
            this.broadcastToRoom(message.roomId, serverMessage);
          }
        }
        break;
        
      // Handle annotation updates (server-side format)
      case MessageTypeEnum.ANNOTATION_UPDATE:
        if (message.roomId && payload && payload.id) {
          this.updateAnnotation(message.roomId, payload.id, message);
        }
        break;
        
      // Handle annotation updates (client-side format)
      case MessageTypeEnum.ANNOTATION_UPDATED:
        if (message.roomId && payload?.annotation && payload.annotation.id) {
          const room = this.rooms.get(message.roomId);
          const annotation = payload.annotation;
          if (room && room.annotations[annotation.id]) {
            room.annotations[annotation.id] = {
              ...room.annotations[annotation.id],
              ...annotation
            };
            room.lastActivity = Date.now();
            
            // Convert to server format for broadcasting
            const serverMessage: WebSocketMessage = {
              type: MessageTypeEnum.ANNOTATION_UPDATE,
              roomId: message.roomId,
              userId: message.userId,
              username: message.username,
              timestamp: message.timestamp,
              payload: room.annotations[annotation.id]
            };
            
            this.broadcastToRoom(message.roomId, serverMessage);
          }
        }
        break;
        
      // Handle annotation deletion (server-side format)
      case MessageTypeEnum.ANNOTATION_DELETE:
        if (message.roomId && payload && payload.id) {
          const room = this.rooms.get(message.roomId);
          if (room && room.annotations[payload.id]) {
            delete room.annotations[payload.id];
            room.lastActivity = Date.now();
            this.broadcastToRoom(message.roomId, message);
          }
        }
        break;
        
      // Handle annotation deletion (client-side format)
      case MessageTypeEnum.ANNOTATION_DELETED:
        if (message.roomId && payload?.annotationId) {
          const room = this.rooms.get(message.roomId);
          const annotationId = payload.annotationId;
          if (room && room.annotations[annotationId]) {
            // Save a copy of the annotation before deletion for the broadcast
            const deletedAnnotation = room.annotations[annotationId];
            
            // Delete the annotation
            delete room.annotations[annotationId];
            room.lastActivity = Date.now();
            
            // Convert to server format for broadcasting
            const serverMessage: WebSocketMessage = {
              type: MessageTypeEnum.ANNOTATION_DELETE,
              roomId: message.roomId,
              userId: message.userId,
              username: message.username,
              timestamp: message.timestamp,
              payload: deletedAnnotation
            };
            
            this.broadcastToRoom(message.roomId, serverMessage);
          }
        }
        break;
        
      // Handle chat messages (both formats)
      case MessageTypeEnum.CHAT:
      case MessageTypeEnum.CHAT_MESSAGE:
        if (message.roomId && payload) {
          this.broadcastToRoom(message.roomId, message);
        }
        break;
        
      // Handle heartbeat messages
      case MessageTypeEnum.HEARTBEAT:
        // Respond with a heartbeat message
        ws.send(JSON.stringify({
          type: MessageTypeEnum.HEARTBEAT,
          timestamp: Date.now()
        }));
        break;
        
      // Handle unknown message types
      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }
  
  /**
   * Join a collaboration room
   */
  private joinRoom(ws: ExtendedWebSocket, roomId: string) {
    // Create room if it doesn't exist
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        clients: new Set(),
        features: {},
        annotations: {},
        createdAt: Date.now(),
        lastActivity: Date.now()
      });
    }
    
    const room = this.rooms.get(roomId)!;
    
    // Add client to room
    room.clients.add(ws);
    ws.rooms.add(roomId);
    
    // Update room activity
    room.lastActivity = Date.now();
    
    console.log(`User ${ws.username} (${ws.userId}) joined room ${roomId}`);
    
    // Notify other clients in the room
    const joinMessage: WebSocketMessage = {
      type: MessageTypeEnum.JOIN_ROOM,
      roomId,
      userId: ws.userId,
      username: ws.username,
      timestamp: Date.now(),
      payload: {
        userCount: room.clients.size
      }
    };
    
    this.broadcastToRoom(roomId, joinMessage, ws);
    
    // Send current room state to the client
    const stateMessage: WebSocketMessage = {
      type: MessageTypeEnum.JOIN_ROOM,
      roomId,
      timestamp: Date.now(),
      payload: {
        features: room.features,
        annotations: room.annotations,
        userCount: room.clients.size
      }
    };
    
    ws.send(JSON.stringify(stateMessage));
  }
  
  /**
   * Leave a collaboration room
   */
  private leaveRoom(ws: ExtendedWebSocket, roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    
    // Remove client from room
    room.clients.delete(ws);
    ws.rooms.delete(roomId);
    
    // Update room activity
    room.lastActivity = Date.now();
    
    console.log(`User ${ws.username} (${ws.userId}) left room ${roomId}`);
    
    // Notify other clients in the room
    const leaveMessage: WebSocketMessage = {
      type: MessageTypeEnum.LEAVE_ROOM,
      roomId,
      userId: ws.userId,
      username: ws.username,
      timestamp: Date.now(),
      payload: {
        userCount: room.clients.size
      }
    };
    
    this.broadcastToRoom(roomId, leaveMessage);
    
    // Clean up empty room after a delay
    if (room.clients.size === 0) {
      setTimeout(() => this.cleanupRoom(roomId), 300000); // 5 minutes
    }
  }
  
  /**
   * Update a feature in a room
   */
  private updateFeature(roomId: string, featureId: string, message: WebSocketMessage) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    
    // Update feature if it exists
    if (room.features[featureId]) {
      room.features[featureId] = {
        ...room.features[featureId],
        ...message.payload
      };
      
      // Update room activity
      room.lastActivity = Date.now();
      
      // Broadcast the update
      this.broadcastToRoom(roomId, message);
    }
  }
  
  /**
   * Update an annotation in a room
   */
  private updateAnnotation(roomId: string, annotationId: string, message: WebSocketMessage) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    
    // Update annotation if it exists
    if (room.annotations[annotationId]) {
      room.annotations[annotationId] = {
        ...room.annotations[annotationId],
        ...message.payload
      };
      
      // Update room activity
      room.lastActivity = Date.now();
      
      // Broadcast the update
      this.broadcastToRoom(roomId, message);
    }
  }
  
  /**
   * Broadcast a message to all clients in a room
   */
  private broadcastToRoom(roomId: string, message: WebSocketMessage, exclude?: ExtendedWebSocket) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    
    // Make sure there's at least a payload or data property
    if (!message.payload && !message.data) {
      // Extract from one field to the other if needed
      if (message.data) {
        message.payload = message.data;
      } else if (message.payload) {
        message.data = message.payload;
      } else {
        // Initialize with empty object if neither exists
        message.payload = {};
        message.data = {};
      }
    }

    // Add metadata to ensure client compatibility
    message.timestamp = message.timestamp || Date.now();
    
    const messageStr = JSON.stringify(message);
    
    room.clients.forEach(client => {
      if (client !== exclude && client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }
  
  /**
   * Handle client disconnection
   */
  private handleDisconnect(ws: ExtendedWebSocket) {
    console.log(`WebSocket disconnected: ${ws.username} (${ws.userId})`);
    
    // Leave all rooms
    for (const roomId of ws.rooms) {
      this.leaveRoom(ws, roomId);
    }
  }
  
  /**
   * Ping all clients to check if they're still alive
   */
  private pingClients() {
    this.wss.clients.forEach((ws) => {
      const extWs = ws as ExtendedWebSocket;
      
      if (extWs.isAlive === false) {
        console.log(`Terminating inactive connection: ${extWs.username} (${extWs.userId})`);
        return extWs.terminate();
      }
      
      extWs.isAlive = false;
      extWs.ping();
    });
  }
  
  /**
   * Clean up an empty room
   */
  private cleanupRoom(roomId: string) {
    const room = this.rooms.get(roomId);
    
    // Only delete the room if it's still empty
    if (room && room.clients.size === 0) {
      console.log(`Cleaning up empty room: ${roomId}`);
      this.rooms.delete(roomId);
    }
  }
  
  /**
   * Clean up resources when the server is shutting down
   */
  public shutdown() {
    console.log('Shutting down WebSocket server');
    
    // Clear ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    // Close all connections
    this.wss.clients.forEach((ws) => {
      ws.terminate();
    });
    
    // Close the server
    this.wss.close();
  }
}