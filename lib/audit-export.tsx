import React from 'react'
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer'

// Register fonts (optional - using default fonts for now)
// Font.register({
//   family: 'Roboto',
//   src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf'
// })

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

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #000',
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  metaInfo: {
    fontSize: 9,
    color: '#666',
    marginTop: 5,
  },
  table: {
    display: 'flex',
    width: 'auto',
    marginTop: 15,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #eee',
    paddingVertical: 5,
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
    paddingVertical: 8,
  },
  tableCell: {
    padding: 5,
    fontSize: 9,
  },
  colId: { width: '8%' },
  colTimestamp: { width: '15%' },
  colUser: { width: '12%' },
  colAction: { width: '15%' },
  colResource: { width: '12%' },
  colIp: { width: '15%' },
  colDetails: { width: '23%' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
    borderTop: '1 solid #eee',
    paddingTop: 10,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    right: 30,
    fontSize: 8,
    color: '#666',
  },
})

// PDF Document Component
const AuditLogsPDF: React.FC<{ 
  logs: AuditLog[]
  filters: {
    searchTerm?: string
    actionFilter?: string
    resourceFilter?: string
    dateRange?: { from?: Date, to?: Date }
    severityFilter?: string
  }
  totalCount: number
}> = ({ logs, filters, totalCount }) => {
  const now = new Date()
  const filterSummary = [
    filters.searchTerm && `Search: "${filters.searchTerm}"`,
    filters.actionFilter && filters.actionFilter !== 'all' && `Action: ${filters.actionFilter}`,
    filters.resourceFilter && filters.resourceFilter !== 'all' && `Resource: ${filters.resourceFilter}`,
    filters.dateRange?.from && `From: ${filters.dateRange.from.toLocaleDateString()}`,
    filters.dateRange?.to && `To: ${filters.dateRange.to.toLocaleDateString()}`,
    filters.severityFilter && filters.severityFilter !== 'all' && `Severity: ${filters.severityFilter}`,
  ].filter(Boolean).join(' | ')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Audit Logs Report</Text>
          <Text style={styles.subtitle}>
            Generated: {now.toLocaleString()}
          </Text>
          <Text style={styles.metaInfo}>
            Total Logs: {totalCount} | Showing: {logs.length}
          </Text>
          {filterSummary && (
            <Text style={styles.metaInfo}>
              Filters: {filterSummary}
            </Text>
          )}
        </View>

        <View style={styles.table}>
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.colId]}>#</Text>
            <Text style={[styles.tableCell, styles.colTimestamp]}>Timestamp</Text>
            <Text style={[styles.tableCell, styles.colUser]}>User ID</Text>
            <Text style={[styles.tableCell, styles.colAction]}>Action</Text>
            <Text style={[styles.tableCell, styles.colResource]}>Resource</Text>
            <Text style={[styles.tableCell, styles.colIp]}>IP Address</Text>
            <Text style={[styles.tableCell, styles.colDetails]}>Details</Text>
          </View>

          {/* Table Rows */}
          {logs.map((log, index) => {
            const timestamp = new Date(log.$createdAt).toLocaleString()
            const details = [
              log.resourceId && `Resource ID: ${log.resourceId}`,
              log.sessionId && `Session: ${log.sessionId.substring(0, 8)}...`,
            ].filter(Boolean).join(' | ') || 'N/A'

            return (
              <View key={log.$id} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colId]}>{index + 1}</Text>
                <Text style={[styles.tableCell, styles.colTimestamp]}>{timestamp}</Text>
                <Text style={[styles.tableCell, styles.colUser]}>{log.userId.substring(0, 12)}...</Text>
                <Text style={[styles.tableCell, styles.colAction]}>{log.action}</Text>
                <Text style={[styles.tableCell, styles.colResource]}>{log.resource}</Text>
                <Text style={[styles.tableCell, styles.colIp]}>{log.ipAddress || 'N/A'}</Text>
                <Text style={[styles.tableCell, styles.colDetails]}>{details}</Text>
              </View>
            )
          })}
        </View>

        <View style={styles.footer}>
          <Text>This is an automated audit log report. Generated by My Console.</Text>
        </View>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} of ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  )
}

// Export function to generate and download PDF
export async function exportAuditLogsToPDF(
  logs: AuditLog[],
  filters: {
    searchTerm?: string
    actionFilter?: string
    resourceFilter?: string
    dateRange?: { from?: Date, to?: Date }
    severityFilter?: string
  },
  totalCount: number
): Promise<void> {
  try {
    const doc = <AuditLogsPDF logs={logs} filters={filters} totalCount={totalCount} />
    const blob = await pdf(doc).toBlob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to generate PDF:', error)
    throw error
  }
}

