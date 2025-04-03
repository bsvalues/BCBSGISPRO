import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { log } from './vite';

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  status: number;
  message: string;
  code: string;
  details?: unknown;
  stack?: string;
}

/**
 * Custom API Error class with standardized structure
 */
export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, message: string, code = 'API_ERROR', details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message = 'Bad Request', code = 'BAD_REQUEST', details?: unknown): ApiError {
    return new ApiError(400, message, code, details);
  }

  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED', details?: unknown): ApiError {
    return new ApiError(401, message, code, details);
  }

  static forbidden(message = 'Forbidden', code = 'FORBIDDEN', details?: unknown): ApiError {
    return new ApiError(403, message, code, details);
  }

  static notFound(message = 'Not Found', code = 'NOT_FOUND', details?: unknown): ApiError {
    return new ApiError(404, message, code, details);
  }

  static conflict(message = 'Conflict', code = 'CONFLICT', details?: unknown): ApiError {
    return new ApiError(409, message, code, details);
  }

  static internal(message = 'Internal Server Error', code = 'INTERNAL_ERROR', details?: unknown): ApiError {
    return new ApiError(500, message, code, details);
  }
}

/**
 * Async handler to catch errors in async route handlers
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Global error handler middleware
 */
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  let errorResponse: ErrorResponse;

  // Log the error
  log(`Error: ${err.message}`, 'error');
  if (err.stack) {
    log(err.stack, 'error');
  }

  // Handle specific error types
  if (err instanceof ApiError) {
    // Handle our custom API errors
    errorResponse = {
      status: err.status,
      message: err.message,
      code: err.code,
      details: err.details,
    };
  } else if (err instanceof ZodError) {
    // Handle Zod validation errors
    const validationError = fromZodError(err);
    errorResponse = {
      status: 400,
      message: validationError.message,
      code: 'VALIDATION_ERROR',
      details: err.format(),
    };
  } else {
    // Handle generic errors
    errorResponse = {
      status: 500,
      message: err.message || 'Internal Server Error',
      code: 'INTERNAL_ERROR',
    };
  }

  // Add stack trace for development environment
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
  }

  // Send the error response
  res.status(errorResponse.status).json(errorResponse);
};

/**
 * Not found middleware - for handling undefined routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const err = ApiError.notFound(`Route not found: ${req.originalUrl}`);
  next(err);
};