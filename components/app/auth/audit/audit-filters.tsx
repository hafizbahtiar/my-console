"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "@/lib/language-context"
import {
  Search,
  Filter,
  CalendarIcon,
  Download,
  FileText,
  ChevronDown,
  ChevronUp
} from "lucide-react"

interface AuditFiltersProps {
  searchTerm: string
  setSearchTerm: (value: string) => void
  actionFilter: string
  setActionFilter: (value: string) => void
  resourceFilter: string
  setResourceFilter: (value: string) => void
  dateRange: { from?: Date, to?: Date }
  setDateRange: (range: { from?: Date, to?: Date }) => void
  severityFilter: string
  setSeverityFilter: (value: string) => void
  showAdvancedFilters: boolean
  setShowAdvancedFilters: (show: boolean) => void
  exportFormat: string
  setExportFormat: (format: string) => void
  onExport: () => void
  onComplianceReport: () => void
  filteredLogsCount: number
  uniqueActions: string[]
  uniqueResources: string[]
}

export function AuditFilters({
  searchTerm,
  setSearchTerm,
  actionFilter,
  setActionFilter,
  resourceFilter,
  setResourceFilter,
  dateRange,
  setDateRange,
  severityFilter,
  setSeverityFilter,
  showAdvancedFilters,
  setShowAdvancedFilters,
  exportFormat,
  setExportFormat,
  onExport,
  onComplianceReport,
  filteredLogsCount,
  uniqueActions,
  uniqueResources
}: AuditFiltersProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg" suppressHydrationWarning>
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            {t('audit_page.filters.title')}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex-1 sm:flex-initial"
            >
              {showAdvancedFilters ? <ChevronUp className="h-4 w-4 mr-1 shrink-0" /> : <ChevronDown className="h-4 w-4 mr-1 shrink-0" />}
              <span className="truncate" suppressHydrationWarning>{t('audit_page.filters.advanced')}</span>
            </Button>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className="w-20 sm:w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={onExport} disabled={filteredLogsCount === 0} size="sm" className="flex-1 sm:flex-initial">
              <Download className="h-4 w-4 mr-2 shrink-0" />
              <span className="truncate" suppressHydrationWarning>{t('audit_page.filters.export')}</span>
            </Button>
            <Button onClick={onComplianceReport} variant="outline" size="sm" className="flex-1 sm:flex-initial">
              <FileText className="h-4 w-4 mr-2 shrink-0" />
              <span className="truncate hidden sm:inline" suppressHydrationWarning>{t('audit_page.filters.compliance_report')}</span>
              <span className="truncate sm:hidden" suppressHydrationWarning>{t('audit_page.filters.report')}</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
        {/* Basic Filters */}
        <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder={t('audit_page.filters.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
          </div>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full sm:w-40 text-sm">
              <SelectValue placeholder={t('audit_page.filters.all_actions')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" suppressHydrationWarning>{t('audit_page.filters.all_actions')}</SelectItem>
              {uniqueActions.map(action => (
                <SelectItem key={action} value={action} className="text-sm">{action}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={resourceFilter} onValueChange={setResourceFilter}>
            <SelectTrigger className="w-full sm:w-40 text-sm">
              <SelectValue placeholder={t('audit_page.filters.all_resources')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" suppressHydrationWarning>{t('audit_page.filters.all_resources')}</SelectItem>
              {uniqueResources.map(resource => (
                <SelectItem key={resource} value={resource} className="text-sm">{resource}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="border-t pt-4 space-y-4">
            <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:flex-wrap">
              {/* Date Range */}
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center flex-1 min-w-0">
                <span className="text-xs sm:text-sm font-medium shrink-0" suppressHydrationWarning>
                  {t('audit_page.filters.date_range')}
                </span>
                <div className="flex flex-wrap gap-2 items-center flex-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-initial text-xs sm:text-sm">
                        <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 shrink-0" />
                        <span className="truncate" suppressHydrationWarning>
                          {dateRange.from ? dateRange.from.toLocaleDateString() : t('audit_page.filters.from')}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <span className="text-xs sm:text-sm text-muted-foreground shrink-0" suppressHydrationWarning>
                    {t('audit_page.filters.to')}
                  </span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-initial text-xs sm:text-sm">
                        <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 shrink-0" />
                        <span className="truncate" suppressHydrationWarning>
                          {dateRange.to ? dateRange.to.toLocaleDateString() : t('audit_page.filters.to')}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {(dateRange.from || dateRange.to) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDateRange({})}
                      className="text-xs sm:text-sm"
                      suppressHydrationWarning
                    >
                      {t('audit_page.filters.clear')}
                    </Button>
                  )}
                </div>
              </div>

              {/* Severity Filter */}
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-full sm:w-32 text-sm">
                  <SelectValue placeholder={t('audit_page.filters.severity')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-sm" suppressHydrationWarning>
                    {t('audit_page.filters.all_severity')}
                  </SelectItem>
                  <SelectItem value="low" className="text-sm" suppressHydrationWarning>
                    {t('audit_page.filters.low')}
                  </SelectItem>
                  <SelectItem value="medium" className="text-sm" suppressHydrationWarning>
                    {t('audit_page.filters.medium')}
                  </SelectItem>
                  <SelectItem value="high" className="text-sm" suppressHydrationWarning>
                    {t('audit_page.filters.high')}
                  </SelectItem>
                  <SelectItem value="critical" className="text-sm" suppressHydrationWarning>
                    {t('audit_page.filters.critical')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
