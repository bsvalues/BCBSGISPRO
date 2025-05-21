import express from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { DatabaseStorage } from '../storage';
import { generateToken, authMiddleware, roleMiddleware } from '../auth-jwt';

const router = express.Router();

// Initialize database storage
const db = new DatabaseStorage();

// Create login validator schema
const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6)
});

// Create registration validator schema
const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().optional()
});

/**
 * @route POST /api/auth/login
 * @desc Login user and get JWT token
 * @access Public
 */
router.post('/login', async (req, res) => {
  try {
    // Validate request body
    const validatedData = loginSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validatedData.error.errors
      });
    }

    const { username, password } = validatedData.data;

    // Find user by username
    const user = await db.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Check if user is active
    if (user.isActive === false) {
      return res.status(401).json({
        success: false,
        message: 'This account has been deactivated'
      });
    }

    // Compare password with stored hash
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Parse permissions from JSON if needed
    let permissions = [];
    if (user.permissions) {
      try {
        permissions = typeof user.permissions === 'string' 
          ? JSON.parse(user.permissions) 
          : user.permissions;
      } catch (e) {
        console.error('Error parsing permissions:', e);
      }
    }

    // Generate JWT token
    const token = generateToken(user);

    // Update last login time
    await db.updateUserLastLogin(user.id);

    // Return success response with token and user info
    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role || 'user',
        permissions: permissions,
        lastLogin: user.lastLogin,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public (can be restricted based on requirements)
 */
router.post('/register', async (req, res) => {
  try {
    // Validate request body
    const validatedData = registerSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validatedData.error.errors
      });
    }

    const { username, email, password, fullName } = validatedData.data;

    // Check if user already exists
    const existingUser = await db.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Check if email is already in use
    const existingEmail = await db.getUserByEmail(email);
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create new user with default 'user' role
    const newUser = await db.createUser({
      username,
      email,
      passwordHash,
      fullName: fullName || null,
      role: 'public',  // Default role for new registrations
      isActive: true
    });

    // Generate JWT token
    const token = generateToken(newUser);

    // Return success response with token and user info
    return res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        permissions: [],
        lastLogin: null,
        isActive: newUser.isActive
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

/**
 * @route GET /api/auth/me
 * @desc Get current user information
 * @access Private
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // User ID is attached to request by auth middleware
    const userId = req.user.id;
    
    // Get user from database
    const user = await db.getUser(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Parse permissions from JSON if needed
    let permissions = [];
    if (user.permissions) {
      try {
        permissions = typeof user.permissions === 'string' 
          ? JSON.parse(user.permissions) 
          : user.permissions;
      } catch (e) {
        console.error('Error parsing permissions:', e);
      }
    }

    // Return user information
    return res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role || 'user',
        permissions: permissions,
        lastLogin: user.lastLogin,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route GET /api/auth/users
 * @desc Get all users (Admin only)
 * @access Private/Admin
 */
router.get('/users', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    // Get all users
    const users = await db.getUsers();
    
    // Map users to remove sensitive information
    const mappedUsers = users.map(user => {
      // Parse permissions from JSON if needed
      let permissions = [];
      if (user.permissions) {
        try {
          permissions = typeof user.permissions === 'string' 
            ? JSON.parse(user.permissions) 
            : user.permissions;
        } catch (e) {
          console.error('Error parsing permissions:', e);
        }
      }
      
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role || 'user',
        permissions: permissions,
        lastLogin: user.lastLogin,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    });
    
    return res.json({
      success: true,
      data: mappedUsers
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;