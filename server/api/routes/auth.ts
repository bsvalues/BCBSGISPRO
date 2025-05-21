/**
 * Authentication API Routes
 * 
 * This module implements the API routes for authentication-related operations.
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Reference to the user store (would be replaced with database in real app)
// Importing from a mock data store for now
const users = [
  {
    id: 'user-1',
    username: 'admin',
    email: 'admin@terrafusion.example',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    password: 'admin123', // In a real app, this would be hashed
    counties: ['benton-county', 'yakima-county'],
    active: true,
    createdAt: new Date('2023-01-01').toISOString(),
    updatedAt: new Date('2023-01-01').toISOString()
  },
  {
    id: 'user-2',
    username: 'sarahjohnson',
    email: 'sarah.johnson@example.gov',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'assessor',
    password: 'sarah123', // In a real app, this would be hashed
    counties: ['benton-county'],
    active: true,
    createdAt: new Date('2023-01-15').toISOString(),
    updatedAt: new Date('2023-01-15').toISOString()
  }
];

// Mock token store - would be replaced with a proper session/token store in real app
const tokens = {};

// Helper function to remove sensitive data before returning user object
function sanitizeUser(user) {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
}

// POST login
router.post('/login', (req, res) => {
  const { username, password, rememberMe } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Username and password are required'
      }
    });
  }
  
  // Find user by username
  const user = users.find(u => u.username === username);
  
  // Check if user exists and password matches
  if (!user || user.password !== password) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid username or password'
      }
    });
  }
  
  // Check if user is active
  if (!user.active) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'ACCOUNT_INACTIVE',
        message: 'Your account is inactive. Please contact an administrator.'
      }
    });
  }
  
  // Generate token
  const tokenId = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 1)); // 30 days or 1 day
  
  // Store token
  tokens[tokenId] = {
    userId: user.id,
    expiresAt: expiresAt.toISOString()
  };
  
  // Update user's last login time - would be done in the database in real app
  user.lastLogin = new Date().toISOString();
  
  // Sanitize user
  const sanitizedUser = sanitizeUser(user);
  
  res.json({
    success: true,
    data: {
      user: sanitizedUser,
      token: tokenId,
      expiresAt: expiresAt.toISOString()
    }
  });
});

// POST register
router.post('/register', (req, res) => {
  const { username, email, password, firstName, lastName } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Username, email, and password are required'
      }
    });
  }
  
  // Check if username or email already exists
  if (users.some(u => u.username === username)) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'USERNAME_EXISTS',
        message: `Username ${username} already exists`
      }
    });
  }
  
  if (users.some(u => u.email === email)) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'EMAIL_EXISTS',
        message: `Email ${email} already exists`
      }
    });
  }
  
  // Create new user
  const newUser = {
    id: `user-${uuidv4().substring(0, 8)}`,
    username,
    email,
    password, // In a real app, this would be hashed
    firstName,
    lastName,
    role: 'viewer', // Default role for new registrations
    counties: [], // No county access by default
    active: false, // Requires admin approval by default
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  users.push(newUser);
  
  // Sanitize user
  const sanitizedUser = sanitizeUser(newUser);
  
  res.status(201).json({
    success: true,
    data: sanitizedUser
  });
});

// POST logout
router.post('/logout', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (token && tokens[token]) {
    // Remove token
    delete tokens[token];
  }
  
  res.json({
    success: true,
    data: {
      success: true
    }
  });
});

// GET authentication status
router.get('/status', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token || !tokens[token]) {
    return res.json({
      success: true,
      data: {
        authenticated: false
      }
    });
  }
  
  // Check if token is expired
  const tokenData = tokens[token];
  const expiresAt = new Date(tokenData.expiresAt);
  
  if (expiresAt <= new Date()) {
    // Token expired, remove it
    delete tokens[token];
    
    return res.json({
      success: true,
      data: {
        authenticated: false
      }
    });
  }
  
  // Get user
  const user = users.find(u => u.id === tokenData.userId);
  
  if (!user) {
    // User not found, remove token
    delete tokens[token];
    
    return res.json({
      success: true,
      data: {
        authenticated: false
      }
    });
  }
  
  // Check if user is active
  if (!user.active) {
    // User inactive, remove token
    delete tokens[token];
    
    return res.json({
      success: true,
      data: {
        authenticated: false
      }
    });
  }
  
  // Sanitize user
  const sanitizedUser = sanitizeUser(user);
  
  res.json({
    success: true,
    data: {
      authenticated: true,
      user: sanitizedUser
    }
  });
});

// POST request password reset
router.post('/reset-password', (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Email is required'
      }
    });
  }
  
  // Check if user with this email exists
  const user = users.find(u => u.email === email);
  
  if (!user) {
    // For security reasons, don't reveal that the email doesn't exist
    // Instead, pretend to have sent the email
    return res.json({
      success: true,
      data: {
        success: true
      }
    });
  }
  
  // In a real app, we would generate a reset token and send an email
  // For now, just return success
  
  res.json({
    success: true,
    data: {
      success: true
    }
  });
});

// POST confirm password reset
router.post('/reset-password/confirm', (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Token and new password are required'
      }
    });
  }
  
  // In a real app, we would validate the token and update the user's password
  // For now, just return success
  
  res.json({
    success: true,
    data: {
      success: true
    }
  });
});

// POST verify email
router.post('/verify-email', (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Token is required'
      }
    });
  }
  
  // In a real app, we would validate the token and mark the user's email as verified
  // For now, just return success
  
  res.json({
    success: true,
    data: {
      success: true
    }
  });
});

// POST resend verification email
router.post('/resend-verification', (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Email is required'
      }
    });
  }
  
  // Check if user with this email exists
  const user = users.find(u => u.email === email);
  
  if (!user) {
    // For security reasons, don't reveal that the email doesn't exist
    // Instead, pretend to have sent the email
    return res.json({
      success: true,
      data: {
        success: true
      }
    });
  }
  
  // In a real app, we would generate a verification token and send an email
  // For now, just return success
  
  res.json({
    success: true,
    data: {
      success: true
    }
  });
});

export default router;