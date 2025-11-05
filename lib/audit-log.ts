import { databases, account, tablesDB } from './appwrite'
import { Models } from 'appwrite'

// Database and Collection IDs
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'console-db'
const AUDIT_COLLECTION_ID = 'audit_logs'

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
  private readonly FETCH_RATE_LIMIT_MS = 1000 // 1 second between fetches
  private readonly LOG_RATE_LIMIT_MS = 500 // 0.5 seconds between log writes

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger()
    }
    return AuditLogger.instance
  }

  private checkFetchRateLimit(): boolean {
    const now = Date.now()
    if (now - this.lastFetchTime < this.FETCH_RATE_LIMIT_MS) {
      console.warn('Rate limit: Audit log fetch too frequent, skipping')
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
  async getUserAuditLogs(userId: string, limit: number = 50): Promise<any[]> {
    if (!this.checkFetchRateLimit()) {
      return []
    }

    try {
      const response = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: AUDIT_COLLECTION_ID
      })

      // Filter and sort on client side to avoid query syntax issues
      const userLogs = response.rows
        .filter((log: any) => log.userId === userId)
        .sort((a: any, b: any) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime())
        .slice(0, limit)

      return userLogs
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
      return []
    }
  }

  async getRecentLogs(limit: number = 100, userId?: string): Promise<any[]> {
    if (!this.checkFetchRateLimit()) {
      return []
    }

    try {
      const response = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: AUDIT_COLLECTION_ID
      })

      // Filter by user if userId is provided, then sort and limit
      let filteredLogs = response.rows

      if (userId) {
        filteredLogs = filteredLogs.filter((log: any) => log.userId === userId)
      }

      const recentLogs = filteredLogs
        .sort((a: any, b: any) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime())
        .slice(0, limit)

      return recentLogs
    } catch (error) {
      console.error('Failed to fetch recent logs:', error)
      return []
    }
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance()
