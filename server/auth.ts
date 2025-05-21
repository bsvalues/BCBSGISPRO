import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { db } from './db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { storage } from './storage';

// Setup session store with PostgreSQL
const PgSession = connectPgSimple(session);

export function setupAuth(app: Express) {
  // Set up session middleware
  app.use(
    session({
      store: new PgSession({
        conString: process.env.DATABASE_URL,
        tableName: 'sessions',
        createTableIfMissing: true
      }),
      secret: process.env.SESSION_SECRET || 'your-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      },
    })
  );

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Auth endpoints for multiple providers
  app.post('/api/auth/login', (req, res, next) => {
    const { email, provider } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    
    // Create a user ID based on email
    const userId = `${provider || 'email'}-${Buffer.from(email).toString('hex')}`;
    
    // Create user object
    const user = {
      id: userId,
      email,
      firstName: email.split('@')[0],
      lastName: '',
      profileImageUrl: `https://www.gravatar.com/avatar/${Buffer.from(email).toString('hex')}?d=mp&f=y`,
      roles: ['viewer'] // Default role for new users
    };

    // Store user in database
    storage.upsertUser(user)
      .then(savedUser => {
        // Log the user in
        req.login(savedUser, (err) => {
          if (err) {
            return next(err);
          }
          return res.json({ success: true, user: savedUser });
        });
      })
      .catch(err => {
        console.error('Error logging in:', err);
        res.status(500).json({ success: false, message: 'Failed to log in' });
      });
  });
  
  // Google login endpoint
  app.get('/api/auth/google', (req, res, next) => {
    const email = req.query.email as string;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    
    const userId = `google-${Buffer.from(email).toString('hex')}`;
    
    const user = {
      id: userId,
      email,
      firstName: email.split('@')[0],
      lastName: 'User',
      profileImageUrl: `https://www.gravatar.com/avatar/${Buffer.from(email).toString('hex')}?d=mp&f=y`,
      roles: ['viewer'] // Default role for Google users
    };
    
    storage.upsertUser(user)
      .then(savedUser => {
        req.login(savedUser, (err) => {
          if (err) {
            return next(err);
          }
          return res.json({ success: true, user: savedUser });
        });
      })
      .catch(err => {
        console.error('Error logging in with Google:', err);
        res.status(500).json({ success: false, message: 'Failed to log in with Google' });
      });
  });
  
  // GitHub login endpoint
  app.get('/api/auth/github', (req, res, next) => {
    const email = req.query.email as string;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    
    const userId = `github-${Buffer.from(email).toString('hex')}`;
    
    const user = {
      id: userId,
      email,
      firstName: email.split('@')[0],
      lastName: 'User',
      profileImageUrl: `https://www.gravatar.com/avatar/${Buffer.from(email).toString('hex')}?d=mp&f=y`,
      roles: ['viewer'] // Default role for GitHub users
    };
    
    storage.upsertUser(user)
      .then(savedUser => {
        req.login(savedUser, (err) => {
          if (err) {
            return next(err);
          }
          return res.json({ success: true, user: savedUser });
        });
      })
      .catch(err => {
        console.error('Error logging in with GitHub:', err);
        res.status(500).json({ success: false, message: 'Failed to log in with GitHub' });
      });
  });

  // Logout endpoint
  app.get('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Failed to log out' });
      }
      res.json({ success: true });
    });
  });

  // Get current user endpoint
  app.get('/api/auth/user', (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ authenticated: false });
    }
    res.json(req.user);
  });

  // Serialize user into the session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from the session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // We'll add more authentication providers here later
  // These will include Google, GitHub, and email sign-in
}

// Middleware to check if a user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
}