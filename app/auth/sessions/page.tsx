"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
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
      toast.error("Failed to load sessions")
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
      toast.success("Session terminated successfully")
    } catch (error: any) {
      console.error('Failed to terminate session:', error)
      toast.error(error.message || "Failed to terminate session")
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
      toast.success("All other sessions terminated successfully")
    } catch (error: any) {
      console.error('Failed to terminate sessions:', error)
      toast.error(error.message || "Failed to terminate all sessions")
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
        ? `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
        : `in ${Math.abs(diffInMinutes)} minute${Math.abs(diffInMinutes) !== 1 ? 's' : ''}`
    } else if (diffInHours < 24) {
      return diffInHours >= 0
        ? `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`
        : `in ${Math.abs(diffInHours)} hour${Math.abs(diffInHours) !== 1 ? 's' : ''}`
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
      return "Expired"
    } else if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
      return `in ${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''}`
    } else if (diffInHours < 24) {
      return `in ${diffInHours} hour${diffInHours !== 1 ? 's' : ''}`
    } else if (diffInDays < 7) {
      return `in ${diffInDays} day${diffInDays !== 1 ? 's' : ''}`
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
      return { status: 'Active', color: 'bg-green-500', textColor: 'text-green-700' }
    } else if (expireDate < now) {
      return { status: 'Expired', color: 'bg-red-500', textColor: 'text-red-700' }
    } else {
      const diffInDays = Math.floor((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (diffInDays < 1) {
        return { status: 'Expiring Soon', color: 'bg-yellow-500', textColor: 'text-yellow-700' }
      } else {
        return { status: 'Active', color: 'bg-blue-500', textColor: 'text-blue-700' }
      }
    }
  }

  const getBrowserName = (clientName: string, clientEngine?: string) => {
    if (clientName) return clientName
    if (clientEngine) return clientEngine
    return "Unknown Browser"
  }

  const getDeviceName = (deviceName: string, deviceModel?: string, deviceBrand?: string) => {
    if (deviceName) return deviceName
    if (deviceBrand && deviceModel) return `${deviceBrand} ${deviceModel}`
    if (deviceModel) return deviceModel
    return "Unknown Device"
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Active Sessions</h1>
          <p className="text-muted-foreground">Loading sessions...</p>
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
    <div className="flex-1 space-y-4 p-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Active Sessions</h1>
          <p className="text-muted-foreground">
            Manage and monitor your active sessions
          </p>
        </div>
        <Button onClick={loadSessions} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Security Alert */}
      {otherSessions.length > 3 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {otherSessions.length} active sessions on other devices. Review them for security.
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
                    Current Session
                    <Badge variant="default" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {getDeviceName(currentSession.deviceName, currentSession.deviceModel, currentSession.deviceBrand)} •
                    {getBrowserName(currentSession.clientName, currentSession.clientEngine)} •
                    {currentSession.ip}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary">This Device</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Started:</span>
                <div className="font-medium">{formatDate(currentSession.$createdAt)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Expires:</span>
                <div className="font-medium">{formatExpirationDate(currentSession.expire)}</div>
              </div>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="session-details" className="border-0">
                <AccordionTrigger className="py-2 px-0 text-sm font-medium hover:no-underline">
                  Session Details
                </AccordionTrigger>
                <AccordionContent className="px-0 pb-0">
                  <div className="grid grid-cols-1 gap-3 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>IP Address:</span>
                      <span className="font-mono">{currentSession.ip}</span>
                    </div>
                    {currentSession.countryName && (
                      <div className="flex justify-between">
                        <span>Location:</span>
                        <span>{currentSession.countryName}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Provider:</span>
                      <span>{currentSession.provider}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Client Type:</span>
                      <span>{currentSession.clientType}</span>
                    </div>
                    {currentSession.osName && (
                      <div className="flex justify-between">
                        <span>Operating System:</span>
                        <span>{currentSession.osName} {currentSession.osVersion}</span>
                      </div>
                    )}
                    {currentSession.clientVersion && (
                      <div className="flex justify-between">
                        <span>Client Version:</span>
                        <span>{currentSession.clientVersion}</span>
                      </div>
                    )}
                    {currentSession.deviceName && (
                      <div className="flex justify-between">
                        <span>Device Name:</span>
                        <span>{currentSession.deviceName}</span>
                      </div>
                    )}
                    {currentSession.deviceBrand && (
                      <div className="flex justify-between">
                        <span>Device Brand:</span>
                        <span>{currentSession.deviceBrand}</span>
                      </div>
                    )}
                    {currentSession.clientName && (
                      <div className="flex justify-between">
                        <span>Browser:</span>
                        <span>{currentSession.clientName} {currentSession.clientVersion}</span>
                      </div>
                    )}
                    {currentSession.clientEngine && (
                      <div className="flex justify-between">
                        <span>Engine:</span>
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
                <CardTitle>Other Sessions ({otherSessions.length})</CardTitle>
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
                  Terminate All
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
                                  <span className="text-muted-foreground">Started:</span>
                                  <div className="font-medium">{formatDate(session.$createdAt)}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Expires:</span>
                                  <div className="font-medium">{formatExpirationDate(session.expire)}</div>
                                </div>
                              </div>

                              <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value={`session-${session.$id}`} className="border-0">
                                  <AccordionTrigger className="py-1 px-0 text-xs hover:no-underline">
                                    More Details
                                  </AccordionTrigger>
                                  <AccordionContent className="px-0 pb-0">
                                    <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
                                      <div className="flex justify-between">
                                        <span>IP Address:</span>
                                        <span className="font-mono">{session.ip}</span>
                                      </div>
                                      {session.countryName && (
                                        <div className="flex justify-between">
                                          <span>Location:</span>
                                          <span>{session.countryName}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between">
                                        <span>Provider:</span>
                                        <span>{session.provider}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Client Type:</span>
                                        <span>{session.clientType}</span>
                                      </div>
                                      {session.osName && (
                                        <div className="flex justify-between">
                                          <span>Operating System:</span>
                                          <span>{session.osName} {session.osVersion}</span>
                                        </div>
                                      )}
                                      {session.clientVersion && (
                                        <div className="flex justify-between">
                                          <span>Client Version:</span>
                                          <span>{session.clientVersion}</span>
                                        </div>
                                      )}
                                      {session.deviceName && (
                                        <div className="flex justify-between">
                                          <span>Device Name:</span>
                                          <span>{session.deviceName}</span>
                                        </div>
                                      )}
                                      {session.deviceBrand && (
                                        <div className="flex justify-between">
                                          <span>Device Brand:</span>
                                          <span>{session.deviceBrand}</span>
                                        </div>
                                      )}
                                      {session.clientName && (
                                        <div className="flex justify-between">
                                          <span>Browser:</span>
                                          <span>{session.clientName} {session.clientVersion}</span>
                                        </div>
                                      )}
                                      {session.clientEngine && (
                                        <div className="flex justify-between">
                                          <span>Engine:</span>
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
                            Terminate
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
            <h3 className="text-lg font-semibold mb-2">Your Account is Secure</h3>
            <p className="text-muted-foreground text-center max-w-md">
              You only have one active session. Your account is well protected.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Session Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
            <p className="text-xs text-muted-foreground">
              All active sessions across devices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Device</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              This device
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Other Sessions</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{otherSessions.length}</div>
            <p className="text-xs text-muted-foreground">
              Additional active sessions
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
