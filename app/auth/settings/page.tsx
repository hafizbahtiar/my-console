"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { useTranslation } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { account } from "@/lib/appwrite"
import { auditLogger } from "@/lib/audit-log"
import { AppwriteException } from "appwrite"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Settings, Bell, Shield, Palette, Globe, Key, Zap, CheckCircle, XCircle, Loader2, Server, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { t, language, setLanguage } = useTranslation()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState(true)
  const [emailUpdates, setEmailUpdates] = useState(true)
  const [twoFactor, setTwoFactor] = useState(false)

  // Ping functionality state
  const [pingStatus, setPingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [pingLogs, setPingLogs] = useState<Array<{
    date: Date
    method: string
    path: string
    status: number
    response: string
  }>>([])

  // Password change state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  const handleSaveSettings = () => {
    toast.success(t("settings.save_settings"))
  }

  const handleLanguageChange = async (newLanguage: "en" | "ms") => {
    const oldLanguage = language
    setLanguage(newLanguage)

    toast.success(t("settings.save_settings"))
  }

  const handlePasswordChange = async () => {
    if (!user) return

    // Validate form
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error(t('general_use.error'))
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('general_use.error'))
      return
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error(t('general_use.error'))
      return
    }

    if (passwordForm.newPassword.length > 265) {
      toast.error(t('general_use.error'))
      return
    }

    // Check for commonly used weak passwords
    const weakPasswords = [
      'password', 'password123', '123456', '123456789', 'qwerty', 'abc123',
      'password1', 'admin', 'letmein', 'welcome', 'monkey', 'dragon',
      'passw0rd', 'p@ssword', 'p@ssw0rd', '12345678', 'iloveyou'
    ]

    if (weakPasswords.includes(passwordForm.newPassword.toLowerCase())) {
      toast.error(t('general_use.error'))
      return
    }

    // Check if new password is the same as current password
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      toast.error(t('general_use.error'))
      return
    }

    setPasswordLoading(true)

    try {
      // Log password change attempt
      await auditLogger.logSecurityEvent(user.$id, 'password_change_attempt', {
        timestamp: new Date().toISOString()
      })

      // Update password using Appwrite - use object parameter style
      await account.updatePassword({
        password: passwordForm.newPassword,
        oldPassword: passwordForm.currentPassword
      })

      // Log successful password change
      await auditLogger.logSecurityEvent(user.$id, 'password_changed', {
        timestamp: new Date().toISOString()
      })

      toast.success(t('general_use.success'))

      // Reset form and close dialog
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setPasswordDialogOpen(false)

    } catch (error: any) {
      console.error('Password change failed:', error)

      let errorMessage = "Failed to change password"
      if (error?.message?.includes('Invalid credentials')) {
        errorMessage = "Current password is incorrect"
      } else if (error?.message?.includes('Password must be between 8 and 265')) {
        errorMessage = "Password must be between 8 and 265 characters long"
      } else if (error?.message?.includes('should not be one of the commonly used password')) {
        errorMessage = "Please choose a stronger password. Avoid commonly used passwords like 'password123' or '123456'"
      } else if (error?.message?.includes('Invalid `password` param')) {
        errorMessage = "Invalid password. Please ensure it meets all requirements"
      } else if (error?.message) {
        errorMessage = error.message
      }

      toast.error(errorMessage)

      // Log failed password change attempt
      await auditLogger.logSecurityEvent(user.$id, 'password_change_failed', {
        timestamp: new Date().toISOString(),
        reason: error?.message || 'unknown'
      })

    } finally {
      setPasswordLoading(false)
    }
  }

  const handlePasswordFormChange = (field: keyof typeof passwordForm, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }))
  }

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const handlePing = async () => {
    if (pingStatus === 'loading') return

    setPingStatus('loading')

    try {
      const result = await account.get()
      const log = {
        date: new Date(),
        method: 'GET',
        path: '/v1/ping',
        status: 200,
        response: JSON.stringify(result, null, 2),
      }
      setPingLogs(prev => [log, ...prev])
      setPingStatus('success')
      toast.success(t("settings.connection_successful"))
    } catch (err) {
      const log = {
        date: new Date(),
        method: 'GET',
        path: '/v1/ping',
        status: err instanceof AppwriteException ? err.code : 500,
        response: err instanceof AppwriteException
          ? err.message
          : 'Something went wrong',
      }
      setPingLogs(prev => [log, ...prev])
      setPingStatus('error')
      toast.error(t("settings.connection_failed"))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("settings.title")}</h1>
        <p className="text-muted-foreground">
          {t("settings.subtitle")}
        </p>
      </div>

      <div className="grid gap-6">
        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              {t("settings.appearance")}
            </CardTitle>
            <CardDescription>
              {t("settings.appearance_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("settings.theme")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("settings.choose_theme")}
                </p>
              </div>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t("settings.light")}</SelectItem>
                  <SelectItem value="dark">{t("settings.dark")}</SelectItem>
                  <SelectItem value="system">{t("settings.system")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t("settings.notifications")}
            </CardTitle>
            <CardDescription>
              {t("settings.notifications_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("settings.push_notifications")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("settings.receive_notifications")}
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
                <Label>{t("settings.email_updates")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("settings.receive_emails")}
                </p>
              </div>
              <Switch
                checked={emailUpdates}
                onCheckedChange={setEmailUpdates}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t("settings.security")}
            </CardTitle>
            <CardDescription>
              {t("settings.security_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("settings.two_factor")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("settings.add_security")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={twoFactor}
                  onCheckedChange={setTwoFactor}
                />
                <Badge variant={twoFactor ? "default" : "secondary"}>
                  {twoFactor ? t("general_use.active") : t("general_use.inactive")}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>{t("settings.change_password")}</Label>
              <p className="text-sm text-muted-foreground">
                Update your account password for better security
              </p>
              <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Key className="h-4 w-4 mr-2" />
                {t("settings.change_password")}
              </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{t("settings.change_password")}</DialogTitle>
                    <DialogDescription>
                      Enter your current password and choose a new secure password.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showPasswords.current ? "text" : "password"}
                          placeholder="Enter current password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => handlePasswordFormChange('currentPassword', e.target.value)}
                          disabled={passwordLoading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => togglePasswordVisibility('current')}
                          disabled={passwordLoading}
                        >
                          {showPasswords.current ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <div className="text-xs text-muted-foreground mb-2">
                        Password must be 8-265 characters long and not commonly used
                      </div>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showPasswords.new ? "text" : "password"}
                          placeholder="Enter new password (min 8 characters)"
                          value={passwordForm.newPassword}
                          onChange={(e) => handlePasswordFormChange('newPassword', e.target.value)}
                          disabled={passwordLoading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => togglePasswordVisibility('new')}
                          disabled={passwordLoading}
                        >
                          {showPasswords.new ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showPasswords.confirm ? "text" : "password"}
                          placeholder="Confirm new password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => handlePasswordFormChange('confirmPassword', e.target.value)}
                          disabled={passwordLoading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => togglePasswordVisibility('confirm')}
                          disabled={passwordLoading}
                        >
                          {showPasswords.confirm ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPasswordDialogOpen(false)}
                      disabled={passwordLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handlePasswordChange}
                      disabled={passwordLoading}
                    >
                      {passwordLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Key className="h-4 w-4 mr-2" />
                          Change Password
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Language & Region */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t("settings.language_region")}
            </CardTitle>
            <CardDescription>
              {t("settings.language_region_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("settings.language")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("settings.choose_language")}
                </p>
              </div>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t("settings.english")}</SelectItem>
                  <SelectItem value="ms">{t("settings.malay")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Connection Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              {t("settings.connection_test")}
            </CardTitle>
            <CardDescription>
              {t("settings.connection_test_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("settings.test_connection")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("settings.test_connection_desc")}
                </p>
              </div>
              <Button
                onClick={handlePing}
                disabled={pingStatus === 'loading'}
                variant={pingStatus === 'success' ? 'default' : pingStatus === 'error' ? 'destructive' : 'outline'}
              >
                {pingStatus === 'loading' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : pingStatus === 'success' ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : pingStatus === 'error' ? (
                  <XCircle className="h-4 w-4 mr-2" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                {pingStatus === 'loading' ? t("settings.testing") :
                 pingStatus === 'success' ? t("settings.connected") :
                 pingStatus === 'error' ? t("settings.failed") : t("settings.test_connection")}
              </Button>
            </div>

            {/* Project Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t("settings.endpoint")}</Label>
                <p className="text-xs font-mono break-all">
                  {process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t("settings.project_id")}</Label>
                <p className="text-xs font-mono break-all">
                  {process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}
                </p>
              </div>
            </div>

            {/* Logs */}
            {pingLogs.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm">{t("settings.connection_logs")} ({pingLogs.length})</Label>
                <ScrollArea className="h-48 w-full rounded-md border">
                  <div className="p-4">
                    {pingLogs.map((log, index) => (
                      <div key={index} className="mb-4 last:mb-0">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>{log.date.toLocaleString()}</span>
                          <Badge variant={log.status >= 400 ? "destructive" : "default"} className="text-xs">
                            {log.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm mb-1">
                          <Badge variant="outline" className="text-xs">{log.method}</Badge>
                          <span className="font-mono text-xs">{log.path}</span>
                        </div>
                        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap">
                          {log.response}
                        </pre>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <Card>
          <CardContent className="pt-6">
            <Button onClick={handleSaveSettings} className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              {t("settings.save_settings")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
