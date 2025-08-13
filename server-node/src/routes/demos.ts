import { Router, Request, Response } from 'express';
import { authMiddleware, requireScope } from '../middleware/auth';
import { rateLimiters } from '../middleware/rateLimit';
import { logger } from '../lib/log';
import { badRequest } from '../lib/errors';
import { asyncHandler } from '../middleware/errorHandler';
import { validators, validateWithErrors } from '../lib/ajv';
import { IdempotencyStore } from '../lib/idempotency';
import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Initialize idempotency store
const idempotencyStore = new IdempotencyStore(config.idempTtlSeconds);

// Mock demo storage
const mockDemos = new Map<string, {
  ticket_id: string;
  calendar_link: string;
  name: string;
  email: string;
  time_window: string;
  notes?: string;
  created_at: string;
}>();

// Type for validated demo input
interface ScheduleDemoInput {
  name: string;
  email: string;
  time_window: string;
  notes?: string;
}

// POST /demos
router.post(
  '/',
  authMiddleware,
  requireScope('demo:schedule'),
  rateLimiters.demos,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const idempotencyKey = req.headers['idempotency-key'] as string;
    const agentRunId = req.headers['x-agent-run-id'] as string;
    
    logger.info({
      type: 'demo',
      action: 'schedule_request',
      path: req.path,
      user: (req as any).user?.sub,
      ip: req.ip,
      idempotencyKey: idempotencyKey ? `${idempotencyKey.substring(0, 8)}...` : undefined,
      agentRunId: agentRunId ? `${agentRunId.substring(0, 8)}...` : undefined,
    });

    // Validate Idempotency-Key header (required per OpenAPI spec)
    if (!idempotencyKey) {
      logger.warn({
        type: 'demo',
        action: 'missing_idempotency_key',
        path: req.path,
        user: (req as any).user?.sub,
      });
      
      res.status(400).json(badRequest('Idempotency-Key header is required', {
        field: 'Idempotency-Key',
        message: 'This endpoint requires an Idempotency-Key header for safe retries',
      }));
      return;
    }

    if (idempotencyKey.length < 8) {
      logger.warn({
        type: 'demo',
        action: 'invalid_idempotency_key',
        path: req.path,
        keyLength: idempotencyKey.length,
      });
      
      res.status(400).json(badRequest('Idempotency-Key must be at least 8 characters', {
        field: 'Idempotency-Key',
        minLength: 8,
        actualLength: idempotencyKey.length,
      }));
      return;
    }

    // Validate request body against OpenAPI schema
    const validation = validateWithErrors<ScheduleDemoInput>(validators.scheduleDemoInput, req.body);
    if (!validation.valid) {
      logger.warn({
        type: 'demo',
        action: 'validation_failed',
        path: req.path,
        errors: validation.errors,
        body: req.body,
      });
      
      res.status(400).json(badRequest('Request validation failed', {
        errors: validation.errors,
        schema: 'ScheduleDemoInput',
      }));
      return;
    }

    const demoData = validation.data;
    
    // Check idempotency
    const idempotencyResult = idempotencyStore.check('schedule_demo', idempotencyKey, demoData);
    if (idempotencyResult.isIdempotent) {
      logger.info({
        type: 'demo',
        action: 'idempotency_hit',
        ticketId: (idempotencyResult.entry.body as any).ticket_id,
        idempotencyKey: `${idempotencyKey.substring(0, 8)}...`,
      });
      
      // Return the cached response
      res.status(idempotencyResult.entry.status).json(idempotencyResult.entry.body);
      return;
    }

    // Generate demo response
    const ticketId = `DEMO-${uuidv4().substring(0, 8).toUpperCase()}`;
    const calendarLink = `https://calendly.com/demo/${ticketId}`;
    
    // Simulate human review requirement (random 20% chance)
    const requiresReview = Math.random() < 0.2;
    
    if (requiresReview) {
      // Return 202 - Pending human review
      const pendingResponse = {
        status: 'pending',
        review_url: `https://demo.example.com/review/${ticketId}`,
        ticket_id: ticketId,
      };
      
      // Store in idempotency store
      idempotencyStore.storeEntry('schedule_demo', idempotencyKey, demoData, 202, pendingResponse);
      
      logger.info({
        type: 'demo',
        action: 'pending_review',
        ticketId,
        idempotencyKey: `${idempotencyKey.substring(0, 8)}...`,
      });
      
      res.status(202).json(pendingResponse);
    } else {
      // Return 201 - Created successfully
      const successResponse = {
        ticket_id: ticketId,
        calendar_link: calendarLink,
      };
      
      // Store in idempotency store
      idempotencyStore.storeEntry('schedule_demo', idempotencyKey, demoData, 201, successResponse);
      
      // Store demo data
      mockDemos.set(ticketId, {
        ...demoData,
        ...successResponse,
        created_at: new Date().toISOString(),
      });
      
      logger.info({
        type: 'demo',
        action: 'created',
        ticketId,
        idempotencyKey: `${idempotencyKey.substring(0, 8)}...`,
        name: demoData.name,
        email: demoData.email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email
      });
      
      res.status(201).setHeader('Location', `${config.baseUrl}/demos/${ticketId}`).json(successResponse);
    }
  })
);

export default router;
