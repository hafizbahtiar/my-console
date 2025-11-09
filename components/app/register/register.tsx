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
import { Eye, EyeOff, Mail, Lock, User, Sun, Moon } from "lucide-react"
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
  const { register, user, loading: authLoading } = useAuth()
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
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-3 w-56" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
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

    // Validation
    if (password.length < 8) {
      setError(t('register_page.password_too_short'))
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError(t('register_page.passwords_no_match'))
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

      toast.success(t('register_page.registration_success'))

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

      setError(err.message || t('register_page.registration_failed'))
      toast.error(t('register_page.registration_failed'))
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
              <span className="sr-only" suppressHydrationWarning>{t('toggle_theme')}</span>
            </Button>
          </div>
          <CardTitle className="text-2xl font-bold text-center" suppressHydrationWarning>
            {t('register_page.create_account')}
          </CardTitle>
          <CardDescription className="text-center" suppressHydrationWarning>
            {t('register_page.create_account_description')}
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
                {t('name')} <span className="text-muted-foreground">({t('optional')})</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder={t('enter_field', { field: t('name') }) + ` (${t('optional')})`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

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
              <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                {t('register_page.password_min_length')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium" suppressHydrationWarning>
                {t('register_page.confirm_password')}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={t('enter_field', { field: t('register_page.confirm_password') })}
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
              suppressHydrationWarning
            >
              {isLoading ? t('loading') : t('register_page.create_account')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground" suppressHydrationWarning>
            {t('register_page.already_have_account')}{" "}
            <Link
              href="/"
              className="text-primary hover:underline focus:underline"
            >
              {t('login_page.sign_in')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
