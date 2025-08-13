import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/log';
import { internalError, validationError, ApiError } from '../lib/errors';

// Extend Error interface to include status code
interface AppError extends Error {
  status?: number;
  code?: string;
  details?: Record<string, unknown>;
}

// Central error handler middleware
export function errorHandler(
  error: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error
  logger.error({
    type: 'error',
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    requestId: (req as any).requestId,
    user: (req as any).user?.sub,
    status: error.status || 500,
  });

  // Determine status code
  const status = error.status || 500;
  
  // Create standardized error response
  let apiError: ApiError;
  
  if (error.code && error.message) {
    // Error already in API format
    apiError = {
      code: error.code,
      message: error.message,
      ...(error.details && { details: error.details }),
    };
  } else if (error.name === 'ValidationError') {
    // AJV validation error
    apiError = validationError('Request validation failed', {
      field: error.message,
      path: req.path,
    });
  } else if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
    // JSON parsing error
    apiError = {
      code: 'BAD_REQUEST',
      message: 'Invalid JSON in request body',
      details: {
        error: error.message,
        path: req.path,
      },
    };
  } else {
    // Generic internal error
    apiError = internalError(
      status >= 500 ? 'Internal server error' : error.message || 'An error occurred',
      {
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
      }
    );
  }

  // Set response status and send error
  res.status(status).json(apiError);
}

// 404 handler for unmatched routes
export function notFoundHandler(req: Request, res: Response): void {
  logger.warn({
    type: 'error',
    action: 'not_found',
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  res.status(404).json({
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
    details: {
      path: req.path,
      method: req.method,
      availableRoutes: [
        'GET /ping',
        'GET /orders/:order_id/status',
        'POST /demos',
        'POST /quotes:sandbox',
        'GET /.well-known/agent.json',
        'GET /spec/openapi.json',
        'GET /spec/openapi.yaml',
      ],
    },
  });
}

// Async error wrapper for route handlers
export function asyncHandler<T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<void>
) {
  return (req: T, res: U, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
