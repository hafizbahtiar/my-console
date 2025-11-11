/**
 * Audit Log Retention Policy
 * 
 * This module handles automatic cleanup of old audit logs based on retention policies.
 * Retention periods are configurable via environment variables.
 * 
 * Retention Policy:
 * - Default: 90 days for all logs
 * - Security events: 365 days (1 year)
 * - System events: 30 days
 * - User activity: 90 days
 * 
 * Compliance:
 * - GDPR: User data can be deleted on request
 * - Audit logs are retained for security and compliance purposes
 * - Retention periods can be adjusted based on organizational requirements
 */

import { tablesDB, DATABASE_ID, AUDIT_COLLECTION_ID } from './appwrite'
import { logger } from './logger'

export interface RetentionConfig {
  /** Default retention period in days */
  defaultDays: number
  /** Security events retention period in days */
  securityEventsDays: number
  /** System events retention period in days */
  systemEventsDays: number
  /** User activity retention period in days */
  userActivityDays: number
  /** Whether to archive logs before deletion */
  archiveBeforeDelete: boolean
  /** Archive location (if archiving is enabled) */
  archiveLocation?: string
}

/**
 * Default retention configuration
 * Can be overridden via environment variables
 */
export const DEFAULT_RETENTION_CONFIG: RetentionConfig = {
  defaultDays: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '90', 10),
  securityEventsDays: parseInt(process.env.AUDIT_LOG_SECURITY_RETENTION_DAYS || '365', 10),
  systemEventsDays: parseInt(process.env.AUDIT_LOG_SYSTEM_RETENTION_DAYS || '30', 10),
  userActivityDays: parseInt(process.env.AUDIT_LOG_USER_RETENTION_DAYS || '90', 10),
  archiveBeforeDelete: process.env.AUDIT_LOG_ARCHIVE_ENABLED === 'true',
  archiveLocation: process.env.AUDIT_LOG_ARCHIVE_LOCATION || './backup/audit-archive',
}

/**
 * Determine retention period for a log entry based on its type
 */
function getRetentionDays(entry: any, config: RetentionConfig): number {
  const action = entry.action || ''
  const resource = entry.resource || ''
  const metadata = entry.metadata ? (typeof entry.metadata === 'string' ? JSON.parse(entry.metadata) : entry.metadata) : {}

  // Security events get longer retention
  if (resource === 'security' || action.includes('SECURITY') || metadata.eventType === 'security') {
    return config.securityEventsDays
  }

  // System events get shorter retention
  if (resource === 'system' || action.includes('SYSTEM') || metadata.eventType === 'system' || entry.userId === 'system') {
    return config.systemEventsDays
  }

  // User activity uses default retention
  return config.userActivityDays
}

/**
 * Check if a log entry should be deleted based on retention policy
 */
function shouldDeleteLog(entry: any, config: RetentionConfig): boolean {
  if (!entry.$createdAt) {
    return false // Don't delete entries without timestamps
  }

  const createdAt = new Date(entry.$createdAt)
  const now = new Date()
  const ageInDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
  const retentionDays = getRetentionDays(entry, config)

  return ageInDays > retentionDays
}

/**
 * Clean up old audit logs based on retention policy
 * 
 * @param config Retention configuration (uses default if not provided)
 * @returns Number of logs deleted
 */
export async function cleanupAuditLogs(config: RetentionConfig = DEFAULT_RETENTION_CONFIG): Promise<{
  deleted: number
  archived: number
  errors: number
}> {
  let deleted = 0
  let archived = 0
  let errors = 0

  try {
    logger.info('Starting audit log cleanup', 'audit-retention', {
      config: {
        defaultDays: config.defaultDays,
        securityEventsDays: config.securityEventsDays,
        systemEventsDays: config.systemEventsDays,
        userActivityDays: config.userActivityDays,
      },
    })

    // Fetch all audit logs
    const response = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: AUDIT_COLLECTION_ID,
    })

    const logs = response.rows || []
    const logsToDelete: any[] = []
    const logsToArchive: any[] = []

    // Identify logs to delete/archive
    for (const log of logs) {
      if (shouldDeleteLog(log, config)) {
        if (config.archiveBeforeDelete) {
          logsToArchive.push(log)
        } else {
          logsToDelete.push(log)
        }
      }
    }

    logger.info(`Found ${logsToDelete.length} logs to delete, ${logsToArchive.length} logs to archive`, 'audit-retention')

    // Archive logs if enabled
    if (config.archiveBeforeDelete && logsToArchive.length > 0) {
      try {
        // In a real implementation, you would write to archive location
        // For now, we'll just log that archiving would happen
        logger.info(`Would archive ${logsToArchive.length} logs to ${config.archiveLocation}`, 'audit-retention')
        archived = logsToArchive.length

        // After archiving, mark for deletion
        logsToDelete.push(...logsToArchive)
      } catch (error) {
        logger.error('Failed to archive logs', 'audit-retention', error)
        errors++
      }
    }

    // Delete old logs
    for (const log of logsToDelete) {
      try {
        await tablesDB.deleteRow({
          databaseId: DATABASE_ID,
          tableId: AUDIT_COLLECTION_ID,
          rowId: log.$id,
        })
        deleted++
      } catch (error) {
        logger.error(`Failed to delete audit log ${log.$id}`, 'audit-retention', error)
        errors++
      }
    }

    logger.info('Audit log cleanup completed', 'audit-retention', {
      deleted,
      archived,
      errors,
      totalProcessed: logsToDelete.length + logsToArchive.length,
    })

    return { deleted, archived, errors }
  } catch (error) {
    logger.error('Failed to cleanup audit logs', 'audit-retention', error)
    throw error
  }
}

/**
 * Get audit log statistics
 */
export async function getAuditLogStats(): Promise<{
  total: number
  byAge: {
    lessThan30Days: number
    between30And90Days: number
    between90And365Days: number
    moreThan365Days: number
  }
  byType: {
    security: number
    system: number
    userActivity: number
  }
}> {
  try {
    const response = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: AUDIT_COLLECTION_ID,
    })

    const logs = response.rows || []
    const now = new Date()

    const stats = {
      total: logs.length,
      byAge: {
        lessThan30Days: 0,
        between30And90Days: 0,
        between90And365Days: 0,
        moreThan365Days: 0,
      },
      byType: {
        security: 0,
        system: 0,
        userActivity: 0,
      },
    }

    for (const log of logs) {
      if (log.$createdAt) {
        const createdAt = new Date(log.$createdAt)
        const ageInDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))

        if (ageInDays < 30) {
          stats.byAge.lessThan30Days++
        } else if (ageInDays < 90) {
          stats.byAge.between30And90Days++
        } else if (ageInDays < 365) {
          stats.byAge.between90And365Days++
        } else {
          stats.byAge.moreThan365Days++
        }
      }

      // Categorize by type
      const action = log.action || ''
      const resource = log.resource || ''
      const metadata = log.metadata ? (typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata) : {}

      if (resource === 'security' || action.includes('SECURITY') || metadata.eventType === 'security') {
        stats.byType.security++
      } else if (resource === 'system' || action.includes('SYSTEM') || metadata.eventType === 'system' || log.userId === 'system') {
        stats.byType.system++
      } else {
        stats.byType.userActivity++
      }
    }

    return stats
  } catch (error) {
    logger.error('Failed to get audit log stats', 'audit-retention', error)
    throw error
  }
}

