import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

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

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // Log the error but only throw in development
    console.error(`Error handling request: ${err.stack || err}`);
    
    // Don't include sensitive error details in production
    const responseMessage = process.env.NODE_ENV === 'production' 
      ? (status === 500 ? 'Internal Server Error' : message)
      : message;
    
    // Respond with appropriate status and message
    res.status(status).json({ 
      message: responseMessage,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
    
    // Only throw in development to avoid crashing the server in production
    if (process.env.NODE_ENV === 'development') {
      console.warn('Non-fatal error in development mode:', err);
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

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
})();
