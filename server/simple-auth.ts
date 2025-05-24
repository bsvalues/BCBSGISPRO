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
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only use secure in production
      maxAge: sessionTtl,
      sameSite: 'lax'
    },
  }));

  // Simple login route
  app.get('/api/login', async (req, res) => {
    try {
      // Upsert the demo user
      const [user] = await db
        .insert(users)
        .values(DEMO_USER)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            ...DEMO_USER,
            updatedAt: new Date(),
          },
        })
        .returning();
      
      // Set user in session
      req.session.userId = user.id;
      req.session.save();
      
      console.log('User logged in:', user.id);
      
      // Redirect to home page
      res.redirect('/');
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).send('An error occurred during login');
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

    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.session.userId));
      
      res.json(user || null);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
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