"use client"

import { useState } from "react"
import { useTranslation } from "@/lib/language-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Bell } from "lucide-react"

export function NotificationSettings() {
  const { t } = useTranslation()
  const [notifications, setNotifications] = useState(true)
  const [emailUpdates, setEmailUpdates] = useState(true)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" suppressHydrationWarning>
          <Bell className="h-5 w-5" />
          {t('settings_page.notifications.title')}
        </CardTitle>
        <CardDescription suppressHydrationWarning>
          {t('settings_page.notifications.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label suppressHydrationWarning>{t('settings_page.notifications.push_notifications')}</Label>
            <p className="text-sm text-muted-foreground" suppressHydrationWarning>
              {t('settings_page.notifications.push_notifications_description')}
            </p>
          </div>
          <Switch
            checked={notifications}
            onCheckedChange={setNotifications}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label suppressHydrationWarning>{t('settings_page.notifications.email_updates')}</Label>
            <p className="text-sm text-muted-foreground" suppressHydrationWarning>
              {t('settings_page.notifications.email_updates_description')}
            </p>
          </div>
          <Switch
            checked={emailUpdates}
            onCheckedChange={setEmailUpdates}
          />
        </div>
      </CardContent>
    </Card>
  )
}

