import express from "express";
import cors from "cors";
import { json } from "express";
import { setupRoutes } from "./routes";
import { setupVite } from "./vite";
import path from "path";
import { db } from "./db"; // Initialize database connection
import { storage } from "./storage";
import { setupSimpleAuth } from "./simple-auth"; // Import auth setup

async function main() {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(json());
  
  // Setup Simple Authentication
  setupSimpleAuth(app);
  
  // Register all application routes
  const server = setupRoutes(app, storage);
  
  // Setup Vite for serving the frontend
  await setupVite(app, server);

  // Start the server
  const PORT = process.env.PORT || 5000;
  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to access the application`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});