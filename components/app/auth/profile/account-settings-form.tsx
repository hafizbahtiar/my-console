"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, MapPin, Globe, Clock, Bell, Loader2 } from "lucide-react"
import { useTranslation } from "@/lib/language-context"
import { ProfileFormData } from "./types"
import { TIMEZONES } from "./timezones"

interface AccountSettingsFormProps {
  formData: ProfileFormData
  isUpdating: boolean
  onInputChange: (field: string, value: string | boolean) => void
  onSubmit: (e: React.FormEvent) => Promise<void>
}

export function AccountSettingsForm({
  formData,
  isUpdating,
  onInputChange,
  onSubmit
}: AccountSettingsFormProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" suppressHydrationWarning>
          <Edit className="h-5 w-5" />
          {t('profile_page.account_settings.title')}
        </CardTitle>
        <CardDescription suppressHydrationWarning>
          {t('profile_page.account_settings.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" suppressHydrationWarning>
              {t('profile_page.account_settings.display_name')}
            </Label>
            <Input
              id="name"
              placeholder={t('profile_page.account_settings.display_name_placeholder')}
              value={formData.name}
              onChange={(e) => onInputChange('name', e.target.value)}
              disabled={isUpdating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" suppressHydrationWarning>
              {t('profile_page.account_settings.email_address')}
            </Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder={t('profile_page.account_settings.email_placeholder')}
                value={formData.email}
                onChange={(e) => onInputChange('email', e.target.value)}
                disabled={true}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const event = new CustomEvent('openEmailChangeDialog')
                  window.dispatchEvent(event)
                }}
                className="shrink-0"
                suppressHydrationWarning
              >
                {t('profile_page.account_settings.change_email')}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio" suppressHydrationWarning>
              {t('profile_page.account_settings.bio')} <span className="text-muted-foreground">({t('optional')})</span>
            </Label>
            <Textarea
              id="bio"
              placeholder={t('profile_page.account_settings.bio_placeholder')}
              value={formData.bio}
              onChange={(e) => onInputChange('bio', e.target.value)}
              disabled={isUpdating}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
              {formData.bio.length}/500 {t('profile_page.account_settings.characters')}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location" suppressHydrationWarning>
                {t('profile_page.account_settings.location')} <span className="text-muted-foreground">({t('optional')})</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  placeholder={t('profile_page.account_settings.location_placeholder')}
                  value={formData.location}
                  onChange={(e) => onInputChange('location', e.target.value)}
                  disabled={isUpdating}
                  className="pl-10"
                  maxLength={100}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" suppressHydrationWarning>
                {t('profile_page.account_settings.website')} <span className="text-muted-foreground">({t('optional')})</span>
              </Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="website"
                  type="url"
                  placeholder={t('profile_page.account_settings.website_placeholder')}
                  value={formData.website}
                  onChange={(e) => onInputChange('website', e.target.value)}
                  disabled={isUpdating}
                  className="pl-10"
                  maxLength={255}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="timezone" suppressHydrationWarning>
                {t('profile_page.account_settings.timezone')} <span className="text-muted-foreground">({t('optional')})</span>
              </Label>
              <Select
                value={formData.timezone || ''}
                onValueChange={(value) => onInputChange('timezone', value)}
                disabled={isUpdating}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('profile_page.account_settings.timezone_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language" suppressHydrationWarning>
                {t('profile_page.account_settings.language')}
              </Label>
              <Select
                value={formData.language}
                onValueChange={(value: 'en' | 'ms') => onInputChange('language', value)}
                disabled={isUpdating}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en" suppressHydrationWarning>
                    {t('settings_page.appearance.languages.en')}
                  </SelectItem>
                  <SelectItem value="ms" suppressHydrationWarning>
                    {t('settings_page.appearance.languages.ms')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme" suppressHydrationWarning>
              {t('profile_page.account_settings.theme')}
            </Label>
            <Select
              value={formData.theme}
              onValueChange={(value: 'light' | 'dark' | 'system') => onInputChange('theme', value)}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light" suppressHydrationWarning>
                  {t('light')}
                </SelectItem>
                <SelectItem value="dark" suppressHydrationWarning>
                  {t('dark')}
                </SelectItem>
                <SelectItem value="system" suppressHydrationWarning>
                  {t('system')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="notificationsEnabled"
              checked={formData.notificationsEnabled}
              onChange={(e) => onInputChange('notificationsEnabled', e.target.checked)}
              disabled={isUpdating}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="notificationsEnabled" className="flex items-center gap-2 cursor-pointer" suppressHydrationWarning>
              <Bell className="h-4 w-4" />
              {t('profile_page.account_settings.notifications_enabled')}
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={isUpdating}>
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span suppressHydrationWarning>{t('profile_page.account_settings.updating')}</span>
              </>
            ) : (
              <span suppressHydrationWarning>{t('profile_page.account_settings.update')}</span>
            )}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t">
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold mb-2" suppressHydrationWarning>
                {t('profile_page.account_settings.danger_zone')}
              </h4>
              <p className="text-xs text-muted-foreground mb-3" suppressHydrationWarning>
                {t('profile_page.account_settings.danger_zone_description')}
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              onClick={() => {
                const event = new CustomEvent('openAccountDeletionDialog')
                window.dispatchEvent(event)
              }}
              suppressHydrationWarning
            >
              {t('profile_page.account_settings.delete_account')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

