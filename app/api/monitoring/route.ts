import { NextRequest, NextResponse } from 'next/server'
import { applySecurityHeaders } from '@/middlewares/security-headers'
import { rateLimitMiddleware, rateLimitConfigs } from '@/middlewares/rate-limit'

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

// Generate real-time monitoring data
function generateMonitoringData(): MonitoringData {
  const now = new Date()

  // Simulate realistic metrics with some variation
  const baseActiveUsers = 25 + Math.sin(now.getMinutes() * 0.1) * 15
  const baseApiCalls = 800 + Math.cos(now.getMinutes() * 0.2) * 200

  const metrics = {
    activeUsers: Math.max(5, Math.round(baseActiveUsers + (Math.random() - 0.5) * 10)),
    totalUsers: 450 + Math.round(Math.random() * 50),
    recentLogins: Math.round(Math.random() * 30) + 5,
    apiCalls: Math.max(100, Math.round(baseApiCalls + (Math.random() - 0.5) * 100)),
    storageUsed: Math.round(Math.random() * 40) + 15,
    cpuUsage: Math.round(Math.random() * 25) + 15,
    responseTime: Math.round(Math.random() * 50) + 75
  }

  const performance = {
    averageResponseTime: Math.round(metrics.responseTime + (Math.random() - 0.5) * 20),
    errorRate: Math.round(Math.random() * 5 * 100) / 100, // 0-5%
    throughput: Math.round(metrics.apiCalls / 60) // requests per second
  }

  // Generate alerts based on metrics
  const alerts = generateMonitoringAlerts(metrics, performance)

  return {
    timestamp: now.toISOString(),
    metrics,
    performance,
    alerts
  }
}

function generateMonitoringAlerts(metrics: any, performance: any): Alert[] {
  const alerts: Alert[] = []
  const now = new Date()

  // CPU usage alerts
  if (metrics.cpuUsage > 80) {
    alerts.push({
      id: `cpu-high-${Date.now()}`,
      type: 'warning',
      message: `High CPU usage detected: ${metrics.cpuUsage}%`,
      timestamp: now.toISOString(),
      resolved: false,
      severity: 'high'
    })
  }

  // Memory alerts (would check actual memory in real implementation)
  if (Math.random() < 0.05) { // 5% chance of memory alert
    alerts.push({
      id: `memory-critical-${Date.now()}`,
      type: 'error',
      message: 'Critical memory usage detected',
      timestamp: now.toISOString(),
      resolved: false,
      severity: 'critical'
    })
  }

  // Response time alerts
  if (performance.averageResponseTime > 2000) {
    alerts.push({
      id: `response-slow-${Date.now()}`,
      type: 'warning',
      message: `Slow response times: ${performance.averageResponseTime}ms average`,
      timestamp: now.toISOString(),
      resolved: false,
      severity: 'medium'
    })
  }

  // Error rate alerts
  if (performance.errorRate > 2) {
    alerts.push({
      id: `error-rate-high-${Date.now()}`,
      type: 'error',
      message: `High error rate: ${performance.errorRate}%`,
      timestamp: now.toISOString(),
      resolved: false,
      severity: 'high'
    })
  }

  // System maintenance alerts (simulated)
  if (Math.random() < 0.02) { // 2% chance
    alerts.push({
      id: `maintenance-${Date.now()}`,
      type: 'info',
      message: 'Scheduled maintenance completed successfully',
      timestamp: now.toISOString(),
      resolved: true,
      severity: 'low'
    })
  }

  return alerts
}

export async function GET(request: NextRequest) {
  // Apply rate limiting for monitoring data
  const rateLimitResult = rateLimitMiddleware(request, rateLimitConfigs.api)
  if (rateLimitResult) {
    return applySecurityHeaders(rateLimitResult)
  }

  try {
    const monitoringData = generateMonitoringData()

    return applySecurityHeaders(NextResponse.json(monitoringData))

  } catch (error) {
    console.error('Monitoring data fetch failed:', error)

    const errorData: MonitoringData = {
      timestamp: new Date().toISOString(),
      metrics: {
        activeUsers: 0,
        totalUsers: 0,
        recentLogins: 0,
        apiCalls: 0,
        storageUsed: 0,
        cpuUsage: 0,
        responseTime: 0
      },
      performance: {
        averageResponseTime: 0,
        errorRate: 0,
        throughput: 0
      },
      alerts: [{
        id: `monitoring-error-${Date.now()}`,
        type: 'error',
        message: 'Failed to fetch monitoring data',
        timestamp: new Date().toISOString(),
        resolved: false,
        severity: 'high'
      }]
    }

    return applySecurityHeaders(NextResponse.json(errorData, { status: 500 }))
  }
}
