import { Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import { logger } from './logger';

/**
 * WebSocket server manager for collaborative features
 * 
 * This class manages WebSocket connections, rooms, and messages for
 * real-time collaboration.
 */
export class WebSocketServerManager {
  private wss: WebSocketServer;
  private rooms: Map<string, Set<WebSocket>> = new Map();
  private clientRooms: Map<WebSocket, string> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(server: Server) {
    // Initialize WebSocket server with a specific path
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws'
    });
    
    logger.info('Initializing WebSocket server');
    
    // Set up connection handlers
    this.setupConnectionHandlers();
    
    // Start ping interval for connection health checks
    this.startPingInterval();
    
    logger.info('WebSocket server initialized');
  }
  
  private setupConnectionHandlers(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      logger.info('New WebSocket connection established');
      
      // Handle messages from clients
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(ws, data);
        } catch (error) {
          logger.error(`Error parsing WebSocket message: ${error}`);
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Invalid message format' 
          }));
        }
      });
      
      // Handle client disconnection
      ws.on('close', () => {
        logger.info('WebSocket connection closed');
        this.handleDisconnect(ws);
      });
      
      // Handle connection errors
      ws.on('error', (error) => {
        logger.error(`WebSocket error: ${error}`);
      });
      
      // Send initial connection confirmation
      ws.send(JSON.stringify({ 
        type: 'connected', 
        message: 'Connected to BentonGeoPro collaborative server' 
      }));
    });
    
    logger.info('WebSocket connection handlers set up');
  }
  
  private handleMessage(ws: WebSocket, data: any): void {
    const { type, roomId, payload } = data;
    
    switch (type) {
      case 'join':
        this.joinRoom(ws, roomId);
        break;
        
      case 'leave':
        this.leaveRoom(ws);
        break;
        
      case 'map-event':
        this.broadcastToRoom(ws, roomId, {
          type: 'map-event',
          payload
        });
        break;
        
      case 'chat':
        this.broadcastToRoom(ws, roomId, {
          type: 'chat',
          sender: payload.sender,
          message: payload.message,
          timestamp: new Date().toISOString()
        });
        break;
        
      case 'pong':
        // Handle pong response from client
        break;
        
      default:
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Unknown message type' 
        }));
    }
  }
  
  private joinRoom(ws: WebSocket, roomId: string): void {
    // Leave current room if client is in one
    this.leaveRoom(ws);
    
    // Get or create the room
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    
    // Add client to room
    const room = this.rooms.get(roomId)!;
    room.add(ws);
    this.clientRooms.set(ws, roomId);
    
    // Notify client they've joined
    ws.send(JSON.stringify({ 
      type: 'joined', 
      roomId,
      userCount: room.size
    }));
    
    // Notify other clients in the room
    this.broadcastToRoom(ws, roomId, {
      type: 'user-joined',
      roomId,
      userCount: room.size
    });
    
    logger.info(`Client joined room: ${roomId}, total clients in room: ${room.size}`);
  }
  
  private leaveRoom(ws: WebSocket): void {
    const roomId = this.clientRooms.get(ws);
    
    if (roomId && this.rooms.has(roomId)) {
      const room = this.rooms.get(roomId)!;
      
      // Remove client from room
      room.delete(ws);
      
      // Delete room if empty
      if (room.size === 0) {
        this.rooms.delete(roomId);
        logger.info(`Room deleted (empty): ${roomId}`);
      } else {
        // Notify others in the room
        this.broadcastToRoom(ws, roomId, {
          type: 'user-left',
          roomId,
          userCount: room.size
        });
      }
      
      logger.info(`Client left room: ${roomId}, remaining clients: ${room.size}`);
    }
    
    // Remove room reference for client
    this.clientRooms.delete(ws);
  }
  
  private handleDisconnect(ws: WebSocket): void {
    // Handle proper room cleanup on disconnect
    this.leaveRoom(ws);
  }
  
  private broadcastToRoom(sender: WebSocket, roomId: string, message: any): void {
    if (!this.rooms.has(roomId)) {
      return;
    }
    
    const room = this.rooms.get(roomId)!;
    const messageStr = JSON.stringify(message);
    
    room.forEach((client) => {
      // Don't send back to the sender
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }
  
  private startPingInterval(): void {
    // Send ping to all clients every 30 seconds to keep connections alive
    this.pingInterval = setInterval(() => {
      this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        }
      });
    }, 30000);
  }
  
  /**
   * Gets information about all active rooms
   */
  public getRoomsStatus(): { roomId: string; userCount: number }[] {
    const status: { roomId: string; userCount: number }[] = [];
    
    this.rooms.forEach((clients, roomId) => {
      status.push({
        roomId,
        userCount: clients.size
      });
    });
    
    return status;
  }
  
  /**
   * Gets the total number of active connections
   */
  public getActiveConnectionsCount(): number {
    return this.wss.clients.size;
  }
  
  /**
   * Shuts down the WebSocket server
   */
  public shutdown(): void {
    // Clean up interval on shutdown
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    // Close all connections
    this.wss.close();
  }
}