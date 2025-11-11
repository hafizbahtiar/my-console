// CSRF (Cross-Site Request Forgery) protection utilities

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// CSRF token store (in-memory for development, use Redis/database in production)
class CSRFTokenStore {
  private tokens = new Map<string, { token: string; expires: number }>()

  generate(sessionId: string): string {
    const token = crypto.randomBytes(32).toString('hex')
    const expires = Date.now() + (24 * 60 * 60 * 1000) // 24 hours

    this.tokens.set(sessionId, { token, expires })
    return token
  }

  validate(sessionId: string, token: string): boolean {
    const stored = this.tokens.get(sessionId)
    if (!stored) return false

    // Check if token is expired
    if (Date.now() > stored.expires) {
      this.tokens.delete(sessionId)
      return false
    }

    // Check if token matches
    return stored.token === token
  }

  remove(sessionId: string): void {
    this.tokens.delete(sessionId)
  }

  cleanup(): void {
    const now = Date.now()
    for (const [sessionId, data] of this.tokens.entries()) {
      if (now > data.expires) {
        this.tokens.delete(sessionId)
      }
    }
  }
}

export const csrfStore = new CSRFTokenStore()

// Cleanup expired tokens every hour
if (typeof global !== 'undefined') {
  setInterval(() => csrfStore.cleanup(), 60 * 60 * 1000)
}

// Generate CSRF token for a session
export function generateCSRFToken(sessionId: string): string {
  return csrfStore.generate(sessionId)
}

// Validate CSRF token
export function validateCSRFToken(sessionId: string, token: string): boolean {
  return csrfStore.validate(sessionId, token)
}

// CSRF protection middleware
export function csrfProtection(request: NextRequest): NextResponse | null {
  // Skip CSRF check for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return null
  }

  // Get session ID from cookies or headers (must match CSRF token generation logic)
  const sessionId = request.cookies.get('csrf-session-id')?.value ||
    request.cookies.get('sessionId')?.value ||
    request.headers.get('x-session-id') ||
    'anonymous'

  // Get CSRF token from headers (check multiple header name variations)
  const csrfToken = request.headers.get('x-csrf-token') ||
    request.headers.get('X-CSRF-Token') ||
    request.headers.get('csrf-token') ||
    request.headers.get('CSRF-Token')

  if (!csrfToken) {
    return NextResponse.json(
      { error: 'CSRF token missing' },
      { status: 403 }
    )
  }

  if (!validateCSRFToken(sessionId, csrfToken)) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    )
  }

  return null // Continue processing
}

// Middleware to add CSRF token to response
export function addCSRFToken(response: NextResponse, sessionId: string): NextResponse {
  const token = generateCSRFToken(sessionId)

  const newHeaders = new Headers(response.headers)
  newHeaders.set('X-CSRF-Token', token)

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  })
}

// Get CSRF token for client-side use
export function getCSRFToken(sessionId: string): string {
  // This would typically be called from a client-side hook
  return csrfStore.generate(sessionId)
}
