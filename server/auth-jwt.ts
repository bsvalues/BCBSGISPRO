import jwt from 'jsonwebtoken';
import { User } from '../shared/schema';

// Secret key for JWT - in production, this should be an environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'benton-county-geo-secret-key';
const TOKEN_EXPIRY = '24h'; // Token expires in 24 hours

interface TokenPayload {
  id: number;
  username: string;
  role: string;
  email: string;
}

/**
 * Generates a JWT token for a user
 * @param user User object to generate token for
 * @returns JWT token string
 */
export const generateToken = (user: any): string => {
  const payload: TokenPayload = {
    id: user.id,
    username: user.username,
    role: user.role,
    email: user.email
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY
  });
};

/**
 * Verifies a JWT token
 * @param token JWT token to verify
 * @returns Decoded payload if valid, null if invalid
 */
export const verifyToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
};

/**
 * Extracts token from authorization header
 * @param authHeader Authorization header
 * @returns Token string or null if not found
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader) return null;

  // Check if the authorization header starts with "Bearer "
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }

  return null;
};

/**
 * Authentication middleware for Express
 * Verifies JWT token from Authorization header and attaches user to request
 */
export const authMiddleware = async (req: any, res: any, next: any) => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication token missing' });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    // Attach user information to request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Role-based access control middleware for Express
 * Checks if the authenticated user has one of the required roles
 * @param allowedRoles Array of roles that are allowed to access the route
 */
export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: any, res: any, next: any) => {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Check if user role is in the allowed roles
    if (allowedRoles.includes(req.user.role)) {
      next();
    } else {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: insufficient permissions'
      });
    }
  };
};