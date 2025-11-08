"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserProfile } from "@/lib/user-profile"

interface AccountStatisticsProps {
  sessionsCount: number
  teamsCount: number
  userProfile: UserProfile | null
}

export function AccountStatistics({
  sessionsCount,
  teamsCount,
  userProfile
}: AccountStatisticsProps) {
  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Account Statistics</CardTitle>
        <CardDescription>
          Overview of your account activity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-primary">{sessionsCount}</div>
            <div className="text-sm text-muted-foreground">Sessions</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-primary">{teamsCount}</div>
            <div className="text-sm text-muted-foreground">Teams</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-primary">{userProfile?.loginCount || 0}</div>
            <div className="text-sm text-muted-foreground">Login Count</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-primary">0</div>
            <div className="text-sm text-muted-foreground">API Calls</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

