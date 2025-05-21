import { Express, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { authService } from "./services/auth-service";
import { db } from "./db";
import { users, userRoles } from "../shared/schema";
import { eq } from "drizzle-orm";

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || 'benton-county-gis-secret-key';

// Authentication middleware for JWT
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Check for token in Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // No token provided, continue without authentication
  }
  
  // Extract token
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify token
    const user = await authService.verifyToken(token);
    if (user) {
      // Attach user to request object
      (req as any).user = user;
    }
  } catch (error) {
    console.error('JWT authentication error:', error);
  }
  
  next();
};

// Middleware to require authentication
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!(req as any).user) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required' 
    });
  }
  next();
};

// Middleware to require specific role
export const requireRole = (roles: string | string[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req: Request, res: Response, next: NextFunction) => {
    if (!(req as any).user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }
    
    const userRole = (req as any).user.role;
    
    // Admin role always has access
    if (userRole === 'admin' || allowedRoles.includes(userRole)) {
      return next();
    }
    
    return res.status(403).json({ 
      success: false,
      message: 'Insufficient permission' 
    });
  };
};

// Middleware to require specific permissions
export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!(req as any).user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }
    
    try {
      const hasPermission = await authService.hasPermission((req as any).user.id, permission);
      if (hasPermission) {
        return next();
      }
      
      return res.status(403).json({ 
        success: false,
        message: 'Insufficient permission' 
      });
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Server error checking permissions' 
      });
    }
  };
};

// Function to set up JWT authentication routes
export function setupJwtAuth(app: Express) {
  // Route to login and get JWT token
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required'
        });
      }
      
      const result = await authService.login(username, password);
      
      if (!result) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred during login'
      });
    }
  });
  
  // Route to register a new user
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password, fullName, role = 'public' } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username, email, and password are required'
        });
      }
      
      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.username, username)
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }
      
      // Create new user
      const user = await authService.registerUser(username, email, password, fullName, role);
      
      res.status(201).json({
        success: true,
        user
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred during registration'
      });
    }
  });
  
  // Route to get current user from JWT
  app.get("/api/auth/me", authMiddleware, (req, res) => {
    if (!(req as any).user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    res.json({
      success: true,
      user: (req as any).user
    });
  });
  
  // Route to log out (client-side only for JWT, just for compatibility)
  app.post("/api/auth/logout", (req, res) => {
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
  
  // Route to get all available roles (admin only)
  app.get("/api/auth/roles", authMiddleware, requireRole('admin'), async (req, res) => {
    try {
      const roles = await db.query.userRoles.findMany();
      
      res.json({
        success: true,
        roles
      });
    } catch (error) {
      console.error('Error fetching roles:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching roles'
      });
    }
  });
  
  // Route to create initial roles and admin user for testing
  app.post("/api/auth/setup", async (req, res) => {
    try {
      // Only allow in development mode
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          success: false,
          message: 'Not allowed in production'
        });
      }
      
      // Create roles if they don't exist
      const existingRoles = await db.query.userRoles.findMany();
      
      if (existingRoles.length === 0) {
        // Create admin role
        await db.insert(userRoles).values({
          name: 'admin',
          description: 'Administrator with full access to all features',
          permissions: ['*'] // Wildcard permission
        });
        
        // Create staff role
        await db.insert(userRoles).values({
          name: 'staff',
          description: 'County staff with access to most features',
          permissions: [
            'view:parcels', 
            'edit:parcels', 
            'view:documents', 
            'upload:documents',
            'view:workflows',
            'create:workflows',
            'edit:workflows',
            'view:maps',
            'create:maps',
            'edit:maps'
          ]
        });
        
        // Create field role
        await db.insert(userRoles).values({
          name: 'field',
          description: 'Field staff with limited access',
          permissions: [
            'view:parcels',
            'view:documents',
            'view:workflows',
            'edit:workflows:own',
            'view:maps'
          ]
        });
        
        // Create public role
        await db.insert(userRoles).values({
          name: 'public',
          description: 'Public user with minimal access',
          permissions: [
            'view:parcels:public',
            'view:documents:public',
            'view:maps:public'
          ]
        });
      }
      
      // Create admin user if it doesn't exist
      const adminUser = await db.query.users.findFirst({
        where: eq(users.username, 'admin')
      });
      
      if (!adminUser) {
        // Create admin user
        await authService.registerUser(
          'admin',
          'admin@bentoncounty.gov',
          'Admin123!',
          'System Administrator',
          'admin'
        );
      }
      
      // Create test users
      const testUsers = [
        {
          username: 'staff_user',
          email: 'staff@bentoncounty.gov',
          password: 'Staff123!',
          fullName: 'Staff User',
          role: 'staff'
        },
        {
          username: 'field_user',
          email: 'field@bentoncounty.gov',
          password: 'Field123!',
          fullName: 'Field User',
          role: 'field'
        },
        {
          username: 'public_user',
          email: 'public@example.com',
          password: 'Public123!',
          fullName: 'Public User',
          role: 'public'
        }
      ];
      
      for (const user of testUsers) {
        const existingUser = await db.query.users.findFirst({
          where: eq(users.username, user.username)
        });
        
        if (!existingUser) {
          await authService.registerUser(
            user.username,
            user.email,
            user.password,
            user.fullName,
            user.role
          );
        }
      }
      
      res.json({
        success: true,
        message: 'Auth system initialized with roles and test users'
      });
    } catch (error) {
      console.error('Setup error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred during setup'
      });
    }
  });
}