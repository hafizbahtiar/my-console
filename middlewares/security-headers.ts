// Security headers middleware for Next.js applications

import { NextRequest, NextResponse } from 'next/server'

// Security headers configuration
export const securityHeaders = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',

  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Content Security Policy (configured for Appwrite, OpenRouter, and TipTap)
  // Enhanced CSP with stricter policies while maintaining compatibility
  'Content-Security-Policy': [
    "default-src 'self'",
    // Scripts: Allow self, inline (for Next.js), and eval (for TipTap)
    // Note: In production, consider using nonces for inline scripts
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    // Styles: Allow self and inline (for Tailwind and component styles)
    "style-src 'self' 'unsafe-inline'",
    // Images: Allow self, data URIs, HTTPS, and blob URLs
    "img-src 'self' data: https: blob:",
    // Fonts: Allow self, data URIs, and HTTPS
    "font-src 'self' data: https:",
    // Connections: Allow self, Appwrite endpoint, and OpenRouter API
    `connect-src 'self' ${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://appwrite.hafizbahtiar.com'} https://openrouter.ai https://api.openrouter.ai`,
    // Media: Allow self and blob URLs
    "media-src 'self' blob:",
    // Disallow object/embed tags
    "object-src 'none'",
    // Disallow frames (prevents clickjacking)
    "frame-src 'none'",
    "frame-ancestors 'none'",
    // Base URI: Only allow same origin
    "base-uri 'self'",
    // Form actions: Only allow same origin
    "form-action 'self'",
    // Upgrade insecure requests to HTTPS
    "upgrade-insecure-requests",
    // Report violations (optional, requires reporting endpoint)
    // "report-uri /api/csp-report",
    // Block all mixed content
    "block-all-mixed-content",
  ].join('; '),

  // Permissions policy (restrict features)
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'accelerometer=()',
    'gyroscope=()',
    'ambient-light-sensor=()',
    'autoplay=()',
    'fullscreen=(self)',
    'picture-in-picture=()'
  ].join(', '),

  // Strict Transport Security (enable in production with HTTPS)
  ...(process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://')
    ? {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    }
    : {}),

  // Cross-Origin policies
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',

  // Additional security headers
  'X-DNS-Prefetch-Control': 'on',
  'X-Download-Options': 'noopen',
  'X-Permitted-Cross-Domain-Policies': 'none',
}

// Development headers (less restrictive for local development)
// Allows WebSocket connections and localhost for hot reloading
export const developmentSecurityHeaders = {
  ...securityHeaders,
  'Content-Security-Policy': [
    "default-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https:",
    // Development: Allow WebSocket and localhost connections
    `connect-src 'self' ws: wss: https: http://localhost:* ${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://appwrite.hafizbahtiar.com'} https://openrouter.ai https://api.openrouter.ai`,
    "media-src 'self' blob:",
    "object-src 'none'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // Development: Don't block mixed content (for local development)
  ].join('; '),
  // Disable HSTS in development
  'Strict-Transport-Security': undefined,
}

// Apply security headers to response
export function applySecurityHeaders(response: NextResponse, isDevelopment = false): NextResponse {
  const headers = isDevelopment ? developmentSecurityHeaders : securityHeaders
  const newHeaders = new Headers(response.headers)

  Object.entries(headers).forEach(([key, value]) => {
    // Skip undefined values (e.g., HSTS in development)
    if (value !== undefined) {
      newHeaders.set(key, value)
    }
  })

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  })
}

// Middleware function for security headers
export function securityHeadersMiddleware(request: NextRequest): NextResponse | null {
  // This is called during request processing, but we'll apply headers to responses
  // The actual header application happens in the response phase
  return null
}

// Utility to create secure cookies
export function createSecureCookie(name: string, value: string, options: {
  maxAge?: number
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  path?: string
} = {}): string {
  const {
    maxAge = 86400, // 24 hours
    httpOnly = true,
    secure = process.env.NODE_ENV === 'production',
    sameSite = 'strict',
    path = '/'
  } = options

  const cookie = [
    `${name}=${encodeURIComponent(value)}`,
    `Max-Age=${maxAge}`,
    `Path=${path}`,
    `SameSite=${sameSite}`,
    httpOnly ? 'HttpOnly' : '',
    secure ? 'Secure' : ''
  ].filter(Boolean).join('; ')

  return cookie
}

// Validate request origin
export function validateOrigin(request: NextRequest, allowedOrigins: string[] = []): boolean {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')

  // Allow requests from the same origin
  if (!origin || origin.includes(host || '')) {
    return true
  }

  // Check against allowed origins
  return allowedOrigins.includes(origin)
}

// CORS headers for API routes
export function corsHeaders(origin?: string): Record<string, string> {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []

  return {
    'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : 'null',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400' // 24 hours
  }
}

// Handle CORS preflight requests
export function handleCors(request: NextRequest): NextResponse | null {
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin') || undefined
    return NextResponse.json({}, {
      status: 200,
      headers: corsHeaders(origin)
    })
  }
  return null
}
