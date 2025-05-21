import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { db } from './db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { Express } from 'express';
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

  // Auth endpoints
  app.post('/api/auth/login', (req, res, next) => {
    // For now, create a temporary user in the database and log them in
    // This will be replaced with proper authentication providers
    const tempUser = {
      id: '123456',
      email: 'user@example.com',
      firstName: 'Test',
      lastName: 'User',
      profileImageUrl: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
    };

    // Store user in database
    storage.upsertUser(tempUser)
      .then(user => {
        // Log the user in
        req.login(user, (err) => {
          if (err) {
            return next(err);
          }
          return res.json({ success: true, user });
        });
      })
      .catch(err => {
        console.error('Error logging in:', err);
        res.status(500).json({ success: false, message: 'Failed to log in' });
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
export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
}