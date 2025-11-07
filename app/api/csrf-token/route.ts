import { NextRequest, NextResponse } from 'next/server';
import { generateCSRFToken } from '@/middlewares/csrf';
import { applySecurityHeaders } from '@/middlewares/security-headers';

export async function GET(request: NextRequest) {
  try {
    // Get session ID from cookies or headers (must match CSRF middleware logic)
    const sessionId = request.cookies.get('sessionId')?.value ||
                     request.headers.get('x-session-id') ||
                     'anonymous';

    // Generate CSRF token
    const token = generateCSRFToken(sessionId);

    const response = NextResponse.json({
      token,
      sessionId
    });

    return applySecurityHeaders(response);
  } catch (error) {
    console.error('Failed to generate CSRF token:', error);
    return applySecurityHeaders(
      NextResponse.json(
        { error: 'Failed to generate CSRF token' },
        { status: 500 }
      )
    );
  }
}

