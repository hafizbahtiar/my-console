"use client"

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
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Total Logs</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="text-xl sm:text-2xl font-bold">{totalLogs}</div>
          <p className="text-xs text-muted-foreground mt-1">
            All audit log entries
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Today's Logs</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="text-xl sm:text-2xl font-bold">{todaysLogs}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Logs created today
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Security Events</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="text-xl sm:text-2xl font-bold">{securityEvents}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Security-related events
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
