"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/language-context"
import { account } from "@/lib/appwrite"
import { auditLogger } from "@/lib/audit-log"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
  const router = useRouter()
  const { user, logout } = useAuth()
  const { t, loading: translationLoading } = useTranslation()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [terminatingSession, setTerminatingSession] = useState<string | null>(null)
  const [showTerminateAllDialog, setShowTerminateAllDialog] = useState(false)

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
      setShowTerminateAllDialog(false)
      
      // Delete all other sessions
      await account.deleteSessions()

      // Log the mass session termination before logout
      try {
      await auditLogger.logSecurityEvent(
        user.$id,
        'ALL_SESSIONS_TERMINATED',
        {
          terminatedBy: 'user',
            includeCurrentSession: true,
          timestamp: new Date().toISOString()
        }
      )
      } catch (auditError) {
        console.warn('Failed to log session termination:', auditError)
      }

      // Log logout event
      try {
        await auditLogger.logUserLogout(user.$id)
      } catch (auditError) {
        console.warn('Failed to log logout audit event:', auditError)
      }

      // Logout current session
      await logout()
      
      toast.success(t('sessions_page.all_sessions_terminated_success'))
      
      // Redirect to login page
      setTimeout(() => {
        router.push('/')
      }, 500)
    } catch (error: any) {
      console.error('Failed to terminate sessions:', error)
      toast.error(error.message || t('sessions_page.all_sessions_terminated_failed'))
      setTerminatingSession(null)
    }
  }

  // Show skeleton while translations or sessions data is loading
  if (translationLoading || loading) {
    return (
      <div className="flex-1 space-y-4 p-3 sm:p-4 sm:pt-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-8 sm:h-9 w-32 sm:w-48" />
            <Skeleton className="h-4 sm:h-5 w-64 sm:w-80" />
          </div>
          <Skeleton className="h-10 w-full sm:w-32" />
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
    <div className="flex-1 space-y-4 p-3 sm:p-4 sm:pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" suppressHydrationWarning>
            {t('sessions_page.title')}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1" suppressHydrationWarning>
            {t('sessions_page.description')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadSessions} disabled={refreshing} className="w-full sm:w-auto shrink-0">
          <RefreshCw className={`h-4 w-4 mr-2 shrink-0 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="truncate" suppressHydrationWarning>{t('refresh')}</span>
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
        onTerminateAll={() => setShowTerminateAllDialog(true)}
        terminatingSession={terminatingSession}
      />

      {/* Terminate All Sessions Confirmation Dialog */}
      <AlertDialog open={showTerminateAllDialog} onOpenChange={setShowTerminateAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle suppressHydrationWarning>
              {t('sessions_page.terminate_all_dialog.title')}
            </AlertDialogTitle>
            <AlertDialogDescription suppressHydrationWarning>
              {t('sessions_page.terminate_all_dialog.description', { count: otherSessions.length.toString() })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-3">
            <AlertDialogCancel 
              onClick={() => setShowTerminateAllDialog(false)}
              className="w-full sm:w-auto order-2 sm:order-1"
              suppressHydrationWarning
            >
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={terminateAllOtherSessions}
              disabled={terminatingSession === 'all'}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto order-1 sm:order-2"
              suppressHydrationWarning
            >
              {terminatingSession === 'all' ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  <span suppressHydrationWarning>{t('sessions_page.terminate_all_dialog.terminating')}</span>
                </>
              ) : (
                <span suppressHydrationWarning>{t('sessions_page.terminate_all_dialog.confirm')}</span>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
