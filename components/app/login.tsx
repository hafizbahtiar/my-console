"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/language-context"
import { auditLogger } from "@/lib/audit-log"
import { account } from "@/lib/appwrite"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Mail, Lock, Sun, Moon } from "lucide-react"
import { toast } from "sonner"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { theme, setTheme } = useTheme()
  const { login, user } = useAuth()
  const { t } = useTranslation()

  // If user is already logged in, show dashboard or redirect
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">{t('auth.welcome_back')}</CardTitle>
            <CardDescription className="text-center">
              {t('auth.already_logged_in', { email: user.email })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => window.location.href = '/auth/dashboard'}
              className="w-full"
            >
              {t('auth.go_to_dashboard')}
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

      // Get current user data for audit logging
      try {
        const currentUser = await account.get()
        await auditLogger.logUserLogin(
          currentUser.$id,
          undefined, // sessionId - could be extracted from session
          undefined, // ipAddress - could be obtained from request headers
          navigator.userAgent
        )
      } catch (auditError) {
        console.warn('Failed to log audit event:', auditError)
      }

      toast.success(t('auth.login_successful'))

      // Redirect to dashboard or home page
      window.location.href = '/auth/dashboard'
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

      setError(err.message || t('auth.login_failed'))
      toast.error(t('auth.login_failed'))
    } finally {
      setIsLoading(false)
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
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
          <CardTitle className="text-2xl font-bold text-center">{t('auth.welcome_back')}</CardTitle>
          <CardDescription className="text-center">
            {t('auth.login_prompt')}
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
                {t('auth.email')}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t('profile.email_placeholder')}
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
                {t('auth.password')}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t('auth.password')}
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
                <span className="text-muted-foreground">{t('auth.remember_me')}</span>
              </label>
              <a
                href="#"
                className="text-sm text-primary hover:underline focus:underline"
                onClick={(e) => e.preventDefault()}
              >
                {t('auth.forgot_password')}
              </a>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? t('general_use.loading') : t('auth.sign_in')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {"Don't have an account? "}{" "}
            <a
              href="#"
              className="text-primary hover:underline focus:underline"
              onClick={(e) => e.preventDefault()}
            >
              {t('auth.sign_up')}
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
