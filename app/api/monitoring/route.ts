import { NextRequest, NextResponse } from 'next/server'
import { createProtectedGET } from '@/lib/api-protection'

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
  alerts: Array<{
    id: string
    type: 'info' | 'warning' | 'error'
    message: string
    timestamp: string
    resolved: boolean
    severity?: 'low' | 'medium' | 'high'
  }>
}

function generateMonitoringData(): MonitoringData {
  // Simulate monitoring data collection
  // In production, this would query actual metrics from your monitoring system
  const metrics = {
    activeUsers: Math.floor(Math.random() * 100) + 50,
    totalUsers: Math.floor(Math.random() * 1000) + 500,
    recentLogins: Math.floor(Math.random() * 20) + 5,
    apiCalls: Math.floor(Math.random() * 10000) + 5000,
    storageUsed: Math.floor(Math.random() * 100) + 50, // GB
    cpuUsage: Math.random() * 50 + 20, // Percentage
    responseTime: Math.random() * 200 + 50 // ms
  }

  const performance = {
    averageResponseTime: metrics.responseTime,
    errorRate: Math.random() * 2, // Percentage
    throughput: metrics.apiCalls / 60 // Requests per second
  }

  const alerts = generateMonitoringAlerts(metrics, performance)

  return {
    timestamp: new Date().toISOString(),
    metrics,
    performance,
    alerts
  }
}

function generateMonitoringAlerts(metrics: any, performance: any): MonitoringData['alerts'] {
  const alerts: MonitoringData['alerts'] = []

  // CPU usage alert
  if (metrics.cpuUsage > 80) {
    alerts.push({
      id: `cpu-high-${Date.now()}`,
      type: 'warning',
      message: `High CPU usage detected: ${metrics.cpuUsage.toFixed(1)}%`,
      timestamp: new Date().toISOString(),
      resolved: false,
      severity: 'high'
    })
  }

  // Response time alert
  if (performance.averageResponseTime > 500) {
    alerts.push({
      id: `response-time-high-${Date.now()}`,
      type: 'warning',
      message: `High response time: ${performance.averageResponseTime.toFixed(0)}ms`,
      timestamp: new Date().toISOString(),
      resolved: false,
      severity: 'medium'
    })
  }

  // Error rate alert
  if (performance.errorRate > 5) {
    alerts.push({
      id: `error-rate-high-${Date.now()}`,
      type: 'error',
      message: `High error rate: ${performance.errorRate.toFixed(2)}%`,
      timestamp: new Date().toISOString(),
      resolved: false,
      severity: 'high'
    })
  }

  // Storage usage alert
  if (metrics.storageUsed > 90) {
    alerts.push({
      id: `storage-high-${Date.now()}`,
      type: 'warning',
      message: `Storage usage is high: ${metrics.storageUsed}GB`,
      timestamp: new Date().toISOString(),
      resolved: false,
      severity: 'medium'
    })
  }

  return alerts
}

export const GET = createProtectedGET(
  async () => {
    const monitoringData = generateMonitoringData()
    return NextResponse.json(monitoringData)
  },
  {
    rateLimit: 'api',
  }
)
