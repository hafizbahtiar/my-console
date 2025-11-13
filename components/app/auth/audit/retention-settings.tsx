"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useTranslation } from "@/lib/language-context"
import { toast } from "sonner"
import { Settings, Save, RefreshCw } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface RetentionConfig {
    defaultDays: number
    securityEventsDays: number
    systemEventsDays: number
    userActivityDays: number
    archiveBeforeDelete: boolean
    archiveLocation?: string
}

export function RetentionSettings() {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [config, setConfig] = useState<RetentionConfig>({
        defaultDays: 90,
        securityEventsDays: 365,
        systemEventsDays: 30,
        userActivityDays: 90,
        archiveBeforeDelete: false,
        archiveLocation: './backup/audit-archive',
    })

    useEffect(() => {
        loadConfig()
    }, [])

    const loadConfig = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/audit/retention')
            const data = await response.json()

            if (data.success && data.data?.retentionConfig) {
                setConfig(data.data.retentionConfig)
            }
        } catch (error) {
            console.error('Failed to load retention config:', error)
            toast.error(t('audit_page.retention.load_error'))
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            const response = await fetch('/api/audit/retention', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config),
            })

            const data = await response.json()

            if (data.success) {
                toast.success(t('audit_page.retention.save_success'))
            } else {
                toast.error(data.error || t('audit_page.retention.save_error'))
            }
        } catch (error) {
            console.error('Failed to save retention config:', error)
            toast.error(t('audit_page.retention.save_error'))
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    <CardTitle suppressHydrationWarning>{t('audit_page.retention.title')}</CardTitle>
                </div>
                <CardDescription suppressHydrationWarning>
                    {t('audit_page.retention.description')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="defaultDays" suppressHydrationWarning>
                            {t('audit_page.retention.default_days')}
                        </Label>
                        <Input
                            id="defaultDays"
                            type="number"
                            min="1"
                            max="3650"
                            value={config.defaultDays}
                            onChange={(e) =>
                                setConfig({ ...config, defaultDays: parseInt(e.target.value) || 90 })
                            }
                        />
                        <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                            {t('audit_page.retention.default_days_description')}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="securityEventsDays" suppressHydrationWarning>
                            {t('audit_page.retention.security_events_days')}
                        </Label>
                        <Input
                            id="securityEventsDays"
                            type="number"
                            min="1"
                            max="3650"
                            value={config.securityEventsDays}
                            onChange={(e) =>
                                setConfig({
                                    ...config,
                                    securityEventsDays: parseInt(e.target.value) || 365,
                                })
                            }
                        />
                        <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                            {t('audit_page.retention.security_events_days_description')}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="systemEventsDays" suppressHydrationWarning>
                            {t('audit_page.retention.system_events_days')}
                        </Label>
                        <Input
                            id="systemEventsDays"
                            type="number"
                            min="1"
                            max="3650"
                            value={config.systemEventsDays}
                            onChange={(e) =>
                                setConfig({
                                    ...config,
                                    systemEventsDays: parseInt(e.target.value) || 30,
                                })
                            }
                        />
                        <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                            {t('audit_page.retention.system_events_days_description')}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="userActivityDays" suppressHydrationWarning>
                            {t('audit_page.retention.user_activity_days')}
                        </Label>
                        <Input
                            id="userActivityDays"
                            type="number"
                            min="1"
                            max="3650"
                            value={config.userActivityDays}
                            onChange={(e) =>
                                setConfig({
                                    ...config,
                                    userActivityDays: parseInt(e.target.value) || 90,
                                })
                            }
                        />
                        <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                            {t('audit_page.retention.user_activity_days_description')}
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="archiveBeforeDelete" suppressHydrationWarning>
                                {t('audit_page.retention.archive_before_delete')}
                            </Label>
                            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                                {t('audit_page.retention.archive_before_delete_description')}
                            </p>
                        </div>
                        <Switch
                            id="archiveBeforeDelete"
                            checked={config.archiveBeforeDelete}
                            onCheckedChange={(checked) =>
                                setConfig({ ...config, archiveBeforeDelete: checked })
                            }
                        />
                    </div>

                    {config.archiveBeforeDelete && (
                        <div className="space-y-2">
                            <Label htmlFor="archiveLocation" suppressHydrationWarning>
                                {t('audit_page.retention.archive_location')}
                            </Label>
                            <Input
                                id="archiveLocation"
                                value={config.archiveLocation || ''}
                                onChange={(e) =>
                                    setConfig({ ...config, archiveLocation: e.target.value })
                                }
                                placeholder="./backup/audit-archive"
                            />
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                {t('audit_page.retention.saving')}
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                {t('audit_page.retention.save')}
                            </>
                        )}
                    </Button>
                    <Button variant="outline" onClick={loadConfig} disabled={saving}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {t('audit_page.retention.refresh')}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

