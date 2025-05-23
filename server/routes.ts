import express, { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import auditLogRoutes from "./routes/audit-logs";
import parcelRoutes from "./routes/parcels";
import eventsRoutes from "./routes/events";
import metricsRoutes from "./routes/metrics";
import path from "path";
import fs from "fs";
// Import the auth/index.ts file for our authentication system

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes (Replit OpenID Connect)
  await setupAuth(app);
  
  // Authentication routes are now directly handled by our auth system

  // Register audit log routes
  app.use('/api/audit-logs', auditLogRoutes);
  
  // Register real Benton County data routes - Elon Musk Demo Dashboard 
  app.use('/api/parcels', parcelRoutes);
  app.use('/api/events', eventsRoutes);
  app.use('/api/metrics', metricsRoutes);
  
  // Add a simple health check endpoint for the root path
  app.get('/api', (req, res) => {
    res.json({ 
      status: 'ok', 
      message: 'BentonGeoPro API is running',
      timestamp: new Date().toISOString()
    });
  });

  // API Health check route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  // Enable CORS for development frontend server (Vite)
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
  });
  
  // Add a special route for direct access to the root path
  // This helps with direct browser access and refreshes on routes
  app.get('/', (req, res, next) => {
    // Let Vite handle the frontend through setupVite middleware
    next();
  });

  // Protected route example
  app.get("/api/protected", isAuthenticated, async (req: any, res) => {
    res.json({ 
      message: "This is protected data", 
      userId: req.user.id,
      timestamp: new Date().toISOString()
    });
  });

  // Serve static files from the public directory
  app.use(express.static(path.join(process.cwd(), 'server/public')));
  
  // Add a specific handler for the root route in case static serving doesn't work
  app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'server/public/index.html'));
  });

  // Create HTTP server (this will be returned at the end of the function)
  const httpServer = createServer(app);
  
  return httpServer;
}