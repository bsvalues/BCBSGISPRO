import { Router } from 'express';
import { authService } from '../services/auth-service';
import { z } from 'zod';
import asyncHandler from 'express-async-handler';
import { insertUserSchema } from '../../shared/schema';

const router = Router();

// Validation schemas
const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6)
});

const registerSchema = insertUserSchema
  .omit({ passwordHash: true, permissions: true, isActive: true })
  .extend({
    password: z.string().min(6),
    confirmPassword: z.string()
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  });

// Middleware to verify JWT and attach user to request
export const authMiddleware = asyncHandler(async (req, res, next) => {
  // Check for token in Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // No token provided, continue without authentication
  }
  
  // Extract token
  const token = authHeader.split(' ')[1];
  
  // Verify token
  const user = await authService.verifyToken(token);
  if (user) {
    // Attach user to request object
    (req as any).user = user;
  }
  
  next();
});

// Middleware to require authentication
export const requireAuth = (req, res, next) => {
  if (!(req as any).user) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required' 
    });
  }
  next();
};

// Middleware to require specific permissions
export const requirePermission = (permission: string) => {
  return asyncHandler(async (req, res, next) => {
    if (!(req as any).user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }
    
    const hasPermission = await authService.hasPermission((req as any).user.id, permission);
    if (!hasPermission) {
      return res.status(403).json({ 
        success: false,
        message: 'Insufficient permission' 
      });
    }
    
    next();
  });
};

// Middleware to require specific role
export const requireRole = (roles: string | string[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    if (!(req as any).user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }
    
    const userRole = (req as any).user.role;
    
    // Always allow admin role
    if (userRole === 'admin' || allowedRoles.includes(userRole)) {
      return next();
    }
    
    return res.status(403).json({ 
      success: false,
      message: 'Insufficient role permission' 
    });
  };
};

// Register a new user
router.post('/register', asyncHandler(async (req, res) => {
  try {
    // Validate request body
    const data = registerSchema.parse(req.body);
    
    // Create user
    const user = await authService.registerUser(
      data.username,
      data.email,
      data.password,
      data.fullName,
      data.role
    );
    
    res.status(201).json({
      success: true,
      user
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
    throw error;
  }
}));

// Login user
router.post('/login', asyncHandler(async (req, res) => {
  try {
    // Validate request body
    const data = loginSchema.parse(req.body);
    
    // Authenticate user
    const result = await authService.login(data.username, data.password);
    
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
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
    throw error;
  }
}));

// Get current user
router.get('/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: (req as any).user
  });
});

// Get all roles
router.get('/roles', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const roles = await authService.getRoles();
  res.json({
    success: true,
    roles
  });
}));

export default router;