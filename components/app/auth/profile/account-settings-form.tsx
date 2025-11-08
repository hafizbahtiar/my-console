"use client"

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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit className="h-5 w-5" />
          Account Settings
        </CardTitle>
        <CardDescription>
          Update your account information and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={(e) => onInputChange('name', e.target.value)}
              disabled={isUpdating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => onInputChange('email', e.target.value)}
              disabled={true}
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed. Contact support if you need to update your email.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">
              Bio <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself"
              value={formData.bio}
              onChange={(e) => onInputChange('bio', e.target.value)}
              disabled={isUpdating}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {formData.bio.length}/500 characters
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location">
                Location <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  placeholder="Enter your location"
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
                Website <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="website"
                  type="url"
                  placeholder="https://example.com"
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
                Timezone <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Select
                value={formData.timezone || ''}
                onValueChange={(value) => onInputChange('timezone', value)}
                disabled={isUpdating}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select timezone" />
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
              <Label htmlFor="language">Language</Label>
              <Select
                value={formData.language}
                onValueChange={(value: 'en' | 'ms') => onInputChange('language', value)}
                disabled={isUpdating}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ms">Malay</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select
              value={formData.theme}
              onValueChange={(value: 'light' | 'dark' | 'system') => onInputChange('theme', value)}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
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
              Notifications Enabled
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={isUpdating}>
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Update"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

