// CSRF (Cross-Site Request Forgery) protection utilities

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// CSRF token store (in-memory for development, use Redis/database in production)
class CSRFTokenStore {
  private tokens = new Map<string, { token: string; expires: number }>()

  generate(sessionId: string): string {
    // Check if we already have a valid token for this session
    const existing = this.tokens.get(sessionId)
    if (existing && Date.now() < existing.expires) {
      // Return existing token if it's still valid
      if (process.env.NODE_ENV === 'development') {
        console.log('[CSRF] Returning existing token for session:', sessionId.substring(0, 8));
      }
      return existing.token
    }

    // Generate new token
    const token = crypto.randomBytes(32).toString('hex')
    const expires = Date.now() + (24 * 60 * 60 * 1000) // 24 hours

    this.tokens.set(sessionId, { token, expires })
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[CSRF] Generated new token for session:', sessionId.substring(0, 8), 'Store size:', this.tokens.size);
    }
    
    return token
  }

  validate(sessionId: string, token: string): boolean {
    const stored = this.tokens.get(sessionId)
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[CSRF] Validating token:', {
        sessionId: sessionId.substring(0, 8),
        hasStored: !!stored,
        storeSize: this.tokens.size,
        allSessionIds: Array.from(this.tokens.keys()).map(k => k.substring(0, 8)),
      });
    }
    
    if (!stored) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[CSRF] No stored token found for session:', sessionId.substring(0, 8));
      }
      return false
    }

    // Check if token is expired
    if (Date.now() > stored.expires) {
      this.tokens.delete(sessionId)
      if (process.env.NODE_ENV === 'development') {
        console.log('[CSRF] Token expired for session:', sessionId.substring(0, 8));
      }
      return false
    }

    // Check if token matches
    const matches = stored.token === token
    if (process.env.NODE_ENV === 'development') {
      console.log('[CSRF] Token match result:', matches, {
        storedToken: stored.token.substring(0, 16),
        providedToken: token.substring(0, 16),
      });
    }
    return matches
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

  getTokenCount(): number {
    return this.tokens.size
  }
}

// Use global to persist across hot reloads in development
const globalForCsrf = global as typeof globalThis & {
  csrfStore?: CSRFTokenStore;
};

export const csrfStore = globalForCsrf.csrfStore || new CSRFTokenStore();

if (!globalForCsrf.csrfStore) {
  globalForCsrf.csrfStore = csrfStore;
  // Cleanup expired tokens every hour
  if (typeof global !== 'undefined') {
    setInterval(() => csrfStore.cleanup(), 60 * 60 * 1000);
  }
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

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('[CSRF] Validation attempt:', {
      method: request.method,
      url: request.url,
      sessionId: sessionId || 'NOT FOUND',
      hasToken: !!csrfToken,
      tokenLength: csrfToken?.length,
      cookies: {
        'csrf-session-id': request.cookies.get('csrf-session-id')?.value || 'NOT SET',
        'sessionId': request.cookies.get('sessionId')?.value || 'NOT SET',
      },
      headers: {
        'x-csrf-token': request.headers.get('x-csrf-token') || 'NOT SET',
        'X-CSRF-Token': request.headers.get('X-CSRF-Token') || 'NOT SET',
      }
    });
  }

  if (!csrfToken) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[CSRF] Token missing');
    }
    return NextResponse.json(
      { error: 'CSRF token missing' },
      { status: 403 }
    )
  }

  const isValid = validateCSRFToken(sessionId, csrfToken);
  if (process.env.NODE_ENV === 'development') {
    console.log('[CSRF] Validation result:', {
      isValid,
      sessionId,
      tokenExists: !!csrfToken,
      storedTokens: csrfStore.getTokenCount(),
    });
  }

  if (!isValid) {
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
