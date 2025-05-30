import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

interface SubscriptionEntry {
  socket: WebSocket;
  userId?: number;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private subscriptions: Map<string, Set<SubscriptionEntry>> = new Map();
  
  constructor(server: http.Server) {
    // Create WebSocket server on the same HTTP server but with distinct path
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
    });
    
    this.setupEventHandlers();
    
    console.log('WebSocket server initialized');
  }

  private setupEventHandlers() {
    this.wss.on('connection', (socket, req) => {
      console.log(`WebSocket connection established from ${req.socket.remoteAddress}`);
      
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
          console.error('Error handling WebSocket message:', error);
        }
      });
      
      // Handle disconnection
      socket.on('close', (code, reason) => {
        console.log(`WebSocket connection closed: ${code} - ${reason}`);
        this.removeSocketFromAllChannels(socket);
      });
      
      // Handle errors
      socket.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }
  
  private handleMessage(socket: WebSocket, message: any) {
    console.log('Received message:', message);
    
    switch (message.type) {
      case 'subscribe':
        this.handleSubscribe(socket, message.channel, message.userId);
        break;
        
      case 'unsubscribe':
        this.handleUnsubscribe(socket, message.channel);
        break;
        
      default:
        console.log(`Unknown message type: ${message.type}`);
        break;
    }
  }
  
  private handleSubscribe(socket: WebSocket, channel: string, userId?: number) {
    if (!channel) {
      return;
    }
    
    // Get or create channel subscription set
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    
    const channelSubs = this.subscriptions.get(channel)!;
    
    // Add socket to channel subscriptions
    channelSubs.add({ socket, userId });
    
    console.log(`Socket subscribed to channel: ${channel}`);
    
    // Send confirmation
    this.sendToSocket(socket, {
      type: 'subscribed',
      channel,
      timestamp: new Date().toISOString()
    });
  }
  
  private handleUnsubscribe(socket: WebSocket, channel: string) {
    if (!channel || !this.subscriptions.has(channel)) {
      return;
    }
    
    const channelSubs = this.subscriptions.get(channel)!;
    
    // Find and remove the entry with this socket
    for (const entry of channelSubs) {
      if (entry.socket === socket) {
        channelSubs.delete(entry);
        console.log(`Socket unsubscribed from channel: ${channel}`);
        break;
      }
    }
    
    // Clean up empty channels
    if (channelSubs.size === 0) {
      this.subscriptions.delete(channel);
    }
    
    // Send confirmation
    this.sendToSocket(socket, {
      type: 'unsubscribed',
      channel,
      timestamp: new Date().toISOString()
    });
  }
  
  private removeSocketFromAllChannels(socket: WebSocket) {
    // Iterate through all channels and remove this socket
    for (const [channel, subscribers] of this.subscriptions.entries()) {
      let found = false;
      
      for (const entry of subscribers) {
        if (entry.socket === socket) {
          subscribers.delete(entry);
          found = true;
          break;
        }
      }
      
      // Clean up empty channels
      if (found && subscribers.size === 0) {
        this.subscriptions.delete(channel);
      }
    }
  }
  
  private sendToSocket(socket: WebSocket, data: any) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    }
  }
  
  // Public methods
  
  /**
   * Broadcast a message to all subscribers of a channel
   */
  public broadcast(channel: string, message: any) {
    if (!this.subscriptions.has(channel)) {
      console.log(`No subscribers for channel: ${channel}`);
      return;
    }
    
    const subscribers = this.subscriptions.get(channel)!;
    console.log(`Broadcasting to ${subscribers.size} subscribers on channel: ${channel}`);
    
    for (const { socket } of subscribers) {
      this.sendToSocket(socket, message);
    }
  }
  
  /**
   * Broadcast achievement notification to a specific user
   */
  public notifyAchievement(userId: number, achievement: any, userAchievement: any) {
    const channel = `user-achievements-${userId}`;
    
    this.broadcast(channel, {
      type: 'achievement-earned',
      achievement,
      userAchievement,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Broadcast workflow update
   */
  public notifyWorkflowUpdate(workflowId: number, status: string, data: any) {
    const channel = `workflow-${workflowId}`;
    
    this.broadcast(channel, {
      type: 'workflow-update',
      status,
      data,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Send system notification to all connected clients
   */
  public broadcastSystemNotification(title: string, message: string, level: 'info' | 'warning' | 'error' = 'info') {
    const notification = {
      type: 'system-notification',
      title,
      message,
      level,
      timestamp: new Date().toISOString()
    };
    
    // Send to all connected sockets
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(notification));
      }
    });
  }
}