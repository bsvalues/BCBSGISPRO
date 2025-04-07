import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Create more robust session settings with additional debugging
  const cookieMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  console.log(`Configuring session with cookie max age: ${cookieMaxAge}ms`);
  
  // Generate a stronger session secret
  const sessionSecret = process.env.SESSION_SECRET || 
    `benton-county-gis-workflow-assistant-secret-${Math.random().toString(36).substring(2, 15)}`;
  
  // Create a proper memory store for session handling
  const MemoryStoreClass = MemoryStore(session);
  const memoryStore = new MemoryStoreClass({
    checkPeriod: 86400000, // prune expired entries every 24h
    max: 1000 // Maximum number of sessions to store
  });
  
  // Log every set and destroy operation for debugging
  const originalSet = memoryStore.set;
  memoryStore.set = function(sid: string, session: any, callback: any) {
    console.log(`Setting session ${sid} with cookie expiry: ${session?.cookie?._expires}`);
    return originalSet.call(this, sid, session, callback);
  };
  
  const originalDestroy = memoryStore.destroy;
  memoryStore.destroy = function(sid: string, callback: any) {
    console.log(`Destroying session ${sid}`);
    return originalDestroy.call(this, sid, callback);
  };
  
  // Get the domain from REPLIT_URL environment variable
  const replitUrl = process.env.REPLIT_URL;
  const domain = replitUrl ? new URL(`https://${replitUrl}`).hostname : undefined;
  console.log(`Using session domain: ${domain || 'undefined (default)'}`);
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: true, // Save session on each request
    saveUninitialized: true, // Create session even without data
    store: memoryStore,
    name: 'bentongis.sid', // Change session name to avoid conflicts
    rolling: true, // Reset expiration on each request
    proxy: true, // Trust the reverse proxy
    cookie: {
      secure: true, // Enable secure cookies for HTTPS on Replit
      httpOnly: true, // Prevents client-side JS from reading cookie
      maxAge: cookieMaxAge,
      sameSite: 'none', // Allow cross-origin in Replit environment
      path: '/', // Ensure cookie is sent for all paths
      domain: undefined // Let browser determine the domain
    },
    // Ensure Replit environment variables are properly considered
    unset: 'destroy' // Remove session from store when req.session is destroyed
  };
  
  console.log('Session store configured with settings:', {
    resave: sessionSettings.resave,
    saveUninitialized: sessionSettings.saveUninitialized,
    rolling: sessionSettings.rolling,
    proxy: sessionSettings.proxy,
    cookieSecure: sessionSettings.cookie?.secure,
    cookieHttpOnly: sessionSettings.cookie?.httpOnly,
    cookieSameSite: sessionSettings.cookie?.sameSite,
    cookiePath: sessionSettings.cookie?.path,
    cookieMaxAge: sessionSettings.cookie?.maxAge
  });

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error, user: SelectUser) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }
        
        // Set cache-control headers to prevent caching
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        // Set session cookie explicitly with same settings as sessionSettings
        res.cookie('bentongis.sid', req.sessionID, {
          path: '/',
          httpOnly: true,
          maxAge: cookieMaxAge,
          sameSite: 'none',
          secure: true
        });
        
        // Force save the session
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Error saving session after login:", saveErr);
          } else {
            console.log("Session saved successfully after login");
          }
          
          // Remove password from response
          const { password, ...userWithoutPassword } = user;
          return res.json(userWithoutPassword);
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    console.log("GET /api/user - Session ID:", req.sessionID);
    console.log("GET /api/user - Cookies:", req.headers.cookie);
    console.log("GET /api/user - Is authenticated:", req.isAuthenticated());
    
    // Always set the cookie to ensure it's sent in subsequent requests
    // Using same settings as in sessionSettings for consistency
    res.cookie('bentongis.sid', req.sessionID, {
      path: '/',
      httpOnly: true,
      maxAge: cookieMaxAge,
      sameSite: 'none',
      secure: true
    });
    
    // Set cache-control to prevent caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    if (!req.isAuthenticated()) {
      console.log("GET /api/user - Not authenticated, session:", req.session);
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    console.log("GET /api/user - User:", req.user.id, req.user.username);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = req.user;
    
    // Touch session to extend expiration time
    req.session.touch();
    req.session.save((err) => {
      if (err) {
        console.error("Error saving session in /api/user:", err);
      } else {
        console.log("Session saved successfully in /api/user");
      }
      
      // Send response
      res.json(userWithoutPassword);
    });
  });
}
