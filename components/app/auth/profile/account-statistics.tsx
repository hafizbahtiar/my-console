"use client"

import { useTranslation } from "@/lib/language-context"
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
  const { t } = useTranslation()

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>{t("profile.account_statistics")}</CardTitle>
        <CardDescription>
          {t("profile.account_statistics_desc")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-primary">{sessionsCount}</div>
            <div className="text-sm text-muted-foreground">{t("profile.sessions")}</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-primary">{teamsCount}</div>
            <div className="text-sm text-muted-foreground">{t("database.teams")}</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-primary">{userProfile?.loginCount || 0}</div>
            <div className="text-sm text-muted-foreground">{t("profile.login_count")}</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-primary">0</div>
            <div className="text-sm text-muted-foreground">{t("profile.api_calls")}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

