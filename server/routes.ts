import express, { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import authRoutes from './routes/auth-routes';

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes (Replit OpenID Connect)
  await setupAuth(app);
  
  // Register authentication routes
  app.use('/api/auth', authRoutes);

  // API Health check route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Protected route example
  app.get("/api/protected", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    res.json({ 
      message: "This is protected data", 
      userId,
      timestamp: new Date().toISOString()
    });
  });

  // Create HTTP server (this will be returned at the end of the function)
  const httpServer = createServer(app);
  
  return httpServer;
}