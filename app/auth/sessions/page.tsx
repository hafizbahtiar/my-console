"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/language-context"
import { account } from "@/lib/appwrite"
import { auditLogger } from "@/lib/audit-log"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import {
  SessionsStats,
  SecurityAlert,
  NoOtherSessionsCard,
  CurrentSessionCard,
  OtherSessionsList,
  type Session
} from "@/components/app/auth/sessions"

export default function SessionsPage() {
  const { user } = useAuth()
  const { t, loading: translationLoading } = useTranslation()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [terminatingSession, setTerminatingSession] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadSessions()
    }
  }, [user])

  const loadSessions = async () => {
    try {
      setRefreshing(true)
      const sessionsData = await account.listSessions()
      setSessions(sessionsData.sessions || [])
    } catch (error) {
      console.error('Failed to load sessions:', error)
      toast.error(t('sessions_page.failed_to_load'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const terminateSession = async (sessionId: string) => {
    if (!user) return

    try {
      setTerminatingSession(sessionId)
      await account.deleteSession({ sessionId })

      // Log the session termination
      await auditLogger.logSecurityEvent(
        user.$id,
        'SESSION_TERMINATED',
        {
          terminatedSessionId: sessionId,
          terminatedBy: 'user',
          timestamp: new Date().toISOString()
        }
      )

      // Remove from local state
      setSessions(prev => prev.filter(session => session.$id !== sessionId))
      toast.success(t('sessions_page.session_terminated_success'))
    } catch (error: any) {
      console.error('Failed to terminate session:', error)
      toast.error(error.message || t('sessions_page.session_terminated_failed'))
    } finally {
      setTerminatingSession(null)
    }
  }

  const terminateAllOtherSessions = async () => {
    if (!user) return

    try {
      setTerminatingSession('all')
      await account.deleteSessions()

      // Update session manager
      try {
        const { getSessionManager } = await import('@/lib/session-manager')
        const manager = getSessionManager()
        manager.clear()
        // Re-initialize with current session
        await manager.initialize()
      } catch (error) {
        // Session manager update is optional
        console.warn('Failed to update session manager:', error)
      }

      // Log the mass session termination
      await auditLogger.logSecurityEvent(
        user.$id,
        'ALL_SESSIONS_TERMINATED',
        {
          terminatedBy: 'user',
          timestamp: new Date().toISOString()
        }
      )

      // Keep only current session
      setSessions(prev => prev.filter(session => session.current))
      toast.success(t('sessions_page.all_sessions_terminated_success'))
    } catch (error: any) {
      console.error('Failed to terminate sessions:', error)
      toast.error(error.message || t('sessions_page.all_sessions_terminated_failed'))
    } finally {
      setTerminatingSession(null)
    }
  }

  // Show skeleton while translations or sessions data is loading
  if (translationLoading || loading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-80" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Alert Skeleton */}
        <Skeleton className="h-16 w-full rounded-lg" />

        {/* Current Session Skeleton */}
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>

        {/* Stats Skeleton */}
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const currentSession = sessions.find(session => session.current)
  const otherSessions = sessions.filter(session => !session.current)

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" suppressHydrationWarning>
            {t('sessions_page.title')}
          </h1>
          <p className="text-muted-foreground" suppressHydrationWarning>
            {t('sessions_page.description')}
          </p>
        </div>
        <Button onClick={loadSessions} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          <span suppressHydrationWarning>{t('refresh')}</span>
        </Button>
      </div>

      {/* Security Alert */}
      <SecurityAlert otherSessionsCount={otherSessions.length} />

      {/* Current Session */}
      {currentSession && (
        <CurrentSessionCard session={currentSession} />
      )}

      {/* Other Sessions */}
      <OtherSessionsList
        sessions={otherSessions}
        onTerminateSession={terminateSession}
        onTerminateAll={terminateAllOtherSessions}
        terminatingSession={terminatingSession}
      />

      {/* No Other Sessions */}
      {sessions.length === 1 && currentSession && (
        <NoOtherSessionsCard />
      )}

      {/* Session Statistics */}
      <SessionsStats
        totalSessions={sessions.length}
        otherSessionsCount={otherSessions.length}
      />
    </div>
  )
}
