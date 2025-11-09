"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "@/lib/language-context"
import { Shield } from "lucide-react"

export function NoOtherSessionsCard() {
  const { t } = useTranslation()

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Shield className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2" suppressHydrationWarning>
          {t('sessions_page.no_other_sessions.title')}
        </h3>
        <p className="text-muted-foreground text-center max-w-md" suppressHydrationWarning>
          {t('sessions_page.no_other_sessions.description')}
        </p>
      </CardContent>
    </Card>
  )
}

