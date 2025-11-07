import { tablesDB, DATABASE_ID, AUDIT_COLLECTION_ID } from './appwrite'

export interface AuditLogEntry {
  // Required fields
  userId: string
  action: string
  resource: string

  // Optional contextual fields
  resourceId?: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  metadata?: Record<string, any>

  // System fields (auto-populated by Appwrite)
  id?: string
  $createdAt?: string
  $updatedAt?: string
}

export class AuditLogger {
  private static instance: AuditLogger
  private lastFetchTime: number = 0
  private lastLogTime: number = 0
  private readonly FETCH_RATE_LIMIT_MS = 500 // 0.5 seconds between fetches (reduced from 1s)
  private readonly LOG_RATE_LIMIT_MS = 500 // 0.5 seconds between log writes
  private cache: { data: any[], timestamp: number } | null = null
  private readonly CACHE_TTL_MS = 2000 // Cache for 2 seconds

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger()
    }
    return AuditLogger.instance
  }

  private checkFetchRateLimit(): boolean {
    const now = Date.now()
    if (now - this.lastFetchTime < this.FETCH_RATE_LIMIT_MS) {
      // Silently return false instead of warning - this is expected behavior
      return false
    }
    this.lastFetchTime = now
    return true
  }

  private checkLogRateLimit(): boolean {
    const now = Date.now()
    if (now - this.lastLogTime < this.LOG_RATE_LIMIT_MS) {
      console.warn('Rate limit: Audit log write too frequent, skipping')
      return false
    }
    this.lastLogTime = now
    return true
  }

  async log(entry: Omit<AuditLogEntry, 'id' | '$createdAt' | '$updatedAt'>): Promise<void> {
    if (!this.checkLogRateLimit()) {
      console.warn('Audit log rate limited for action:', entry.action)
      return // Skip logging if rate limited
    }

    try {
      console.log('Creating audit log:', { action: entry.action, resource: entry.resource, userId: entry.userId })
      await tablesDB.createRow({
        databaseId: DATABASE_ID,
        tableId: AUDIT_COLLECTION_ID,
        rowId: 'unique()', // Auto-generate ID
        data: {
          ...entry,
          // Convert objects to JSON strings for Appwrite
          oldValues: entry.oldValues ? JSON.stringify(entry.oldValues) : null,
          newValues: entry.newValues ? JSON.stringify(entry.newValues) : null,
          metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        }
      })
      console.log('Audit log created successfully for:', entry.action)
    } catch (error) {
      console.error('Failed to create audit log:', error)
      // Don't throw - audit logging shouldn't break the main functionality
    }
  }

  // Predefined audit events
  async logUserLogin(userId: string, sessionId?: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log({
      userId,
      action: 'USER_LOGIN',
      resource: 'auth',
      resourceId: userId,
      sessionId,
      ipAddress,
      userAgent,
      metadata: { eventType: 'authentication' }
    })
  }

  async logUserLogout(userId: string, sessionId?: string): Promise<void> {
    await this.log({
      userId,
      action: 'USER_LOGOUT',
      resource: 'auth',
      resourceId: userId,
      sessionId,
      metadata: { eventType: 'authentication' }
    })
  }

  async logProfileUpdate(userId: string, oldValues: Record<string, any>, newValues: Record<string, any>): Promise<void> {
    await this.log({
      userId,
      action: 'PROFILE_UPDATE',
      resource: 'user_profile',
      resourceId: userId,
      oldValues,
      newValues,
      metadata: { eventType: 'user_management' }
    })
  }


  async logSecurityEvent(userId: string, eventType: string, details?: Record<string, any>): Promise<void> {
    await this.log({
      userId,
      action: 'SECURITY_EVENT',
      resource: 'security',
      resourceId: userId,
      metadata: { eventType: 'security', securityEvent: eventType, ...details }
    })
  }

  async logSystemEvent(action: string, resource: string, details?: Record<string, any>): Promise<void> {
    await this.log({
      userId: 'system',
      action,
      resource,
      metadata: { eventType: 'system', ...details }
    })
  }

  // Query helpers
  async getUserAuditLogs(userId: string, limit: number = 50, offset: number = 0): Promise<{ logs: any[], total: number }> {
    if (!this.checkFetchRateLimit()) {
      return { logs: [], total: 0 }
    }

    try {
      const response = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: AUDIT_COLLECTION_ID,
        queries: [
          `limit(${limit})`,
          `offset(${offset})`,
          `orderDesc("$createdAt")`
        ]
      })

      // Filter and sort on client side to avoid query syntax issues
      // Note: We still need to filter by userId client-side since Appwrite queries don't support complex filtering
      const allLogs = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: AUDIT_COLLECTION_ID
      })

      const userLogs = allLogs.rows
        .filter((log: any) => log.userId === userId)
        .sort((a: any, b: any) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime())

      const paginatedLogs = userLogs.slice(offset, offset + limit)

      return {
        logs: paginatedLogs,
        total: userLogs.length
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
      return { logs: [], total: 0 }
    }
  }

  async getRecentLogs(limit: number = 100, userId?: string, offset: number = 0): Promise<{ logs: any[], total: number }> {
    // Check cache first
    const now = Date.now()
    if (this.cache && (now - this.cache.timestamp) < this.CACHE_TTL_MS) {
      // Use cached data
      let filteredLogs = this.cache.data

      if (userId) {
        filteredLogs = filteredLogs.filter((log: any) => log.userId === userId)
      }

      const sortedLogs = filteredLogs
        .sort((a: any, b: any) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime())

      const paginatedLogs = sortedLogs.slice(offset, offset + limit)

      return {
        logs: paginatedLogs,
        total: sortedLogs.length
      }
    }

    // If rate limited, wait and retry once
    if (!this.checkFetchRateLimit()) {
      // Wait for the rate limit period, then retry
      await new Promise(resolve => setTimeout(resolve, this.FETCH_RATE_LIMIT_MS))
      // Retry once after waiting
      if (!this.checkFetchRateLimit()) {
        // If still rate limited, return empty to avoid blocking
      return { logs: [], total: 0 }
      }
    }

    try {
      // Get all logs for filtering (Appwrite queries don't support complex filtering)
      const response = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: AUDIT_COLLECTION_ID
      })

      // Update cache
      this.cache = {
        data: response.rows || [],
        timestamp: Date.now()
      }

      // Filter by user if userId is provided, then sort
      let filteredLogs = response.rows || []

      if (userId) {
        filteredLogs = filteredLogs.filter((log: any) => log.userId === userId)
      }

      const sortedLogs = filteredLogs
        .sort((a: any, b: any) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime())

      // Apply pagination
      const paginatedLogs = sortedLogs.slice(offset, offset + limit)

      return {
        logs: paginatedLogs,
        total: sortedLogs.length
      }
    } catch (error) {
      console.error('Failed to fetch recent logs:', error)
      return { logs: [], total: 0 }
    }
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance()
