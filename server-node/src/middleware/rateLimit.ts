import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { config, parseRateLimit } from '../config';
import { logger } from '../lib/log';
import { rateLimited } from '../lib/errors';

// Create rate limiter for a specific route
export function createRateLimiter(routeName: keyof typeof config.rateLimits) {
  const rateLimitConfig = config.rateLimits[routeName];
  const { count, windowMs } = parseRateLimit(rateLimitConfig);
  
  return rateLimit({
    windowMs,
    max: count,
    message: {
      code: 'RATE_LIMITED',
      message: `Rate limit exceeded. Maximum ${count} requests per ${windowMs / 1000} seconds.`,
      details: {
        limit: count,
        windowSeconds: windowMs / 1000,
        route: routeName,
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      const retryAfter = Math.ceil(windowMs / 1000);
      
      logger.warn({
        type: 'rate_limit',
        action: 'exceeded',
        route: routeName,
        ip: req.ip,
        path: req.path,
        limit: count,
        windowMs,
        retryAfter,
      });
      
      res.setHeader('Retry-After', retryAfter.toString());
      res.status(429).json(rateLimited(
        `Rate limit exceeded. Maximum ${count} requests per ${windowMs / 1000} seconds.`,
        {
          limit: count,
          windowSeconds: windowMs / 1000,
          route: routeName,
          retryAfter,
        }
      ));
    },
    keyGenerator: (req: Request) => {
      // Use IP address as the key for rate limiting
      return req.ip || 'unknown';
    },
    skip: (req: Request) => {
      // Skip rate limiting for health checks or internal routes
      return req.path === '/ping' || req.path.startsWith('/health');
    },
  });
}

// Pre-configured rate limiters for each route
export const rateLimiters = {
  ping: createRateLimiter('ping'),
  orderStatus: createRateLimiter('orderStatus'),
  demos: createRateLimiter('demos'),
  quotesSandbox: createRateLimiter('quotesSandbox'),
};

// Global rate limiter for all routes
export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per minute
  message: {
    code: 'RATE_LIMITED',
    message: 'Global rate limit exceeded',
    details: {
      limit: 1000,
      windowSeconds: 60,
      type: 'global',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn({
      type: 'rate_limit',
      action: 'global_exceeded',
      ip: req.ip,
      path: req.path,
    });
    
    res.setHeader('Retry-After', '60');
    res.status(429).json(rateLimited('Global rate limit exceeded', {
      limit: 1000,
      windowSeconds: 60,
      type: 'global',
      retryAfter: 60,
    }));
  },
  keyGenerator: (req: Request) => req.ip || 'unknown',
});

// Middleware to add rate limit info to response headers
export function addRateLimitHeaders(req: Request, res: Response, next: NextFunction): void {
  // Add rate limit info headers if available
  const rateLimitInfo = (req as any).rateLimit;
  if (rateLimitInfo) {
    res.setHeader('X-RateLimit-Limit', rateLimitInfo.limit);
    res.setHeader('X-RateLimit-Remaining', rateLimitInfo.remaining);
    
    // Safely handle the reset time
    if (rateLimitInfo.resetTime && typeof rateLimitInfo.resetTime === 'number') {
      try {
        const resetDate = new Date(Date.now() + rateLimitInfo.resetTime);
        if (!isNaN(resetDate.getTime())) {
          res.setHeader('X-RateLimit-Reset', resetDate.toISOString());
        }
      } catch (error) {
        // If there's an error with the date, skip this header
        logger.warn({
          type: 'rate_limit',
          action: 'header_error',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }
  
  next();
}
