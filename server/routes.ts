import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import WebSocket from 'ws';
import { IStorage } from './storage';

export function setupRoutes(app: express.Express, storage: IStorage) {
  // Simple authentication endpoints
  app.post('/api/login', (req, res) => {
    // Simple demo login - set a session cookie
    const user = {
      id: 'demo-user-001',
      email: 'demo@bentoncounty.gov',
      firstName: 'Demo',
      lastName: 'User',
      roles: ['assessor', 'user']
    };
    
    // Set session cookie
    res.cookie('session', JSON.stringify(user), { 
      httpOnly: true, 
      secure: false, // Set to true in production
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    res.json(user);
  });

  app.get('/api/auth/user', (req, res) => {
    // Check if user has session cookie
    const sessionCookie = req.cookies.session;
    if (sessionCookie) {
      try {
        const user = JSON.parse(sessionCookie);
        res.json(user);
      } catch (error) {
        res.status(401).json({ error: 'Invalid session' });
      }
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  });

  app.post('/api/logout', (req, res) => {
    res.clearCookie('session');
    res.json({ message: 'Logged out successfully' });
  });

  const httpServer = createServer(app);
  
  // Setup WebSocket server on /ws path
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket connection established');
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      message: 'Connected to Benton County GIS WebSocket Server'
    }));
    
    // Handle incoming messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
        
        // Process different message types
        switch (data.type) {
          case 'map_update':
            // Broadcast map updates to all connected clients
            broadcastMessage(wss, {
              type: 'map_update',
              data: data.data
            });
            break;
            
          case 'ping':
            // Respond to ping with pong
            ws.send(JSON.stringify({
              type: 'pong',
              timestamp: Date.now()
            }));
            break;
            
          default:
            console.log(`Unknown message type: ${data.type}`);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    // Handle WebSocket closing
    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });
  
  // API routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Check if a secret exists (for client-side validation)
  app.get('/api/check-secret', (req, res) => {
    const { key } = req.query;
    if (!key || typeof key !== 'string') {
      return res.status(400).json({ error: 'Secret key is required' });
    }
    
    const exists = !!process.env[key];
    res.json({ exists });
  });
  
  // Return the HTTP server so it can be used in the main application
  return httpServer;
}

// Helper function to broadcast messages to all connected clients
function broadcastMessage(wss: WebSocketServer, message: any) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}