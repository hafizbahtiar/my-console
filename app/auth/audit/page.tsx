"use client"

import { useState, useEffect } from "react"
import { auditLogger } from "@/lib/audit-log"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/language-context"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { AuditStats, AuditFilters, AuditTable } from "@/components/app/auth/audit"
import { createPaginationParams, DEFAULT_PAGE_SIZE, getTotalPages } from "@/lib/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { exportAuditLogsToPDF } from "@/lib/audit-export"
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
  const { user } = useAuth()
  const { t, loading: translationLoading } = useTranslation()
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
  const [searchField, setSearchField] = useState<string>("all") // Field-specific search
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [resourceFilter, setResourceFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<{ from?: Date, to?: Date }>({})
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [exportFormat, setExportFormat] = useState<string>("csv")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])


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
      toast.error(t('audit_page.error'))
      setLogs([])
      setAllLogs([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Enhanced search function with field-specific search and operators
  const performSearch = (log: AuditLog, term: string, field: string): boolean => {
    if (!term) return true

    const lowerTerm = term.toLowerCase()
    
    // Parse search operators (AND, OR, NOT)
    const terms = term.split(/\s+(AND|OR|NOT)\s+/i).filter(t => t.trim())
    const operators = term.match(/\s+(AND|OR|NOT)\s+/gi) || []
    
    // If no operators, use simple search
    if (operators.length === 0) {
      return searchInField(log, lowerTerm, field)
    }

    // Handle operators
    let result = searchInField(log, terms[0].toLowerCase(), field)
    for (let i = 0; i < operators.length; i++) {
      const op = operators[i].trim().toUpperCase()
      const nextTerm = terms[i + 1]?.toLowerCase() || ''
      const nextResult = searchInField(log, nextTerm, field)
      
      if (op === 'AND') {
        result = result && nextResult
      } else if (op === 'OR') {
        result = result || nextResult
      } else if (op === 'NOT') {
        result = result && !nextResult
      }
    }
    
    return result
  }

  // Field-specific search
  const searchInField = (log: AuditLog, term: string, field: string): boolean => {
    if (!term) return true

    switch (field) {
      case 'action':
        return log.action.toLowerCase().includes(term)
      case 'resource':
        return log.resource.toLowerCase().includes(term)
      case 'userId':
        return log.userId.toLowerCase().includes(term)
      case 'ipAddress':
        return log.ipAddress?.toLowerCase().includes(term) || false
      case 'userAgent':
        return log.userAgent?.toLowerCase().includes(term) || false
      case 'resourceId':
        return log.resourceId?.toLowerCase().includes(term) || false
      case 'sessionId':
        return log.sessionId?.toLowerCase().includes(term) || false
      case 'all':
      default:
        return (
          log.action.toLowerCase().includes(term) ||
          log.resource.toLowerCase().includes(term) ||
          log.userId.toLowerCase().includes(term) ||
          (log.ipAddress?.toLowerCase().includes(term) ?? false) ||
          (log.userAgent?.toLowerCase().includes(term) ?? false) ||
          (log.resourceId?.toLowerCase().includes(term) ?? false) ||
          (log.sessionId?.toLowerCase().includes(term) ?? false)
        )
    }
  }

  // Filter all logs first, then paginate
  const filteredAllLogs = (Array.isArray(allLogs) ? allLogs : []).filter(log => {
    const matchesSearch = performSearch(log, searchTerm, searchField)
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

  // Save search to history
  useEffect(() => {
    if (searchTerm && searchTerm.length > 2) {
      const history = JSON.parse(localStorage.getItem('audit_search_history') || '[]') as string[]
      if (!history.includes(searchTerm)) {
        const newHistory = [searchTerm, ...history].slice(0, 10) // Keep last 10 searches
        localStorage.setItem('audit_search_history', JSON.stringify(newHistory))
        setSearchHistory(newHistory)
      }
    } else {
      const history = JSON.parse(localStorage.getItem('audit_search_history') || '[]') as string[]
      setSearchHistory(history)
    }
  }, [searchTerm])
  
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
  }, [searchTerm, searchField, actionFilter, resourceFilter, dateRange, severityFilter])

  // Load search history on mount
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('audit_search_history') || '[]') as string[]
    setSearchHistory(history)
  }, [])

  // Get unique values for filters (use allLogs for complete list)
  const uniqueActions = [...new Set((Array.isArray(allLogs) ? allLogs : []).map(log => log.action))]
  const uniqueResources = [...new Set((Array.isArray(allLogs) ? allLogs : []).map(log => log.resource))]

  // Export functionality
  const exportLogs = async () => {
    const dataToExport = filteredAllLogs.map(log => ({
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
    } else if (exportFormat === 'pdf') {
      try {
        await exportAuditLogsToPDF(
          filteredAllLogs,
          {
            searchTerm,
            actionFilter: actionFilter !== 'all' ? actionFilter : undefined,
            resourceFilter: resourceFilter !== 'all' ? resourceFilter : undefined,
            dateRange,
            severityFilter: severityFilter !== 'all' ? severityFilter : undefined,
          },
          totalFilteredLogs
        )
        toast.success(t('audit_page.filters.exported_success', { 
          count: dataToExport.length.toString(), 
          format: exportFormat.toUpperCase() 
        }))
      } catch (error) {
        console.error('PDF export failed:', error)
        toast.error(t('audit_page.filters.export_failed'))
      }
      return
    }

    toast.success(t('audit_page.filters.exported_success', { 
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

    toast.success(t('audit_page.filters.compliance_report_success'))
  }

  // Show skeleton while translations or audit data is loading
  if (translationLoading || loading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-32 sm:h-9 sm:w-40" />
            <Skeleton className="h-4 w-64 sm:h-5 sm:w-80" />
          </div>
          <Skeleton className="h-10 w-full sm:w-32" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters Skeleton */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Skeleton className="h-6 w-32" />
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-32" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
            <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-full sm:w-40" />
              <Skeleton className="h-10 w-full sm:w-40" />
            </div>
          </CardContent>
        </Card>

        {/* Table Skeleton */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1 min-w-0 flex-1">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" suppressHydrationWarning>
            {t('audit_page.title')}
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base" suppressHydrationWarning>
            {t('audit_page.description')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAuditLogs} disabled={refreshing} className="w-full sm:w-auto shrink-0">
          <RefreshCw className={`h-4 w-4 mr-2 shrink-0 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="truncate" suppressHydrationWarning>{t('audit_page.refresh')}</span>
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
        searchField={searchField}
        setSearchField={setSearchField}
        searchHistory={searchHistory}
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
        filteredLogsCount={filteredAllLogs.length}
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
        <div className="border-t p-4 sm:p-6">
          <Pagination>
            <PaginationContent className="flex-wrap gap-2">
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
                      className="text-xs sm:text-sm"
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
