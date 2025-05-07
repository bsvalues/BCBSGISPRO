import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { logger } from './logger';

// WebSocket client interface
interface Client {
  ws: WebSocket;
  subscriptions: Set<string>;
}

// WebSocket message interface
interface WebSocketMessage {
  type: string;
  channel?: string;
  [key: string]: any;
}

// Store connected clients
const clients = new Map<number, Client>();

// Setup WebSocket server
export function setupWebSocketServer(httpServer: Server) {
  // Create WebSocket server for real-time notifications
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Handle WebSocket connections
  wss.on('connection', (ws) => {
    const clientId = Date.now();
    const subscriptions = new Set<string>();
    
    // Store this client connection
    clients.set(clientId, {
      ws,
      subscriptions
    });
    
    logger.info(`WebSocket client connected: ${clientId}`);
    
    // Handle messages from clients
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString()) as WebSocketMessage;
        
        // Handle subscription requests
        if (data.type === 'subscribe' && data.channel) {
          subscriptions.add(data.channel);
          logger.info(`Client ${clientId} subscribed to ${data.channel}`);
          
          // Send confirmation
          ws.send(JSON.stringify({
            type: 'subscribed',
            channel: data.channel
          }));
        }
        
        // Handle unsubscribe requests
        if (data.type === 'unsubscribe' && data.channel) {
          subscriptions.delete(data.channel);
          logger.info(`Client ${clientId} unsubscribed from ${data.channel}`);
          
          // Send confirmation
          ws.send(JSON.stringify({
            type: 'unsubscribed',
            channel: data.channel
          }));
        }
      } catch (error) {
        logger.error('WebSocket message parse error:', error);
      }
    });
    
    // Handle disconnections
    ws.on('close', () => {
      clients.delete(clientId);
      logger.info(`WebSocket client disconnected: ${clientId}`);
    });
    
    // Send initial welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to TerraFusionSync WebSocket server',
      clientId
    }));
  });
  
  return wss;
}

// Broadcast achievement notification
export function broadcastAchievement(userId: number, achievement: any, userAchievement: any) {
  const channel = `user-achievements-${userId}`;
  const message = JSON.stringify({
    type: 'achievement-earned',
    achievement,
    userAchievement
  });
  
  // Broadcast to all subscribed clients
  clients.forEach((client) => {
    if (client.subscriptions.has(channel) && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  });
  
  logger.info(`Achievement notification sent to channel ${channel}`);
}

// Broadcast workflow status update
export function broadcastWorkflowUpdate(workflowId: number, status: string, data: any) {
  const channel = `workflow-${workflowId}`;
  const message = JSON.stringify({
    type: 'workflow-update',
    status,
    data
  });
  
  // Broadcast to all subscribed clients
  clients.forEach((client) => {
    if (client.subscriptions.has(channel) && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  });
}

// Broadcast system notification
export function broadcastSystemNotification(title: string, message: string, level: 'info' | 'warning' | 'error' = 'info') {
  const systemMessage = JSON.stringify({
    type: 'system-notification',
    title,
    message,
    level,
    timestamp: new Date().toISOString()
  });
  
  // Broadcast to all clients
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(systemMessage);
    }
  });
}