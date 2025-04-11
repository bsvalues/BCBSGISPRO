/**
 * Error Handler Module
 * 
 * This module provides error handling functions and classes for the server.
 * Includes handlers for API errors, async route handlers, and 404 not found errors.
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

  constructor(code: string, message: string, statusCode: number = 400, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    
    // This is needed because we're extending a built-in class
    Object.setPrototypeOf(this, ApiError.prototype);
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
  console.error(`Error processing request ${req.method} ${req.path}:`, err);
  
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    });
  }
  
  // Handle other types of errors
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
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
  return res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.path}`
    }
  });
}