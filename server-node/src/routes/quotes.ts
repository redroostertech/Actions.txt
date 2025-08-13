import { Router, Request, Response } from 'express';
import { authMiddleware, requireScope } from '../middleware/auth';
import { rateLimiters } from '../middleware/rateLimit';
import { logger } from '../lib/log';
import { badRequest } from '../lib/errors';
import { asyncHandler } from '../middleware/errorHandler';
import { validators, validateWithErrors } from '../lib/ajv';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Mock pricing data for demonstration
const mockPricing = new Map<string, { unitPrice: number; currency: string }>();

// Initialize with some sample SKUs
mockPricing.set('SKU-123', { unitPrice: 29.99, currency: 'USD' });
mockPricing.set('SKU-456', { unitPrice: 49.99, currency: 'USD' });
mockPricing.set('SKU-789', { unitPrice: 99.99, currency: 'USD' });
mockPricing.set('SKU-PREMIUM', { unitPrice: 199.99, currency: 'USD' });

// Type for validated quote request
interface QuoteRequest {
  sku: string;
  quantity: number;
}

// POST /quotes:sandbox (Express route: /sandbox)
router.post(
  '/sandbox',
  authMiddleware,
  requireScope('demo:quote:sandbox'),
  rateLimiters.quotesSandbox,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.info({
      type: 'quote',
      action: 'sandbox_request',
      path: req.path,
      user: (req as any).user?.sub,
      ip: req.ip,
    });

    // Validate request body against OpenAPI schema
    const validation = validateWithErrors<QuoteRequest>(validators.quoteRequest, req.body);
    if (!validation.valid) {
      logger.warn({
        type: 'quote',
        action: 'validation_failed',
        path: req.path,
        errors: validation.errors,
        body: req.body,
      });
      
      res.status(400).json(badRequest('Request validation failed', {
        errors: validation.errors,
        schema: 'QuoteRequest',
      }));
      return;
    }

    const quoteRequest = validation.data;
    
    // Check if SKU exists in pricing
    const pricing = mockPricing.get(quoteRequest.sku);
    if (!pricing) {
      logger.warn({
        type: 'quote',
        action: 'sku_not_found',
        sku: quoteRequest.sku,
        availableSkus: Array.from(mockPricing.keys()),
      });
      
      res.status(400).json(badRequest(`SKU ${quoteRequest.sku} not found`, {
        sku: quoteRequest.sku,
        availableSkus: Array.from(mockPricing.keys()),
        message: 'Please use a valid SKU from the available list',
      }));
      return;
    }

    // Calculate quote
    const subtotal = pricing.unitPrice * quoteRequest.quantity;
    const quoteId = `QUOTE-${uuidv4().substring(0, 8).toUpperCase()}`;
    
    // Generate quote response per OpenAPI spec
    const quote = {
      quote_id: quoteId,
      subtotal: Math.round(subtotal * 100) / 100, // Round to 2 decimal places
      currency: pricing.currency,
      items: [
        {
          sku: quoteRequest.sku,
          quantity: quoteRequest.quantity,
          unit_price: pricing.unitPrice,
        },
      ],
    };

    logger.info({
      type: 'quote',
      action: 'generated',
      quoteId,
      sku: quoteRequest.sku,
      quantity: quoteRequest.quantity,
      subtotal: quote.subtotal,
      currency: pricing.currency,
      user: (req as any).user?.sub,
    });

    res.json(quote);
  })
);

export default router;
