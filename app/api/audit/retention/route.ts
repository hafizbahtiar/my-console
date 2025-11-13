import { NextRequest, NextResponse } from 'next/server'
import { createProtectedGET, createProtectedPOST } from '@/lib/api-protection'
import { DEFAULT_RETENTION_CONFIG, RetentionConfig, setRuntimeRetentionConfig, getCurrentRetentionConfig } from '@/lib/audit-retention'
import { logger } from '@/lib/logger'

/**
 * GET endpoint to retrieve current retention configuration
 * 
 * GET /api/audit/retention
 */
export const GET = createProtectedGET(
    async () => {
        try {
            const retentionConfig = getCurrentRetentionConfig()
            return NextResponse.json({
                success: true,
                data: {
                    retentionConfig: {
                        defaultDays: retentionConfig.defaultDays,
                        securityEventsDays: retentionConfig.securityEventsDays,
                        systemEventsDays: retentionConfig.systemEventsDays,
                        userActivityDays: retentionConfig.userActivityDays,
                        archiveBeforeDelete: retentionConfig.archiveBeforeDelete,
                        archiveLocation: retentionConfig.archiveLocation,
                    },
                },
            })
        } catch (error) {
            logger.error('Failed to get retention config', 'api/audit/retention', error)
            return NextResponse.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to get config',
                },
                { status: 500 }
            )
        }
    },
    {
        rateLimit: 'api',
    }
)

/**
 * POST endpoint to update retention configuration
 * 
 * POST /api/audit/retention
 * 
 * Body:
 * {
 *   "defaultDays": number,
 *   "securityEventsDays": number,
 *   "systemEventsDays": number,
 *   "userActivityDays": number,
 *   "archiveBeforeDelete": boolean,
 *   "archiveLocation": string (optional)
 * }
 */
export const POST = createProtectedPOST(
    async ({ body }) => {
        try {
            const {
                defaultDays,
                securityEventsDays,
                systemEventsDays,
                userActivityDays,
                archiveBeforeDelete,
                archiveLocation,
            } = body || {}

            // Validate input
            if (
                defaultDays !== undefined && (typeof defaultDays !== 'number' || defaultDays < 1 || defaultDays > 3650)
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'defaultDays must be between 1 and 3650',
                    },
                    { status: 400 }
                )
            }

            if (
                securityEventsDays !== undefined &&
                (typeof securityEventsDays !== 'number' || securityEventsDays < 1 || securityEventsDays > 3650)
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'securityEventsDays must be between 1 and 3650',
                    },
                    { status: 400 }
                )
            }

            if (
                systemEventsDays !== undefined &&
                (typeof systemEventsDays !== 'number' || systemEventsDays < 1 || systemEventsDays > 3650)
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'systemEventsDays must be between 1 and 3650',
                    },
                    { status: 400 }
                )
            }

            if (
                userActivityDays !== undefined &&
                (typeof userActivityDays !== 'number' || userActivityDays < 1 || userActivityDays > 3650)
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'userActivityDays must be between 1 and 3650',
                    },
                    { status: 400 }
                )
            }

            // Get current config and update
            const currentConfig = getCurrentRetentionConfig()
            const updatedConfig: RetentionConfig = {
                ...currentConfig,
                ...(defaultDays !== undefined && { defaultDays }),
                ...(securityEventsDays !== undefined && { securityEventsDays }),
                ...(systemEventsDays !== undefined && { systemEventsDays }),
                ...(userActivityDays !== undefined && { userActivityDays }),
                ...(archiveBeforeDelete !== undefined && { archiveBeforeDelete }),
                ...(archiveLocation !== undefined && { archiveLocation }),
            }

            // Update runtime config
            setRuntimeRetentionConfig(updatedConfig)

            logger.info('Retention configuration updated', 'api/audit/retention', { retentionConfig: updatedConfig })

            return NextResponse.json({
                success: true,
                message: 'Retention configuration updated',
                data: {
                    retentionConfig: {
                        defaultDays: updatedConfig.defaultDays,
                        securityEventsDays: updatedConfig.securityEventsDays,
                        systemEventsDays: updatedConfig.systemEventsDays,
                        userActivityDays: updatedConfig.userActivityDays,
                        archiveBeforeDelete: updatedConfig.archiveBeforeDelete,
                        archiveLocation: updatedConfig.archiveLocation,
                    },
                },
            })
        } catch (error) {
            logger.error('Failed to update retention config', 'api/audit/retention', error)
            return NextResponse.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to update config',
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


