"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "@/lib/language-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Shield,
  User,
  Settings,
  Database,
  Activity,
  Info
} from "lucide-react"

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

interface AuditTableProps {
  filteredLogs: AuditLog[]
  totalLogs: number
}

export function AuditTable({ filteredLogs, totalLogs }: AuditTableProps) {
  const { t } = useTranslation()

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10) // Default to 10 items per page
  const pageSizeOptions = [10, 25, 50, 100]

  // Calculate pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex)


  // Reset to first page when filtered logs change or page size changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filteredLogs.length, itemsPerPage])

  // Handle page size change
  const handlePageSizeChange = (newSize: string) => {
    const size = parseInt(newSize)
    setItemsPerPage(size)
    setCurrentPage(1) // Reset to first page
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'USER_LOGIN': return <Shield className="h-4 w-4 text-green-600" />
      case 'USER_LOGOUT': return <Shield className="h-4 w-4 text-orange-600" />
      case 'PROFILE_UPDATE': return <User className="h-4 w-4 text-blue-600" />
      case 'SETTINGS_CHANGE': return <Settings className="h-4 w-4 text-purple-600" />
      case 'SECURITY_EVENT': return <Shield className="h-4 w-4 text-red-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'USER_LOGIN': return 'default'
      case 'USER_LOGOUT': return 'secondary'
      case 'PROFILE_UPDATE': return 'default'
      case 'SETTINGS_CHANGE': return 'outline'
      case 'SECURITY_EVENT': return 'destructive'
      default: return 'secondary'
    }
  }

  const getActionDescription = (log: AuditLog) => {
    switch (log.action) {
      case 'USER_LOGIN':
        return t('audit.user_logged_in')
      case 'USER_LOGOUT':
        return t('audit.user_logged_out')
      case 'PROFILE_UPDATE':
        return t('audit.profile_updated')
      case 'SETTINGS_CHANGE':
        return t('audit.settings_changed')
      case 'SECURITY_EVENT':
        return t('audit.security_event')
      default:
        return t('audit.unknown_action')
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const parseJsonField = (jsonString?: string) => {
    if (!jsonString) return null
    try {
      return JSON.parse(jsonString)
    } catch {
      return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
        <CardTitle>{t('audit.activity_log')}</CardTitle>
        <CardDescription>
              {t('audit.showing_entries_paginated', {
                showing: paginatedLogs.length.toString(),
            filtered: filteredLogs.length.toString(),
            total: totalLogs.toString()
          })}
        </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('audit.show')}</span>
            <Select value={itemsPerPage.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map(size => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">{t('audit.entries')}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] w-full">
          <Accordion type="single" collapsible className="w-full space-y-2">
            {paginatedLogs.map((log) => (
              <AccordionItem
                key={log.$id}
                value={log.$id}
                className="border border-border/50 rounded-lg px-4 hover:bg-muted/30 transition-colors"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center justify-between w-full mr-4">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Action Icon & Badge */}
                      <div className="flex items-center gap-2 min-w-0">
                        {getActionIcon(log.action)}
                        <Badge
                          variant={getActionBadgeVariant(log.action)}
                          className="text-xs px-2 py-1"
                        >
                          {log.action.replace('_', ' ')}
                        </Badge>
                      </div>

                      {/* User */}
                      <div className="hidden sm:block text-sm text-muted-foreground min-w-0">
                        {log.userId === 'system' ? (
                          <Badge variant="outline" className="text-xs">{t('audit.system')}</Badge>
                        ) : (
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {log.userId.slice(0, 8)}...
                          </code>
                        )}
                      </div>

                      {/* Resource */}
                      <div className="text-sm text-muted-foreground min-w-0 truncate">
                        {log.resource}
                      </div>

                      {/* Timestamp */}
                      <div className="text-xs text-muted-foreground ml-auto">
                        {formatTimestamp(log.$createdAt)}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-4">
                    {/* Action Description */}
                    <div className="text-sm">
                      <span className="font-medium">{getActionDescription(log)}</span>
                    </div>

                    <Separator />

                    {/* Detailed Information */}
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Basic Info */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">{t('audit.resource_information')}</h4>
                        <div className="space-y-1 text-xs">
                          <div><strong>{t('audit.user_agent')}:</strong> {log.userAgent || 'N/A'}</div>
                          <div><strong>{t('audit.ip_address')}:</strong> {log.ipAddress || 'N/A'}</div>
                          <div><strong>{t('audit.session_id')}:</strong> {log.sessionId || 'N/A'}</div>
                        </div>
                      </div>

                      {/* Changes */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">{t('audit.changes_summary')}</h4>
                        <div className="space-y-2 text-xs">
                          {log.oldValues && (
                            <div>
                              <div className="font-medium text-red-600">{t('audit.old_value')}:</div>
                              <pre className="bg-red-50 dark:bg-red-950 p-2 rounded text-xs overflow-x-auto">
                                {JSON.stringify(parseJsonField(log.oldValues), null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.newValues && (
                            <div>
                              <div className="font-medium text-green-600">{t('audit.new_value')}:</div>
                              <pre className="bg-green-50 dark:bg-green-950 p-2 rounded text-xs overflow-x-auto">
                                {JSON.stringify(parseJsonField(log.newValues), null, 2)}
                              </pre>
                            </div>
                          )}
                          {!log.oldValues && !log.newValues && (
                            <div className="text-muted-foreground italic">
                              {t('audit.no_changes')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Technical Details */}
                    {log.metadata && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">{t('audit.technical_details')}</h4>
                          <div className="text-xs bg-muted p-2 rounded">
                            <strong>{t('audit.metadata')}:</strong>
                            <pre className="mt-1 overflow-x-auto">
                              {JSON.stringify(parseJsonField(log.metadata), null, 2)}
                            </pre>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber
                  if (totalPages <= 5) {
                    pageNumber = i + 1
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i
                  } else {
                    pageNumber = currentPage - 2 + i
                  }

                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNumber)}
                        isActive={currentPage === pageNumber}
                        className="cursor-pointer"
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => setCurrentPage(totalPages)}
                        className="cursor-pointer"
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
