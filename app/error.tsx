"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { logError, createAppError, ErrorType } from '@/lib/error-handler'
import { useTranslation } from '@/lib/language-context'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const router = useRouter()
  const { t } = useTranslation()

  useEffect(() => {
    // Log the error
    const appError = createAppError(
      ErrorType.CLIENT,
      error.message || 'Page error occurred',
      error,
      {
        digest: error.digest,
        url: window.location.href
      }
    )
    logError(appError)
  }, [error])

  const handleGoBack = () => {
    router.back()
  }

  const handleGoHome = () => {
    router.push('/auth/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 text-destructive">
            <AlertTriangle className="h-full w-full" />
          </div>
          <CardTitle className="text-destructive">{t('errors.something_went_wrong')}</CardTitle>
          <CardDescription>
            {t('errors.try_again')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            <strong>Error:</strong> {error.message || 'Unknown error'}
            {error.digest && (
              <div className="mt-1">
                <strong>Digest:</strong> {error.digest}
              </div>
            )}
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer font-medium">Stack Trace (Development)</summary>
              <pre className="mt-2 whitespace-pre-wrap break-all bg-muted p-2 rounded text-xs">
                {error.stack}
              </pre>
            </details>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={reset} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('general_use.retry')}
            </Button>
            <Button onClick={handleGoBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('general_use.back')}
            </Button>
          </div>

          <Button onClick={handleGoHome} className="w-full">
            <Home className="h-4 w-4 mr-2" />
            {t('auth.go_to_dashboard')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
