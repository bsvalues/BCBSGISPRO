import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { errorHandler, notFoundHandler, setupGlobalErrorHandlers } from "./error-handler";
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import http from 'http';

// Load environment variables from .env.local
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    console.log('Loading environment variables from .env.local');
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    
    // Copy VITE_ prefixed variables to non-prefixed for server use
    for (const key in envConfig) {
      if (key.startsWith('VITE_')) {
        const serverKey = key.replace('VITE_', '');
        process.env[serverKey] = envConfig[key];
        console.log(`Set ${serverKey} from ${key}`);
      }
      
      // Also set the original key
      process.env[key] = envConfig[key];
    }
  } else {
    console.log('.env.local file not found, using existing environment variables');
  }
} catch (error) {
  console.error('Error loading .env.local file:', error);
}

// Create Express application
const app = express();

// Set trust proxy to properly handle requests behind reverse proxy
app.set('trust proxy', 1);

// Parse JSON bodies and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS headers for allowing cross-domain requests in development
app.use((req, res, next) => {
  // For Replit environment, we need to be more specific with CORS
  const replitUrl = process.env.REPLIT_URL;
  const allowedOrigins = [
    `https://${replitUrl}`,
    req.headers.origin || '*',
    'https://replit.com',
    'https://*.replit.app',
    'https://*.repl.co'
  ];
  
  // Allow the specific origin that made the request
  const origin = req.headers.origin || '';
  if (allowedOrigins.includes(origin) || origin.includes('replit')) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', allowedOrigins[0] || '*');
  }
  
  // Ensure credentials are always allowed for cookie-based auth
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Expires');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  
  // Allow exposing headers for cookie access
  res.header('Access-Control-Expose-Headers', 'Set-Cookie, Date, ETag');
  
  // Handle pre-flight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  // Add security headers and caching control
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'SAMEORIGIN');
  res.header('X-XSS-Protection', '1; mode=block');
  
  // Set cache control headers to prevent caching of API responses
  if (req.path.startsWith('/api')) {
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
  }
  
  // Log CORS-related headers for debugging
  console.log(`Request to ${req.path} from origin: ${req.headers.origin}`);
  console.log(`CORS headers: ${JSON.stringify({
    'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
    'Access-Control-Allow-Credentials': res.getHeader('Access-Control-Allow-Credentials')
  })}`);
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Setup global error handlers for uncaught exceptions and unhandled rejections
setupGlobalErrorHandlers(async () => {
  // Graceful shutdown logic
  log('Performing graceful shutdown...');
  
  if (globalThis.server) {
    await new Promise<void>((resolve) => {
      globalThis.server.close(() => {
        log('HTTP server closed');
        resolve();
      });
    });
  }
  
  log('Graceful shutdown complete');
});

(async () => {
  const server = await registerRoutes(app);
  
  // Store server instance in global for graceful shutdown access
  globalThis.server = server;

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  
  // Register the not found handler for undefined routes - must be after Vite setup
  app.use(notFoundHandler);
  
  // Register the global error handler - must be after Vite setup
  app.use(errorHandler);

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
  
  // Add signal handlers for graceful shutdown
  const signalHandlers = {
    SIGTERM: 'SIGTERM',
    SIGINT: 'SIGINT',
  };
  
  Object.keys(signalHandlers).forEach((signal) => {
    process.on(signal, async () => {
      log(`${signal} received. Starting graceful shutdown...`);
      
      server.close(() => {
        log('HTTP server closed');
        process.exit(0);
      });
      
      // Force exit after 10s if graceful shutdown fails
      setTimeout(() => {
        log('Forcing exit after timeout');
        process.exit(1);
      }, 10000);
    });
  });
})();
