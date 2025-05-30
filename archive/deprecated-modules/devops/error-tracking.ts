/**
 * BentonGeoPro Error Tracking System
 * 
 * This module provides advanced error tracking, logging, and reporting
 * capabilities to improve application reliability and debugging.
 */

import { Express, Request, Response, NextFunction } from 'express';
import { logger } from '../logger';
import { ApiError } from '../error-handler';
import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';
import { getDeploymentInfo } from './deployment';

// Error storage
interface ErrorRecord {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  type: string;
  code?: string | number;
  context: Record<string, any>;
  tags: string[];
  count: number;
  lastOccurrence: string;
  resolved: boolean;
  environment: string;
  version: string;
  userAgent?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  userId?: string;
}

// In-memory error storage
// In a production system, this would be stored in a database
const errorStore: ErrorRecord[] = [];
const ERROR_LIMIT = 1000; // Maximum number of errors to keep in memory

// Error grouping helpers
function generateErrorId(error: Error, req?: Request): string {
  // Create a somewhat unique ID based on error message and stack trace
  const message = error.message;
  const type = error.constructor.name;
  const firstStackLine = error.stack?.split('\n')[1]?.trim() || '';
  
  // Add request information if available
  const url = req?.originalUrl || '';
  const method = req?.method || '';
  
  return createHash(`${type}:${message}:${firstStackLine}:${url}:${method}`);
}

function createHash(str: string): string {
  // Simple hash function for demo purposes
  // In production, use a proper hash function
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Track an error in the error tracking system
 */
export function trackError(
  error: Error,
  context: Record<string, any> = {},
  tags: string[] = [],
  req?: Request
): string {
  try {
    const errorId = generateErrorId(error, req);
    const deploymentInfo = getDeploymentInfo();
    
    // Check if this error is already tracked
    const existingError = errorStore.find(e => e.id === errorId);
    
    if (existingError) {
      // Update existing error record
      existingError.count += 1;
      existingError.lastOccurrence = new Date().toISOString();
      
      // Update context with new information
      existingError.context = {
        ...existingError.context,
        ...context,
      };
      
      // Add any new tags
      for (const tag of tags) {
        if (!existingError.tags.includes(tag)) {
          existingError.tags.push(tag);
        }
      }
      
      return errorId;
    }
    
    // Create new error record
    const errorRecord: ErrorRecord = {
      id: errorId,
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      type: error.constructor.name,
      code: (error as any).code || (error as ApiError).statusCode,
      context,
      tags,
      count: 1,
      lastOccurrence: new Date().toISOString(),
      resolved: false,
      environment: deploymentInfo.environment,
      version: deploymentInfo.version,
    };
    
    // Add request-specific information if available
    if (req) {
      errorRecord.userAgent = req.headers['user-agent'];
      errorRecord.url = req.originalUrl;
      errorRecord.method = req.method;
      errorRecord.statusCode = (error as ApiError).statusCode || 500;
      errorRecord.userId = (req as any).user?.id?.toString();
    }
    
    // Add to error store
    errorStore.unshift(errorRecord);
    
    // Trim error store if it's getting too large
    if (errorStore.length > ERROR_LIMIT) {
      errorStore.pop();
    }
    
    // Log the error
    logger.error(`[${errorId}] ${error.message}`, {
      errorId,
      stack: error.stack,
      context,
      tags,
    });
    
    return errorId;
  } catch (trackingError) {
    // Fail silently and log
    logger.error('Error in error tracking system', trackingError);
    return 'error-tracking-failed';
  }
}

/**
 * Get an error record by ID
 */
export function getErrorById(errorId: string): ErrorRecord | undefined {
  return errorStore.find(e => e.id === errorId);
}

/**
 * Get all error records with optional filtering
 */
export function getErrors(
  options: {
    limit?: number;
    offset?: number;
    resolved?: boolean;
    tags?: string[];
    startDate?: Date;
    endDate?: Date;
    search?: string;
  } = {}
): {
  errors: ErrorRecord[];
  total: number;
} {
  let filteredErrors = [...errorStore];
  
  // Apply filters
  if (options.resolved !== undefined) {
    filteredErrors = filteredErrors.filter(e => e.resolved === options.resolved);
  }
  
  if (options.tags?.length) {
    filteredErrors = filteredErrors.filter(
      e => options.tags!.some(tag => e.tags.includes(tag))
    );
  }
  
  if (options.startDate) {
    filteredErrors = filteredErrors.filter(
      e => new Date(e.timestamp) >= options.startDate!
    );
  }
  
  if (options.endDate) {
    filteredErrors = filteredErrors.filter(
      e => new Date(e.timestamp) <= options.endDate!
    );
  }
  
  if (options.search) {
    const search = options.search.toLowerCase();
    filteredErrors = filteredErrors.filter(
      e => e.message.toLowerCase().includes(search) ||
           e.type.toLowerCase().includes(search) ||
           e.id.toLowerCase().includes(search) ||
           e.url?.toLowerCase().includes(search)
    );
  }
  
  const total = filteredErrors.length;
  
  // Apply pagination
  if (options.offset !== undefined && options.limit !== undefined) {
    filteredErrors = filteredErrors.slice(
      options.offset,
      options.offset + options.limit
    );
  } else if (options.limit !== undefined) {
    filteredErrors = filteredErrors.slice(0, options.limit);
  }
  
  return {
    errors: filteredErrors,
    total,
  };
}

/**
 * Mark an error as resolved
 */
export function resolveError(errorId: string): boolean {
  const error = errorStore.find(e => e.id === errorId);
  
  if (error) {
    error.resolved = true;
    return true;
  }
  
  return false;
}

/**
 * Error tracking middleware
 */
export function errorTrackingMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Track the error
  const errorId = trackError(err, {
    route: req.originalUrl,
    params: req.params,
    query: req.query,
    body: req.body,
    // Add other relevant context here
  }, [
    'api-error',
    req.method.toLowerCase(),
    // Add other relevant tags here
  ], req);
  
  // Add the error ID to the response
  res.locals.errorId = errorId;
  
  // Continue to the next error handler
  next(err);
}

/**
 * Custom error handler with rich response
 */
export function richErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // If headers are already sent, delegate to the default Express error handler
  if (res.headersSent) {
    return next(err);
  }
  
  // Get error ID from locals
  const errorId = res.locals.errorId || 'unknown';
  
  // Determine status code
  const statusCode = (err as ApiError).statusCode || 500;
  
  // Prepare error response
  const errorResponse = {
    error: {
      message: err.message,
      id: errorId,
      type: err.constructor.name,
      // Only send stack trace in development
      ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
    },
  };
  
  // Send response
  res.status(statusCode).json(errorResponse);
  
  // Log the error (already done in trackError)
}

/**
 * Write errors to a log file
 */
export async function writeErrorsToLogFile(filePath: string): Promise<boolean> {
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write errors to file
    const content = JSON.stringify(errorStore, null, 2);
    await fs.promises.writeFile(filePath, content);
    
    return true;
  } catch (error) {
    logger.error('Failed to write errors to log file', error);
    return false;
  }
}

/**
 * Register error tracking routes
 */
export function registerErrorTrackingRoutes(app: Express): void {
  // Get all errors (admin only)
  app.get('/api/errors', (req, res) => {
    // Authenticate - in real application, use proper authentication
    if (req.query.apiKey !== 'devops-admin-key') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const resolved = req.query.resolved !== undefined
      ? req.query.resolved === 'true'
      : undefined;
    const tags = req.query.tags
      ? (Array.isArray(req.query.tags)
          ? req.query.tags as string[]
          : [req.query.tags as string])
      : undefined;
    const search = req.query.search as string;
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : undefined;
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : undefined;
    
    const result = getErrors({
      limit,
      offset,
      resolved,
      tags,
      startDate,
      endDate,
      search,
    });
    
    res.json(result);
  });
  
  // Get a specific error by ID (admin only)
  app.get('/api/errors/:id', (req, res) => {
    // Authenticate
    if (req.query.apiKey !== 'devops-admin-key') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const errorId = req.params.id;
    const error = getErrorById(errorId);
    
    if (!error) {
      return res.status(404).json({ error: 'Error not found' });
    }
    
    res.json(error);
  });
  
  // Mark an error as resolved (admin only)
  app.post('/api/errors/:id/resolve', (req, res) => {
    // Authenticate
    if (req.query.apiKey !== 'devops-admin-key') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const errorId = req.params.id;
    const success = resolveError(errorId);
    
    if (!success) {
      return res.status(404).json({ error: 'Error not found' });
    }
    
    res.json({ success: true });
  });
  
  // Export errors to a log file (admin only)
  app.post('/api/errors/export', async (req, res) => {
    // Authenticate
    if (req.query.apiKey !== 'devops-admin-key') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const filePath = path.join(process.cwd(), 'logs', `errors-${Date.now()}.json`);
    const success = await writeErrorsToLogFile(filePath);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to export errors' });
    }
    
    res.json({
      success: true,
      filePath,
    });
  });
  
  // Get error statistics (admin only)
  app.get('/api/errors/stats', (req, res) => {
    // Authenticate
    if (req.query.apiKey !== 'devops-admin-key') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Calculate statistics
    const totalErrors = errorStore.length;
    const unresolvedErrors = errorStore.filter(e => !e.resolved).length;
    
    // Count errors by type
    const errorsByType = errorStore.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Count errors by status code
    const errorsByStatus = errorStore.reduce((acc, error) => {
      if (error.statusCode) {
        acc[error.statusCode] = (acc[error.statusCode] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    // Get most common errors
    const errorFrequency = errorStore.reduce((acc, error) => {
      acc[error.message] = (acc[error.message] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostCommonErrors = Object.entries(errorFrequency)
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    res.json({
      totalErrors,
      unresolvedErrors,
      errorsByType,
      errorsByStatus,
      mostCommonErrors,
    });
  });
}

/**
 * Initialize the error tracking system
 */
export function initializeErrorTracking(app: Express): void {
  // Register routes
  registerErrorTrackingRoutes(app);
  
  // The error tracking middleware should be registered after all routes
  // and before the error handler in the main application
  
  logger.info('Error tracking system initialized');
}