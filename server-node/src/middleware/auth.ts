import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { logger } from '../lib/log';
import { unauthorized } from '../lib/errors';

// Extend Request interface to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        scope?: string;
        token?: string;
      };
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    logger.warn({
      type: 'auth',
      action: 'missing_header',
      path: req.path,
      ip: req.ip,
    });
    res.status(401).json(unauthorized('Missing Authorization header'));
    return;
  }

  if (!authHeader.startsWith('Bearer ')) {
    logger.warn({
      type: 'auth',
      action: 'invalid_format',
      path: req.path,
      ip: req.ip,
    });
    res.status(401).json(unauthorized('Invalid Authorization header format'));
    return;
  }

  const token = authHeader.substring(7);

  // If STATIC_TOKEN is configured, require exact match
  if (config.staticToken) {
    if (token === config.staticToken) {
      req.user = {
        sub: 'static-user',
        scope: 'demo:read,demo:schedule,demo:order:read,demo:quote:sandbox',
        token: token.substring(0, 8) + '...', // Log partial token for debugging
      };
      
      logger.info({
        type: 'auth',
        action: 'static_token_success',
        path: req.path,
        user: req.user.sub,
      });
      
      next();
      return;
    } else {
      logger.warn({
        type: 'auth',
        action: 'static_token_mismatch',
        path: req.path,
        ip: req.ip,
        tokenPrefix: token.substring(0, 8),
      });
      res.status(401).json(unauthorized('Invalid token'));
      return;
    }
  }

  // In development mode without STATIC_TOKEN, allow all tokens but warn
  if (process.env['NODE_ENV'] !== 'production') {
    logger.warn({
      type: 'auth',
      action: 'dev_mode_allow',
      path: req.path,
      ip: req.ip,
      message: 'STATIC_TOKEN not configured - allowing all tokens in dev mode',
    });
    
    req.user = {
      sub: 'dev-user',
      scope: 'demo:read,demo:schedule,demo:order:read,demo:quote:sandbox',
      token: token.substring(0, 8) + '...',
    };
    
    next();
    return;
  }

  // Production mode without STATIC_TOKEN - reject
  logger.error({
    type: 'auth',
    action: 'no_auth_config',
    path: req.path,
    ip: req.ip,
    message: 'No authentication configured in production mode',
  });
  
  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'Authentication not configured',
  });
}

// Optional JWT validation middleware (non-blocking)
export function optionalJwtValidation(_req: Request, _res: Response, next: NextFunction): void {
  // Skip if JWT validation not configured
  if (!config.oauthIssuer || !config.jwksUrl) {
    next();
    return;
  }

  // TODO: Implement JWT validation with JWKS
  // For now, just log that it's configured
  logger.info({
    type: 'auth',
    action: 'jwt_configured',
    issuer: config.oauthIssuer,
    jwksUrl: config.jwksUrl,
    message: 'JWT validation configured but not implemented yet',
  });
  
  next();
}

// Scope checking middleware
export function requireScope(requiredScope: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json(unauthorized('Authentication required'));
      return;
    }

    const userScopes = req.user.scope?.split(',') || [];
    
    if (!userScopes.includes(requiredScope)) {
      logger.warn({
        type: 'auth',
        action: 'insufficient_scope',
        path: req.path,
        user: req.user.sub,
        requiredScope,
        userScopes,
      });
      
      res.status(403).json({
        code: 'FORBIDDEN',
        message: `Insufficient scope. Required: ${requiredScope}`,
        details: {
          requiredScope,
          userScopes,
        },
      });
      return;
    }

    next();
  };
}
