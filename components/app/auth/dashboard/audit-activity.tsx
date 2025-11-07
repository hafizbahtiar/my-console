"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { auditLogger } from "@/lib/audit-log"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Clock,
  Database,
  Shield,
  User,
  Settings,
  Activity,
  ArrowRight,
  Loader2,
  Info
} from "lucide-react"
import Link from "next/link"

interface AuditLog {
  $id: string
  userId: string
  action: string
  resource: string
  resourceId?: string
  oldValues?: string
  newValues?: string
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  metadata?: string
  $createdAt: string
}

export function AuditActivity() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [hasFetched, setHasFetched] = useState(false)

  useEffect(() => {
    if (!hasFetched) {
      loadRecentAuditLogs()
      setHasFetched(true)
    }
  }, [hasFetched])

  const loadRecentAuditLogs = async () => {
    try {
      setLoading(true)
      // Get recent logs (limit to 8 for dashboard)
      const { logs } = await auditLogger.getRecentLogs(8)
      setLogs(logs || [])
    } catch (error) {
      console.error('Failed to load recent audit logs:', error)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'USER_LOGIN': return <Shield className="h-4 w-4 text-green-600" />
      case 'USER_LOGOUT': return <Shield className="h-4 w-4 text-orange-600" />
      case 'PROFILE_UPDATE': return <User className="h-4 w-4 text-blue-600" />
      case 'SETTINGS_CHANGE': return <Settings className="h-4 w-4 text-purple-600" />
      case 'SECURITY_EVENT': return <Shield className="h-4 w-4 text-red-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getActionBadgeVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (action) {
      case 'USER_LOGIN': return 'default'
      case 'USER_LOGOUT': return 'secondary'
      case 'PROFILE_UPDATE': return 'default'
      case 'SETTINGS_CHANGE': return 'outline'
      case 'SECURITY_EVENT': return 'destructive'
      default: return 'secondary'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getActionDescription = (log: AuditLog) => {
    switch (log.action) {
      case 'USER_LOGIN':
        return 'Logged into the system'
      case 'USER_LOGOUT':
        return 'Logged out of the system'
      case 'PROFILE_UPDATE':
        return 'Updated profile information'
      case 'SETTINGS_CHANGE':
        return 'Changed account settings'
      case 'SECURITY_EVENT':
        return 'Security-related action'
      default:
        return `${log.action.replace('_', ' ')} on ${log.resource}`
    }
  }

  const getChangeSummary = (log: AuditLog) => {
    if (!log.newValues) return 'Updated settings'

    try {
      const newData = JSON.parse(log.newValues)

      if (log.action === 'PROFILE_UPDATE') {
        if (newData.name) return `Name changed to: ${newData.name}`
        return 'Profile information updated'
      }

      // Settings changes are no longer audited as they are user preferences
    } catch {
      return 'Settings updated'
    }

    return 'Information updated'
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest system activities and audit events
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild className="shrink-0">
            <Link href="/auth/audit" className="flex items-center gap-1">
              View All
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading activity...</p>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <Alert className="border-dashed">
            <Database className="h-4 w-4" />
            <AlertDescription className="text-center">
              <div className="font-medium mb-1">No Recent Activity</div>
              <div className="text-xs text-muted-foreground">
                Activity logs will appear here as you use the system
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-4">
              {logs.map((log, index) => (
                <div key={log.$id} className="group">
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-all duration-200 border border-transparent hover:border-border/50">
                    <Avatar className="h-8 w-8 ring-1 ring-border/20 group-hover:ring-border/40 transition-all">
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        {getActionIcon(log.action)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Header with action and timestamp */}
                      <div className="flex items-center justify-between">
                        <Badge
                          variant={getActionBadgeVariant(log.action)}
                          className="text-xs px-2 py-1 font-medium"
                        >
                          {log.action.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-medium">
                          {formatTimestamp(log.$createdAt)}
                        </span>
                      </div>

                      {/* Main description */}
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground leading-tight">
                          {getActionDescription(log)}
                        </p>

                        {/* Resource and ID info */}
                        {log.resourceId && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs px-2 py-0.5 h-auto">
                              {log.resource}
                            </Badge>
                            <code className="text-xs bg-muted px-2 py-1 rounded font-mono text-muted-foreground">
                              {log.resourceId.slice(0, 12)}...
                            </code>
                          </div>
                        )}

                        {/* Additional context for profile/settings changes */}
                        {(log.action === 'PROFILE_UPDATE' || log.action === 'SETTINGS_CHANGE') && log.newValues && (
                          <Alert className="border-l-2 border-l-primary/50 py-2 px-3">
                            <Info className="h-3 w-3" />
                            <AlertDescription className="text-xs">
                              {getChangeSummary(log)}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  </div>
                  {index < logs.length - 1 && <Separator className="my-2" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="mt-6 pt-4 border-t border-border/50">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href="/auth/audit" className="flex items-center justify-center gap-2">
              <Database className="h-4 w-4" />
              <span>View All Audit Logs</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
