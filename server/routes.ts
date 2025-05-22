import express, { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import auditLogRoutes from "./routes/audit-logs";
import parcelRoutes from "./routes/parcels";
import eventsRoutes from "./routes/events";
import metricsRoutes from "./routes/metrics";
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

  // API Health check route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Protected route example
  app.get("/api/protected", isAuthenticated, async (req: any, res) => {
    res.json({ 
      message: "This is protected data", 
      userId: req.user.id,
      timestamp: new Date().toISOString()
    });
  });

  // Create HTTP server (this will be returned at the end of the function)
  const httpServer = createServer(app);
  
  return httpServer;
}