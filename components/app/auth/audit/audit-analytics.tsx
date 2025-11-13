"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from "@/lib/language-context"
import { BarChart3, TrendingUp, Users, Shield, Activity, Clock } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

interface AnalyticsData {
    activityTrends: { date: string; count: number }[]
    topActions: { action: string; count: number; percentage: number }[]
    topUsers: { userId: string; count: number; percentage: number }[]
    topResources: { resource: string; count: number; percentage: number }[]
    hourlyDistribution: { hour: number; count: number }[]
    actionDistribution: { action: string; count: number }[]
    securityEvents: {
        total: number
        byType: Record<string, number>
        recent: any[]
    }
    timeRange: {
        from: string
        to: string
    }
}

export function AuditAnalytics() {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(true)
    const [days, setDays] = useState(30)
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)

    useEffect(() => {
        loadAnalytics()
    }, [days])

    const loadAnalytics = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/audit/analytics?days=${days}`)
            const data = await response.json()

            if (data.success && data.data) {
                setAnalytics(data.data)
            }
        } catch (error) {
            console.error('Failed to load analytics:', error)
        } finally {
            setLoading(false)
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
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        )
    }

    if (!analytics) {
        return null
    }

    const maxActivityCount = Math.max(...analytics.activityTrends.map((t) => t.count), 1)
    const maxHourlyCount = Math.max(...analytics.hourlyDistribution.map((h) => h.count), 1)

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            <CardTitle suppressHydrationWarning>{t('audit_page.analytics.title')}</CardTitle>
                        </div>
                        <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7">7 {t('audit_page.analytics.days')}</SelectItem>
                                <SelectItem value="30">30 {t('audit_page.analytics.days')}</SelectItem>
                                <SelectItem value="90">90 {t('audit_page.analytics.days')}</SelectItem>
                                <SelectItem value="365">365 {t('audit_page.analytics.days')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <CardDescription suppressHydrationWarning>
                        {t('audit_page.analytics.description')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Activity Trends */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="h-4 w-4" />
                            <h3 className="font-semibold" suppressHydrationWarning>
                                {t('audit_page.analytics.activity_trends')}
                            </h3>
                        </div>
                        <div className="h-48 flex items-end gap-1 overflow-x-auto">
                            {analytics.activityTrends.map((trend, index) => (
                                <div
                                    key={index}
                                    className="flex-1 min-w-[40px] flex flex-col items-center gap-1"
                                >
                                    <div
                                        className="w-full bg-primary rounded-t transition-all hover:opacity-80"
                                        style={{
                                            height: `${(trend.count / maxActivityCount) * 100}%`,
                                            minHeight: trend.count > 0 ? '4px' : '0',
                                        }}
                                        title={`${trend.date}: ${trend.count}`}
                                    />
                                    <span className="text-xs text-muted-foreground rotate-90 origin-center whitespace-nowrap">
                                        {new Date(trend.date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Hourly Distribution */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="h-4 w-4" />
                            <h3 className="font-semibold" suppressHydrationWarning>
                                {t('audit_page.analytics.hourly_distribution')}
                            </h3>
                        </div>
                        <div className="h-48 flex items-end gap-1">
                            {analytics.hourlyDistribution.map((hour) => (
                                <div
                                    key={hour.hour}
                                    className="flex-1 flex flex-col items-center gap-1"
                                >
                                    <div
                                        className="w-full bg-secondary rounded-t transition-all hover:opacity-80"
                                        style={{
                                            height: `${(hour.count / maxHourlyCount) * 100}%`,
                                            minHeight: hour.count > 0 ? '4px' : '0',
                                        }}
                                        title={`${hour.hour}:00 - ${hour.count}`}
                                    />
                                    <span className="text-xs text-muted-foreground">{hour.hour}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Top Actions */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            <CardTitle className="text-base" suppressHydrationWarning>
                                {t('audit_page.analytics.top_actions')}
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {analytics.topActions.slice(0, 5).map((action, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{action.action}</span>
                                            <Badge variant="secondary" className="text-xs">
                                                {action.percentage}%
                                            </Badge>
                                        </div>
                                        <div className="mt-1 h-2 bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all"
                                                style={{ width: `${action.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className="ml-4 text-sm font-semibold">{action.count}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Resources */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            <CardTitle className="text-base" suppressHydrationWarning>
                                {t('audit_page.analytics.top_resources')}
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {analytics.topResources.slice(0, 5).map((resource, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{resource.resource}</span>
                                            <Badge variant="secondary" className="text-xs">
                                                {resource.percentage}%
                                            </Badge>
                                        </div>
                                        <div className="mt-1 h-2 bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all"
                                                style={{ width: `${resource.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className="ml-4 text-sm font-semibold">{resource.count}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Users */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <CardTitle className="text-base" suppressHydrationWarning>
                                {t('audit_page.analytics.top_users')}
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {analytics.topUsers.slice(0, 5).map((user, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-mono text-xs truncate max-w-[150px]">
                                                {user.userId}
                                            </span>
                                            <Badge variant="secondary" className="text-xs">
                                                {user.percentage}%
                                            </Badge>
                                        </div>
                                        <div className="mt-1 h-2 bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all"
                                                style={{ width: `${user.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className="ml-4 text-sm font-semibold">{user.count}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Security Events */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            <CardTitle className="text-base" suppressHydrationWarning>
                                {t('audit_page.analytics.security_events')}
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <div className="text-2xl font-bold">{analytics.securityEvents.total}</div>
                                <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                                    {t('audit_page.analytics.total_security_events')}
                                </p>
                            </div>
                            {Object.keys(analytics.securityEvents.byType).length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold" suppressHydrationWarning>
                                        {t('audit_page.analytics.by_type')}
                                    </h4>
                                    {Object.entries(analytics.securityEvents.byType)
                                        .slice(0, 5)
                                        .map(([type, count]) => (
                                            <div
                                                key={type}
                                                className="flex items-center justify-between text-sm"
                                            >
                                                <span className="truncate">{type}</span>
                                                <Badge variant="destructive">{count}</Badge>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

