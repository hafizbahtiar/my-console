"use client"

import { useTranslation } from "@/lib/language-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, MapPin, Globe, Clock, Bell, Loader2 } from "lucide-react"
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
        <CardTitle className="flex items-center gap-2">
          <Edit className="h-5 w-5" />
          {t("profile.account_settings")}
        </CardTitle>
        <CardDescription>
          {t("profile.account_settings_desc")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("profile.display_name")}</Label>
            <Input
              id="name"
              placeholder={t("profile.name_placeholder")}
              value={formData.name}
              onChange={(e) => onInputChange('name', e.target.value)}
              disabled={isUpdating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("profile.email_address")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("profile.email_placeholder")}
              value={formData.email}
              onChange={(e) => onInputChange('email', e.target.value)}
              disabled={true}
            />
            <p className="text-xs text-muted-foreground">
              {t("profile.email_change_note")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">
              {t("profile.bio")} <span className="text-muted-foreground">({t("general_use.optional")})</span>
            </Label>
            <Textarea
              id="bio"
              placeholder={t("profile.bio_placeholder")}
              value={formData.bio}
              onChange={(e) => onInputChange('bio', e.target.value)}
              disabled={isUpdating}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {formData.bio.length}/500 {t("general_use.characters")}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location">
                {t("profile.location")} <span className="text-muted-foreground">({t("general_use.optional")})</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  placeholder={t("profile.location_placeholder")}
                  value={formData.location}
                  onChange={(e) => onInputChange('location', e.target.value)}
                  disabled={isUpdating}
                  className="pl-10"
                  maxLength={100}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">
                {t("profile.website")} <span className="text-muted-foreground">({t("general_use.optional")})</span>
              </Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="website"
                  type="url"
                  placeholder={t("profile.website_placeholder")}
                  value={formData.website}
                  onChange={(e) => onInputChange('website', e.target.value)}
                  disabled={isUpdating}
                  className="pl-10"
                  maxLength={255}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="timezone">
                {t("profile.timezone")} <span className="text-muted-foreground">({t("general_use.optional")})</span>
              </Label>
              <Select
                value={formData.timezone || ''}
                onValueChange={(value) => onInputChange('timezone', value)}
                disabled={isUpdating}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("profile.timezone_placeholder")} />
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
              <Label htmlFor="language">{t("profile.language")}</Label>
              <Select
                value={formData.language}
                onValueChange={(value: 'en' | 'ms') => onInputChange('language', value)}
                disabled={isUpdating}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t("general_use.english")}</SelectItem>
                  <SelectItem value="ms">{t("general_use.malay")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme">{t("profile.theme")}</Label>
            <Select
              value={formData.theme}
              onValueChange={(value: 'light' | 'dark' | 'system') => onInputChange('theme', value)}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t("profile.theme_light")}</SelectItem>
                <SelectItem value="dark">{t("profile.theme_dark")}</SelectItem>
                <SelectItem value="system">{t("profile.theme_system")}</SelectItem>
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
            <Label htmlFor="notificationsEnabled" className="flex items-center gap-2 cursor-pointer">
              <Bell className="h-4 w-4" />
              {t("profile.notifications_enabled")}
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={isUpdating}>
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("profile.updating")}
              </>
            ) : (
              t("profile.update_profile")
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

