import { NextRequest, NextResponse } from 'next/server'
import { createProtectedPOST, createProtectedGET } from '@/lib/api-protection'
import { cleanupAuditLogs, getAuditLogStats, DEFAULT_RETENTION_CONFIG, getCurrentRetentionConfig } from '@/lib/audit-retention'
import { logger } from '@/lib/logger'

/**
 * API endpoint to manually trigger audit log cleanup
 * Requires admin authentication
 * 
 * POST /api/audit/cleanup
 * 
 * Body (optional):
 * {
 *   "force": boolean - Force cleanup even if recently run
 * }
 */
export const POST = createProtectedPOST(
    async ({ body }) => {
        try {
            const { force = false } = body || {}

            logger.info('Manual audit log cleanup triggered', 'api/audit/cleanup', { force })

            // Use current retention config (runtime or default)
            const retentionConfig = getCurrentRetentionConfig()
            const result = await cleanupAuditLogs(retentionConfig)

            return NextResponse.json({
                success: true,
                message: 'Audit log cleanup completed',
                data: result,
            })
        } catch (error) {
            logger.error('Audit log cleanup failed', 'api/audit/cleanup', error)
            return NextResponse.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : 'Cleanup failed',
                },
                { status: 500 }
            )
        }
    },
    {
        rateLimit: 'api',
        requireCSRF: true,
    }
)

/**
 * GET endpoint to retrieve audit log statistics
 * 
 * GET /api/audit/cleanup
 */
export const GET = createProtectedGET(
    async () => {
        try {
            const stats = await getAuditLogStats()

            return NextResponse.json({
                success: true,
                data: {
                    stats,
                    retentionConfig: {
                        defaultDays: DEFAULT_RETENTION_CONFIG.defaultDays,
                        securityEventsDays: DEFAULT_RETENTION_CONFIG.securityEventsDays,
                        systemEventsDays: DEFAULT_RETENTION_CONFIG.systemEventsDays,
                        userActivityDays: DEFAULT_RETENTION_CONFIG.userActivityDays,
                    },
                },
            })
        } catch (error) {
            logger.error('Failed to get audit log stats', 'api/audit/cleanup', error)
            return NextResponse.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to get stats',
                },
                { status: 500 }
            )
        }
    },
    {
        rateLimit: 'api',
    }
)

