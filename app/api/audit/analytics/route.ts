import { NextRequest, NextResponse } from 'next/server'
import { createProtectedGET } from '@/lib/api-protection'
import { tablesDB, DATABASE_ID, AUDIT_COLLECTION_ID } from '@/lib/appwrite'
import { logger } from '@/lib/logger'

interface AnalyticsData {
    activityTrends: {
        date: string
        count: number
    }[]
    topActions: {
        action: string
        count: number
        percentage: number
    }[]
    topUsers: {
        userId: string
        count: number
        percentage: number
    }[]
    topResources: {
        resource: string
        count: number
        percentage: number
    }[]
    hourlyDistribution: {
        hour: number
        count: number
    }[]
    actionDistribution: {
        action: string
        count: number
    }[]
    securityEvents: {
        total: number
        byType: Record<string, number>
        recent: any[]
    }
    timeRange: {
        from: string
        to: string
    }
}

/**
 * GET endpoint to retrieve audit log analytics
 * 
 * GET /api/audit/analytics?days=30
 */
export const GET = createProtectedGET(
    async ({ request }) => {
        try {
            const searchParams = request.nextUrl.searchParams
            const days = parseInt(searchParams.get('days') || '30', 10)

            // Fetch all audit logs
            const response = await tablesDB.listRows({
                databaseId: DATABASE_ID,
                tableId: AUDIT_COLLECTION_ID,
            })

            const logs = response.rows || []
            const now = new Date()
            const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

            // Filter logs by date range
            const filteredLogs = logs.filter((log: any) => {
                if (!log.$createdAt) return false
                const logDate = new Date(log.$createdAt)
                return logDate >= cutoffDate
            })

            // Activity trends (daily)
            const activityTrendsMap = new Map<string, number>()
            filteredLogs.forEach((log: any) => {
                if (log.$createdAt) {
                    const date = new Date(log.$createdAt).toISOString().split('T')[0]
                    activityTrendsMap.set(date, (activityTrendsMap.get(date) || 0) + 1)
                }
            })
            const activityTrends = Array.from(activityTrendsMap.entries())
                .map(([date, count]) => ({ date, count }))
                .sort((a, b) => a.date.localeCompare(b.date))

            // Top actions
            const actionCounts = new Map<string, number>()
            filteredLogs.forEach((log: any) => {
                const action = log.action || 'UNKNOWN'
                actionCounts.set(action, (actionCounts.get(action) || 0) + 1)
            })
            const totalActions = filteredLogs.length
            const topActions = Array.from(actionCounts.entries())
                .map(([action, count]) => ({
                    action,
                    count,
                    percentage: totalActions > 0 ? Math.round((count / totalActions) * 100) : 0,
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10)

            // Top users
            const userCounts = new Map<string, number>()
            filteredLogs.forEach((log: any) => {
                const userId = log.userId || 'UNKNOWN'
                userCounts.set(userId, (userCounts.get(userId) || 0) + 1)
            })
            const totalUsers = filteredLogs.length
            const topUsers = Array.from(userCounts.entries())
                .map(([userId, count]) => ({
                    userId,
                    count,
                    percentage: totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0,
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10)

            // Top resources
            const resourceCounts = new Map<string, number>()
            filteredLogs.forEach((log: any) => {
                const resource = log.resource || 'UNKNOWN'
                resourceCounts.set(resource, (resourceCounts.get(resource) || 0) + 1)
            })
            const totalResources = filteredLogs.length
            const topResources = Array.from(resourceCounts.entries())
                .map(([resource, count]) => ({
                    resource,
                    count,
                    percentage: totalResources > 0 ? Math.round((count / totalResources) * 100) : 0,
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10)

            // Hourly distribution
            const hourlyCounts = new Map<number, number>()
            filteredLogs.forEach((log: any) => {
                if (log.$createdAt) {
                    const hour = new Date(log.$createdAt).getHours()
                    hourlyCounts.set(hour, (hourlyCounts.get(hour) || 0) + 1)
                }
            })
            const hourlyDistribution = Array.from({ length: 24 }, (_, i) => ({
                hour: i,
                count: hourlyCounts.get(i) || 0,
            }))

            // Action distribution (all actions)
            const actionDistribution = Array.from(actionCounts.entries()).map(([action, count]) => ({
                action,
                count,
            }))

            // Security events
            const securityLogs = filteredLogs.filter((log: any) => {
                const action = log.action || ''
                const resource = log.resource || ''
                const metadata = log.metadata
                    ? typeof log.metadata === 'string'
                        ? JSON.parse(log.metadata)
                        : log.metadata
                    : {}
                return resource === 'security' || action.includes('SECURITY') || metadata.eventType === 'security'
            })

            const securityByType = new Map<string, number>()
            securityLogs.forEach((log: any) => {
                const action = log.action || 'UNKNOWN'
                securityByType.set(action, (securityByType.get(action) || 0) + 1)
            })

            const recentSecurityEvents = securityLogs
                .sort((a: any, b: any) => {
                    const dateA = new Date(a.$createdAt || 0).getTime()
                    const dateB = new Date(b.$createdAt || 0).getTime()
                    return dateB - dateA
                })
                .slice(0, 10)

            const analytics: AnalyticsData = {
                activityTrends,
                topActions,
                topUsers,
                topResources,
                hourlyDistribution,
                actionDistribution,
                securityEvents: {
                    total: securityLogs.length,
                    byType: Object.fromEntries(securityByType),
                    recent: recentSecurityEvents,
                },
                timeRange: {
                    from: cutoffDate.toISOString(),
                    to: now.toISOString(),
                },
            }

            return NextResponse.json({
                success: true,
                data: analytics,
            })
        } catch (error) {
            logger.error('Failed to get audit analytics', 'api/audit/analytics', error)
            return NextResponse.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to get analytics',
                },
                { status: 500 }
            )
        }
    },
    {
        rateLimit: 'api',
    }
)

