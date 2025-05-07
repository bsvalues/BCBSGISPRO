import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { logger } from './logger';

export class WebSocketServerManager {
  private wss: WebSocketServer;
  private rooms: Map<string, Set<WebSocket>> = new Map();
  private clientInfo: Map<WebSocket, { userId?: number, rooms: Set<string> }> = new Map();
  
  constructor(server: http.Server) {
    // Create WebSocket server on the same HTTP server
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
    });
    
    this.setupEventHandlers();
    
    logger.info('WebSocket server initialized');
    console.log('WebSocket server initialized');
  }
  
  private setupEventHandlers() {
    this.wss.on('connection', (socket, req) => {
      logger.info(`WebSocket connection established from ${req.socket.remoteAddress}`);
      
      // Initialize client info
      this.clientInfo.set(socket, { rooms: new Set() });
      
      // Send connected confirmation
      this.sendToSocket(socket, {
        type: 'connected',
        timestamp: new Date().toISOString()
      });
      
      // Handle incoming messages
      socket.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(socket, message);
        } catch (error) {
          logger.error('Error handling WebSocket message:', error);
        }
      });
      
      // Handle disconnection
      socket.on('close', () => {
        this.handleDisconnection(socket);
      });
      
      // Handle errors
      socket.on('error', (error) => {
        logger.error('WebSocket error:', error);
      });
    });
  }
  
  private handleMessage(socket: WebSocket, message: any) {
    logger.info('Received WebSocket message:', message);
    
    switch (message.type) {
      case 'ping':
        this.sendToSocket(socket, { type: 'pong', timestamp: new Date().toISOString() });
        break;
        
      case 'join':
        this.joinRoom(socket, message.room, message.userId);
        break;
        
      case 'leave':
        this.leaveRoom(socket, message.room);
        break;
        
      case 'subscribe':
        this.joinRoom(socket, message.channel, message.userId);
        break;
        
      case 'unsubscribe':
        this.leaveRoom(socket, message.channel);
        break;
        
      case 'chat':
        if (message.room) {
          this.sendToRoom(message.room, {
            type: 'chat',
            sender: message.sender || 'Anonymous',
            text: message.text,
            timestamp: new Date().toISOString()
          });
        }
        break;
        
      default:
        logger.info(`Unknown WebSocket message type: ${message.type}`);
        break;
    }
  }
  
  private handleDisconnection(socket: WebSocket) {
    // Get client info
    const info = this.clientInfo.get(socket);
    
    if (info) {
      // Remove from all rooms
      for (const room of info.rooms) {
        this.leaveRoom(socket, room);
      }
      
      // Remove client info
      this.clientInfo.delete(socket);
    }
    
    logger.info('WebSocket connection closed');
  }
  
  private joinRoom(socket: WebSocket, room: string, userId?: number) {
    if (!room) return;
    
    // Get or create room
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    
    // Add socket to room
    this.rooms.get(room)!.add(socket);
    
    // Update client info
    const info = this.clientInfo.get(socket);
    if (info) {
      info.rooms.add(room);
      if (userId !== undefined) {
        info.userId = userId;
      }
    }
    
    logger.info(`Client joined room: ${room}`);
    
    // Send confirmation
    this.sendToSocket(socket, {
      type: 'subscribed',
      channel: room,
      timestamp: new Date().toISOString()
    });
  }
  
  private leaveRoom(socket: WebSocket, room: string) {
    if (!room || !this.rooms.has(room)) return;
    
    // Remove socket from room
    const roomClients = this.rooms.get(room)!;
    roomClients.delete(socket);
    
    // Update client info
    const info = this.clientInfo.get(socket);
    if (info) {
      info.rooms.delete(room);
    }
    
    // Clean up empty rooms
    if (roomClients.size === 0) {
      this.rooms.delete(room);
    }
    
    logger.info(`Client left room: ${room}`);
    
    // Send confirmation
    this.sendToSocket(socket, {
      type: 'unsubscribed',
      channel: room,
      timestamp: new Date().toISOString()
    });
  }
  
  private sendToSocket(socket: WebSocket, data: any) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    }
  }
  
  // Public methods
  
  /**
   * Get the number of active WebSocket connections
   */
  public getActiveConnectionsCount(): number {
    return this.clientInfo.size;
  }
  
  /**
   * Get information about active rooms
   */
  public getRoomsStatus(): Array<{ room: string, clients: number }> {
    const status: Array<{ room: string, clients: number }> = [];
    
    for (const [room, clients] of this.rooms.entries()) {
      status.push({
        room,
        clients: clients.size
      });
    }
    
    return status;
  }
  
  /**
   * Send a message to all clients in a room
   */
  public sendToRoom(room: string, message: any): void {
    if (!this.rooms.has(room)) {
      logger.info(`Room not found: ${room}`);
      return;
    }
    
    const clients = this.rooms.get(room)!;
    logger.info(`Sending message to ${clients.size} clients in room: ${room}`);
    
    for (const client of clients) {
      this.sendToSocket(client, message);
    }
  }
  
  /**
   * Send a message to all connected clients
   */
  public broadcast(message: any): void {
    logger.info(`Broadcasting message to all clients`);
    
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
  
  /**
   * Send a system notification to all connected clients
   */
  public broadcastSystemNotification(title: string, message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    this.broadcast({
      type: 'system-notification',
      title,
      message,
      level,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Notify a user about an earned achievement
   */
  public notifyAchievement(userId: number, achievement: any, userAchievement: any): void {
    // The channel for user-specific achievements
    const channel = `user-achievements-${userId}`;
    
    this.sendToRoom(channel, {
      type: 'achievement-earned',
      achievement,
      userAchievement,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Wrapper for legacy code - will be refactored in the future
   */
  public broadcastAchievement(userId: number, achievement: any, userAchievement: any): void {
    this.notifyAchievement(userId, achievement, userAchievement);
  }
  
  /**
   * Notify subscribers about a workflow update
   */
  public notifyWorkflowUpdate(workflowId: number, status: string, data: any): void {
    const channel = `workflow-${workflowId}`;
    
    this.sendToRoom(channel, {
      type: 'workflow-update',
      status,
      data,
      timestamp: new Date().toISOString()
    });
  }
}