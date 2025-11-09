"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/language-context"
import { account } from "@/lib/appwrite"
import { auditLogger } from "@/lib/audit-log"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Shield, Key, Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function SecuritySettings() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [twoFactor, setTwoFactor] = useState(false)
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

  const handlePasswordChange = async () => {
    if (!user) return

    // Validate form
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error(t('settings_page.security.current_password_required'))
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('settings_page.security.passwords_no_match'))
      return
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error(t('settings_page.security.password_length_error'))
      return
    }

    if (passwordForm.newPassword.length > 265) {
      toast.error(t('settings_page.security.password_length_error'))
      return
    }

    // Check for commonly used weak passwords
    const weakPasswords = [
      'password', 'password123', '123456', '123456789', 'qwerty', 'abc123',
      'password1', 'admin', 'letmein', 'welcome', 'monkey', 'dragon',
      'passw0rd', 'p@ssword', 'p@ssw0rd', '12345678', 'iloveyou'
    ]

    if (weakPasswords.includes(passwordForm.newPassword.toLowerCase())) {
      toast.error(t('settings_page.security.password_weak_error'))
      return
    }

    // Check if new password is the same as current password
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      toast.error(t('settings_page.security.password_same_error'))
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

      toast.success(t('settings_page.security.password_change_success'))

      // Reset form and close dialog
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setPasswordDialogOpen(false)

    } catch (error: any) {
      console.error('Password change failed:', error)

      let errorMessage = t('settings_page.security.password_change_failed')
      if (error?.message?.includes('Invalid credentials')) {
        errorMessage = t('settings_page.security.password_incorrect')
      } else if (error?.message?.includes('Password must be between 8 and 265')) {
        errorMessage = t('settings_page.security.password_length_error')
      } else if (error?.message?.includes('should not be one of the commonly used password')) {
        errorMessage = t('settings_page.security.password_weak_error')
      } else if (error?.message?.includes('Invalid `password` param')) {
        errorMessage = t('settings_page.security.password_invalid_format')
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" suppressHydrationWarning>
          <Shield className="h-5 w-5" />
          {t('settings_page.security.title')}
        </CardTitle>
        <CardDescription suppressHydrationWarning>
          {t('settings_page.security.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label suppressHydrationWarning>{t('settings_page.security.two_factor_auth')}</Label>
            <p className="text-sm text-muted-foreground" suppressHydrationWarning>
              {t('settings_page.security.two_factor_auth_description')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={twoFactor}
              onCheckedChange={setTwoFactor}
            />
            <Badge variant={twoFactor ? "default" : "secondary"} suppressHydrationWarning>
              {twoFactor ? t('active') : t('inactive')}
            </Badge>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label suppressHydrationWarning>{t('settings_page.security.change_password')}</Label>
          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
            {t('settings_page.security.change_password_description')}
          </p>
          <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Key className="h-4 w-4 mr-2" />
                <span suppressHydrationWarning>{t('settings_page.security.change_password')}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle suppressHydrationWarning>{t('settings_page.security.change_password_dialog_title')}</DialogTitle>
                <DialogDescription suppressHydrationWarning>
                  {t('settings_page.security.change_password_dialog_description')}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password" suppressHydrationWarning>{t('settings_page.security.current_password')}</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showPasswords.current ? "text" : "password"}
                      placeholder={t('settings_page.security.current_password_placeholder')}
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
                  <Label htmlFor="new-password" suppressHydrationWarning>{t('settings_page.security.new_password')}</Label>
                  <div className="text-xs text-muted-foreground mb-2" suppressHydrationWarning>
                    {t('settings_page.security.new_password_requirements')}
                  </div>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPasswords.new ? "text" : "password"}
                      placeholder={t('settings_page.security.new_password_placeholder')}
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
                  <Label htmlFor="confirm-password" suppressHydrationWarning>{t('settings_page.security.confirm_password')}</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showPasswords.confirm ? "text" : "password"}
                      placeholder={t('settings_page.security.confirm_password_placeholder')}
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
                  <span suppressHydrationWarning>{t('cancel')}</span>
                </Button>
                <Button
                  onClick={handlePasswordChange}
                  disabled={passwordLoading}
                >
                  {passwordLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <span suppressHydrationWarning>{t('settings_page.security.updating')}</span>
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      <span suppressHydrationWarning>{t('settings_page.security.change_password')}</span>
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}

