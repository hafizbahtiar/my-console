"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/language-context"
import { auditLogger } from "@/lib/audit-log"
import { account } from "@/lib/appwrite"
import { updateLoginStats } from "@/lib/user-profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Eye, EyeOff, Mail, Lock, Sun, Moon, HelpCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("")
  const [sendingReset, setSendingReset] = useState(false)
  const { theme, setTheme } = useTheme()
  const { login, user, loading: authLoading } = useAuth()
  const { t } = useTranslation()

  // Show skeleton while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1 relative">
            <div className="absolute top-4 right-4">
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-10 w-full" />
            <div className="mt-6 text-center">
              <Skeleton className="h-4 w-48 mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If user is already logged in, show dashboard or redirect
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              {t('login_page.welcome_back')}
            </CardTitle>
            <CardDescription className="text-center">
              {t('login_page.already_logged_in', { email: user.email })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => window.location.href = '/auth/dashboard'}
              className="w-full"
            >
              {t('login_page.go_to_dashboard')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      await login(email, password)

      // Get current user data
      const currentUser = await account.get()

      // Create/update user profile and update login stats
      // This will create the profile if it doesn't exist
      try {
        await updateLoginStats(currentUser.$id)
      } catch (profileError) {
        console.warn('Failed to create/update user profile:', profileError)
        // Don't block login if profile creation fails
        toast.warning('Profile update skipped')
      }

      // Log audit event
      try {
        await auditLogger.logUserLogin(
          currentUser.$id,
          undefined, // sessionId - could be extracted from session
          undefined, // ipAddress - could be obtained from request headers
          navigator.userAgent
        )
      } catch (auditError) {
        console.warn('Failed to log audit event:', auditError)
        toast.warning('Audit logging failed')
      }

      toast.success(t('login_page.login_success'), {
        description: `Welcome back, ${currentUser.email || currentUser.name || 'User'}`,
        duration: 3000,
      })

      // Redirect to dashboard or home page
      // window.location.href = '/auth/dashboard'
    } catch (err: any) {
      // Log failed login attempt
      try {
        await auditLogger.logSecurityEvent(
          'unknown', // We don't know the user ID for failed logins
          'FAILED_LOGIN_ATTEMPT',
          {
            email: email,
            error: err.message,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        )
      } catch (auditError) {
        console.warn('Failed to log failed login audit event:', auditError)
      }

      const errorMessage = err.message || t('login_page.login_failed')
      setError(errorMessage)

      // Show error toast with appropriate styling
      toast.error(t('login_page.login_failed'), {
        description: errorMessage,
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotPasswordEmail) {
      setError(t('login_page.forgot_password_email_required'))
      return
    }

    try {
      setSendingReset(true)
      setError("")
      
      // Get the current URL origin for the redirect URL
      const redirectUrl = `${window.location.origin}/reset-password`
      
      await account.createRecovery(forgotPasswordEmail, redirectUrl)
      
      // Log critical security event - password reset requested
      const userAgent = typeof window !== 'undefined' ? navigator.userAgent : 'unknown'
      auditLogger.logSecurityEvent(
        'unknown', // User ID not available at this point
        'PASSWORD_RESET_REQUESTED',
        {
          email: forgotPasswordEmail,
          userAgent
        }
      ).catch(() => {
        // Silently fail audit logging
      })
      
      toast.success(t('login_page.forgot_password_sent'))
      setShowForgotPassword(false)
      setForgotPasswordEmail("")
    } catch (err: any) {
      console.error('Failed to send password reset email:', err)
      
      // Handle SMTP disabled error specifically
      // Check for the specific Appwrite error type: 'general_smtp_disabled'
      const isSmtpDisabled = err.type === 'general_smtp_disabled'
      
      if (isSmtpDisabled) {
        const smtpErrorMessage = t('login_page.smtp_disabled')
        setError(smtpErrorMessage)
        toast.error(smtpErrorMessage, {
          description: t('login_page.smtp_disabled_description'),
          duration: 8000,
        })
      } else {
        // Show the actual error message for other issues (SMTP config errors, network issues, etc.)
        const errorMessage = err.message || t('login_page.forgot_password_failed')
        setError(errorMessage)
        toast.error(errorMessage, {
          description: err.message ? undefined : t('login_page.forgot_password_failed'),
          duration: 5000,
        })
      }
    } finally {
      setSendingReset(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 relative">
          <div className="absolute top-4 right-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-8 w-8"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only" suppressHydrationWarning>{t('toggle_theme')}</span>
            </Button>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {t('login_page.welcome_back')}
          </CardTitle>
          <CardDescription className="text-center">
            {t('login_page.enter_credentials')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                {t('email')}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t('enter_field', { field: t('email') })}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                {t('password')}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t('enter_field', { field: t('password') })}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  disabled={isLoading}
                />
                <span className="text-muted-foreground">{t('login_page.remember_me')}</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-primary hover:underline focus:underline flex items-center gap-1"
                disabled={isLoading}
              >
                <HelpCircle className="h-3 w-3" />
                {t('login_page.forgot_password')}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? t('loading') : t('login_page.sign_in')}
            </Button>
          </form>

          {/* Forgot Password Dialog */}
          {showForgotPassword && (
            <div className="mt-4 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-1" suppressHydrationWarning>
                    {t('login_page.forgot_password_title')}
                  </h3>
                  <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                    {t('login_page.forgot_password_description')}
                  </p>
                </div>
                <form onSubmit={handleForgotPassword} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email" className="text-sm">
                      {t('email')}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder={t('enter_field', { field: t('email') })}
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        disabled={sendingReset}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={sendingReset || !forgotPasswordEmail}
                      className="flex-1"
                    >
                      {sendingReset ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          <span suppressHydrationWarning>{t('login_page.sending')}</span>
                        </>
                      ) : (
                        <span suppressHydrationWarning>{t('login_page.send_reset_link')}</span>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowForgotPassword(false)
                        setForgotPasswordEmail("")
                        setError("")
                      }}
                      disabled={sendingReset}
                      suppressHydrationWarning
                    >
                      {t('cancel')}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {t('login_page.no_account')}{" "}
            <Link
              href="/register"
              className="text-primary hover:underline focus:underline"
            >
              {t('login_page.sign_up')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
