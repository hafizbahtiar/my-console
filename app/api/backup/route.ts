import { NextRequest, NextResponse } from 'next/server';
import { performBackup } from '../../../scripts/backup/backup';
import { schemas } from '../../../lib/validation';
import { rateLimitMiddleware, rateLimitConfigs } from '../../../middlewares/rate-limit';
import { csrfProtection } from '../../../middlewares/csrf';
import { applySecurityHeaders } from '../../../middlewares/security-headers';
import { sanitize } from '../../../lib/validation';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimitMiddleware(request, rateLimitConfigs.api)
    if (rateLimitResult) {
      return applySecurityHeaders(rateLimitResult)
    }

    // Apply CSRF protection
    const csrfResult = csrfProtection(request)
    if (csrfResult) {
      return applySecurityHeaders(csrfResult)
    }

    console.log('🔄 Manual backup initiated via API');

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    // Sanitize input
    const sanitizedBody = sanitize.object(body)

    // Validate request
    const validation = schemas.backupRequest.safeParse(sanitizedBody)
    if (!validation.success) {
      return applySecurityHeaders(
        NextResponse.json(
          {
            success: false,
            message: 'Invalid request data',
            error: validation.error?.message,
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      )
    }

    const { type = 'manual' } = validation.data

    // Perform the backup
    const result = await performBackup(type);

    console.log('✅ Manual backup completed successfully');
    console.log(`📊 Backup summary: ${result.collections} collections, ${result.totalRecords} records`);

    const response = NextResponse.json({
      success: true,
      message: 'Manual backup completed successfully',
      data: result,
      timestamp: new Date().toISOString()
    });

    return applySecurityHeaders(response);

  } catch (error) {
    console.error('❌ Manual backup failed:', error);

    const response = NextResponse.json(
      {
        success: false,
        message: 'Manual backup failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );

    return applySecurityHeaders(response);
  }
}

// GET endpoint for backup status (future enhancement)
export async function GET(request: NextRequest) {
  const response = NextResponse.json({
    message: 'Backup API is available',
    endpoints: ['POST /api/backup - Perform manual backup']
  });

  return applySecurityHeaders(response);
}
