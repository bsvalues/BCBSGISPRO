import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { v4 as uuidv4 } from 'uuid';

// Define WebSocket message types
enum MessageType {
  CHAT = 'chat',
  DRAWING_UPDATE = 'drawing_update',
  FEATURE_LOCK = 'feature_lock',
  CURSOR_POSITION = 'cursor_position',
  PRESENCE = 'presence',
  SYSTEM = 'system'
}

// Define WebSocket message interface
interface WebSocketMessage {
  type: MessageType;
  data?: any;
  source?: string;
  timestamp?: string;
  roomId?: string;
}

// Client connection with metadata
interface WebSocketClient {
  ws: WebSocket;
  id: string;
  roomId: string;
  lastActivity: Date;
  metadata: Record<string, any>;
}

// Create and initialize the WebSocket server
export function setupWebSocketServer(httpServer: Server) {
  // Create WebSocket server on a specific path
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws' // Specify path to avoid conflicts with Vite HMR WebSocket
  });
  
  // Client tracking
  const clients = new Map<WebSocket, WebSocketClient>();
  
  // Room tracking for easier broadcasting
  const rooms = new Map<string, Set<WebSocket>>();
  
  // Setup a heartbeat interval to detect and clean up dead connections
  const heartbeatInterval = setInterval(() => {
    const now = new Date();
    
    // Check for inactive clients (no message for 2 minutes)
    for (const [ws, client] of clients.entries()) {
      const inactiveTime = now.getTime() - client.lastActivity.getTime();
      
      // If inactive for too long and not connected, remove them
      if (inactiveTime > 120000 && ws.readyState !== WebSocket.OPEN) {
        removeClient(ws);
      }
    }
  }, 30000); // Run every 30 seconds
  
  // Remove client and clean up
  function removeClient(ws: WebSocket) {
    const client = clients.get(ws);
    if (!client) return;
    
    // Remove from room tracking
    const room = rooms.get(client.roomId);
    if (room) {
      room.delete(ws);
      
      // If room is empty, delete it
      if (room.size === 0) {
        rooms.delete(client.roomId);
      } else {
        // Notify others in the room that this client left
        broadcastToRoom(client.roomId, {
          type: MessageType.SYSTEM,
          data: {
            action: 'leave',
            clientId: client.id
          },
          timestamp: new Date().toISOString()
        }, ws); // Exclude the client that left
      }
    }
    
    // Remove from clients tracking
    clients.delete(ws);
    
    console.log(`WebSocket client disconnected. Active clients: ${clients.size}`);
  }
  
  // Add client to a room
  function addClientToRoom(ws: WebSocket, roomId: string) {
    const client = clients.get(ws);
    if (!client) return;
    
    // If client was in another room, remove them
    if (client.roomId && client.roomId !== roomId) {
      const oldRoom = rooms.get(client.roomId);
      if (oldRoom) {
        oldRoom.delete(ws);
        
        // If old room is empty, delete it
        if (oldRoom.size === 0) {
          rooms.delete(client.roomId);
        } else {
          // Notify others in the old room that this client left
          broadcastToRoom(client.roomId, {
            type: MessageType.SYSTEM,
            data: {
              action: 'leave',
              clientId: client.id
            },
            timestamp: new Date().toISOString()
          }, ws); // Exclude the client that left
        }
      }
    }
    
    // Update client's room
    client.roomId = roomId;
    
    // Add to new room
    let room = rooms.get(roomId);
    if (!room) {
      room = new Set<WebSocket>();
      rooms.set(roomId, room);
    }
    room.add(ws);
    
    // Notify others in the room that this client joined
    broadcastToRoom(roomId, {
      type: MessageType.SYSTEM,
      data: {
        action: 'join',
        clientId: client.id
      },
      timestamp: new Date().toISOString()
    }, ws); // Exclude the client that joined
    
    console.log(`Client ${client.id} joined room ${roomId}. Room size: ${room.size}`);
  }
  
  // Broadcast message to all clients in a room
  function broadcastToRoom(roomId: string, message: WebSocketMessage, exclude?: WebSocket) {
    const room = rooms.get(roomId);
    if (!room) return;
    
    const messageStr = JSON.stringify(message);
    
    for (const client of room) {
      // Skip excluded client and non-open connections
      if (client === exclude || client.readyState !== WebSocket.OPEN) continue;
      
      client.send(messageStr);
    }
  }
  
  // Get a list of client IDs in a room
  function getClientsInRoom(roomId: string): string[] {
    const room = rooms.get(roomId);
    if (!room) return [];
    
    const clientIds: string[] = [];
    for (const ws of room) {
      const client = clients.get(ws);
      if (client) {
        clientIds.push(client.id);
      }
    }
    
    return clientIds;
  }
  
  // Connection event
  wss.on('connection', (ws) => {
    // Assign a unique ID to this client
    const clientId = uuidv4();
    
    // Store client information
    clients.set(ws, {
      ws,
      id: clientId,
      roomId: 'default', // Default room
      lastActivity: new Date(),
      metadata: {}
    });
    
    // Add to default room
    addClientToRoom(ws, 'default');
    
    console.log(`WebSocket client connected. Active clients: ${clients.size}`);
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: MessageType.SYSTEM,
      data: {
        message: 'Welcome to BentonGeoPro WebSocket Server',
        clientId
      },
      timestamp: new Date().toISOString()
    }));
    
    // Message handler
    ws.on('message', (messageData) => {
      try {
        // Update last activity time
        const client = clients.get(ws);
        if (client) {
          client.lastActivity = new Date();
        }
        
        // Parse message
        const message: WebSocketMessage = JSON.parse(messageData.toString());
        
        // Process based on message type
        switch (message.type) {
          case MessageType.SYSTEM:
            // Handle system messages (join/leave room, etc.)
            if (message.data?.action === 'join' && message.data?.roomId) {
              addClientToRoom(ws, message.data.roomId);
            }
            break;
            
          case MessageType.CHAT:
            // Add room clients info to the message
            if (client && message.roomId) {
              // Add list of connected users to the message
              message.data = {
                ...message.data,
                connectedUsers: getClientsInRoom(message.roomId)
              };
              
              // Broadcast to room
              broadcastToRoom(message.roomId, message);
            }
            break;
            
          case MessageType.DRAWING_UPDATE:
            // Forward drawing updates to all clients in the room
            if (client && message.roomId) {
              broadcastToRoom(message.roomId, message);
            }
            break;
            
          case MessageType.FEATURE_LOCK:
            // Handle feature locking between clients
            if (client && message.roomId && message.data?.featureId) {
              // Add client ID to the message
              message.source = client.id;
              
              // Track locked feature (could add more sophisticated locking logic here)
              if (message.data.action === 'lock') {
                client.metadata.lockedFeatures = [
                  ...(client.metadata.lockedFeatures || []),
                  message.data.featureId
                ];
              } else if (message.data.action === 'unlock') {
                client.metadata.lockedFeatures = (client.metadata.lockedFeatures || [])
                  .filter((id: string) => id !== message.data.featureId);
              }
              
              // Broadcast to room
              broadcastToRoom(message.roomId, message);
            }
            break;
            
          case MessageType.CURSOR_POSITION:
            // Forward cursor position to all clients in the room
            if (client && message.roomId) {
              // Add client ID to the message
              message.source = client.id;
              
              // Broadcast to room
              broadcastToRoom(message.roomId, message);
            }
            break;
            
          case MessageType.PRESENCE:
            // Update presence information
            if (client && message.roomId) {
              // Update client metadata
              client.metadata.presence = message.data;
              
              // Add list of connected users to the message
              message.data = {
                ...message.data,
                connectedUsers: getClientsInRoom(message.roomId)
              };
              
              // Broadcast to room
              broadcastToRoom(message.roomId, message);
            }
            break;
            
          default:
            // Unknown message type, ignore
            console.warn(`Unknown message type: ${message.type}`);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      removeClient(ws);
    });
    
    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      removeClient(ws);
    });
  });
  
  // Server error handler
  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });
  
  // Cleanup on shutdown
  const cleanup = () => {
    clearInterval(heartbeatInterval);
    
    // Close all connections
    for (const [ws] of clients) {
      ws.terminate();
    }
    
    // Clear maps
    clients.clear();
    rooms.clear();
    
    // Close server
    wss.close();
  };
  
  return {
    wss,
    cleanup,
    broadcastToClients: (roomId: string, message: any) => {
      broadcastToRoom(roomId, {
        type: MessageType.SYSTEM,
        data: message,
        timestamp: new Date().toISOString()
      });
    }
  };
}