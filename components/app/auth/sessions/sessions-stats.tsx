"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "@/lib/language-context"
import { Globe, Monitor, Shield } from "lucide-react"

interface SessionsStatsProps {
  totalSessions: number
  otherSessionsCount: number
}

export function SessionsStats({ totalSessions, otherSessionsCount }: SessionsStatsProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium" suppressHydrationWarning>
            {t('sessions_page.stats.total_sessions')}
          </CardTitle>
          <Globe className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{totalSessions}</div>
          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
            {t('sessions_page.stats.total_sessions_description')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium" suppressHydrationWarning>
            {t('sessions_page.stats.current_device')}
          </CardTitle>
          <Monitor className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">1</div>
          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
            {t('sessions_page.stats.current_device_description')}
          </p>
        </CardContent>
      </Card>

      <Card className="sm:col-span-2 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium" suppressHydrationWarning>
            {t('sessions_page.stats.other_sessions')}
          </CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{otherSessionsCount}</div>
          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
            {t('sessions_page.stats.other_sessions_description')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

