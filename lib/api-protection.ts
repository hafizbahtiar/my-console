/**
 * API Protection Utilities
 * Provides rate limiting, CSRF protection, and validation for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimitMiddleware, rateLimitConfigs, checkRateLimit } from '@/middlewares/rate-limit';
import { csrfProtection, validateCSRFToken } from '@/middlewares/csrf';
import { applySecurityHeaders } from '@/middlewares/security-headers';
import { sanitize } from '@/lib/validation';

export interface APIHandlerOptions {
  /** Rate limit configuration */
  rateLimit?: {
    limit: number;
    windowMs: number;
    message?: string;
  } | keyof typeof rateLimitConfigs;
  /** Whether to require CSRF protection (default: true for POST/PUT/DELETE/PATCH) */
  requireCSRF?: boolean;
  /** Zod schema for request body validation */
  schema?: z.ZodSchema;
  /** Whether to sanitize input (default: true) */
  sanitizeInput?: boolean;
  /** Custom error handler */
  onError?: (error: Error, request: NextRequest) => NextResponse;
}

export interface APIHandlerContext {
  request: NextRequest;
  body: any;
  params: Record<string, string>;
}

export type APIHandler = (context: APIHandlerContext) => Promise<NextResponse>;

/**
 * Protected API route wrapper
 * Applies rate limiting, CSRF protection, and validation
 */
export async function protectedAPI(
  request: NextRequest,
  handler: APIHandler,
  options: APIHandlerOptions = {}
): Promise<NextResponse> {
  try {
    // 1. Apply rate limiting
    const rateLimitConfig =
      typeof options.rateLimit === 'string'
        ? rateLimitConfigs[options.rateLimit]
        : options.rateLimit || rateLimitConfigs.api;

    const rateLimitResult = rateLimitMiddleware(request, rateLimitConfig);
    if (rateLimitResult) {
      return applySecurityHeaders(rateLimitResult);
    }

    // 2. Apply CSRF protection for state-changing methods
    const requireCSRF =
      options.requireCSRF !== undefined
        ? options.requireCSRF
        : ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method);

    if (requireCSRF) {
      const csrfResult = csrfProtection(request);
      if (csrfResult) {
        return applySecurityHeaders(csrfResult);
      }
    }

    // 3. Parse and sanitize request body (if applicable)
    let body: any = {};
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        const rawBody = await request.json();
        body = options.sanitizeInput !== false ? sanitize.object(rawBody) : rawBody;
      } catch (error) {
        // Body might be empty or invalid JSON
        if (request.headers.get('content-type')?.includes('application/json')) {
          return applySecurityHeaders(
            NextResponse.json(
              { error: 'Invalid JSON in request body' },
              { status: 400 }
            )
          );
        }
      }
    }

    // 4. Validate request body with Zod schema
    if (options.schema) {
      const validation = options.schema.safeParse(body);
      if (!validation.success) {
        return applySecurityHeaders(
          NextResponse.json(
            {
              error: 'Validation failed',
              details: validation.error.issues.map((err: any) => ({
                path: err.path.join('.'),
                message: err.message,
                code: err.code,
              })),
            },
            { status: 400 }
          )
        );
      }
      body = validation.data; // Use validated and transformed data
    }

    // 5. Extract route parameters (for dynamic routes)
    const url = new URL(request.url);
    const params: Record<string, string> = {};
    // This is a simplified extraction - in actual Next.js routes, params come from the route handler
    // For now, we'll extract from URL pathname if needed

    // 6. Execute the handler
    const context: APIHandlerContext = {
      request,
      body,
      params,
    };

    const response = await handler(context);

    // 7. Add rate limit headers to successful responses
    const rateLimitInfo = checkRateLimit(request, rateLimitConfig);
    const newHeaders = new Headers(response.headers);
    Object.entries(rateLimitInfo.headers).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });

    // 8. Apply security headers
    return applySecurityHeaders(
      new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      })
    );
  } catch (error) {
    console.error('API protection error:', error);

    // Use custom error handler if provided
    if (options.onError) {
      return options.onError(error as Error, request);
    }

    // Default error response
    return applySecurityHeaders(
      NextResponse.json(
        {
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    );
  }
}

/**
 * Helper to create protected GET handler
 */
export function createProtectedGET(
  handler: APIHandler,
  options: Omit<APIHandlerOptions, 'requireCSRF'> = {}
) {
  return async (request: NextRequest) => {
    return protectedAPI(request, handler, {
      ...options,
      requireCSRF: false, // GET requests don't need CSRF
    });
  };
}

/**
 * Helper to create protected POST handler
 */
export function createProtectedPOST(
  handler: APIHandler,
  options: APIHandlerOptions = {}
) {
  return async (request: NextRequest) => {
    return protectedAPI(request, handler, {
      ...options,
      requireCSRF: true, // POST requests need CSRF
    });
  };
}

/**
 * Helper to create protected DELETE handler
 */
export function createProtectedDELETE(
  handler: APIHandler,
  options: APIHandlerOptions = {}
) {
  return async (
    request: NextRequest,
    context?: { params: Promise<Record<string, string>> | Record<string, string> }
  ) => {
    const params = context?.params
      ? await Promise.resolve(context.params)
      : {};
    return protectedAPI(
      request,
      async (ctx) => {
        return handler({ ...ctx, params });
      },
      {
        ...options,
        requireCSRF: true, // DELETE requests need CSRF
      }
    );
  };
}

/**
 * Helper to create protected PUT/PATCH handler
 */
export function createProtectedPUT(
  handler: APIHandler,
  options: APIHandlerOptions = {}
) {
  return async (request: NextRequest) => {
    return protectedAPI(request, handler, {
      ...options,
      requireCSRF: true, // PUT/PATCH requests need CSRF
    });
  };
}

