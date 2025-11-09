"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useTranslation } from "@/lib/language-context"
import { LogOut, Loader2, Trash2, Eye } from "lucide-react"
import { Session, getDeviceIcon, formatDate, formatExpirationDate, getSessionStatus, getBrowserName, getDeviceName } from "./session-utils"
import { SessionDetailsModal } from "./session-details-modal"

interface OtherSessionsListProps {
  sessions: Session[]
  onTerminateSession: (sessionId: string) => void
  onTerminateAll: () => void
  terminatingSession: string | null
}

export function OtherSessionsList({ 
  sessions, 
  onTerminateSession, 
  onTerminateAll, 
  terminatingSession 
}: OtherSessionsListProps) {
  const { t } = useTranslation()
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const handleViewDetails = (session: Session) => {
    setSelectedSession(session)
    setDetailsOpen(true)
  }

  if (sessions.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle suppressHydrationWarning>
              {t('sessions_page.other_sessions.title', { count: sessions.length.toString() })}
            </CardTitle>
            <CardDescription suppressHydrationWarning>
              {t('sessions_page.other_sessions.description')}
            </CardDescription>
          </div>
          {sessions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onTerminateAll}
              disabled={terminatingSession === 'all'}
              className="text-destructive hover:text-destructive"
            >
              {terminatingSession === 'all' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              <span suppressHydrationWarning>{t('sessions_page.other_sessions.terminate_all')}</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] w-full">
          <div className="space-y-4">
            {sessions.map((session) => {
              const sessionStatus = getSessionStatus(session, t)
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
                              {getDeviceName(session.deviceName, session.deviceModel, session.deviceBrand, t)}
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
                            {getBrowserName(session.clientName, session.clientEngine, t)} •
                            {session.countryName ? `${session.countryName} •` : ''}
                            <span className="font-mono">{session.ip}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="text-muted-foreground" suppressHydrationWarning>
                                {t('sessions_page.current_session.started')}
                              </span>
                              <div className="font-medium">{formatDate(session.$createdAt, t)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground" suppressHydrationWarning>
                                {t('sessions_page.current_session.expires')}
                              </span>
                              <div className="font-medium">{formatExpirationDate(session.expire, t)}</div>
                            </div>
                          </div>

                          <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value={`session-${session.$id}`} className="border-0">
                              <AccordionTrigger className="py-1 px-0 text-xs hover:no-underline" suppressHydrationWarning>
                                {t('sessions_page.other_sessions.more_details')}
                              </AccordionTrigger>
                              <AccordionContent className="px-0 pb-0">
                                <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
                                  <div className="flex justify-between">
                                    <span suppressHydrationWarning>{t('sessions_page.current_session.ip_address')}</span>
                                    <span className="font-mono">{session.ip}</span>
                                  </div>
                                  {session.countryName && (
                                    <div className="flex justify-between">
                                      <span suppressHydrationWarning>{t('sessions_page.current_session.location')}</span>
                                      <span>{session.countryName}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between">
                                    <span suppressHydrationWarning>{t('sessions_page.current_session.provider')}</span>
                                    <span>{session.provider}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span suppressHydrationWarning>{t('sessions_page.current_session.client_type')}</span>
                                    <span>{session.clientType}</span>
                                  </div>
                                  {session.osName && (
                                    <div className="flex justify-between">
                                      <span suppressHydrationWarning>{t('sessions_page.current_session.operating_system')}</span>
                                      <span>{session.osName} {session.osVersion}</span>
                                    </div>
                                  )}
                                  {session.clientVersion && (
                                    <div className="flex justify-between">
                                      <span suppressHydrationWarning>{t('sessions_page.current_session.client_version')}</span>
                                      <span>{session.clientVersion}</span>
                                    </div>
                                  )}
                                  {session.deviceName && (
                                    <div className="flex justify-between">
                                      <span suppressHydrationWarning>{t('sessions_page.current_session.device_name')}</span>
                                      <span>{session.deviceName}</span>
                                    </div>
                                  )}
                                  {session.deviceBrand && (
                                    <div className="flex justify-between">
                                      <span suppressHydrationWarning>{t('sessions_page.current_session.device_brand')}</span>
                                      <span>{session.deviceBrand}</span>
                                    </div>
                                  )}
                                  {session.clientName && (
                                    <div className="flex justify-between">
                                      <span suppressHydrationWarning>{t('sessions_page.current_session.browser')}</span>
                                      <span>{session.clientName} {session.clientVersion}</span>
                                    </div>
                                  )}
                                  {session.clientEngine && (
                                    <div className="flex justify-between">
                                      <span suppressHydrationWarning>{t('sessions_page.current_session.engine')}</span>
                                      <span>{session.clientEngine} {session.clientEngineVersion}</span>
                                    </div>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(session)}
                          suppressHydrationWarning
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          <span suppressHydrationWarning>{t('sessions_page.other_sessions.view_details')}</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onTerminateSession(session.$id)}
                          disabled={terminatingSession === session.$id}
                          className="text-destructive hover:text-destructive"
                        >
                          {terminatingSession === session.$id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <LogOut className="h-4 w-4 mr-2" />
                          )}
                          <span suppressHydrationWarning>{t('sessions_page.other_sessions.terminate')}</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
      
      {/* Session Details Modal */}
      <SessionDetailsModal
        session={selectedSession}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </Card>
  )
}

