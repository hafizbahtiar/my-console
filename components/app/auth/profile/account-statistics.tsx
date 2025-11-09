"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "@/lib/language-context"
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
        <CardTitle suppressHydrationWarning>
          {t('profile_page.statistics.title')}
        </CardTitle>
        <CardDescription suppressHydrationWarning>
          {t('profile_page.statistics.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="text-center p-3 sm:p-4 border rounded-lg">
            <div className="text-xl sm:text-2xl font-bold text-primary">{sessionsCount}</div>
            <div className="text-xs sm:text-sm text-muted-foreground" suppressHydrationWarning>
              {t('profile_page.statistics.sessions')}
            </div>
          </div>
          <div className="text-center p-3 sm:p-4 border rounded-lg">
            <div className="text-xl sm:text-2xl font-bold text-primary">{teamsCount}</div>
            <div className="text-xs sm:text-sm text-muted-foreground" suppressHydrationWarning>
              {t('profile_page.statistics.teams')}
            </div>
          </div>
          <div className="text-center p-3 sm:p-4 border rounded-lg">
            <div className="text-xl sm:text-2xl font-bold text-primary">{userProfile?.loginCount || 0}</div>
            <div className="text-xs sm:text-sm text-muted-foreground" suppressHydrationWarning>
              {t('profile_page.statistics.login_count')}
            </div>
          </div>
          <div className="text-center p-3 sm:p-4 border rounded-lg">
            <div className="text-xl sm:text-2xl font-bold text-primary">0</div>
            <div className="text-xs sm:text-sm text-muted-foreground" suppressHydrationWarning>
              {t('profile_page.statistics.api_calls')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

