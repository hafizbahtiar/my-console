# API Routes Documentation

## Overview

All API routes in My Console follow a standardized pattern with built-in security features including CSRF protection, rate limiting, input validation, and consistent error handling.

## Architecture

### Protection Layer (`lib/api-protection.ts`)

All API routes use protection wrappers that provide:
- **Rate Limiting**: Configurable rate limits per endpoint type
- **CSRF Protection**: Automatic CSRF validation for state-changing operations
- **Input Validation**: Zod schema validation integrated into the protection layer
- **Request Size Limits**: Configurable body size limits (10MB default)
- **Input Sanitization**: Automatic sanitization of request bodies
- **Standardized Responses**: Consistent success/error response format
- **Security Headers**: Applied to all responses

### Protection Wrappers

#### `createProtectedGET`
For GET requests (no CSRF required):
```typescript
export const GET = createProtectedGET(
  async ({ request, params }) => {
    // Handler logic
    return createSuccessResponse(data);
  },
  {
    rateLimit: 'api',
  }
);
```

#### `createProtectedPOST`
For POST requests (CSRF enabled by default):
```typescript
export const POST = createProtectedPOST(
  async ({ body, request, params }) => {
    // Body is already validated by schema
    const data = body;
    // Handler logic
    return createSuccessResponse(result);
  },
  {
    rateLimit: 'api',
    schema: yourZodSchema, // Optional but recommended
  }
);
```

#### `createProtectedPUT`
For PUT/PATCH requests (CSRF always enabled):
```typescript
export const PUT = createProtectedPUT(
  async ({ body, request, params }) => {
    // Handler logic
    return createSuccessResponse(updatedData);
  },
  {
    rateLimit: 'api',
    schema: updateSchema,
  }
);
```

#### `createProtectedDELETE`
For DELETE requests (CSRF always enabled):
```typescript
export const DELETE = createProtectedDELETE(
  async ({ request, params }) => {
    // Handler logic
    return createSuccessResponse(null, 'Resource deleted');
  },
  {
    rateLimit: 'api',
  }
);
```

## Dynamic Route Parameters

All protection wrappers support Next.js 15 dynamic route parameters:

```typescript
// For routes like /api/customers/[id]/route.ts
export const GET = createProtectedGET(
  async ({ request, params }) => {
    const id = params.id; // Automatically extracted from route
    // Handler logic
  },
  {
    rateLimit: 'api',
  }
);
```

## CSRF Protection

### How It Works

1. **Token Generation**: Client requests CSRF token from `/api/csrf-token`
2. **Token Storage**: Token stored server-side with session ID (cookie-based)
3. **Token Validation**: All POST/PUT/DELETE/PATCH requests must include CSRF token in headers
4. **Header Names Supported**:
   - `x-csrf-token`
   - `X-CSRF-Token`
   - `csrf-token`
   - `CSRF-Token`

### Client-Side Usage

```typescript
import { getCSRFHeadersAlt } from '@/lib/csrf-utils';

const headers = await getCSRFHeadersAlt();
const response = await fetch('/api/your-endpoint', {
  method: 'POST',
  headers,
  body: JSON.stringify(data),
});
```

### Disabling CSRF (Not Recommended)

Only disable CSRF for specific endpoints if absolutely necessary:

```typescript
export const POST = createProtectedPOST(
  async ({ body }) => {
    // Handler logic
  },
  {
    rateLimit: 'api',
    requireCSRF: false, // Only use when necessary
  }
);
```

## Rate Limiting

### Configuration

Rate limits are configured in `middlewares/rate-limit.ts`:

- **auth**: 5 requests per 15 minutes (authentication endpoints)
- **api**: 100 requests per 15 minutes (standard API endpoints)
- **health**: 1000 requests per minute (health check endpoints)
- **upload**: 10 requests per minute (file upload endpoints)

### Custom Rate Limits

```typescript
export const POST = createProtectedPOST(
  async ({ body }) => {
    // Handler logic
  },
  {
    rateLimit: {
      limit: 50,
      windowMs: 60 * 1000, // 1 minute
      message: 'Too many requests',
    },
  }
);
```

## Input Validation

### Schema Validation

Validation is integrated into the protection layer:

```typescript
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email(),
});

export const POST = createProtectedPOST(
  async ({ body }) => {
    // Body is already validated and typed
    const { name, email } = body;
    // Handler logic
  },
  {
    rateLimit: 'api',
    schema: createSchema,
  }
);
```

### Validation Errors

Failed validation returns standardized error response:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "path": "email",
        "message": "Invalid email",
        "code": "invalid_string"
      }
    ]
  }
}
```

## Response Format

### Success Response

```typescript
import { createSuccessResponse } from '@/lib/api-error-handler';

return createSuccessResponse(data, 'Operation successful', 201);
```

Response format:
```json
{
  "success": true,
  "data": { /* your data */ },
  "message": "Operation successful"
}
```

### Error Response

```typescript
import { APIError } from '@/lib/api-error-handler';

throw APIError.badRequest('Invalid input');
throw APIError.unauthorized('Unauthorized');
throw APIError.forbidden('Forbidden');
throw APIError.notFound('Resource not found');
throw APIError.conflict('Resource conflict');
throw APIError.validationError('Validation failed', details);
```

Response format:
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid input",
    "requestId": "req_1234567890_abc123"
  }
}
```

## Error Handling

### Standardized Error Codes

- `BAD_REQUEST` (400): Invalid request format or parameters
- `UNAUTHORIZED` (401): Authentication required
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `CONFLICT` (409): Resource conflict (e.g., duplicate)
- `VALIDATION_ERROR` (422): Request validation failed
- `PAYLOAD_TOO_LARGE` (413): Request body exceeds size limit
- `TOO_MANY_REQUESTS` (429): Rate limit exceeded
- `INTERNAL_SERVER_ERROR` (500): Server error
- `SERVICE_UNAVAILABLE` (503): Service temporarily unavailable

### Error Handling Pattern

```typescript
export const POST = createProtectedPOST(
  async ({ body, request, params }) => {
    try {
      // Business logic
      const result = await performOperation();
      return createSuccessResponse(result);
    } catch (error: any) {
      // Re-throw APIError instances (they'll be handled automatically)
      if (error instanceof APIError) {
        throw error;
      }
      
      // Handle Appwrite errors
      if (error.code === 404) {
        throw APIError.notFound('Resource not found');
      }
      
      // Log and throw generic error
      logger.error('Operation failed', 'api/endpoint', error);
      throw APIError.internalServerError('Operation failed', error);
    }
  },
  {
    rateLimit: 'api',
    schema: yourSchema,
  }
);
```

## Request Size Limits

Default limit: **10MB** per request body

Custom limits:
```typescript
export const POST = createProtectedPOST(
  async ({ body }) => {
    // Handler logic
  },
  {
    rateLimit: 'api',
    maxBodySize: 5 * 1024 * 1024, // 5MB
  }
);
```

## Security Headers

All API responses include security headers via `middlewares/security-headers.ts`:
- Content-Security-Policy
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy

## Best Practices

### 1. Always Use Protection Wrappers

```typescript
// ✅ Good
export const POST = createProtectedPOST(handler, options);

// ❌ Bad
export async function POST(request: NextRequest) {
  // Manual implementation
}
```

### 2. Use Schema Validation

```typescript
// ✅ Good
{
  schema: z.object({
    name: z.string().min(1),
  }),
}

// ❌ Bad
// Manual validation in handler
```

### 3. Use Standardized Responses

```typescript
// ✅ Good
return createSuccessResponse(data);
throw APIError.badRequest('Error message');

// ❌ Bad
return NextResponse.json({ data });
return NextResponse.json({ error: 'Error' }, { status: 400 });
```

### 4. Handle Dynamic Routes Properly

```typescript
// ✅ Good - params automatically extracted
export const GET = createProtectedGET(
  async ({ params }) => {
    const id = params.id;
  }
);

// ❌ Bad - manual param extraction
export async function GET(request, { params }) {
  const resolvedParams = await params;
  // ...
}
```

### 5. Error Handling

```typescript
// ✅ Good - Let protection layer handle errors
try {
  // Logic
} catch (error) {
  if (error instanceof APIError) throw error;
  throw APIError.internalServerError('Failed', error);
}

// ❌ Bad - Manual error responses
catch (error) {
  return NextResponse.json({ error: error.message }, { status: 500 });
}
```

## API Route Structure

### Standard Route Pattern

```typescript
import { createProtectedPOST, createProtectedGET } from '@/lib/api-protection';
import { APIError, createSuccessResponse } from '@/lib/api-error-handler';
import { z } from 'zod';

// Schema definition
const schema = z.object({
  // Your schema
});

// POST handler
export const POST = createProtectedPOST(
  async ({ body, request, params }) => {
    // Get authenticated user
    let user;
    try {
      user = await account.get();
    } catch (error) {
      throw APIError.unauthorized('Unauthorized');
    }

    // Body is already validated
    const data = body;

    // Business logic
    const result = await performOperation(data);

    return createSuccessResponse(result, 'Operation successful', 201);
  },
  {
    rateLimit: 'api',
    schema: schema,
  }
);

// GET handler
export const GET = createProtectedGET(
  async ({ request, params }) => {
    // Handler logic
    return createSuccessResponse(data);
  },
  {
    rateLimit: 'api',
  }
);
```

## Migration Guide

### Before (Old Pattern)

```typescript
export async function POST(request: NextRequest) {
  // Manual rate limiting
  // Manual CSRF check
  // Manual validation
  // Manual error handling
  return NextResponse.json({ data });
}
```

### After (New Pattern)

```typescript
export const POST = createProtectedPOST(
  async ({ body, request, params }) => {
    // Clean handler logic
    return createSuccessResponse(data);
  },
  {
    rateLimit: 'api',
    schema: yourSchema,
  }
);
```

## Testing API Routes

### Testing with CSRF Token

```typescript
// Get CSRF token first
const tokenResponse = await fetch('/api/csrf-token');
const { token } = await tokenResponse.json();

// Use token in request
const response = await fetch('/api/your-endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-csrf-token': token,
  },
  body: JSON.stringify(data),
});
```

## Related Documentation

- **CSRF Protection**: See `middlewares/csrf.ts` for implementation details
- **Rate Limiting**: See `middlewares/rate-limit.ts` for configuration
- **Error Handling**: See `lib/api-error-handler.ts` for error utilities
- **Security Headers**: See `middlewares/security-headers.ts` for header configuration
- **Security Audit**: See `docs/SECURITY_AUDIT.md` for security analysis

## Summary

All API routes now follow a consistent, secure pattern:
- ✅ CSRF protection enabled by default for state-changing operations
- ✅ Rate limiting configured per endpoint type
- ✅ Input validation via Zod schemas
- ✅ Standardized error handling and responses
- ✅ Request size limits
- ✅ Security headers applied
- ✅ Support for dynamic route parameters
- ✅ Consistent code structure across all routes

