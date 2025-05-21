import { Express } from 'express';
import { db } from './db';
import { users } from '../shared/schema';

/**
 * Registers debugging routes to help troubleshoot authentication issues
 */
export function registerAuthDebugRoutes(app: Express) {
  // Debug endpoint to check database connection
  app.get('/api/debug/db-status', async (req, res) => {
    try {
      // Try a simple query to check if DB is working
      const result = await db.select({ count: db.fn.count() }).from(users);
      return res.json({
        status: 'connected',
        usersCount: result[0].count,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Database connection error:', error);
      return res.status(500).json({
        status: 'error',
        message: `Database connection failed: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Debug endpoint to create a test user
  app.post('/api/debug/create-test-user', async (req, res) => {
    try {
      // Check if test user already exists
      const existingUser = await db.select()
        .from(users)
        .where({ username: 'testuser' })
        .limit(1);
      
      if (existingUser.length > 0) {
        return res.json({
          status: 'exists',
          message: 'Test user already exists',
          user: {
            id: existingUser[0].id,
            username: existingUser[0].username,
            email: existingUser[0].email || 'test@example.com'
          }
        });
      }
      
      // Create a new test user
      const [newUser] = await db.insert(users)
        .values({
          username: 'testuser',
          password: 'password', // For testing only
          email: 'test@example.com',
          fullName: 'Test User',
          role: 'admin',
          isActive: true
        })
        .returning();
      
      return res.status(201).json({
        status: 'created',
        message: 'Test user created successfully',
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email
        }
      });
    } catch (error) {
      console.error('Error creating test user:', error);
      return res.status(500).json({
        status: 'error',
        message: `Failed to create test user: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Debug endpoint for direct login without auth logic
  app.post('/api/debug/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Username and password are required'
        });
      }
      
      console.log(`Debug login attempt for username: ${username}`);
      
      // Find user
      const [user] = await db.select()
        .from(users)
        .where({ username })
        .limit(1);
      
      if (!user) {
        console.log(`User not found: ${username}`);
        return res.status(401).json({
          status: 'error',
          message: 'Invalid credentials - user not found'
        });
      }
      
      // Simple password check (no hashing in debug route)
      if (user.password !== password) {
        console.log(`Password mismatch for user: ${username}`);
        return res.status(401).json({
          status: 'error',
          message: 'Invalid credentials - password mismatch'
        });
      }
      
      // Success - return user without password
      const { password: _, ...userWithoutPassword } = user;
      
      console.log(`Debug login successful for user: ${username}`);
      
      return res.json({
        status: 'success',
        message: 'Login successful (debug mode)',
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Debug login error:', error);
      return res.status(500).json({
        status: 'error',
        message: `Server error during debug login: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });
}