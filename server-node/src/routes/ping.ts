import { Router, Request, Response } from 'express';
import { logger } from '../lib/log';
import { rateLimiters } from '../middleware/rateLimit';

const router = Router();

// GET /ping - Health check endpoint
router.get('/', rateLimiters.ping, (req: Request, res: Response): void => {
  logger.info({
    type: 'ping',
    action: 'request',
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Respond with pong message per OpenAPI spec
  res.json({
    message: 'pong',
  });
});

export default router;
