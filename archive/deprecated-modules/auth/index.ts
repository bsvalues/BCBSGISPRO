import passport from 'passport';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { Express } from 'express';
import { db } from '../db';
import { users } from '../../shared/schema';
import { storage } from '../storage';
import { setupAuthProviders } from './providers';

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
      secret: process.env.SESSION_SECRET || 'bentongis-session-secret',
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

  // Set up authentication providers
  setupAuthProviders();

  // Auth endpoints
  app.post('/api/auth/login', passport.authenticate('local'), (req, res) => {
    res.json({ success: true, user: req.user });
  });

  // OAuth routes for multiple providers
  // Google
  app.get('/api/auth/google', (req, res) => {
    // This would be implemented with a real Google OAuth setup
    // For now, create a temporary user and log them in
    const tempUser = {
      id: 'google-123456',
      email: 'google-user@example.com',
      firstName: 'Google',
      lastName: 'User',
      profileImageUrl: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
    };

    // Store user in database
    storage.upsertUser(tempUser)
      .then(user => {
        // Log the user in
        req.login(user, (err) => {
          if (err) {
            return res.status(500).json({ success: false, message: 'Failed to log in' });
          }
          return res.json({ success: true, user });
        });
      })
      .catch(err => {
        console.error('Error logging in with Google:', err);
        res.status(500).json({ success: false, message: 'Failed to log in with Google' });
      });
  });

  // GitHub
  app.get('/api/auth/github', (req, res) => {
    // This would be implemented with a real GitHub OAuth setup
    // For now, create a temporary user and log them in
    const tempUser = {
      id: 'github-123456',
      email: 'github-user@example.com',
      firstName: 'GitHub',
      lastName: 'User',
      profileImageUrl: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
    };

    // Store user in database
    storage.upsertUser(tempUser)
      .then(user => {
        // Log the user in
        req.login(user, (err) => {
          if (err) {
            return res.status(500).json({ success: false, message: 'Failed to log in' });
          }
          return res.json({ success: true, user });
        });
      })
      .catch(err => {
        console.error('Error logging in with GitHub:', err);
        res.status(500).json({ success: false, message: 'Failed to log in with GitHub' });
      });
  });

  // Email login/signup
  app.post('/api/auth/email', (req, res) => {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    
    // This would normally send an email with a verification link/code
    // For now, create a temporary user and log them in
    const tempUser = {
      id: `email-${Date.now()}`,
      email,
      firstName: 'Email',
      lastName: 'User',
      profileImageUrl: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
    };

    // Store user in database
    storage.upsertUser(tempUser)
      .then(user => {
        // Log the user in
        req.login(user, (err) => {
          if (err) {
            return res.status(500).json({ success: false, message: 'Failed to log in' });
          }
          return res.json({ success: true, user });
        });
      })
      .catch(err => {
        console.error('Error logging in with email:', err);
        res.status(500).json({ success: false, message: 'Failed to log in with email' });
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
}

// Middleware to check if a user is authenticated
export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
}