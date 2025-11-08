"use client"

import { useState, useEffect } from "react"
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
        return 'User logged in'
      case 'USER_LOGOUT':
        return 'User logged out'
      case 'PROFILE_UPDATE':
        return 'Profile updated'
      case 'SETTINGS_CHANGE':
        return 'Settings changed'
      case 'SECURITY_EVENT':
        return 'Security event'
      default:
        return 'Unknown action'
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
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 min-w-0 flex-1">
            <CardTitle className="text-base sm:text-lg">Activity Log</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Showing {paginatedLogs.length} of {filteredLogs.length} entries (Total: {totalLogs})
        </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Show</span>
            <Select value={itemsPerPage.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-16 sm:w-20 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map(size => (
                  <SelectItem key={size} value={size.toString()} className="text-xs sm:text-sm">
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">entries</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <ScrollArea className="h-[400px] sm:h-[500px] w-full">
          <Accordion type="single" collapsible className="w-full space-y-2">
            {paginatedLogs.map((log) => (
              <AccordionItem
                key={log.$id}
                value={log.$id}
                className="border border-border/50 rounded-lg px-3 sm:px-4 hover:bg-muted/30 transition-colors"
              >
                <AccordionTrigger className="hover:no-underline py-3 sm:py-4">
                  <div className="flex items-center justify-between w-full mr-2 sm:mr-4">
                    <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                      {/* Action Icon & Badge */}
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <div className="shrink-0">{getActionIcon(log.action)}</div>
                        <Badge
                          variant={getActionBadgeVariant(log.action)}
                          className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 whitespace-nowrap"
                        >
                          <span className="hidden sm:inline">{log.action.replace('_', ' ')}</span>
                          <span className="sm:hidden">{log.action.split('_')[0]}</span>
                        </Badge>
                      </div>

                      {/* User */}
                      <div className="hidden md:block text-xs sm:text-sm text-muted-foreground shrink-0">
                        {log.userId === 'system' ? (
                          <Badge variant="outline" className="text-xs">System</Badge>
                        ) : (
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {log.userId.slice(0, 8)}...
                          </code>
                        )}
                      </div>

                      {/* Resource */}
                      <div className="text-xs sm:text-sm text-muted-foreground min-w-0 truncate hidden sm:block">
                        {log.resource}
                      </div>

                      {/* Timestamp */}
                      <div className="text-xs text-muted-foreground ml-auto shrink-0 text-right">
                        <div className="hidden sm:block">{formatTimestamp(log.$createdAt)}</div>
                        <div className="sm:hidden">{new Date(log.$createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-3 sm:pb-4 pt-2">
                  <div className="space-y-3 sm:space-y-4">
                    {/* Action Description */}
                    <div className="text-xs sm:text-sm">
                      <span className="font-medium">{getActionDescription(log)}</span>
                    </div>

                    <Separator />

                    {/* Detailed Information */}
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
                      {/* Basic Info */}
                      <div className="space-y-2">
                        <h4 className="text-xs sm:text-sm font-medium">Resource Information</h4>
                        <div className="space-y-1.5 text-xs">
                          <div className="break-words">
                            <strong className="block mb-0.5">User Agent</strong>
                            <span className="text-muted-foreground">{log.userAgent || 'N/A'}</span>
                          </div>
                          <div className="break-words">
                            <strong className="block mb-0.5">IP Address</strong>
                            <span className="text-muted-foreground">{log.ipAddress || 'N/A'}</span>
                          </div>
                          <div className="break-words">
                            <strong className="block mb-0.5">Session ID</strong>
                            <span className="text-muted-foreground font-mono text-xs">{log.sessionId || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Changes */}
                      <div className="space-y-2">
                        <h4 className="text-xs sm:text-sm font-medium">Changes Summary</h4>
                        <div className="space-y-2 text-xs">
                          {log.oldValues && (
                            <div>
                              <div className="font-medium text-red-600 mb-1">Old Value</div>
                              <pre className="bg-red-50 dark:bg-red-950 p-2 rounded text-xs overflow-x-auto max-h-[150px] sm:max-h-none">
                                {JSON.stringify(parseJsonField(log.oldValues), null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.newValues && (
                            <div>
                              <div className="font-medium text-green-600 mb-1">New Value</div>
                              <pre className="bg-green-50 dark:bg-green-950 p-2 rounded text-xs overflow-x-auto max-h-[150px] sm:max-h-none">
                                {JSON.stringify(parseJsonField(log.newValues), null, 2)}
                              </pre>
                            </div>
                          )}
                          {!log.oldValues && !log.newValues && (
                            <div className="text-muted-foreground italic">
                              No changes
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
                          <h4 className="text-xs sm:text-sm font-medium">Technical Details</h4>
                          <div className="text-xs bg-muted p-2 rounded">
                            <strong className="block mb-1">Metadata</strong>
                            <pre className="mt-1 overflow-x-auto max-h-[150px] sm:max-h-none">
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
          <div className="flex justify-center mt-4 sm:mt-6">
            <Pagination>
              <PaginationContent className="flex-wrap gap-1 sm:gap-2">
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={`text-xs sm:text-sm ${currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
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
                        className="cursor-pointer text-xs sm:text-sm"
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
                        className="cursor-pointer text-xs sm:text-sm"
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={`text-xs sm:text-sm ${currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
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
