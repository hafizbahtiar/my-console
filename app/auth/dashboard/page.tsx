"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/language-context"
import { AuditActivity } from "@/components/app/auth/dashboard/audit-activity"
import { MonitoringDashboard } from "@/components/app/auth/dashboard/monitoring"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  User,
  Settings,
  Activity,
  BarChart3,
  TrendingUp,
  Users,
  Database,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Calendar,
  FileText,
  Zap
} from "lucide-react"
import { toast } from "sonner"

interface MonitoringData {
  metrics: {
    activeUsers: number
    totalUsers: number
    recentLogins: number
    apiCalls: number
    storageUsed: number
    cpuUsage: number
    responseTime: number
  }
}

export default function Dashboard() {
  const { user, logout, loading } = useAuth()
  const { t } = useTranslation()
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null)

  const handleLogout = async () => {
    try {
      await logout()
      toast.success(t('auth.logout_success'))
      window.location.href = '/'
    } catch (error) {
      toast.error(t('auth.logout'))
    }
  }

  // Fetch monitoring data for dashboard stats
  const fetchMonitoringData = async () => {
    try {
      const response = await fetch('/api/monitoring')
      if (response.ok) {
        const data = await response.json()
        setMonitoringData(data)
      }
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error)
      // Keep existing data or set defaults
      setMonitoringData(prev => prev || {
        metrics: {
          activeUsers: 1,
          totalUsers: 1,
          recentLogins: 1,
          apiCalls: 0,
          storageUsed: 0,
          cpuUsage: 15,
          responseTime: 150
        }
      })
    }
  }

  useEffect(() => {
    fetchMonitoringData()
    // Refresh every 60 seconds for dashboard stats
    const interval = setInterval(fetchMonitoringData, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    window.location.href = '/'
    return null
  }

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.title")}</h1>
        <p className="text-muted-foreground">
          {t("dashboard.welcome_back", { name: user.name || user.email })}
        </p>
      </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              {t("status.online")}
            </Badge>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.active_users')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monitoringData?.metrics.activeUsers ?? 1}
            </div>
            <p className="text-xs text-muted-foreground">
              {monitoringData?.metrics.recentLogins ?? 0} {t('dashboard.recent_logins')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.total_users')}</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monitoringData?.metrics.totalUsers ?? 1}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.registered_users')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.api_calls')}</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monitoringData?.metrics.apiCalls ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.this_month')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.system_load')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              (monitoringData?.metrics.cpuUsage ?? 0) > 80 ? 'text-red-600' :
              (monitoringData?.metrics.cpuUsage ?? 0) > 60 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {monitoringData?.metrics.cpuUsage ?? 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.cpu_usage')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">{t("dashboard.overview")}</TabsTrigger>
          <TabsTrigger value="activity">{t("dashboard.activity")}</TabsTrigger>
          <TabsTrigger value="analytics">{t("dashboard.analytics")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* User Profile */}
            <Card className="col-span-4">
              <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t("profile.user_profile")}
              </CardTitle>
              <CardDescription>
                {t("profile.user_profile_desc")}
              </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-lg">
                      {getInitials(user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">{user.name || 'User'}</h3>
                    <p className="text-muted-foreground">{user.email}</p>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{t('dashboard.active')}</Badge>
                      <Badge variant={user.emailVerification ? "default" : "secondary"}>
                        {user.emailVerification ? t('dashboard.verified') : t('dashboard.unverified')}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('dashboard.account_completion')}</span>
                    <span className="font-medium">75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {t('dashboard.complete_profile')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="col-span-3">
              <CardHeader>
              <CardTitle>{t("actions.quick_actions")}</CardTitle>
              <CardDescription>
                {t("actions.common_tasks")}
              </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="default" className="w-full justify-start" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  {t("actions.create_project")}
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  {t("actions.account_settings")}
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  {t("actions.security_settings")}
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  {t("actions.team_management")}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Welcome Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {t("welcome.welcome_desc")}
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <AuditActivity />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <MonitoringDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}
