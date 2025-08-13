import { Router, Request, Response } from 'express';
import { join } from 'path';
import { logger } from '../lib/log';

const router = Router();

// Serve agent.json from examples directory
router.get('/.well-known/agent.json', (req: Request, res: Response): void => {
  logger.info({
    type: 'static',
    action: 'serve_agent_json',
    path: req.path,
    ip: req.ip,
  });

  // Set appropriate headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
  
  // Serve the agent.json file from examples
  const agentJsonPath = join(__dirname, '../../../examples/.well-known/agent.json');
  res.sendFile(agentJsonPath, (err) => {
    if (err) {
      logger.error({
        type: 'static',
        action: 'agent_json_error',
        path: req.path,
        error: err.message,
      });
      
      if (!res.headersSent) {
        res.status(500).json({
          code: 'INTERNAL_ERROR',
          message: 'Failed to serve agent.json',
        });
      }
    }
  });
});

// Serve OpenAPI JSON spec
router.get('/spec/openapi.json', (req: Request, res: Response): void => {
  logger.info({
    type: 'static',
    action: 'serve_openapi_json',
    path: req.path,
    ip: req.ip,
  });

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=300');
  
  const openapiPath = join(__dirname, '../../../spec/openapi.json');
  res.sendFile(openapiPath, (err) => {
    if (err) {
      logger.error({
        type: 'static',
        action: 'openapi_json_error',
        path: req.path,
        error: err.message,
      });
      
      if (!res.headersSent) {
        res.status(500).json({
          code: 'INTERNAL_ERROR',
          message: 'Failed to serve OpenAPI spec',
        });
      }
    }
  });
});

// Serve OpenAPI YAML spec
router.get('/spec/openapi.yaml', (req: Request, res: Response): void => {
  logger.info({
    type: 'static',
    action: 'serve_openapi_yaml',
    path: req.path,
    ip: req.ip,
  });

  res.setHeader('Content-Type', 'text/yaml');
  res.setHeader('Cache-Control', 'public, max-age=300');
  
  const openapiPath = join(__dirname, '../../../spec/openapi.yaml');
  res.sendFile(openapiPath, (err) => {
    if (err) {
      logger.error({
        type: 'static',
        action: 'openapi_yaml_error',
        path: req.path,
        error: err.message,
      });
      
      if (!res.headersSent) {
        res.status(500).json({
          code: 'INTERNAL_ERROR',
          message: 'Failed to serve OpenAPI spec',
        });
      }
    }
  });
});

// Health check endpoint
router.get('/health', (req: Request, res: Response): void => {
  logger.debug({
    type: 'health',
    action: 'check',
    path: req.path,
    ip: req.ip,
  });

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env['npm_package_version'] || '1.0.0',
  });
});

export default router;
