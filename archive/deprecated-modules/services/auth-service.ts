import { db } from '../db';
import { users, userRoles } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// JWT Secret Key (in production, set this in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'benton-county-gis-secret-key';
const TOKEN_EXPIRY = '24h';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  role: string;
  permissions: string[];
}

export interface LoginResult {
  user: AuthUser;
  token: string;
}

/**
 * Authentication Service
 * 
 * Handles user authentication, authorization, and role-based access control
 */
class AuthService {
  /**
   * Register a new user
   */
  async registerUser(
    username: string, 
    email: string, 
    password: string, 
    fullName?: string, 
    role: string = 'public'
  ): Promise<AuthUser> {
    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create the user
    const [newUser] = await db.insert(users).values({
      username,
      email,
      passwordHash,
      fullName: fullName || null,
      role,
      permissions: [],
      isActive: true
    }).returning();
    
    // Return user without sensitive data
    return this.sanitizeUser(newUser);
  }
  
  /**
   * Authenticate a user and return a JWT token
   */
  async login(username: string, password: string): Promise<LoginResult | null> {
    // Find user by username
    const user = await db.query.users.findFirst({
      where: eq(users.username, username)
    });
    
    if (!user) return null;
    
    // Verify password
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) return null;
    
    // Check if user is active
    if (!user.isActive) return null;
    
    // Update last login time
    await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, user.id));
    
    // Create JWT token
    const sanitizedUser = this.sanitizeUser(user);
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        role: user.role
      }, 
      JWT_SECRET, 
      { expiresIn: TOKEN_EXPIRY }
    );
    
    return {
      user: sanitizedUser,
      token
    };
  }
  
  /**
   * Verify JWT token and return user info
   */
  async verifyToken(token: string): Promise<AuthUser | null> {
    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
      
      // Get user data
      const user = await db.query.users.findFirst({
        where: eq(users.id, decoded.id)
      });
      
      if (!user || !user.isActive) return null;
      
      return this.sanitizeUser(user);
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Check if user has a specific permission
   */
  async hasPermission(userId: number, permission: string): Promise<boolean> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    
    if (!user || !user.isActive) return false;
    
    // If user is admin, they have all permissions
    if (user.role === 'admin') return true;
    
    // Check user's permissions array
    if (user.permissions && Array.isArray(user.permissions)) {
      if (user.permissions.includes(permission)) return true;
    }
    
    // Check role-based permissions
    const role = await db.query.userRoles.findFirst({
      where: eq(userRoles.name, user.role)
    });
    
    if (role && role.permissions && Array.isArray(role.permissions)) {
      return role.permissions.includes(permission);
    }
    
    return false;
  }
  
  /**
   * Get all available roles
   */
  async getRoles(): Promise<typeof userRoles.$inferSelect[]> {
    return db.query.userRoles.findMany();
  }
  
  /**
   * Remove sensitive data from user object
   */
  private sanitizeUser(user: typeof users.$inferSelect): AuthUser {
    // Convert permissions from JSON to array if needed
    const permissions = user.permissions ? (
      Array.isArray(user.permissions) ? user.permissions : []
    ) : [];
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      permissions
    };
  }
}

export const authService = new AuthService();