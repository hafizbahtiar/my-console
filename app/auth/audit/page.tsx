"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "@/lib/language-context"
import { auditLogger } from "@/lib/audit-log"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { AuditStats, AuditFilters, AuditTable } from "@/components/app/auth/audit"

interface AuditLog {
  $id: string
  userId: string
  action: string
  resource: string
  resourceId?: string
  oldValues?: string
  newValues?: string
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  metadata?: string
  $createdAt: string
}

export default function AuditPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Advanced Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [resourceFilter, setResourceFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<{ from?: Date, to?: Date }>({})
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [exportFormat, setExportFormat] = useState<string>("csv")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)


  useEffect(() => {
    if (user?.$id) {
      loadAuditLogs()
    }
  }, [user?.$id])

  const loadAuditLogs = async () => {
    try {
      setRefreshing(true)
      const auditLogs = await auditLogger.getRecentLogs(100, user?.$id)
      setLogs(auditLogs as AuditLog[])
    } catch (error) {
      console.error('Failed to load audit logs:', error)
      toast.error(t('general_use.error'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === "" ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.ipAddress && log.ipAddress.includes(searchTerm)) ||
      (log.userAgent && log.userAgent.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesAction = actionFilter === "all" || log.action === actionFilter
    const matchesResource = resourceFilter === "all" || log.resource === resourceFilter

    // Date range filtering
    const logDate = new Date(log.$createdAt)
    const matchesDateRange = (!dateRange.from || logDate >= dateRange.from) &&
      (!dateRange.to || logDate <= dateRange.to)

    // Severity filtering based on action type
    const getSeverity = (action: string) => {
      if (action.includes('SECURITY') || action.includes('FAILED')) return 'high'
      if (action.includes('UPDATE') || action.includes('DELETE')) return 'medium'
      return 'low'
    }
    const matchesSeverity = severityFilter === "all" || getSeverity(log.action) === severityFilter

    return matchesSearch && matchesAction && matchesResource && matchesDateRange && matchesSeverity
  })

  // Get unique values for filters
  const uniqueActions = [...new Set(logs.map(log => log.action))]
  const uniqueResources = [...new Set(logs.map(log => log.resource))]

  // Export functionality
  const exportLogs = () => {
    const dataToExport = filteredLogs.map(log => ({
      timestamp: new Date(log.$createdAt).toISOString(),
      userId: log.userId,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId || '',
      ipAddress: log.ipAddress || '',
      userAgent: log.userAgent || '',
      oldValues: log.oldValues || '',
      newValues: log.newValues || '',
      metadata: log.metadata || ''
    }))

    if (exportFormat === 'csv') {
      exportToCSV(dataToExport)
    } else if (exportFormat === 'json') {
      exportToJSON(dataToExport)
    }

    toast.success(t('audit.export_success', {
      count: dataToExport.length.toString(),
      format: exportFormat.toUpperCase()
    }))
  }

  const exportToCSV = (data: any[]) => {
    const headers = Object.keys(data[0] || {})
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportToJSON = (data: any[]) => {
    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Compliance reporting
  const generateComplianceReport = () => {
    const now = new Date()
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const complianceData = {
      reportPeriod: `${lastMonth.toISOString().split('T')[0]} to ${now.toISOString().split('T')[0]}`,
      totalLogs: logs.length,
      securityEvents: logs.filter(log => log.action.includes('SECURITY')).length,
      failedLogins: logs.filter(log => log.action.includes('FAILED')).length,
      userActivity: logs.filter(log => log.action.includes('LOGIN') || log.action.includes('LOGOUT')).length,
      dataModifications: logs.filter(log => log.action.includes('UPDATE') || log.action.includes('DELETE')).length,
      complianceStatus: 'compliant'
    }

    const jsonContent = JSON.stringify(complianceData, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `compliance-report-${now.toISOString().split('T')[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)

    toast.success(t('audit.compliance_report_generated'))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('audit.title')}</h1>
          <p className="text-muted-foreground">{t('audit.loading')}</p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('audit.title')}</h1>
          <p className="text-muted-foreground">
            {t('audit.subtitle')}
          </p>
        </div>
        <Button onClick={loadAuditLogs} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {t('audit.refresh')}
        </Button>
      </div>

      {/* Stats Cards */}
      <AuditStats
        totalLogs={logs.length}
        todaysLogs={logs.filter(log =>
          new Date(log.$createdAt).toDateString() === new Date().toDateString()
        ).length}
        securityEvents={logs.filter(log => log.action === 'SECURITY_EVENT').length}
      />

      {/* Filters & Export */}
      <AuditFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        actionFilter={actionFilter}
        setActionFilter={setActionFilter}
        resourceFilter={resourceFilter}
        setResourceFilter={setResourceFilter}
        dateRange={dateRange}
        setDateRange={setDateRange}
        severityFilter={severityFilter}
        setSeverityFilter={setSeverityFilter}
        showAdvancedFilters={showAdvancedFilters}
        setShowAdvancedFilters={setShowAdvancedFilters}
        exportFormat={exportFormat}
        setExportFormat={setExportFormat}
        onExport={exportLogs}
        onComplianceReport={generateComplianceReport}
        filteredLogsCount={filteredLogs.length}
        uniqueActions={uniqueActions}
        uniqueResources={uniqueResources}
      />

      {/* Audit Logs Table */}
      <AuditTable
        filteredLogs={filteredLogs}
        totalLogs={logs.length}
      />
    </div>
  )
}
