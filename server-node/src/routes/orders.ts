import { Router, Request, Response } from 'express';
import { authMiddleware, requireScope } from '../middleware/auth';
import { rateLimiters } from '../middleware/rateLimit';
import { logger } from '../lib/log';
import { notFound, badRequest } from '../lib/errors';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Mock order data for demonstration
const mockOrders = new Map<string, {
  order_id: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'canceled';
  updated_at: string;
}>();

// Initialize with some sample orders
mockOrders.set('ORD-ABC123', {
  order_id: 'ORD-ABC123',
  status: 'shipped',
  updated_at: new Date().toISOString(),
});

mockOrders.set('ORD-DEF456', {
  order_id: 'ORD-DEF456',
  status: 'delivered',
  updated_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
});

mockOrders.set('ORD-GHI789', {
  order_id: 'ORD-GHI789',
  status: 'pending',
  updated_at: new Date().toISOString(),
});

// GET /orders/:order_id/status
router.get(
  '/:order_id/status',
  authMiddleware,
  requireScope('demo:order:read'),
  rateLimiters.orderStatus,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const order_id = req.params['order_id'];
    
    if (!order_id) {
      res.status(400).json(badRequest('Order ID parameter is required'));
      return;
    }
    
    logger.info({
      type: 'order',
      action: 'get_status',
      orderId: order_id,
      path: req.path,
      user: (req as any).user?.sub,
      ip: req.ip,
    });

    // Validate order_id format per OpenAPI spec pattern
    const orderIdPattern = /^[A-Z0-9_-]{6,32}$/;
    if (!orderIdPattern.test(order_id)) {
      logger.warn({
        type: 'order',
        action: 'invalid_order_id',
        orderId: order_id,
        pattern: orderIdPattern.source,
      });
      
      res.status(400).json(badRequest('Invalid order ID format', {
        orderId: order_id,
        pattern: orderIdPattern.source,
        message: 'Order ID must be 6-32 characters, containing only uppercase letters, numbers, hyphens, and underscores',
      }));
      return;
    }

    // Check if order exists
    const order = mockOrders.get(order_id);
    if (!order) {
      logger.warn({
        type: 'order',
        action: 'not_found',
        orderId: order_id,
      });
      
      res.status(404).json(notFound(`Order ${order_id} not found`, {
        orderId: order_id,
        availableOrders: Array.from(mockOrders.keys()),
      }));
      return;
    }

    // Return order status per OpenAPI spec
    res.json(order);
  })
);

export default router;
