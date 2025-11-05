"use client"

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from '@/lib/language-context'

export default function NotFound() {
  const router = useRouter()
  const { t } = useTranslation()
  const [currentUrl, setCurrentUrl] = useState('')

  useEffect(() => {
    // Set URL on client side only to avoid hydration mismatch
    setCurrentUrl(window.location.href)
  }, [])

  const handleGoBack = () => {
    router.back()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 text-muted-foreground">
            <FileQuestion className="h-full w-full" />
          </div>
          <CardTitle className="text-2xl">{t('errors.something_went_wrong')}</CardTitle>
          <CardDescription>
            {t('errors.try_again')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            <strong>URL:</strong> {currentUrl}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={handleGoBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('general_use.back')}
            </Button>
            <Button asChild variant="outline">
              <Link href="/auth/dashboard">
                <Home className="h-4 w-4 mr-2" />
                {t('nav.dashboard')}
              </Link>
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              If you believe this is an error, please contact support.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
