"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { useTranslation } from "@/lib/language-context"
import { AlertTriangle } from "lucide-react"

interface SecurityAlertProps {
  otherSessionsCount: number
}

export function SecurityAlert({ otherSessionsCount }: SecurityAlertProps) {
  const { t } = useTranslation()

  if (otherSessionsCount <= 3) {
    return null
  }

  return (
    <Alert>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription suppressHydrationWarning>
        {t('sessions_page.security_alert', { count: otherSessionsCount.toString() })}
      </AlertDescription>
    </Alert>
  )
}

