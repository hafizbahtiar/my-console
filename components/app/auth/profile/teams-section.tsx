"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "@/lib/language-context"
import { Users } from "lucide-react"
import { formatDate } from "./utils"

interface TeamsSectionProps {
  teams: any[]
}

export function TeamsSection({ teams }: TeamsSectionProps) {
  const { t } = useTranslation()

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2" suppressHydrationWarning>
          <Users className="h-5 w-5" />
          {t('profile_page.teams.title')}
        </CardTitle>
        <CardDescription suppressHydrationWarning>
          {t('profile_page.teams.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {teams.length > 0 ? (
          teams.map((team: any) => (
            <div key={team.$id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-3 border rounded-lg">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <Users className="h-4 w-4 text-blue-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{team.name}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground" suppressHydrationWarning>
                    {team.total} {team.total !== 1 ? t('profile_page.teams.members') : t('profile_page.teams.member')}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right text-xs text-muted-foreground shrink-0">
                <p suppressHydrationWarning>{t('profile_page.teams.created')}</p>
                <p>{formatDate(team.$createdAt)}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-muted-foreground py-6">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p suppressHydrationWarning>{t('profile_page.teams.no_teams')}</p>
            <p className="text-sm" suppressHydrationWarning>
              {t('profile_page.teams.no_teams_description')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

