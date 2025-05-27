import { Request, Response, NextFunction, Express } from 'express';
import session from 'express-session';
import { db } from './db';
import { users, type UpsertUser } from '../shared/schema';
import { eq } from 'drizzle-orm';
import connectPg from 'connect-pg-simple';

// Extend the Express.session types to include our custom properties
declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

// Mock user for development/demo purposes
const DEMO_USER: UpsertUser = {
  id: 'demo-user-001',
  email: 'demo@example.com',
  firstName: 'Demo',
  lastName: 'User',
  profileImageUrl: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
  roles: ['user', 'admin']
};

export function setupSimpleAuth(app: Express) {
  // Configure session middleware
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  // Set up session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-session-secret-key-123456',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: false, // Allow frontend to access cookie for debugging
      secure: false, // Disable secure for development
      maxAge: sessionTtl,
      sameSite: 'lax',
      path: '/'
    },
    name: 'sessionId'
  }));

  // Simple login route
  app.get('/api/login', async (req, res) => {
    try {
      // Set user in session directly without database
      req.session.userId = DEMO_USER.id;
      
      console.log('User logged in:', DEMO_USER.id);
      
      // Redirect to professional dashboard
      res.redirect('/professional-demo');
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).send('An error occurred during login');
    }
  });

  // Also add POST route for login
  app.post('/api/login', async (req, res) => {
    try {
      // Set user in session directly
      req.session.userId = DEMO_USER.id;
      
      console.log('User logged in:', DEMO_USER.id);
      
      // Return user data
      res.json(DEMO_USER);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'An error occurred during login' });
    }
  });

  // Logout route
  app.get('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
      }
      res.redirect('/');
    });
  });

  // Current user route
  app.get('/api/auth/user', async (req, res) => {
    if (!req.session.userId) {
      return res.json(null);
    }

    // Return demo user directly if session exists
    if (req.session.userId === DEMO_USER.id) {
      res.json(DEMO_USER);
      return;
    }

    // Fallback to database lookup
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.session.userId));
      
      res.json(user || null);
    } catch (error) {
      console.error('Error fetching user:', error);
      // If database fails, still return demo user if session is valid
      if (req.session.userId === DEMO_USER.id) {
        res.json(DEMO_USER);
      } else {
        res.status(500).json({ message: 'Failed to fetch user' });
      }
    }
  });

  // Middleware to protect routes
  app.use('/api/protected', isAuthenticated);
}

// Authentication middleware
export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.session.userId));
      
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};