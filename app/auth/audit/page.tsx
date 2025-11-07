"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "@/lib/language-context"
import { auditLogger } from "@/lib/audit-log"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { AuditStats, AuditFilters, AuditTable } from "@/components/app/auth/audit"
import { createPaginationParams, DEFAULT_PAGE_SIZE, getTotalPages } from "@/lib/pagination"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

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
  const [allLogs, setAllLogs] = useState<AuditLog[]>([]) // Store all logs for filtering
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalLogs, setTotalLogs] = useState(0)

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
  }, [user?.$id, currentPage, pageSize])

  const loadAuditLogs = async () => {
    try {
      setRefreshing(true)
      const paginationParams = createPaginationParams(currentPage, pageSize)
      
      // Load all logs once (cache will handle subsequent calls)
      const allResult = await auditLogger.getRecentLogs(10000, user?.$id, 0)
      const allLogsArray = (allResult.logs || []) as AuditLog[]
      setAllLogs(allLogsArray)
      setTotalLogs(allResult.total || 0)
      
      // Use the same data for paginated view
      const paginatedLogs = allLogsArray.slice(
        paginationParams.offset || 0,
        (paginationParams.offset || 0) + (paginationParams.limit || DEFAULT_PAGE_SIZE)
      )
      setLogs(paginatedLogs)
    } catch (error) {
      console.error('Failed to load audit logs:', error)
      toast.error(t('general_use.error'))
      setLogs([])
      setAllLogs([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Filter all logs first, then paginate
  const filteredAllLogs = (Array.isArray(allLogs) ? allLogs : []).filter(log => {
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
  
  // Apply pagination to filtered results
  const paginationParams = createPaginationParams(currentPage, pageSize)
  const filteredLogs = filteredAllLogs.slice(
    paginationParams.offset || 0,
    (paginationParams.offset || 0) + (paginationParams.limit || DEFAULT_PAGE_SIZE)
  )
  
  const totalFilteredLogs = filteredAllLogs.length
  const totalPages = getTotalPages(totalFilteredLogs, pageSize)
  
  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage > 1) {
      setCurrentPage(1)
    }
  }, [searchTerm, actionFilter, resourceFilter, dateRange, severityFilter])

  // Get unique values for filters (use allLogs for complete list)
  const uniqueActions = [...new Set((Array.isArray(allLogs) ? allLogs : []).map(log => log.action))]
  const uniqueResources = [...new Set((Array.isArray(allLogs) ? allLogs : []).map(log => log.resource))]

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
        totalLogs={totalFilteredLogs}
        todaysLogs={filteredAllLogs.filter(log =>
          new Date(log.$createdAt).toDateString() === new Date().toDateString()
        ).length}
        securityEvents={filteredAllLogs.filter(log => log.action === 'SECURITY_EVENT').length}
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
        totalLogs={totalFilteredLogs}
      />
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t p-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) {
                      setCurrentPage(currentPage - 1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(pageNum);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      isActive={currentPage === pageNum}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) {
                      setCurrentPage(currentPage + 1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
