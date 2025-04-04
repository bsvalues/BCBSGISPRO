import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';

/**
 * WebSocket message type
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
  type: MessageType;
  roomId?: string;
  userId?: string;
  username?: string;
  payload?: any;
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
 * WebSocket server manager
 */
export class WebSocketManager {
  private wss: WebSocketServer;
  private rooms: Map<string, Room> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;
  
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
    
    console.log('WebSocket server initialized');
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
      type: 'heartbeat',
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
    
    // Handle different message types
    switch (message.type) {
      case 'join_room':
        if (message.roomId) {
          if (message.username) ws.username = message.username;
          this.joinRoom(ws, message.roomId);
        }
        break;
        
      case 'leave_room':
        if (message.roomId) {
          this.leaveRoom(ws, message.roomId);
        }
        break;
        
      case 'cursor_move':
        if (message.roomId && message.payload) {
          this.broadcastToRoom(message.roomId, message, ws);
        }
        break;
        
      case 'feature_add':
        if (message.roomId && message.payload && message.payload.id) {
          const room = this.rooms.get(message.roomId);
          if (room) {
            room.features[message.payload.id] = message.payload;
            room.lastActivity = Date.now();
            this.broadcastToRoom(message.roomId, message);
          }
        }
        break;
        
      case 'feature_update':
        if (message.roomId && message.payload && message.payload.id) {
          this.updateFeature(message.roomId, message.payload.id, message);
        }
        break;
        
      case 'feature_delete':
        if (message.roomId && message.payload && message.payload.id) {
          const room = this.rooms.get(message.roomId);
          if (room && room.features[message.payload.id]) {
            delete room.features[message.payload.id];
            room.lastActivity = Date.now();
            this.broadcastToRoom(message.roomId, message);
          }
        }
        break;
        
      case 'annotation_add':
        if (message.roomId && message.payload && message.payload.id) {
          const room = this.rooms.get(message.roomId);
          if (room) {
            room.annotations[message.payload.id] = message.payload;
            room.lastActivity = Date.now();
            this.broadcastToRoom(message.roomId, message);
          }
        }
        break;
        
      case 'annotation_update':
        if (message.roomId && message.payload && message.payload.id) {
          this.updateAnnotation(message.roomId, message.payload.id, message);
        }
        break;
        
      case 'annotation_delete':
        if (message.roomId && message.payload && message.payload.id) {
          const room = this.rooms.get(message.roomId);
          if (room && room.annotations[message.payload.id]) {
            delete room.annotations[message.payload.id];
            room.lastActivity = Date.now();
            this.broadcastToRoom(message.roomId, message);
          }
        }
        break;
        
      case 'chat_message':
        if (message.roomId && message.payload) {
          this.broadcastToRoom(message.roomId, message);
        }
        break;
        
      case 'heartbeat':
        // Respond with a heartbeat message
        ws.send(JSON.stringify({
          type: 'heartbeat',
          timestamp: Date.now()
        }));
        break;
        
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
      type: 'join_room',
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
      type: 'join_room',
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
      type: 'leave_room',
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