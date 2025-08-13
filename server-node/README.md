# Action.txt Server

A minimal, production-grade Node.js + TypeScript server that implements the Action.txt specification.

## Features

- ✅ **OpenAPI 3.0.3 Compliance** - All endpoints match the spec exactly
- 🔐 **OAuth2 Bearer Token Authentication** - Configurable static token or dev mode
- 🚦 **Rate Limiting** - Per-route rate limits with `Retry-After` headers
- 🔄 **Idempotency** - Required for `/demos` endpoint with TTL-based storage
- 📊 **Structured Logging** - Pino logger with request/response tracking
- 🛡️ **Security** - Helmet, CORS, input validation with AJV
- 📁 **Static File Serving** - Agent manifest and OpenAPI specs
- 🧪 **Mock Data** - Sample orders, demos, and quotes for testing

## Quick Start

### 1. Setup Environment

```bash
# Copy environment file
cp env.example .env

# Edit .env with your configuration
# PORT=4242
# STATIC_TOKEN=your-dev-token
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:4242`

## API Endpoints

### Public Endpoints

- `GET /ping` - Health check (no auth required)
- `GET /.well-known/agent.json` - Action.txt agent manifest
- `GET /spec/openapi.json` - OpenAPI specification
- `GET /spec/openapi.yaml` - OpenAPI specification (YAML)
- `GET /health` - Server health status

### Protected Endpoints

All require `Authorization: Bearer <token>` header:

- `GET /orders/{order_id}/status` - Get order status
- `POST /demos` - Schedule a demo (requires `Idempotency-Key`)
- `POST /quotes:sandbox` - Generate sandbox quote

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4242` | Server port |
| `BASE_URL` | `http://localhost:4242` | Base URL for responses |
| `STATIC_TOKEN` | - | Required Bearer token (if not set, dev mode allows all) |
| `OAUTH_ISSUER` | - | OAuth issuer for JWT validation (optional) |
| `JWKS_URL` | - | JWKS URL for JWT validation (optional) |
| `RATE_LIMIT_PING` | `10:1s` | Rate limit for ping endpoint |
| `RATE_LIMIT_ORDER_STATUS` | `60:1m` | Rate limit for order status |
| `RATE_LIMIT_DEMOS` | `60:1m` | Rate limit for demos |
| `RATE_LIMIT_QUOTES_SANDBOX` | `30:1m` | Rate limit for quotes |
| `IDEMP_TTL_SECONDS` | `7200` | Idempotency key TTL (2 hours) |
| `LOG_LEVEL` | `info` | Logging level |

### Rate Limit Format

Rate limits use the format `COUNT:WINDOW`:
- `10:1s` - 10 requests per second
- `60:1m` - 60 requests per minute
- `1000:1h` - 1000 requests per hour

## Development

### Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run smoke        # Quick smoke test
```

### Project Structure

```
src/
├── config.ts              # Configuration and environment
├── index.ts               # Main server file
├── lib/
│   ├── ajv.ts            # JSON Schema validation
│   ├── errors.ts          # Error handling utilities
│   ├── idempotency.ts     # Idempotency store
│   └── log.ts             # Pino logger
├── middleware/
│   ├── auth.ts            # Authentication middleware
│   ├── errorHandler.ts    # Error handling middleware
│   └── rateLimit.ts       # Rate limiting middleware
└── routes/
    ├── demos.ts           # Demo scheduling
    ├── orders.ts          # Order status
    ├── ping.ts            # Health check
    ├── quotes.ts          # Quote generation
    └── static.ts          # Static file serving
```

## Testing

### Manual Testing

1. **Start server**: `npm run dev`

2. **Test ping** (no auth):
   ```bash
   curl -s http://localhost:4242/ping | jq .
   ```

3. **Test authentication** (expect 401):
   ```bash
   curl -i http://localhost:4242/orders/ORD-ABC123/status
   ```

4. **Test with token**:
   ```bash
   export TOKEN="your-token-from-env"
   curl -s http://localhost:4242/orders/ORD-ABC123/status \
     -H "Authorization: Bearer $TOKEN" | jq .
   ```

5. **Test idempotency**:
   ```bash
   export IDEMP_KEY=$(uuidgen)
   curl -s -X POST http://localhost:4242/demos \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -H "Idempotency-Key: $IDEMP_KEY" \
     -d '{"name":"Jane Doe","email":"jane@example.com","time_window":"2025-08-16T09:00Z/2025-08-18T17:00Z"}' | jq .
   
   # Repeat same request - should get identical response
   ```

6. **Test rate limiting**:
   ```bash
   # Rapidly call ping endpoint to trigger rate limit
   for i in {1..15}; do curl -s http://localhost:4242/ping; done
   ```

### Validation Against Spec

The server implements all endpoints exactly as defined in `./spec/openapi.json`:

- ✅ Method signatures
- ✅ Request/response schemas
- ✅ Status codes
- ✅ Headers (including `Idempotency-Key` requirement)
- ✅ Error responses following `components.schemas.Error`

## Security Features

- **Input Validation**: All requests validated against OpenAPI schemas
- **Rate Limiting**: Per-route rate limits with `Retry-After` headers
- **Authentication**: Bearer token validation with scope checking
- **Idempotency**: Hash-based idempotency for safe retries
- **Logging**: Structured logging with PII masking
- **CORS**: Configurable CORS for cross-origin requests
- **Helmet**: Security headers and protections

## Production Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Set production environment**:
   ```bash
   export NODE_ENV=production
   export STATIC_TOKEN=your-secure-token
   ```

3. **Start production server**:
   ```bash
   npm start
   ```

4. **Use process manager** (recommended):
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name actiontxt-server
   ```

## Troubleshooting

### Common Issues

1. **Port already in use**: Change `PORT` in `.env`
2. **Authentication errors**: Check `STATIC_TOKEN` configuration
3. **Rate limit errors**: Adjust rate limit values in `.env`
4. **Validation errors**: Check request body against OpenAPI schemas

### Logs

The server uses structured logging with Pino. Log levels:
- `fatal` - Unrecoverable errors
- `error` - Error conditions
- `warn` - Warning conditions
- `info` - General information
- `debug` - Debug information
- `trace` - Trace information

### Health Check

```bash
curl http://localhost:4242/health
```

Returns server status, uptime, and version information.

## Contributing

1. Follow TypeScript strict mode
2. Use ESLint and Prettier
3. Add tests for new features
4. Update OpenAPI spec if adding endpoints
5. Follow error handling patterns

## License

MIT License - see LICENSE file for details.
