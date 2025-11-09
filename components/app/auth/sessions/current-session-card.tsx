"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useTranslation } from "@/lib/language-context"
import { CheckCircle } from "lucide-react"
import { Session, getDeviceIcon, formatDate, formatExpirationDate, getBrowserName, getDeviceName } from "./session-utils"

interface CurrentSessionCardProps {
  session: Session
}

export function CurrentSessionCard({ session }: CurrentSessionCardProps) {
  const { t } = useTranslation()

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              {getDeviceIcon(session.clientType, session.deviceModel)}
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2" suppressHydrationWarning>
                {t('sessions_page.current_session.title')}
                <Badge variant="default" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {t('active')}
                </Badge>
              </CardTitle>
              <CardDescription suppressHydrationWarning>
                {getDeviceName(session.deviceName, session.deviceModel, session.deviceBrand, t)} •
                {getBrowserName(session.clientName, session.clientEngine, t)} •
                {session.ip}
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" suppressHydrationWarning>
            {t('sessions_page.current_session.this_device')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
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
          <AccordionItem value="session-details" className="border-0">
            <AccordionTrigger className="py-2 px-0 text-sm font-medium hover:no-underline" suppressHydrationWarning>
              {t('sessions_page.current_session.session_details')}
            </AccordionTrigger>
            <AccordionContent className="px-0 pb-0">
              <div className="grid grid-cols-1 gap-3 text-xs text-muted-foreground">
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
      </CardContent>
    </Card>
  )
}

