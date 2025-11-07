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
import { Eye, EyeOff, Mail, Lock, User, Sun, Moon, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export function RegisterForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { theme, setTheme } = useTheme()
  const { register, user } = useAuth()
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

    // Validation
    if (password.length < 8) {
      setError(t('auth.password_too_short'))
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwords_dont_match'))
      setIsLoading(false)
      return
    }

    try {
      // Register user in Appwrite
      await register(email, password, name || undefined)

      // Get current user data
      const currentUser = await account.get()

      // Create/update user profile and update login stats
      // This will create the profile if it doesn't exist
      try {
        await updateLoginStats(currentUser.$id)
      } catch (profileError) {
        console.warn('Failed to create/update user profile:', profileError)
        // Don't block registration if profile creation fails
        // Profile will be created on next login
      }

      // Log audit event
      try {
        await auditLogger.log({
          action: 'USER_REGISTERED',
          resource: 'auth',
          resourceId: currentUser.$id,
          userId: currentUser.$id,
          metadata: {
            email: email,
            name: name || 'Not provided',
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        })
      } catch (auditError) {
        console.warn('Failed to log registration audit event:', auditError)
      }

      toast.success(t('auth.registration_successful'))

      // Redirect to dashboard
      window.location.href = '/auth/dashboard'
    } catch (err: any) {
      // Log failed registration attempt
      try {
        await auditLogger.logSecurityEvent(
          'unknown',
          'FAILED_REGISTRATION_ATTEMPT',
          {
            email: email,
            error: err.message,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        )
      } catch (auditError) {
        console.warn('Failed to log failed registration audit event:', auditError)
      }

      setError(err.message || t('auth.registration_failed'))
      toast.error(t('auth.registration_failed'))
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
          <CardTitle className="text-2xl font-bold text-center">{t('auth.create_account')}</CardTitle>
          <CardDescription className="text-center">
            {t('auth.register_prompt')}
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
              <Label htmlFor="name" className="text-sm font-medium">
                {t('auth.name')} <span className="text-muted-foreground">({t('general_use.optional')})</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder={t('auth.name_placeholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

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
                  placeholder={t('auth.password_placeholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  disabled={isLoading}
                  minLength={8}
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
              <p className="text-xs text-muted-foreground">
                {t('auth.password_requirements')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                {t('auth.confirm_password')}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={t('auth.confirm_password_placeholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  disabled={isLoading}
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? t('general_use.loading') : t('auth.create_account')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {t('auth.already_have_account')}{" "}
            <Link
              href="/"
              className="text-primary hover:underline focus:underline"
            >
              {t('auth.sign_in')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

