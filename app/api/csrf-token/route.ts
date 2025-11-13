import { NextRequest, NextResponse } from 'next/server';
import { generateCSRFToken } from '@/middlewares/csrf';
import { logger } from '@/lib/logger';
import { applySecurityHeaders } from '@/middlewares/security-headers';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    // Get or create a unique client identifier
    let sessionId = request.cookies.get('csrf-session-id')?.value ||
      request.cookies.get('sessionId')?.value ||
      request.headers.get('x-session-id');

    // If no session ID exists, generate a unique one
    if (!sessionId) {
      sessionId = crypto.randomBytes(16).toString('hex');
    }

    // Generate CSRF token
    const token = generateCSRFToken(sessionId);

    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      const { csrfStore } = await import('@/middlewares/csrf');
      console.log('[CSRF Token Generation]', {
        sessionId,
        tokenLength: token.length,
        storedTokens: csrfStore.getTokenCount(),
      });
    }

    const response = NextResponse.json({
      token,
      sessionId
    });

    // Set the session ID cookie if it wasn't already set
    if (!request.cookies.get('csrf-session-id')) {
      response.cookies.set('csrf-session-id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });
    }

    return applySecurityHeaders(response);
  } catch (error) {
    logger.error('Failed to generate CSRF token', 'api/csrf-token', error);
    return applySecurityHeaders(
      NextResponse.json(
        { error: 'Failed to generate CSRF token' },
        { status: 500 }
      )
    );
  }
}

