import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { performBackup } from '../../../scripts/backup/backup';
import { createProtectedPOST, createProtectedGET } from '@/lib/api-protection';
import { apiSchemas } from '@/lib/api-schemas';

export const POST = createProtectedPOST(
  async ({ body }) => {
    logger.info('Manual backup initiated via API', 'api/backup');

    const { type = 'manual' } = body;

    // Perform the backup
    const result = await performBackup(type);

    logger.info('Manual backup completed successfully', 'api/backup', {
      collections: result.collections,
      totalRecords: result.totalRecords,
    });

    return NextResponse.json({
      success: true,
      message: 'Manual backup completed successfully',
      data: result,
      timestamp: new Date().toISOString(),
    });
  },
  {
    rateLimit: 'api',
    schema: apiSchemas.backup.createBackup,
  }
);

// GET endpoint for backup status
export const GET = createProtectedGET(
  async () => {
    return NextResponse.json({
      message: 'Backup API is available',
      endpoints: ['POST /api/backup - Perform manual backup'],
    });
  },
  {
    rateLimit: 'health',
  }
);
