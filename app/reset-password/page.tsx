"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { account } from "@/lib/appwrite"
import { useTranslation } from "@/lib/language-context"
import { auditLogger } from "@/lib/audit-log"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Eye, EyeOff, Lock, Loader2, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

function ResetPasswordPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const [userId, setUserId] = useState("")
  const [secret, setSecret] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Get userId and secret from URL parameters
    const userIdParam = searchParams.get('userId')
    const secretParam = searchParams.get('secret')

    if (userIdParam && secretParam) {
      setUserId(userIdParam)
      setSecret(secretParam)
    } else {
      setError(t('reset_password_page.invalid_link'))
    }
  }, [searchParams, t])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (password.length < 8) {
      setError(t('reset_password_page.password_too_short'))
      return
    }

    if (password !== confirmPassword) {
      setError(t('reset_password_page.passwords_not_match'))
      return
    }

    if (!userId || !secret) {
      setError(t('reset_password_page.invalid_link'))
      return
    }

    try {
      setIsResetting(true)
      
      // Update password using Appwrite recovery
      // Appwrite updateRecovery signature: updateRecovery(userId: string, secret: string, password: string)
      await account.updateRecovery(userId, secret, password)
      
      // Log critical security event - password reset
      const userAgent = typeof window !== 'undefined' ? navigator.userAgent : 'unknown'
      auditLogger.logSecurityEvent(
        userId,
        'PASSWORD_RESET',
        {
          method: 'email_recovery',
          userAgent
        }
      ).catch(() => {
        // Silently fail audit logging - don't block password reset
      })
      
      setSuccess(true)
      toast.success(t('reset_password_page.success'))
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (err: any) {
      // Log failed password reset attempt
      const userAgent = typeof window !== 'undefined' ? navigator.userAgent : 'unknown'
      auditLogger.logSecurityEvent(
        userId || 'unknown',
        'PASSWORD_RESET_FAILED',
        {
          error: err.message || 'Unknown error',
          userAgent
        }
      ).catch(() => {
        // Silently fail audit logging
      })
      
      const errorMessage = err.message || t('reset_password_page.failed')
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsResetting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center" suppressHydrationWarning>
              {t('reset_password_page.success_title')}
            </CardTitle>
            <CardDescription className="text-center" suppressHydrationWarning>
              {t('reset_password_page.success_description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push('/')}
              className="w-full"
              suppressHydrationWarning
            >
              {t('reset_password_page.go_to_login')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center" suppressHydrationWarning>
            {t('reset_password_page.title')}
          </CardTitle>
          <CardDescription className="text-center" suppressHydrationWarning>
            {t('reset_password_page.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium" suppressHydrationWarning>
                {t('reset_password_page.new_password')}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t('reset_password_page.password_placeholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isResetting || !userId || !secret}
                  className="pl-10 pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  disabled={isResetting}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                {t('reset_password_page.password_requirements')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium" suppressHydrationWarning>
                {t('reset_password_page.confirm_password')}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={t('reset_password_page.confirm_password_placeholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isResetting || !userId || !secret}
                  className="pl-10 pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  disabled={isResetting}
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
              disabled={isResetting || !userId || !secret || !password || !confirmPassword}
            >
              {isResetting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span suppressHydrationWarning>{t('reset_password_page.resetting')}</span>
                </>
              ) : (
                <span suppressHydrationWarning>{t('reset_password_page.reset_password')}</span>
              )}
            </Button>

            <div className="text-center">
              <Link
                href="/"
                className="text-sm text-primary hover:underline"
                suppressHydrationWarning
              >
                {t('reset_password_page.back_to_login')}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="space-y-1">
              <Skeleton className="h-8 w-48 mx-auto" />
              <Skeleton className="h-4 w-64 mx-auto" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <ResetPasswordPageContent />
    </Suspense>
  )
}

