"use client"

import { useState, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/lib/language-context"
import { auditLogger } from "@/lib/audit-log"
import { Activity, Clock, Shield, User, Settings, AlertTriangle } from "lucide-react"

interface SessionActivityTimelineProps {
  sessionId: string
}

interface ActivityLog {
  $id: string
  action: string
  resource: string
  severity: string
  userId: string
  sessionId?: string
  metadata?: string
  $createdAt: string
}

export function SessionActivityTimeline({ sessionId }: SessionActivityTimelineProps) {
  const { t } = useTranslation()
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSessionActivities()
  }, [sessionId])

  const loadSessionActivities = async () => {
    try {
      setLoading(true)
      // Get all recent logs and filter by sessionId
      const result = await auditLogger.getRecentLogs(1000)
      const allLogs = result.logs || []
      
      // Filter logs by sessionId
      const sessionLogs = allLogs.filter((log: any) => {
        // Check if sessionId is in metadata or directly in log
        if (log.sessionId === sessionId) return true
        
        // Try to parse metadata if it's a string
        if (log.metadata) {
          try {
            const metadata = typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata
            if (metadata.sessionId === sessionId || metadata.terminatedSessionId === sessionId) {
              return true
            }
          } catch {
            // If metadata parsing fails, skip
          }
        }
        
        return false
      })

      // Sort by date (newest first)
      const sortedLogs = sessionLogs.sort((a: any, b: any) => 
        new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
      )

      setActivities(sortedLogs.slice(0, 50)) // Limit to 50 most recent
    } catch (error) {
      console.error('Failed to load session activities:', error)
      setActivities([])
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (action: string) => {
    if (action.includes('LOGIN') || action.includes('SESSION')) {
      return <Shield className="h-4 w-4 text-blue-600" />
    }
    if (action.includes('USER') || action.includes('PROFILE')) {
      return <User className="h-4 w-4 text-green-600" />
    }
    if (action.includes('SETTINGS')) {
      return <Settings className="h-4 w-4 text-purple-600" />
    }
    if (action.includes('SECURITY') || action.includes('TERMINATED')) {
      return <AlertTriangle className="h-4 w-4 text-red-600" />
    }
    return <Activity className="h-4 w-4 text-gray-600" />
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
      case 'critical':
        return <Badge variant="destructive" className="text-xs">{severity}</Badge>
      case 'medium':
      case 'warning':
        return <Badge variant="secondary" className="text-xs">{severity}</Badge>
      case 'low':
      case 'info':
        return <Badge variant="outline" className="text-xs">{severity}</Badge>
      default:
        return null
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date)
  }

  const formatAction = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm" suppressHydrationWarning>
          {t('sessions_page.details.no_activity')}
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[300px] w-full">
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={activity.$id} className="flex gap-4 relative">
            {/* Timeline line */}
            {index < activities.length - 1 && (
              <div className="absolute left-4 top-8 w-0.5 h-full bg-border" />
            )}
            
            {/* Icon */}
            <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background border-2 border-border">
              {getActivityIcon(activity.action)}
            </div>
            
            {/* Content */}
            <div className="flex-1 space-y-1 pb-4">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">
                  {formatAction(activity.action)}
                </p>
                {getSeverityBadge(activity.severity)}
              </div>
              <p className="text-xs text-muted-foreground">
                {activity.resource}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatTimestamp(activity.$createdAt)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

