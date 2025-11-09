"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslation } from "@/lib/language-context"
import { auditLogger } from "@/lib/audit-log"
import { Session, getDeviceIcon, formatDate, formatExpirationDate, getSessionStatus, getBrowserName, getDeviceName } from "./session-utils"
import { SessionActivityTimeline } from "./session-activity-timeline"
import { Monitor, Smartphone, Tablet, MapPin, Globe, Calendar, Clock, Shield, Info } from "lucide-react"

interface SessionDetailsModalProps {
  session: Session | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SessionDetailsModal({ session, open, onOpenChange }: SessionDetailsModalProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)

  if (!session) return null

  const sessionStatus = getSessionStatus(session, t)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" suppressHydrationWarning>
            <Shield className="h-5 w-5" />
            {t('sessions_page.details.title')}
          </DialogTitle>
          <DialogDescription suppressHydrationWarning>
            {t('sessions_page.details.description')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            {/* Session Overview */}
            <div className="space-y-4">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-muted shrink-0">
                  {getDeviceIcon(session.clientType, session.deviceModel)}
                </div>
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base sm:text-lg font-semibold truncate">
                      {getDeviceName(session.deviceName, session.deviceModel, session.deviceBrand, t)}
                    </h3>
                    <Badge
                      variant="outline"
                      className={`text-xs ${sessionStatus.textColor} border-current shrink-0`}
                    >
                      <div className={`w-2 h-2 rounded-full ${sessionStatus.color} mr-1`} />
                      {sessionStatus.status}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground break-words">
                    {getBrowserName(session.clientName, session.clientEngine, t)}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Session Information */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2" suppressHydrationWarning>
                <Info className="h-4 w-4" />
                {t('sessions_page.details.session_info')}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-xs sm:text-sm text-muted-foreground" suppressHydrationWarning>
                    {t('sessions_page.details.session_id')}
                  </p>
                  <p className="text-xs sm:text-sm font-mono break-all">{session.$id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground" suppressHydrationWarning>
                    {t('sessions_page.details.status')}
                  </p>
                  <Badge variant="outline" className={`text-xs ${sessionStatus.textColor}`}>
                    {sessionStatus.status}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1" suppressHydrationWarning>
                    <Calendar className="h-3 w-3" />
                    {t('sessions_page.details.created')}
                  </p>
                  <p className="text-xs sm:text-sm">{formatDate(session.$createdAt, t)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1" suppressHydrationWarning>
                    <Clock className="h-3 w-3" />
                    {t('sessions_page.details.expires')}
                  </p>
                  <p className="text-xs sm:text-sm">{formatExpirationDate(session.expire, t)}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Device Information */}
            <div className="space-y-4">
              <h4 className="font-semibold" suppressHydrationWarning>
                {t('sessions_page.details.device_info')}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {session.deviceName && (
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm text-muted-foreground" suppressHydrationWarning>
                      {t('sessions_page.current_session.device_name')}
                    </p>
                    <p className="text-xs sm:text-sm">{session.deviceName}</p>
                  </div>
                )}
                {session.deviceBrand && (
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm text-muted-foreground" suppressHydrationWarning>
                      {t('sessions_page.current_session.device_brand')}
                    </p>
                    <p className="text-xs sm:text-sm">{session.deviceBrand}</p>
                  </div>
                )}
                {session.deviceModel && (
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm text-muted-foreground" suppressHydrationWarning>
                      {t('sessions_page.details.model')}
                    </p>
                    <p className="text-xs sm:text-sm">{session.deviceModel}</p>
                  </div>
                )}
                {session.osName && (
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm text-muted-foreground" suppressHydrationWarning>
                      {t('sessions_page.current_session.operating_system')}
                    </p>
                    <p className="text-xs sm:text-sm">{session.osName} {session.osVersion}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Browser/Client Information */}
            <div className="space-y-4">
              <h4 className="font-semibold" suppressHydrationWarning>
                {t('sessions_page.details.browser_info')}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {session.clientName && (
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm text-muted-foreground" suppressHydrationWarning>
                      {t('sessions_page.current_session.browser')}
                    </p>
                    <p className="text-xs sm:text-sm">{session.clientName} {session.clientVersion}</p>
                  </div>
                )}
                {session.clientEngine && (
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm text-muted-foreground" suppressHydrationWarning>
                      {t('sessions_page.current_session.engine')}
                    </p>
                    <p className="text-xs sm:text-sm">{session.clientEngine} {session.clientEngineVersion}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground" suppressHydrationWarning>
                    {t('sessions_page.current_session.client_type')}
                  </p>
                  <p className="text-xs sm:text-sm">{session.clientType}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Location Information */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2" suppressHydrationWarning>
                <MapPin className="h-4 w-4" />
                {t('sessions_page.details.location_info')}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1" suppressHydrationWarning>
                    <Globe className="h-3 w-3" />
                    {t('sessions_page.current_session.ip_address')}
                  </p>
                  <p className="text-xs sm:text-sm font-mono break-all">{session.ip}</p>
                </div>
                {session.countryName && (
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm text-muted-foreground" suppressHydrationWarning>
                      {t('sessions_page.current_session.location')}
                    </p>
                    <p className="text-xs sm:text-sm">{session.countryName} {session.countryCode && `(${session.countryCode})`}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground" suppressHydrationWarning>
                    {t('sessions_page.current_session.provider')}
                  </p>
                  <p className="text-xs sm:text-sm">{session.provider}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Session Activity Timeline */}
            <div className="space-y-4">
              <h4 className="font-semibold" suppressHydrationWarning>
                {t('sessions_page.details.activity_timeline')}
              </h4>
              <SessionActivityTimeline sessionId={session.$id} />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

