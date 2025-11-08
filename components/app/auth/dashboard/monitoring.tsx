"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Activity,
  Users,
  Zap,
  Database,
  AlertTriangle,
  CheckCircle,
  Info,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Cpu,
  HardDrive,
  Clock,
  Server
} from "lucide-react"
import { toast } from "sonner"

interface MonitoringData {
  timestamp: string
  metrics: {
    activeUsers: number
    totalUsers: number
    recentLogins: number
    apiCalls: number
    storageUsed: number
    cpuUsage: number
    responseTime: number
  }
  performance: {
    averageResponseTime: number
    errorRate: number
    throughput: number
  }
  alerts: Alert[]
}

interface Alert {
  id: string
  type: 'error' | 'warning' | 'info'
  message: string
  timestamp: string
  resolved: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export function MonitoringDashboard() {
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Fetch monitoring data
  const fetchMonitoringData = async () => {
    try {
      const response = await fetch('/api/monitoring')
      if (!response.ok) throw new Error('Failed to fetch monitoring data')
      const data = await response.json()
      setMonitoringData(data)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error)
      toast.error('Failed to fetch monitoring data')
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchMonitoringData()

    const interval = setInterval(fetchMonitoringData, 30000)
    return () => clearInterval(interval)
  }, [])

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info': return <Info className="h-4 w-4 text-blue-500" />
      default: return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusColor = (value: number, thresholds: { warning: number, critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-500'
    if (value >= thresholds.warning) return 'text-yellow-500'
    return 'text-green-500'
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">System Monitoring</h2>
            <p className="text-muted-foreground">Real-time system metrics and performance</p>
          </div>
          <Button disabled>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!monitoringData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">System Monitoring</h2>
            <p className="text-muted-foreground">Real-time system metrics and performance</p>
          </div>
          <Button onClick={fetchMonitoringData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Failed to load monitoring data</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { metrics, performance, alerts } = monitoringData
  const activeAlerts = alerts.filter(alert => !alert.resolved)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time system metrics and performance
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <Button onClick={fetchMonitoringData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.recentLogins} recent logins
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.cpuUsage, { warning: 70, critical: 90 })}`}>
              {metrics.cpuUsage}%
            </div>
            <Progress value={metrics.cpuUsage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.responseTime, { warning: 500, critical: 1000 })}`}>
              {metrics.responseTime}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: {performance.averageResponseTime}ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Throughput</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance.throughput}</div>
            <p className="text-xs text-muted-foreground">
              Requests per second
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Health & Performance */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Health
            </CardTitle>
            <CardDescription>Current system resource usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>CPU Usage</span>
                <span className={getStatusColor(metrics.cpuUsage, { warning: 70, critical: 90 })}>
                  {metrics.cpuUsage}%
                </span>
              </div>
              <Progress value={metrics.cpuUsage} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Memory Usage</span>
                <span className="text-muted-foreground">N/A</span>
              </div>
              <Progress value={0} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Storage Used</span>
                <span>{metrics.storageUsed} MB</span>
              </div>
              <Progress value={(metrics.storageUsed / 100) * 100} className="h-2" />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total Users</span>
                <div className="font-semibold">{metrics.totalUsers}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Error Rate</span>
                <div className={`font-semibold ${getStatusColor(performance.errorRate, { warning: 2, critical: 5 })}`}>
                  {performance.errorRate}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Active Alerts
              {activeAlerts.length > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {activeAlerts.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>System alerts and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            {activeAlerts.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm">All systems operational</p>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-32">
                <div className="space-y-3">
                  {activeAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-start gap-3 p-2 rounded-lg border">
                      <div className="mt-0.5">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{alert.message}</span>
                          <div className={`w-2 h-2 rounded-full ${getSeverityColor(alert.severity)}`} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Trends
          </CardTitle>
          <CardDescription>Real-time performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {performance.throughput}
              </div>
              <p className="text-sm text-muted-foreground">Requests/sec</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-600">+12%</span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {performance.averageResponseTime}ms
              </div>
              <p className="text-sm text-muted-foreground">Avg: {performance.averageResponseTime}ms</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <TrendingDown className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-600">-5%</span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {performance.errorRate}%
              </div>
              <p className="text-sm text-muted-foreground">Error Rate</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-red-500" />
                <span className="text-xs text-red-600">+2%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
