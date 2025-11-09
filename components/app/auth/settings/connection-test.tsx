"use client"

import { useState } from "react"
import { useTranslation } from "@/lib/language-context"
import { account } from "@/lib/appwrite"
import { AppwriteException } from "appwrite"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Server, Zap, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function ConnectionTest() {
  const { t } = useTranslation()
  const [pingStatus, setPingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [pingLogs, setPingLogs] = useState<Array<{
    date: Date
    method: string
    path: string
    status: number
    response: string
  }>>([])

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
      toast.success(t('settings_page.connection_test.connection_success'))
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
      toast.error(t('settings_page.connection_test.connection_failed'))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" suppressHydrationWarning>
          <Server className="h-5 w-5" />
          {t('settings_page.connection_test.title')}
        </CardTitle>
        <CardDescription suppressHydrationWarning>
          {t('settings_page.connection_test.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label suppressHydrationWarning>{t('settings_page.connection_test.test_button')}</Label>
            <p className="text-sm text-muted-foreground" suppressHydrationWarning>
              {t('settings_page.connection_test.test_description')}
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
            <span suppressHydrationWarning>
              {pingStatus === 'loading' ? t('settings_page.connection_test.testing') :
                pingStatus === 'success' ? t('settings_page.connection_test.connected') :
                  pingStatus === 'error' ? t('settings_page.connection_test.connection_failed') : t('settings_page.connection_test.test_button')}
            </span>
          </Button>
        </div>

        {/* Project Info */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground" suppressHydrationWarning>{t('settings_page.connection_test.endpoint')}</Label>
            <p className="text-xs font-mono break-all">
              {process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}
            </p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground" suppressHydrationWarning>{t('settings_page.connection_test.project_id')}</Label>
            <p className="text-xs font-mono break-all">
              {process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}
            </p>
          </div>
        </div>

        {/* Logs */}
        {pingLogs.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm" suppressHydrationWarning>{t('settings_page.connection_test.connection_logs')} ({pingLogs.length})</Label>
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
  )
}

