"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/language-context"
import { account } from "@/lib/appwrite"
import { auditLogger } from "@/lib/audit-log"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  Shield,
  LogOut,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"

interface Session {
  $id: string
  $createdAt: string
  $updatedAt: string
  userId: string
  expire: string
  provider: string
  providerUid: string
  providerAccessToken: string
  providerAccessTokenExpiry: string
  providerRefreshToken: string
  ip: string
  osCode: string
  osName: string
  osVersion: string
  clientType: string
  clientCode: string
  clientName: string
  clientVersion: string
  clientEngine: string
  clientEngineVersion: string
  deviceName: string
  deviceBrand: string
  deviceModel: string
  countryCode: string
  countryName: string
  current: boolean
}

export default function SessionsPage() {
  const { user } = useAuth()
  const { t } = useTranslation()
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
      toast.error(t('sessions.failed_load_sessions'))
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
      toast.success(t('sessions.session_terminated'))
    } catch (error: any) {
      console.error('Failed to terminate session:', error)
      toast.error(error.message || t('sessions.failed_terminate'))
    } finally {
      setTerminatingSession(null)
    }
  }

  const terminateAllOtherSessions = async () => {
    if (!user) return

    try {
      setTerminatingSession('all')
      await account.deleteSessions()

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
      toast.success(t('sessions.all_sessions_terminated'))
    } catch (error: any) {
      console.error('Failed to terminate sessions:', error)
      toast.error(error.message || t('sessions.failed_terminate_all'))
    } finally {
      setTerminatingSession(null)
    }
  }

  const getDeviceIcon = (clientType: string, deviceModel?: string) => {
    if (clientType === 'browser') {
      return <Monitor className="h-5 w-5" />
    }
    if (deviceModel?.toLowerCase().includes('phone') || clientType === 'phone') {
      return <Smartphone className="h-5 w-5" />
    }
    if (deviceModel?.toLowerCase().includes('tablet') || clientType === 'tablet') {
      return <Tablet className="h-5 w-5" />
    }
    return <Monitor className="h-5 w-5" />
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return diffInMinutes >= 0
        ? t('sessions.minutes_ago', { count: diffInMinutes.toString() })
        : t('sessions.in_minutes', { count: Math.abs(diffInMinutes).toString() })
    } else if (diffInHours < 24) {
      return diffInHours >= 0
        ? t('sessions.hours_ago', { count: diffInHours.toString() })
        : t('sessions.in_hours', { count: Math.abs(diffInHours).toString() })
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const formatExpirationDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = date.getTime() - now.getTime()
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInMs < 0) {
      return t('sessions.expired')
    } else if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
      return t('sessions.in_minutes', { count: diffInMinutes.toString() })
    } else if (diffInHours < 24) {
      return t('sessions.in_hours', { count: diffInHours.toString() })
    } else if (diffInDays < 7) {
      return t('sessions.in_days', { count: diffInDays.toString() })
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const getSessionStatus = (session: Session) => {
    const now = new Date()
    const expireDate = new Date(session.expire)

    if (session.current) {
      return { status: t('active'), color: 'bg-green-500', textColor: 'text-green-700' }
    } else if (expireDate < now) {
      return { status: t('sessions.expired'), color: 'bg-red-500', textColor: 'text-red-700' }
    } else {
      const diffInDays = Math.floor((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (diffInDays < 1) {
        return { status: t('sessions.expiring_soon'), color: 'bg-yellow-500', textColor: 'text-yellow-700' }
      } else {
        return { status: t('active'), color: 'bg-blue-500', textColor: 'text-blue-700' }
      }
    }
  }

  const getBrowserName = (clientName: string, clientEngine?: string) => {
    if (clientName) return clientName
    if (clientEngine) return clientEngine
    return t('sessions.unknown_browser')
  }

  const getDeviceName = (deviceName: string, deviceModel?: string, deviceBrand?: string) => {
    if (deviceName) return deviceName
    if (deviceBrand && deviceModel) return `${deviceBrand} ${deviceModel}`
    if (deviceModel) return deviceModel
    return t('sessions.unknown_device')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("sessions.active_sessions")}</h1>
          <p className="text-muted-foreground">{t("sessions.loading_sessions")}</p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  const currentSession = sessions.find(session => session.current)
  const otherSessions = sessions.filter(session => !session.current)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("sessions.active_sessions")}</h1>
          <p className="text-muted-foreground">
            {t("sessions.manage_sessions")}
          </p>
        </div>
        <Button onClick={loadSessions} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {t("sessions.refresh")}
        </Button>
      </div>

      {/* Security Alert */}
      {otherSessions.length > 3 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t("sessions.security_alert", { count: otherSessions.length.toString() })}
          </AlertDescription>
        </Alert>
      )}

      {/* Current Session */}
      {currentSession && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  {getDeviceIcon(currentSession.clientType, currentSession.deviceModel)}
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {t("sessions.current_session")}
                    <Badge variant="default" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {t("active")}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {getDeviceName(currentSession.deviceName, currentSession.deviceModel, currentSession.deviceBrand)} •
                    {getBrowserName(currentSession.clientName, currentSession.clientEngine)} •
                    {currentSession.ip}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary">{t("sessions.this_device")}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t("sessions.started")}:</span>
                <div className="font-medium">{formatDate(currentSession.$createdAt)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">{t("sessions.expires")}:</span>
                <div className="font-medium">{formatExpirationDate(currentSession.expire)}</div>
              </div>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="session-details" className="border-0">
                <AccordionTrigger className="py-2 px-0 text-sm font-medium hover:no-underline">
                  {t("sessions.session_details")}
                </AccordionTrigger>
                <AccordionContent className="px-0 pb-0">
                  <div className="grid grid-cols-1 gap-3 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>{t("sessions.ip_address")}:</span>
                      <span className="font-mono">{currentSession.ip}</span>
                    </div>
                    {currentSession.countryName && (
                      <div className="flex justify-between">
                        <span>{t("sessions.location")}:</span>
                        <span>{currentSession.countryName}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>{t("sessions.provider")}:</span>
                      <span>{currentSession.provider}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("sessions.client_type")}:</span>
                      <span>{currentSession.clientType}</span>
                    </div>
                    {currentSession.osName && (
                      <div className="flex justify-between">
                        <span>{t("sessions.operating_system")}:</span>
                        <span>{currentSession.osName} {currentSession.osVersion}</span>
                      </div>
                    )}
                    {currentSession.clientVersion && (
                      <div className="flex justify-between">
                        <span>{t("sessions.client_version")}:</span>
                        <span>{currentSession.clientVersion}</span>
                      </div>
                    )}
                    {currentSession.deviceName && (
                      <div className="flex justify-between">
                        <span>{t("sessions.device_name")}:</span>
                        <span>{currentSession.deviceName}</span>
                      </div>
                    )}
                    {currentSession.deviceBrand && (
                      <div className="flex justify-between">
                        <span>{t("sessions.device_brand")}:</span>
                        <span>{currentSession.deviceBrand}</span>
                      </div>
                    )}
                    {currentSession.clientName && (
                      <div className="flex justify-between">
                        <span>{t("sessions.browser")}:</span>
                        <span>{currentSession.clientName} {currentSession.clientVersion}</span>
                      </div>
                    )}
                    {currentSession.clientEngine && (
                      <div className="flex justify-between">
                        <span>{t("sessions.engine")}:</span>
                        <span>{currentSession.clientEngine} {currentSession.clientEngineVersion}</span>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Other Sessions */}
      {otherSessions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("sessions.other_sessions")} ({otherSessions.length})</CardTitle>
                <CardDescription>
                  Sessions from other devices and browsers
                </CardDescription>
              </div>
              {otherSessions.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={terminateAllOtherSessions}
                  disabled={terminatingSession === 'all'}
                  className="text-destructive hover:text-destructive"
                >
                  {terminatingSession === 'all' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  {t("sessions.terminate_all")}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] w-full">
              <div className="space-y-4">
                {otherSessions.map((session) => {
                  const sessionStatus = getSessionStatus(session)
                  return (
                    <Card key={session.$id} className="relative">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                              {getDeviceIcon(session.clientType, session.deviceModel)}
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">
                                  {getDeviceName(session.deviceName, session.deviceModel, session.deviceBrand)}
                                </h4>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${sessionStatus.textColor} border-current`}
                                >
                                  <div className={`w-2 h-2 rounded-full ${sessionStatus.color} mr-1`} />
                                  {sessionStatus.status}
                                </Badge>
                              </div>

                              <div className="text-sm text-muted-foreground">
                                {getBrowserName(session.clientName, session.clientEngine)} •
                                {session.countryName ? `${session.countryName} •` : ''}
                                <span className="font-mono">{session.ip}</span>
                              </div>

                              <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                  <span className="text-muted-foreground">{t("sessions.started")}:</span>
                                  <div className="font-medium">{formatDate(session.$createdAt)}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">{t("sessions.expires")}:</span>
                                  <div className="font-medium">{formatExpirationDate(session.expire)}</div>
                                </div>
                              </div>

                              <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value={`session-${session.$id}`} className="border-0">
                                  <AccordionTrigger className="py-1 px-0 text-xs hover:no-underline">
                                    {t("sessions.more_details")}
                                  </AccordionTrigger>
                                  <AccordionContent className="px-0 pb-0">
                                    <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
                                      <div className="flex justify-between">
                                        <span>{t("sessions.ip_address")}:</span>
                                        <span className="font-mono">{session.ip}</span>
                                      </div>
                                      {session.countryName && (
                                        <div className="flex justify-between">
                                          <span>{t("sessions.location")}:</span>
                                          <span>{session.countryName}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between">
                                        <span>{t("sessions.provider")}:</span>
                                        <span>{session.provider}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>{t("sessions.client_type")}:</span>
                                        <span>{session.clientType}</span>
                                      </div>
                                      {session.osName && (
                                        <div className="flex justify-between">
                                          <span>{t("sessions.operating_system")}:</span>
                                          <span>{session.osName} {session.osVersion}</span>
                                        </div>
                                      )}
                                      {session.clientVersion && (
                                        <div className="flex justify-between">
                                          <span>{t("sessions.client_version")}:</span>
                                          <span>{session.clientVersion}</span>
                                        </div>
                                      )}
                                      {session.deviceName && (
                                        <div className="flex justify-between">
                                          <span>{t("sessions.device_name")}:</span>
                                          <span>{session.deviceName}</span>
                                        </div>
                                      )}
                                      {session.deviceBrand && (
                                        <div className="flex justify-between">
                                          <span>{t("sessions.device_brand")}:</span>
                                          <span>{session.deviceBrand}</span>
                                        </div>
                                      )}
                                      {session.clientName && (
                                        <div className="flex justify-between">
                                          <span>{t("sessions.browser")}:</span>
                                          <span>{session.clientName} {session.clientVersion}</span>
                                        </div>
                                      )}
                                      {session.clientEngine && (
                                        <div className="flex justify-between">
                                          <span>{t("sessions.engine")}:</span>
                                          <span>{session.clientEngine} {session.clientEngineVersion}</span>
                                        </div>
                                      )}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => terminateSession(session.$id)}
                            disabled={terminatingSession === session.$id}
                            className="text-destructive hover:text-destructive ml-4"
                          >
                            {terminatingSession === session.$id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <LogOut className="h-4 w-4 mr-2" />
                            )}
                            {t("sessions.terminate")}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* No Other Sessions */}
      {sessions.length === 1 && currentSession && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("sessions.secure_protected")}</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {t("sessions.single_session")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Session Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("sessions.total_sessions")}</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
            <p className="text-xs text-muted-foreground">
              {t("sessions.total_sessions_desc")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("sessions.current_device")}</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              {t("sessions.this_device")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("sessions.other_sessions")}</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{otherSessions.length}</div>
            <p className="text-xs text-muted-foreground">
              {t("sessions.additional_sessions")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
