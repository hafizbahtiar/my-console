"use client"

import { useTranslation } from "@/lib/language-context"
import { AppearanceSettings, NotificationSettings, SecuritySettings, ConnectionTest } from "@/components/app/auth/settings"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
  const { t, loading } = useTranslation()

  // Show skeleton while translations are loading
  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6">
        <div>
          <Skeleton className="h-9 w-32 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>

        <div className="grid gap-6">
          {/* Appearance Settings Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-10 w-32" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-10 w-40" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-10 w-40" />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-3 w-64" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-11 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-64" />
                <Skeleton className="h-9 w-32" />
              </div>
            </CardContent>
          </Card>

          {/* Connection Test Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-36 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-10 w-48" />
              </div>
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-full" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" suppressHydrationWarning>
          {t('settings_page.title')}
        </h1>
        <p className="text-muted-foreground" suppressHydrationWarning>
          {t('settings_page.description')}
        </p>
      </div>

      <div className="grid gap-6">
        <AppearanceSettings />
        <NotificationSettings />
        <SecuritySettings />
        <ConnectionTest />
      </div>
    </div>
  )
}
