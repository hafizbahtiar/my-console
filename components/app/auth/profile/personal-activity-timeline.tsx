"use client"

import { useState, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { useTranslation } from "@/lib/language-context"
import { auditLogger } from "@/lib/audit-log"
import { Activity, Clock, Shield, User, Settings, AlertTriangle, Mail, Key, RefreshCw, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface PersonalActivityTimelineProps {
  userId: string
}

interface ActivityLog {
  $id: string
  action: string
  resource: string
  severity?: string
  userId: string
  sessionId?: string
  metadata?: string
  oldValues?: string
  newValues?: string
  $createdAt: string
}

export function PersonalActivityTimeline({ userId }: PersonalActivityTimelineProps) {
  const { t } = useTranslation()
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const pageSize = 20

  useEffect(() => {
    loadUserActivities()
  }, [userId, page])

  const loadUserActivities = async () => {
    try {
      setLoading(true)
      const offset = (page - 1) * pageSize
      const result = await auditLogger.getUserAuditLogs(userId, pageSize, offset)
      
      if (page === 1) {
        setActivities(result.logs || [])
      } else {
        setActivities(prev => [...prev, ...(result.logs || [])])
      }
      
      setHasMore(result.logs.length === pageSize)
    } catch (error) {
      console.error('Failed to load user activities:', error)
      setActivities([])
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (action: string) => {
    const actionUpper = action.toUpperCase()
    
    if (actionUpper.includes('LOGIN')) {
      return <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
    }
    if (actionUpper.includes('LOGOUT')) {
      return <Shield className="h-4 w-4 text-orange-600 dark:text-orange-400" />
    }
    if (actionUpper.includes('PROFILE')) {
      return <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
    }
    if (actionUpper.includes('SETTINGS')) {
      return <Settings className="h-4 w-4 text-purple-600 dark:text-purple-400" />
    }
    if (actionUpper.includes('EMAIL') || actionUpper.includes('VERIFICATION')) {
      return <Mail className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
    }
    if (actionUpper.includes('PASSWORD') || actionUpper.includes('RESET')) {
      return <Key className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
    }
    if (actionUpper.includes('SECURITY') || actionUpper.includes('TERMINATED')) {
      return <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
    }
    return <Activity className="h-4 w-4 text-gray-600 dark:text-gray-400" />
  }

  const getActionBadgeVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    const actionUpper = action.toUpperCase()
    if (actionUpper.includes('LOGIN') || actionUpper.includes('VERIFIED')) {
      return 'default'
    }
    if (actionUpper.includes('LOGOUT')) {
      return 'secondary'
    }
    if (actionUpper.includes('PROFILE') || actionUpper.includes('SETTINGS')) {
      return 'outline'
    }
    if (actionUpper.includes('SECURITY') || actionUpper.includes('FAILED')) {
      return 'destructive'
    }
    return 'secondary'
  }

  const formatAction = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getActionDescription = (log: ActivityLog) => {
    const action = log.action.toUpperCase()
    
    if (action.includes('LOGIN')) {
      return t('profile_page.activity.login')
    }
    if (action.includes('LOGOUT')) {
      return t('profile_page.activity.logout')
    }
    if (action.includes('PROFILE_UPDATE')) {
      return t('profile_page.activity.profile_updated')
    }
    if (action.includes('EMAIL_VERIFIED')) {
      return t('profile_page.activity.email_verified')
    }
    if (action.includes('VERIFICATION_EMAIL_SENT')) {
      return t('profile_page.activity.verification_email_sent')
    }
    if (action.includes('PASSWORD_RESET')) {
      return t('profile_page.activity.password_reset')
    }
    if (action.includes('PASSWORD_RESET_REQUESTED')) {
      return t('profile_page.activity.password_reset_requested')
    }
    if (action.includes('SETTINGS_CHANGE')) {
      return t('profile_page.activity.settings_changed')
    }
    if (action.includes('SESSION_TERMINATED')) {
      return t('profile_page.activity.session_terminated')
    }
    
    return formatAction(log.action)
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return formatDistanceToNow(date, { addSuffix: true })
    } catch {
      return timestamp
    }
  }

  const displayedActivities = expanded ? activities : activities.slice(0, 5)

  if (loading && activities.length === 0) {
    return (
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle suppressHydrationWarning>{t('profile_page.activity.title')}</CardTitle>
          <CardDescription suppressHydrationWarning>
            {t('profile_page.activity.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                {t('loading')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle suppressHydrationWarning>{t('profile_page.activity.title')}</CardTitle>
          <CardDescription suppressHydrationWarning>
            {t('profile_page.activity.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Activity className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle suppressHydrationWarning>
                {t('profile_page.activity.no_activity')}
              </EmptyTitle>
              <EmptyDescription suppressHydrationWarning>
                {t('profile_page.activity.no_activity_description')}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle suppressHydrationWarning>{t('profile_page.activity.title')}</CardTitle>
            <CardDescription suppressHydrationWarning>
              {t('profile_page.activity.description')}
            </CardDescription>
          </div>
          {activities.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              suppressHydrationWarning
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  {t('profile_page.activity.show_less')}
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  {t('profile_page.activity.show_all', { count: activities.length })}
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className={expanded ? "h-[500px]" : "h-[300px]"} type="auto">
          <div className="relative pl-10 pr-2">
            {/* Main continuous timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-border via-border to-border" />
            
            <div className="space-y-0">
              {displayedActivities.map((activity, index) => (
                <div key={activity.$id} className="group relative">
                  <div className="flex gap-4 pb-8 last:pb-0">
                    {/* Timeline node container */}
                    <div className="relative flex flex-col items-center shrink-0 -ml-2">
                      {/* Timeline dot with icon */}
                      <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background border-2 border-primary/30 shadow-sm group-hover:border-primary/60 group-hover:shadow-md transition-all duration-200">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted/50 group-hover:bg-muted transition-colors">
                                {getActivityIcon(activity.action)}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs font-medium">{formatAction(activity.action)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      {/* Connector line to next item (only if not last) */}
                      {index < displayedActivities.length - 1 && (
                        <div className="absolute top-9 left-1/2 -translate-x-1/2 w-0.5 h-full bg-border" />
                      )}
                    </div>
                    
                    {/* Content card */}
                    <div className="flex-1 space-y-2 min-w-0 pt-0.5">
                      <div className="rounded-lg border border-border/50 bg-card/50 p-3 group-hover:border-border group-hover:bg-card transition-all duration-200">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold leading-tight">
                              {getActionDescription(activity)}
                            </p>
                            <Badge 
                              variant={getActionBadgeVariant(activity.action)} 
                              className="text-xs px-2 py-0.5 h-auto font-medium shrink-0"
                            >
                              {formatAction(activity.action)}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs px-2 py-0.5 h-auto capitalize font-normal">
                              {activity.resource.replace(/_/g, ' ')}
                            </Badge>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 shrink-0" />
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span suppressHydrationWarning className="cursor-help hover:text-foreground transition-colors">
                                      {formatTimestamp(activity.$createdAt)}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">
                                      {new Date(activity.$createdAt).toLocaleString()}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
        
        {expanded && hasMore && (
          <div className="mt-4 pt-4">
            <Separator className="mb-4" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(prev => prev + 1)}
              disabled={loading}
              className="w-full"
              suppressHydrationWarning
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('loading')}
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('profile_page.activity.load_more')}
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

