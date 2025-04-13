/**
 * Error Handler Module
 * 
 * This module provides error handling functions and classes for the server.
 * Includes handlers for API errors, async route handlers, and 404 not found errors.
 * It also includes recovery mechanisms for common error scenarios.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * API Error class that extends the built-in Error class
 * to provide a standardized error structure for API responses.
 */
export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: any;
  isOperational: boolean;
  retryable: boolean;

  constructor(code: string, message: string, statusCode: number = 400, details?: any, isOperational: boolean = true, retryable: boolean = false) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational; // Operational errors are expected errors that can be handled
    this.retryable = retryable; // Indicates if the request can be retried
    
    // This is needed because we're extending a built-in class
    Object.setPrototypeOf(this, ApiError.prototype);
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create a Bad Request error (400)
   */
  static badRequest(message: string, code: string = 'BAD_REQUEST', details?: any): ApiError {
    return new ApiError(code, message, 400, details, true, false);
  }

  /**
   * Create an Unauthorized error (401)
   */
  static unauthorized(message: string, code: string = 'UNAUTHORIZED', details?: any): ApiError {
    return new ApiError(code, message, 401, details, true, true);
  }

  /**
   * Create a Forbidden error (403)
   */
  static forbidden(message: string, code: string = 'FORBIDDEN', details?: any): ApiError {
    return new ApiError(code, message, 403, details, true, false);
  }

  /**
   * Create a Not Found error (404)
   */
  static notFound(message: string, code: string = 'NOT_FOUND', details?: any): ApiError {
    return new ApiError(code, message, 404, details, true, false);
  }

  /**
   * Create a Conflict error (409)
   */
  static conflict(message: string, code: string = 'CONFLICT', details?: any): ApiError {
    return new ApiError(code, message, 409, details, true, false);
  }

  /**
   * Create a Too Many Requests error (429)
   */
  static tooManyRequests(message: string, code: string = 'TOO_MANY_REQUESTS', details?: any): ApiError {
    return new ApiError(code, message, 429, details, true, true);
  }

  /**
   * Create an Internal Server Error (500)
   */
  static internal(message: string, code: string = 'INTERNAL_ERROR', details?: any, isOperational: boolean = false): ApiError {
    return new ApiError(code, message, 500, details, isOperational, true);
  }

  /**
   * Create a Bad Gateway error (502)
   */
  static badGateway(message: string, code: string = 'BAD_GATEWAY', details?: any): ApiError {
    return new ApiError(code, message, 502, details, true, true);
  }

  /**
   * Create a Service Unavailable error (503)
   */
  static serviceUnavailable(message: string, code: string = 'SERVICE_UNAVAILABLE', details?: any): ApiError {
    return new ApiError(code, message, 503, details, true, true);
  }

  /**
   * Create a Gateway Timeout error (504)
   */
  static gatewayTimeout(message: string, code: string = 'GATEWAY_TIMEOUT', details?: any): ApiError {
    return new ApiError(code, message, 504, details, true, true);
  }

  /**
   * Create a Validation Error (400)
   */
  static validationError(message: string, details?: any): ApiError {
    return new ApiError('VALIDATION_ERROR', message, 400, details, true, false);
  }

  /**
   * Create a Database Error (500)
   */
  static databaseError(message: string, details?: any): ApiError {
    return new ApiError('DATABASE_ERROR', message, 500, details, true, true);
  }
}

/**
 * Async handler for express routes to catch errors in async functions
 * 
 * This function wraps an async route handler and catches any errors,
 * passing them to the next middleware.
 * 
 * @param fn The async function to wrap
 * @returns A function that handles async errors
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Async handler with retry capability for potentially transient errors
 * 
 * @param fn The async function to wrap
 * @param maxRetries Maximum number of retries 
 * @param delayMs Delay between retries in milliseconds
 * @returns A function that handles async errors with retry capability
 */
export function asyncHandlerWithRetry(fn: Function, maxRetries: number = 3, delayMs: number = 1000) {
  return async (req: Request, res: Response, next: NextFunction) => {
    let lastError: any;
    
    for (let attempt = 0; attempt < maxRetries + 1; attempt++) {
      try {
        return await fn(req, res, next);
      } catch (err) {
        lastError = err;
        
        // Only retry if this is a retryable error
        const isRetryable = err instanceof ApiError && err.retryable;
        
        if (!isRetryable || attempt >= maxRetries) {
          break;
        }
        
        console.log(`Retrying request (attempt ${attempt + 1}/${maxRetries}) after error: ${err.message}`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    // If we get here, all retries failed
    next(lastError);
  };
}

/**
 * Error handler middleware for express
 * 
 * This middleware catches all errors and formats them as JSON responses.
 * It handles ApiError instances specially, and converts other errors to
 * a standard format.
 * 
 * @param err The error that was thrown
 * @param req The request object
 * @param res The response object
 * @param next The next middleware function
 */
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  // Log the error with different levels based on severity
  if (err instanceof ApiError && err.statusCode < 500) {
    console.warn(`Error processing request ${req.method} ${req.path}:`, err);
  } else {
    console.error(`Error processing request ${req.method} ${req.path}:`, err);
    
    // Log detailed info for severe errors
    if (err instanceof ApiError && !err.isOperational) {
      console.error('Non-operational error detected, may require immediate attention:');
      console.error('Stack trace:', err.stack);
      console.error('Request details:', {
        method: req.method,
        path: req.path,
        params: req.params,
        query: req.query,
        headers: req.headers,
        ip: req.ip
      });
    }
  }
  
  // If headers already sent, just return
  if (res.headersSent) {
    return next(err);
  }
  
  if (err instanceof ApiError) {
    // Add retry-after header for rate limit errors
    if (err.statusCode === 429) {
      res.setHeader('Retry-After', '60');
    }
    
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        retryable: err.retryable
      }
    });
  }
  
  // Special handling for known error types
  if (err.name === 'ValidationError' || err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation error',
        details: err.message
      }
    });
  }
  
  if (err.name === 'SyntaxError' && (err as any).status === 400) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body',
        details: err.message
      }
    });
  }
  
  // Handle other types of errors
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      requestId: req.headers['x-request-id'] || undefined
    }
  });
}

/**
 * 404 Not Found handler middleware for express
 * 
 * This middleware handles requests to routes that don't exist.
 * It returns a 404 Not Found response with a standardized format.
 * 
 * @param req The request object
 * @param res The response object
 * @param next The next middleware function
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  // Check if this is an API route
  const isApiRoute = req.path.startsWith('/api');
  
  if (isApiRoute) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route not found: ${req.method} ${req.path}`
      }
    });
  } else {
    // For non-API routes, let the client-side router handle 404s
    next();
  }
}

/**
 * Create a global error handler for uncaught exceptions and unhandled rejections
 * 
 * @param gracefulShutdown Function to call for graceful shutdown if needed
 */
export function setupGlobalErrorHandlers(gracefulShutdown?: () => Promise<void>) {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(error.name, error.message);
    console.error(error.stack);
    
    // Perform graceful shutdown for critical errors
    if (gracefulShutdown) {
      gracefulShutdown()
        .catch(err => {
          console.error('Error during graceful shutdown:', err);
        })
        .finally(() => {
          process.exit(1);
        });
    } else {
      process.exit(1);
    }
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (error: any) => {
    console.error('UNHANDLED REJECTION! 💥');
    console.error(error.name, error.message);
    console.error(error.stack);
    
    // Optionally shutdown the server on critical errors
    // Usually we just log these and continue running
  });
}