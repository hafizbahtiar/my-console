import { NextRequest, NextResponse } from 'next/server'
import { applySecurityHeaders, handleCors } from './security-headers'

export function middleware(request: NextRequest) {
  // Handle CORS preflight requests
  const corsResponse = handleCors(request)
  if (corsResponse) {
    return applySecurityHeaders(corsResponse, process.env.NODE_ENV === 'development')
  }

  // Apply security headers to all responses
  // Note: This is a basic implementation. In production, you might want to use
  // Next.js middleware with a custom response transformer.

  // For now, we'll let individual routes handle security headers
  // since Next.js middleware has limitations with response modification

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
