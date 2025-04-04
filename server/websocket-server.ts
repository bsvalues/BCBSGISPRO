import { Server, IncomingMessage } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { parse } from 'url';

/**
 * WebSocket message type
 */
type MessageType = 
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
interface WebSocketMessage {
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
    // Initialize WebSocket server on the existing HTTP server
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      clientTracking: true
    });
    
    console.log('WebSocket server initialized on path /ws');
    
    // Set up event handlers
    this.wss.on('connection', this.handleConnection.bind(this));
    
    // Start the interval to check for dead connections every 30 seconds
    this.pingInterval = setInterval(this.pingClients.bind(this), 30000);
  }
  
  /**
   * Handle new WebSocket connections
   */
  private handleConnection(ws: WebSocket, request: IncomingMessage) {
    // Initialize extended properties
    const extWs = ws as ExtendedWebSocket;
    extWs.isAlive = true;
    extWs.userId = Math.random().toString(36).substring(2, 15);
    extWs.username = 'User_' + extWs.userId.substring(0, 5);
    extWs.rooms = new Set();
    extWs.lastActivity = Date.now();
    
    // Parse any query parameters
    if (request.url) {
      const { query } = parse(request.url, true);
      
      if (query.userId && typeof query.userId === 'string') {
        extWs.userId = query.userId;
      }
      
      if (query.username && typeof query.username === 'string') {
        extWs.username = query.username;
      }
      
      // Auto-join room if specified
      if (query.roomId && typeof query.roomId === 'string') {
        this.joinRoom(extWs, query.roomId);
      }
    }
    
    // Set up WebSocket event handlers
    extWs.on('pong', () => {
      extWs.isAlive = true;
    });
    
    extWs.on('message', (data) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        this.handleMessage(extWs, message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    });
    
    extWs.on('close', () => {
      this.handleDisconnect(extWs);
    });
    
    extWs.on('error', (error) => {
      console.error('WebSocket error:', error);
      extWs.terminate();
    });
    
    // Send an initial welcome message
    const message: WebSocketMessage = {
      type: 'heartbeat',
      userId: 'server',
      username: 'Server',
      timestamp: Date.now(),
      payload: {
        message: 'Connected to BentonGeoPro WebSocket server',
        userId: extWs.userId
      }
    };
    
    extWs.send(JSON.stringify(message));
  }
  
  /**
   * Handle messages received from clients
   */
  private handleMessage(ws: ExtendedWebSocket, message: WebSocketMessage) {
    // Update last activity timestamp
    ws.lastActivity = Date.now();
    
    // Update user information if provided
    if (message.userId) {
      ws.userId = message.userId;
    }
    
    if (message.username) {
      ws.username = message.username;
    }
    
    // Process message based on type
    switch (message.type) {
      case 'join_room':
        if (message.roomId) {
          this.joinRoom(ws, message.roomId);
        }
        break;
        
      case 'leave_room':
        if (message.roomId) {
          this.leaveRoom(ws, message.roomId);
        }
        break;
        
      case 'heartbeat':
        // Just keep the connection alive, no need to broadcast
        ws.isAlive = true;
        break;
        
      case 'cursor_move':
      case 'chat_message':
        // Forward these messages to everyone in the room
        if (message.roomId) {
          this.broadcastToRoom(message.roomId, message, ws);
        }
        break;
        
      case 'feature_add':
      case 'feature_update':
      case 'feature_delete':
        // Update the feature collection and broadcast
        if (message.roomId && message.payload?.featureId) {
          this.updateFeature(message.roomId, message.payload.featureId, message);
          this.broadcastToRoom(message.roomId, message, ws);
        }
        break;
        
      case 'annotation_add':
      case 'annotation_update':
      case 'annotation_delete':
        // Update the annotations collection and broadcast
        if (message.roomId && message.payload?.annotationId) {
          this.updateAnnotation(message.roomId, message.payload.annotationId, message);
          this.broadcastToRoom(message.roomId, message, ws);
        }
        break;
        
      default:
        console.warn('Unhandled message type:', message.type);
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
        clients: new Set<ExtendedWebSocket>(),
        features: {},
        annotations: {},
        createdAt: Date.now(),
        lastActivity: Date.now()
      });
    }
    
    const room = this.rooms.get(roomId)!;
    room.clients.add(ws);
    room.lastActivity = Date.now();
    ws.rooms.add(roomId);
    
    // Notify all clients in the room about the new connection
    const joinMessage: WebSocketMessage = {
      type: 'join_room',
      roomId,
      userId: ws.userId,
      username: ws.username,
      timestamp: Date.now(),
      payload: {
        userCount: room.clients.size,
        userId: ws.userId,
        username: ws.username
      }
    };
    
    this.broadcastToRoom(roomId, joinMessage);
    
    // Send the current state of the room to the new client
    const stateMessage: WebSocketMessage = {
      type: 'join_room',
      roomId,
      userId: 'server',
      username: 'Server',
      timestamp: Date.now(),
      payload: {
        features: room.features,
        annotations: room.annotations,
        userCount: room.clients.size,
        roomState: 'active'
      }
    };
    
    ws.send(JSON.stringify(stateMessage));
  }
  
  /**
   * Leave a collaboration room
   */
  private leaveRoom(ws: ExtendedWebSocket, roomId: string) {
    if (!this.rooms.has(roomId)) return;
    
    const room = this.rooms.get(roomId)!;
    room.clients.delete(ws);
    room.lastActivity = Date.now();
    ws.rooms.delete(roomId);
    
    // Notify all clients in the room about the disconnection
    const leaveMessage: WebSocketMessage = {
      type: 'leave_room',
      roomId,
      userId: ws.userId,
      username: ws.username,
      timestamp: Date.now(),
      payload: {
        userCount: room.clients.size,
        userId: ws.userId,
        username: ws.username
      }
    };
    
    this.broadcastToRoom(roomId, leaveMessage);
    
    // Clean up empty rooms
    if (room.clients.size === 0) {
      this.cleanupRoom(roomId);
    }
  }
  
  /**
   * Update a feature in a room
   */
  private updateFeature(roomId: string, featureId: string, message: WebSocketMessage) {
    if (!this.rooms.has(roomId)) return;
    
    const room = this.rooms.get(roomId)!;
    room.lastActivity = Date.now();
    
    if (message.type === 'feature_delete') {
      delete room.features[featureId];
    } else if (message.payload?.feature) {
      room.features[featureId] = message.payload.feature;
    }
  }
  
  /**
   * Update an annotation in a room
   */
  private updateAnnotation(roomId: string, annotationId: string, message: WebSocketMessage) {
    if (!this.rooms.has(roomId)) return;
    
    const room = this.rooms.get(roomId)!;
    room.lastActivity = Date.now();
    
    if (message.type === 'annotation_delete') {
      delete room.annotations[annotationId];
    } else if (message.payload?.annotation) {
      room.annotations[annotationId] = message.payload.annotation;
    }
  }
  
  /**
   * Broadcast a message to all clients in a room
   */
  private broadcastToRoom(roomId: string, message: WebSocketMessage, exclude?: ExtendedWebSocket) {
    if (!this.rooms.has(roomId)) return;
    
    const room = this.rooms.get(roomId)!;
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
        return extWs.terminate();
      }
      
      extWs.isAlive = false;
      extWs.ping();
      
      // Check for inactive clients (no activity for more than 10 minutes)
      const inactiveTime = Date.now() - extWs.lastActivity;
      if (inactiveTime > 10 * 60 * 1000) {
        console.log(`Terminating inactive connection for user ${extWs.userId}`);
        extWs.terminate();
      }
    });
  }
  
  /**
   * Clean up an empty room
   */
  private cleanupRoom(roomId: string) {
    if (!this.rooms.has(roomId)) return;
    
    const room = this.rooms.get(roomId)!;
    
    // If there are still clients, don't clean up
    if (room.clients.size > 0) return;
    
    // After 1 hour of inactivity, remove the room
    setTimeout(() => {
      if (this.rooms.has(roomId)) {
        const room = this.rooms.get(roomId)!;
        
        // Only delete if still empty
        if (room.clients.size === 0) {
          this.rooms.delete(roomId);
          console.log(`Room ${roomId} cleaned up due to inactivity`);
        }
      }
    }, 60 * 60 * 1000);
  }
  
  /**
   * Clean up resources when the server is shutting down
   */
  public shutdown() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    // Close all connections
    this.wss.clients.forEach((ws) => {
      ws.terminate();
    });
    
    this.wss.close();
  }
}