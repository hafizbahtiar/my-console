"use client"

import { useTranslation } from "@/lib/language-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Database,
  Clock,
  User,
  Shield
} from "lucide-react"

interface AuditStatsProps {
  totalLogs: number
  todaysLogs: number
  securityEvents: number
}

export function AuditStats({ totalLogs, todaysLogs, securityEvents }: AuditStatsProps) {
  const { t } = useTranslation()

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('audit.total_logs')}</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalLogs}</div>
          <p className="text-xs text-muted-foreground">
            {t('audit.total_logs_desc')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('audit.todays_logs')}</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{todaysLogs}</div>
          <p className="text-xs text-muted-foreground">
            {t('audit.todays_logs_desc')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('audit.security_events')}</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{securityEvents}</div>
          <p className="text-xs text-muted-foreground">
            {t('audit.security_events_desc')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
