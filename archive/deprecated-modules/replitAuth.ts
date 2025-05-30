import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users } from "../shared/schema";

// Check for the required environment variables
// Use default values if not available in development
if (!process.env.REPLIT_DOMAINS) {
  // Use current hostname in development
  process.env.REPLIT_DOMAINS = process.env.REPL_SLUG ? 
    `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : 
    'localhost:5000';
}

// Ensure we have a session secret
if (!process.env.SESSION_SECRET) {
  console.warn('SESSION_SECRET not set, using a default value for development');
  process.env.SESSION_SECRET = 'dev-session-secret-key-123456';
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID || "your-repl-id"
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // Only use secure cookies in production
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  const [user] = await db
    .insert(users)
    .values({
      id: claims["sub"],
      email: claims["email"],
      firstName: claims["first_name"],
      lastName: claims["last_name"],
      profileImageUrl: claims["profile_image_url"],
      roles: ["user"], // Default role
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: claims["email"],
        firstName: claims["first_name"],
        lastName: claims["last_name"],
        profileImageUrl: claims["profile_image_url"],
        updatedAt: new Date(),
      },
    })
    .returning();
  
  return user;
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();
  console.log("OpenID configuration loaded successfully");

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    console.log("User authenticated successfully");
    verified(null, user);
  };

  // Get all domains including development localhost
  // Setup a single strategy with dynamic callback URL handling
  const strategyName = 'replitauth';
  console.log(`Setting up auth strategy with name: ${strategyName}`);
  
  const strategy = new Strategy(
    {
      name: strategyName,
      config,
      scope: "openid email profile offline_access",
      // Callback URL will be constructed dynamically at login time
      callbackURL: "",
    },
    verify,
  );
  passport.use(strategy);

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    console.log("Login request initiated for hostname:", req.hostname);
    
    // Get the current protocol
    const protocol = req.protocol;
    const hostname = req.hostname;
    
    // Set proper callback URL before authentication
    const callbackURL = `${protocol}://${hostname}/api/callback`;
    
    const options = {
      callbackURL,
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    };
    
    console.log(`Using callbackURL: ${callbackURL}`);
    
    passport.authenticate('replitauth', options)(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    console.log("Callback received from auth provider for hostname:", req.hostname);
    
    // Get the current protocol
    const protocol = req.protocol;
    const hostname = req.hostname;
    
    // Set proper callback URL before authentication
    const callbackURL = `${protocol}://${hostname}/api/callback`;
    
    const options = {
      callbackURL,
      successReturnToOrRedirect: "/",
      failureRedirect: "/"
    };
    
    passport.authenticate('replitauth', options)(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });

  app.get("/api/auth/user", async (req: any, res) => {
    if (!req.isAuthenticated() || !req.user?.claims?.sub) {
      return res.json(null);
    }

    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user.claims.sub));

      res.json(user || null);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    return res.redirect("/api/login");
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    return res.redirect("/api/login");
  }
};