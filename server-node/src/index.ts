import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config';
import { logger } from './lib/log';
import { createRequestLogger } from './lib/log';
import { globalRateLimiter, addRateLimitHeaders } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import routes
import staticRoutes from './routes/static';
import pingRoutes from './routes/ping';
import orderRoutes from './routes/orders';
import demoRoutes from './routes/demos';
import quoteRoutes from './routes/quotes';

// Create Express app
const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', true);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API server
}));

// CORS configuration
app.use(cors({
  origin: process.env['NODE_ENV'] === 'production' ? false : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Idempotency-Key',
    'X-Agent-Run-Id',
    'X-Request-ID',
  ],
}));

// Body parsing middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request logging
app.use(createRequestLogger());

// Global rate limiting
app.use(globalRateLimiter);

// Add rate limit headers
app.use(addRateLimitHeaders);

// Routes
app.use('/', staticRoutes);
app.use('/ping', pingRoutes);
app.use('/orders', orderRoutes);
app.use('/demos', demoRoutes);
app.use('/quotes', quoteRoutes);

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown handling
const server = app.listen(config.port, () => {
  logger.info({
    type: 'server',
    action: 'started',
    port: config.port,
    baseUrl: config.baseUrl,
    nodeEnv: process.env['NODE_ENV'] || 'development',
    version: process.env['npm_package_version'] || '1.0.0',
  });
  
  console.log(`🚀 Action.txt server running on ${config.baseUrl}`);
  console.log(`📚 API docs: ${config.baseUrl}/spec/openapi.json`);
  console.log(`🤖 Agent manifest: ${config.baseUrl}/.well-known/agent.json`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info({
    type: 'server',
    action: 'shutdown_signal',
    signal: 'SIGTERM',
  });
  
  server.close(() => {
    logger.info({
      type: 'server',
      action: 'shutdown_complete',
    });
    
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info({
    type: 'server',
    action: 'shutdown_signal',
    signal: 'SIGINT',
  });
  
  server.close(() => {
    logger.info({
      type: 'server',
      action: 'shutdown_complete',
    });
    
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.fatal({
    type: 'server',
    action: 'uncaught_exception',
    error: error.message,
    stack: error.stack,
  });
  
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({
    type: 'server',
    action: 'unhandled_rejection',
    reason: reason instanceof Error ? reason.message : String(reason),
    promise: promise.toString(),
  });
  
  process.exit(1);
});

export default app;
