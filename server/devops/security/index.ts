/**
 * Security Monitoring and Protection System
 * 
 * This module provides security-related functionality including
 * rate limiting, audit logging, and security scanning integration.
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../../db';
import { sql } from 'drizzle-orm';
import { getDeploymentInfo } from '../deployment';
import { logger } from '../../logger';

// In-memory store for rate limiting
const rateLimitStore: Record<string, { count: number, resetTime: number }> = {};

// Configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window
const RATE_LIMIT_MAX = 100; // 100 requests per minute

/**
 * Rate limiting middleware
 * Limits number of requests per IP address
 */
export function rateLimit(customLimit?: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const limit = customLimit || RATE_LIMIT_MAX;
    
    // Clean up expired entries
    Object.keys(rateLimitStore).forEach(key => {
      if (rateLimitStore[key].resetTime < now) {
        delete rateLimitStore[key];
      }
    });
    
    // Initialize or get current rate limit data for IP
    if (!rateLimitStore[ip] || rateLimitStore[ip].resetTime < now) {
      rateLimitStore[ip] = {
        count: 1,
        resetTime: now + RATE_LIMIT_WINDOW
      };
    } else {
      rateLimitStore[ip].count += 1;
    }
    
    // Set headers
    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - rateLimitStore[ip].count).toString());
    res.setHeader('X-RateLimit-Reset', rateLimitStore[ip].resetTime.toString());
    
    // Check if rate limit exceeded
    if (rateLimitStore[ip].count > limit) {
      logSecurityEvent(req, 'RATE_LIMIT_EXCEEDED', {
        ip,
        count: rateLimitStore[ip].count
      });
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    
    next();
  };
}

/**
 * Enum of security event types
 */
export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  PERMISSION_DENIED = 'permission_denied',
  ADMIN_ACTION = 'admin_action',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  CONFIGURATION_CHANGE = 'configuration_change',
}

/**
 * Log a security event to the database and console
 */
export async function logSecurityEvent(
  req: Request | null, 
  eventType: string, 
  details: Record<string, any> = {}
) {
  try {
    const timestamp = new Date();
    const ip = req ? (req.ip || req.socket.remoteAddress || 'unknown') : 'system';
    const userId = req && req.user ? (req.user as any).id : null;
    const path = req ? req.path : null;
    const method = req ? req.method : null;
    const deploymentInfo = await getDeploymentInfo();
    
    const event = {
      eventType,
      timestamp,
      ip,
      userId,
      path,
      method,
      userAgent: req?.headers['user-agent'],
      version: deploymentInfo.version,
      details: JSON.stringify(details)
    };
    
    // Log to console
    logger.warn(`Security event: ${eventType}`, {
      ...event,
      details
    });
    
    // Log to database
    await db.execute(sql`
      INSERT INTO security_events (
        event_type, timestamp, ip, user_id, path, method, user_agent, version, details
      ) VALUES (
        ${eventType}, ${timestamp}, ${ip}, ${userId}, ${path}, ${method}, 
        ${req?.headers['user-agent']}, ${deploymentInfo.version}, ${JSON.stringify(details)}
      )
    `);
  } catch (error) {
    // Fail gracefully to not block operations if logging fails
    logger.error('Failed to log security event:', error);
  }
}

/**
 * Audit logging middleware for sensitive operations
 */
export function auditLog(actionCategory: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Capture the original send function
    const originalSend = res.send;
    
    // Override send to intercept the response
    res.send = function(body) {
      // Only log successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logSecurityEvent(req, SecurityEventType.ADMIN_ACTION, {
          category: actionCategory,
          status: res.statusCode,
          responseTime: Date.now() - (req.startTime || Date.now())
        });
      }
      
      // Call the original send function
      return originalSend.call(this, body);
    };
    
    next();
  };
}

/**
 * Get recent security events with filtering options
 */
export async function getSecurityEvents(options: {
  limit?: number,
  eventType?: SecurityEventType | string,
  userId?: number,
  from?: Date,
  to?: Date
} = {}) {
  const {
    limit = 100,
    eventType,
    userId,
    from,
    to = new Date()
  } = options;
  
  let query = sql`
    SELECT * FROM security_events
    WHERE 1=1
  `;
  
  if (eventType) {
    query = sql`${query} AND event_type = ${eventType}`;
  }
  
  if (userId) {
    query = sql`${query} AND user_id = ${userId}`;
  }
  
  if (from) {
    query = sql`${query} AND timestamp >= ${from}`;
  }
  
  query = sql`${query} AND timestamp <= ${to}`;
  query = sql`${query} ORDER BY timestamp DESC LIMIT ${limit}`;
  
  const events = await db.execute(query);
  return events.rows;
}

/**
 * Register security routes
 * 
 * @param app Express application
 */
export function registerSecurityRoutes(app: any) {
  // Apply rate limiting to all routes
  app.use(rateLimit());
  
  // Apply stricter rate limits to authentication endpoints
  app.use('/api/auth', rateLimit(20)); // 20 req/min
  
  // Apply audit logging to sensitive operations
  app.use('/api/admin', auditLog('admin_panel'));
  app.use('/api/feature-flags', auditLog('feature_flags'));
  app.use('/api/users', auditLog('user_management'));
  
  // Get security events (admin only)
  app.get('/api/security/events', async (req: Request, res: Response) => {
    try {
      // Check for admin permission
      if (!(req.user && (req.user as any).isAdmin)) {
        logSecurityEvent(req, SecurityEventType.PERMISSION_DENIED, {
          resource: 'security_events'
        });
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      const events = await getSecurityEvents({
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        eventType: req.query.type as string,
        userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
        from: req.query.from ? new Date(req.query.from as string) : undefined
      });
      
      return res.json({ events });
    } catch (error) {
      console.error('Error retrieving security events:', error);
      return res.status(500).json({ error: 'Failed to retrieve security events' });
    }
  });
  
  // Get security dashboard data (admin only)
  app.get('/api/security/dashboard', async (req: Request, res: Response) => {
    try {
      // Check for admin permission
      if (!(req.user && (req.user as any).isAdmin)) {
        logSecurityEvent(req, SecurityEventType.PERMISSION_DENIED, {
          resource: 'security_dashboard'
        });
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      // Get counts by event type
      const eventTypeCounts = await db.execute(sql`
        SELECT event_type, COUNT(*) as count 
        FROM security_events 
        GROUP BY event_type
      `);
      
      // Get recent failed login attempts
      const recentFailedLogins = await getSecurityEvents({
        limit: 10,
        eventType: SecurityEventType.LOGIN_FAILURE
      });
      
      // Get top IPs with suspicious activity
      const suspiciousIps = await db.execute(sql`
        SELECT ip, COUNT(*) as count 
        FROM security_events 
        WHERE event_type IN ('rate_limit_exceeded', 'permission_denied', 'login_failure', 'suspicious_activity')
        GROUP BY ip
        ORDER BY count DESC
        LIMIT 10
      `);
      
      return res.json({
        eventTypeCounts: eventTypeCounts.rows,
        recentFailedLogins,
        suspiciousIps: suspiciousIps.rows
      });
    } catch (error) {
      console.error('Error retrieving security dashboard:', error);
      return res.status(500).json({ error: 'Failed to retrieve security dashboard' });
    }
  });
}