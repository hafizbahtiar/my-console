"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/lib/language-context"
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
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium" suppressHydrationWarning>
            {t('audit_page.stats.total_logs')}
          </CardTitle>
          <Database className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="text-xl sm:text-2xl font-bold">{totalLogs}</div>
          <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
            {t('audit_page.stats.total_logs_description')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium" suppressHydrationWarning>
            {t('audit_page.stats.todays_logs')}
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="text-xl sm:text-2xl font-bold">{todaysLogs}</div>
          <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
            {t('audit_page.stats.todays_logs_description')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium" suppressHydrationWarning>
            {t('audit_page.stats.security_events')}
          </CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="text-xl sm:text-2xl font-bold">{securityEvents}</div>
          <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
            {t('audit_page.stats.security_events_description')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
