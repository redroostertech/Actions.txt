import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  port: number;
  baseUrl: string;
  staticToken?: string | undefined;
  oauthIssuer?: string | undefined;
  jwksUrl?: string | undefined;
  rateLimits: {
    ping: string;
    orderStatus: string;
    demos: string;
    quotesSandbox: string;
  };
  idempTtlSeconds: number;
  logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
}

export type { Config };

export const config: Config = {
  port: parseInt(process.env['PORT'] || '4242', 10),
  baseUrl: process.env['BASE_URL'] || 'http://localhost:4242',
  staticToken: process.env['STATIC_TOKEN'],
  oauthIssuer: process.env['OAUTH_ISSUER'],
  jwksUrl: process.env['JWKS_URL'],
  rateLimits: {
    ping: process.env['RATE_LIMIT_PING'] || '10:1s',
    orderStatus: process.env['RATE_LIMIT_ORDER_STATUS'] || '60:1m',
    demos: process.env['RATE_LIMIT_DEMOS'] || '60:1m',
    quotesSandbox: process.env['RATE_LIMIT_QUOTES_SANDBOX'] || '30:1m',
  },
  idempTtlSeconds: parseInt(process.env['IDEMP_TTL_SECONDS'] || '7200', 10),
  logLevel: (process.env['LOG_LEVEL'] as Config['logLevel']) || 'info',
};

// Parse rate limit strings into count and window
export function parseRateLimit(rateLimit: string): { count: number; windowMs: number } {
  const parts = rateLimit.split(':');
  if (parts.length !== 2) {
    throw new Error(`Invalid rate limit format: ${rateLimit}. Expected format: COUNT:WINDOW`);
  }
  
  const [countStr, windowStr] = parts;
  if (!countStr || !windowStr) {
    throw new Error(`Invalid rate limit format: ${rateLimit}. Expected format: COUNT:WINDOW`);
  }
  
  const count = parseInt(countStr, 10);
  
  if (isNaN(count) || count <= 0) {
    throw new Error(`Invalid count in rate limit: ${countStr}`);
  }
  
  let windowMs: number;
  if (windowStr.endsWith('s')) {
    windowMs = parseInt(windowStr.slice(0, -1), 10) * 1000;
  } else if (windowStr.endsWith('m')) {
    windowMs = parseInt(windowStr.slice(0, -1), 10) * 60 * 1000;
  } else if (windowStr.endsWith('h')) {
    windowMs = parseInt(windowStr.slice(0, -1), 10) * 60 * 60 * 1000;
  } else {
    windowMs = parseInt(windowStr, 10) * 1000; // Default to seconds
  }
  
  if (isNaN(windowMs) || windowMs <= 0) {
    throw new Error(`Invalid window in rate limit: ${windowStr}`);
  }
  
  return { count, windowMs };
}
