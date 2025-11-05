"use client"

import { useTranslation } from "@/lib/language-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('audit.filters_search')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              {showAdvancedFilters ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
              {t('audit.advanced')}
            </Button>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={onExport} disabled={filteredLogsCount === 0}>
              <Download className="h-4 w-4 mr-2" />
              {t('audit.export')}
            </Button>
            <Button onClick={onComplianceReport} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              {t('audit.compliance_report')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('audit.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('audit.all_actions')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('audit.all_actions')}</SelectItem>
              {uniqueActions.map(action => (
                <SelectItem key={action} value={action}>{action}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={resourceFilter} onValueChange={setResourceFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('audit.all_resources')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('audit.all_resources')}</SelectItem>
              {uniqueResources.map(resource => (
                <SelectItem key={resource} value={resource}>{resource}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="border-t pt-4 space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              {/* Date Range */}
              <div className="flex gap-2 items-center">
                <span className="text-sm font-medium">{t('audit.date_range')}</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {dateRange.from ? dateRange.from.toLocaleDateString() : t('audit.from')}
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
                <span className="text-muted-foreground">{t('audit.to')}</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {dateRange.to ? dateRange.to.toLocaleDateString() : t('audit.to')}
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
                  >
                    {t('audit.clear')}
                  </Button>
                )}
              </div>

              {/* Severity Filter */}
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder={t('audit.severity')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('audit.all_severity')}</SelectItem>
                  <SelectItem value="low">{t('audit.low')}</SelectItem>
                  <SelectItem value="medium">{t('audit.medium')}</SelectItem>
                  <SelectItem value="high">{t('audit.high')}</SelectItem>
                  <SelectItem value="critical">{t('audit.critical')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
