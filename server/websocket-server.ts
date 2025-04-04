import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { v4 as uuidv4 } from 'uuid';

// Client information tracking
interface WebSocketClient {
  id: string;
  userId: string;
  sessionId: string;
  rooms: Set<string>;
  lastActivity: Date;
}

// Message structure
interface WebSocketMessage {
  id?: string;
  type: string;
  roomId?: string;
  source?: string;
  timestamp?: string;
  data?: any;
}

// Room tracking
interface Room {
  id: string;
  clients: Set<WebSocket>;
  features: any[];
  annotations: any[];
  lastActivity: Date;
}

export class WebSocketHandler {
  private wss: WebSocketServer;
  private clients: Map<WebSocket, WebSocketClient> = new Map();
  private rooms: Map<string, Room> = new Map();
  
  // Heartbeat interval in ms (30 seconds)
  private readonly HEARTBEAT_INTERVAL = 30000;
  
  // Client timeout in ms (90 seconds)
  private readonly CLIENT_TIMEOUT = 90000;
  
  constructor(server: Server) {
    // Create WebSocket server on dedicated path to avoid conflicts with Vite
    this.wss = new WebSocketServer({ server, path: '/ws' });
    
    // Set up event handlers
    this.setupEventHandlers();
    
    // Start heartbeat interval
    setInterval(() => this.checkConnections(), this.HEARTBEAT_INTERVAL);
    
    console.log('WebSocket server initialized on path /ws');
  }
  
  private setupEventHandlers() {
    this.wss.on('connection', (ws: WebSocket) => {
      // Initialize client
      const clientId = uuidv4();
      this.clients.set(ws, {
        id: clientId,
        userId: '',
        sessionId: '',
        rooms: new Set(),
        lastActivity: new Date()
      });
      
      console.log(`Client connected: ${clientId}`);
      
      // Set up ping/pong for heartbeat
      ws.on('pong', () => {
        const client = this.clients.get(ws);
        if (client) {
          client.lastActivity = new Date();
        }
      });
      
      // Handle messages
      ws.on('message', (data: string) => {
        try {
          const message: WebSocketMessage = JSON.parse(data);
          const client = this.clients.get(ws);
          
          if (!client) {
            console.error('Message received from unknown client');
            return;
          }
          
          // Update client activity
          client.lastActivity = new Date();
          
          // Handle message based on type
          this.handleMessage(ws, client, message);
        } catch (err) {
          console.error('Error processing WebSocket message:', err);
        }
      });
      
      // Handle disconnections
      ws.on('close', () => {
        this.handleClientDisconnect(ws);
      });
      
      // Handle errors
      ws.on('error', (err) => {
        console.error('WebSocket error:', err);
        this.handleClientDisconnect(ws);
      });
    });
  }
  
  private handleMessage(ws: WebSocket, client: WebSocketClient, message: WebSocketMessage) {
    // Ensure message has an ID
    const messageId = message.id || uuidv4();
    
    // Generate timestamp if not provided
    const timestamp = message.timestamp || new Date().toISOString();
    
    // Handle by message type
    switch (message.type) {
      case 'connect':
        this.handleConnectMessage(ws, client, message);
        break;
        
      case 'disconnect':
        this.handleDisconnectMessage(ws, client, message);
        break;
        
      case 'chat':
        this.handleChatMessage(client, message);
        break;
        
      case 'drawing':
      case 'drawing_update':
        this.handleDrawingMessage(client, message);
        break;
        
      case 'presence':
        this.handlePresenceMessage(client, message);
        break;
        
      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }
  
  private handleConnectMessage(ws: WebSocket, client: WebSocketClient, message: WebSocketMessage) {
    // Extract user and session info
    if (message.data && message.data.userId) {
      client.userId = message.data.userId;
    }
    
    if (message.data && message.data.sessionId) {
      client.sessionId = message.data.sessionId;
    }
    
    // Join room if specified
    if (message.roomId) {
      this.joinRoom(ws, client, message.roomId);
      
      // Send presence update to room
      this.broadcastPresence(message.roomId);
      
      // Send current room state to client
      this.sendRoomState(ws, client, message.roomId);
    }
    
    console.log(`Client ${client.id} identified as user ${client.userId}`);
  }
  
  private handleDisconnectMessage(ws: WebSocket, client: WebSocketClient, message: WebSocketMessage) {
    // Leave room if specified
    if (message.roomId && client.rooms.has(message.roomId)) {
      this.leaveRoom(ws, client, message.roomId);
      
      // Broadcast presence update
      this.broadcastPresence(message.roomId);
    }
    
    // Close connection
    ws.close();
  }
  
  private handleChatMessage(client: WebSocketClient, message: WebSocketMessage) {
    // Broadcast chat message to room
    if (message.roomId) {
      const room = this.rooms.get(message.roomId);
      
      if (room) {
        this.broadcast(message, room.clients, client);
      }
    }
  }
  
  private handleDrawingMessage(client: WebSocketClient, message: WebSocketMessage) {
    // Validate room
    if (!message.roomId) return;
    
    const room = this.rooms.get(message.roomId);
    if (!room) return;
    
    // Store feature in room state for new clients
    if (message.type === 'drawing' && message.data && message.data.action) {
      const action = message.data.action;
      const feature = message.data.feature;
      
      if (action === 'create' && feature) {
        room.features.push(feature);
      } else if (action === 'update' && feature && feature.id) {
        const index = room.features.findIndex(f => f.id === feature.id);
        if (index >= 0) {
          room.features[index] = feature;
        }
      } else if (action === 'delete' && feature && feature.id) {
        room.features = room.features.filter(f => f.id !== feature.id);
      }
    }
    
    // Store annotation in room state
    if (message.type === 'drawing_update' && message.data && message.data.action) {
      const action = message.data.action;
      const annotation = message.data.annotation;
      
      if (action === 'create' && annotation) {
        room.annotations.push(annotation);
      } else if (action === 'update' && annotation && annotation.id) {
        const index = room.annotations.findIndex(a => a.id === annotation.id);
        if (index >= 0) {
          room.annotations[index] = annotation;
        }
      } else if (action === 'delete' && annotation && annotation.id) {
        room.annotations = room.annotations.filter(a => a.id !== annotation.id);
      }
    }
    
    // Broadcast to room
    this.broadcast(message, room.clients, client);
  }
  
  private handlePresenceMessage(client: WebSocketClient, message: WebSocketMessage) {
    // Update presence for room
    if (message.roomId) {
      this.broadcastPresence(message.roomId);
    }
  }
  
  private joinRoom(ws: WebSocket, client: WebSocketClient, roomId: string) {
    // Create room if it doesn't exist
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        clients: new Set(),
        features: [],
        annotations: [],
        lastActivity: new Date()
      });
    }
    
    // Get room
    const room = this.rooms.get(roomId);
    
    if (!room) return;
    
    // Add client to room
    room.clients.add(ws);
    client.rooms.add(roomId);
    
    // Update room activity
    room.lastActivity = new Date();
    
    console.log(`Client ${client.id} joined room ${roomId}`);
  }
  
  private leaveRoom(ws: WebSocket, client: WebSocketClient, roomId: string) {
    // Get room
    const room = this.rooms.get(roomId);
    
    if (!room) return;
    
    // Remove client from room
    room.clients.delete(ws);
    client.rooms.delete(roomId);
    
    console.log(`Client ${client.id} left room ${roomId}`);
    
    // Clean up empty rooms
    if (room.clients.size === 0) {
      this.rooms.delete(roomId);
      console.log(`Room ${roomId} deleted (empty)`);
    }
  }
  
  private sendRoomState(ws: WebSocket, client: WebSocketClient, roomId: string) {
    const room = this.rooms.get(roomId);
    
    if (!room) return;
    
    // Send initial feature state
    if (room.features.length > 0) {
      const featuresMessage: WebSocketMessage = {
        id: uuidv4(),
        type: 'drawing',
        roomId,
        source: 'server',
        timestamp: new Date().toISOString(),
        data: {
          action: 'init',
          features: room.features
        }
      };
      
      this.sendMessage(ws, featuresMessage);
    }
    
    // Send initial annotation state
    if (room.annotations.length > 0) {
      const annotationsMessage: WebSocketMessage = {
        id: uuidv4(),
        type: 'drawing_update',
        roomId,
        source: 'server',
        timestamp: new Date().toISOString(),
        data: {
          action: 'init',
          annotations: room.annotations
        }
      };
      
      this.sendMessage(ws, annotationsMessage);
    }
    
    // Send presence information
    const presenceMessage = this.createPresenceMessage(roomId);
    this.sendMessage(ws, presenceMessage);
  }
  
  private broadcastPresence(roomId: string) {
    const room = this.rooms.get(roomId);
    
    if (!room) return;
    
    const message = this.createPresenceMessage(roomId);
    
    // Broadcast to all clients in room
    for (const client of room.clients) {
      this.sendMessage(client, message);
    }
  }
  
  private createPresenceMessage(roomId: string): WebSocketMessage {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return {
        id: uuidv4(),
        type: 'presence',
        roomId,
        source: 'server',
        timestamp: new Date().toISOString(),
        data: {
          users: []
        }
      };
    }
    
    // Collect user IDs in room
    const users: string[] = [];
    
    for (const client of room.clients) {
      const clientInfo = this.clients.get(client);
      if (clientInfo && clientInfo.userId && !users.includes(clientInfo.userId)) {
        users.push(clientInfo.userId);
      }
    }
    
    return {
      id: uuidv4(),
      type: 'presence',
      roomId,
      source: 'server',
      timestamp: new Date().toISOString(),
      data: {
        users
      }
    };
  }
  
  private broadcast(
    message: WebSocketMessage,
    clients: Set<WebSocket>,
    sourceClient?: WebSocketClient
  ) {
    // Add server fields if not present
    const broadcastMessage: WebSocketMessage = {
      id: message.id || uuidv4(),
      timestamp: message.timestamp || new Date().toISOString(),
      ...message
    };
    
    // Broadcast to all clients except source
    for (const client of clients) {
      const clientInfo = this.clients.get(client);
      
      // Skip source client
      if (sourceClient && clientInfo && clientInfo.id === sourceClient.id) {
        continue;
      }
      
      this.sendMessage(client, broadcastMessage);
    }
  }
  
  private sendMessage(ws: WebSocket, message: WebSocketMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (err) {
        console.error('Error sending WebSocket message:', err);
      }
    }
  }
  
  private handleClientDisconnect(ws: WebSocket) {
    const client = this.clients.get(ws);
    
    if (client) {
      console.log(`Client disconnected: ${client.id}`);
      
      // Leave all rooms
      for (const roomId of client.rooms) {
        this.leaveRoom(ws, client, roomId);
        
        // Broadcast presence update
        this.broadcastPresence(roomId);
      }
      
      // Remove client
      this.clients.delete(ws);
    }
  }
  
  private checkConnections() {
    const now = new Date();
    
    // Send ping to all clients
    for (const [ws, client] of this.clients.entries()) {
      // Check if client has timed out
      const timeSinceActivity = now.getTime() - client.lastActivity.getTime();
      
      if (timeSinceActivity > this.CLIENT_TIMEOUT) {
        console.log(`Client ${client.id} timed out`);
        ws.terminate();
        this.handleClientDisconnect(ws);
      } else {
        // Send ping
        try {
          ws.ping();
        } catch (err) {
          console.error('Error sending ping:', err);
          this.handleClientDisconnect(ws);
        }
      }
    }
  }
}

export function setupWebSocketServer(server: Server): WebSocketHandler {
  return new WebSocketHandler(server);
}