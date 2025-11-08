import { NextRequest, NextResponse } from 'next/server'
import { applySecurityHeaders, handleCors, securityHeaders, developmentSecurityHeaders } from './security-headers'

export function middleware(request: NextRequest) {
  // Handle CORS preflight requests
  const corsResponse = handleCors(request)
  if (corsResponse) {
    return applySecurityHeaders(corsResponse, process.env.NODE_ENV === 'development')
  }

  // Apply security headers to all responses using Next.js response rewriting
  const response = NextResponse.next()
  const isDevelopment = process.env.NODE_ENV === 'development'
  const headers = isDevelopment ? developmentSecurityHeaders : securityHeaders

  // Apply all security headers (skip undefined values)
  Object.entries(headers).forEach(([key, value]) => {
    if (value !== undefined) {
      response.headers.set(key, value)
    }
  })

  return response
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
