// Rate limiting middleware for API routes

import { NextRequest, NextResponse } from 'next/server'
import { rateLimitStore } from '../lib/validation'

export interface RateLimitConfig {
  limit: number
  windowMs: number
  message?: string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  headers: Record<string, string>
}

// Default configurations for different endpoints
export const rateLimitConfigs = {
  // Authentication endpoints - strict limits
  auth: {
    limit: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many authentication attempts. Please try again later.'
  },

  // API endpoints - moderate limits
  api: {
    limit: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many requests. Please try again later.'
  },

  // Health check - generous limits
  health: {
    limit: 1000,
    windowMs: 60 * 1000, // 1 minute
    message: 'Health check rate limit exceeded.'
  },

  // File uploads - moderate limits
  upload: {
    limit: 10,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many upload attempts. Please try again later.'
  }
}

// Get client identifier (IP address)
function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from various headers (for reverse proxy setups)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const clientIp = request.headers.get('x-client-ip')

  // Use the first available IP, fallback to a generic identifier
  const ip = forwardedFor?.split(',')[0]?.trim() ||
             realIp ||
             clientIp ||
             'unknown'

  // Include user agent for additional uniqueness
  const userAgent = request.headers.get('user-agent') || 'unknown'
  return `${ip}:${userAgent.substring(0, 50)}` // Limit user agent length
}

// Check rate limit for a request
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): RateLimitResult {
  const identifier = getClientIdentifier(request)
  const result = rateLimitStore.check(identifier, config.limit, config.windowMs)

  const headers = {
    'X-RateLimit-Limit': config.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
    'X-RateLimit-Window': config.windowMs.toString()
  }

  return {
    ...result,
    headers
  }
}

// Rate limiting middleware function
export function rateLimitMiddleware(
  request: NextRequest,
  config: RateLimitConfig
): NextResponse | null {
  const result = checkRateLimit(request, config)

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: config.message || 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
      },
      {
        status: 429,
        headers: {
          ...result.headers,
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
        }
      }
    )
  }

  // Return null to continue processing (caller should add headers to response)
  return null
}

// Helper function to apply rate limiting to API routes
export async function withRateLimit(
  request: NextRequest,
  handler: () => Promise<NextResponse>,
  config: RateLimitConfig
): Promise<NextResponse> {
  const rateLimitResult = checkRateLimit(request, config)

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: config.message || 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      },
      {
        status: 429,
        headers: {
          ...rateLimitResult.headers,
          'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
        }
      }
    )
  }

  // Execute the handler
  const response = await handler()

  // Add rate limit headers to the response
  const newHeaders = new Headers(response.headers)
  Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
    newHeaders.set(key, value)
  })

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  })
}
