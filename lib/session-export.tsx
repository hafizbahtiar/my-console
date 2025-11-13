/**
 * Session Export Utilities
 * 
 * Provides export functionality for sessions (CSV, JSON, PDF)
 */

import React from 'react'
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import { Session } from '@/components/app/auth/sessions'

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottom: '2 solid #000',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 10,
    backgroundColor: '#f0f0f0',
    padding: 5,
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #ddd',
    paddingVertical: 5,
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
    fontWeight: 'bold',
    paddingVertical: 5,
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
    borderTop: '1 solid #ddd',
    paddingTop: 10,
  },
  badge: {
    padding: '2 6',
    borderRadius: 3,
    fontSize: 8,
    marginRight: 5,
  },
  badgeActive: {
    backgroundColor: '#10b981',
    color: '#fff',
  },
  badgeExpired: {
    backgroundColor: '#ef4444',
    color: '#fff',
  },
  badgeSuspicious: {
    backgroundColor: '#f59e0b',
    color: '#fff',
  },
})

interface SessionsPDFProps {
  sessions: Session[]
  filters?: {
    includeCurrent?: boolean
    suspiciousOnly?: boolean
  }
  suspiciousSessions?: Set<string>
}

const SessionsPDF: React.FC<SessionsPDFProps> = ({ sessions, filters, suspiciousSessions }) => {
  const filteredSessions = sessions.filter(session => {
    if (filters?.includeCurrent === false && session.current) return false
    if (filters?.suspiciousOnly && !suspiciousSessions?.has(session.$id)) return false
    return true
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Active Sessions Report</Text>
          <Text style={styles.subtitle}>
            Generated: {new Date().toLocaleString('en-US')}
          </Text>
          <Text style={styles.subtitle}>
            Total Sessions: {filteredSessions.length}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Summary</Text>
          <Text>Current Sessions: {sessions.filter(s => s.current).length}</Text>
          <Text>Other Sessions: {sessions.filter(s => !s.current).length}</Text>
          {suspiciousSessions && (
            <Text>Suspicious Sessions: {suspiciousSessions.size}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Details</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { flex: 0.5 }]}>Status</Text>
              <Text style={styles.tableCell}>Device</Text>
              <Text style={styles.tableCell}>Location</Text>
              <Text style={styles.tableCell}>IP Address</Text>
              <Text style={styles.tableCell}>Created</Text>
            </View>
            {filteredSessions.map((session) => (
              <View key={session.$id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 0.5 }]}>
                  {session.current ? 'Current' : 'Active'}
                </Text>
                <Text style={styles.tableCell}>
                  {session.deviceName || session.deviceModel || 'Unknown'}
                </Text>
                <Text style={styles.tableCell}>
                  {session.countryName || session.countryCode || 'Unknown'}
                </Text>
                <Text style={styles.tableCell}>{session.ip || 'N/A'}</Text>
                <Text style={styles.tableCell}>{formatDate(session.$createdAt)}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.footer} fixed>
          Page {'{pageNumber}'} of {'{totalPages}'} - Confidential Session Report
        </Text>
      </Page>
    </Document>
  )
}

/**
 * Export sessions to CSV
 */
export function exportSessionsToCSV(
  sessions: Session[],
  suspiciousSessions?: Set<string>
): void {
  const headers = [
    'Session ID',
    'Status',
    'Device Name',
    'Device Model',
    'Device Brand',
    'Browser',
    'OS',
    'IP Address',
    'Country',
    'Location',
    'Created At',
    'Expires At',
    'Suspicious',
  ]

  const rows = sessions.map(session => [
    session.$id,
    session.current ? 'Current' : 'Active',
    session.deviceName || '',
    session.deviceModel || '',
    session.deviceBrand || '',
    session.clientName || '',
    session.osName || '',
    session.ip || '',
    session.countryCode || '',
    session.countryName || '',
    new Date(session.$createdAt).toISOString(),
    new Date(session.expire).toISOString(),
    suspiciousSessions?.has(session.$id) ? 'Yes' : 'No',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `sessions-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}

/**
 * Export sessions to JSON
 */
export function exportSessionsToJSON(
  sessions: Session[],
  suspiciousSessions?: Set<string>
): void {
  const data = sessions.map(session => ({
    sessionId: session.$id,
    status: session.current ? 'current' : 'active',
    device: {
      name: session.deviceName || null,
      model: session.deviceModel || null,
      brand: session.deviceBrand || null,
    },
    browser: {
      name: session.clientName || null,
      version: session.clientVersion || null,
      engine: session.clientEngine || null,
    },
    os: {
      name: session.osName || null,
      version: session.osVersion || null,
      code: session.osCode || null,
    },
    location: {
      ip: session.ip || null,
      countryCode: session.countryCode || null,
      countryName: session.countryName || null,
    },
    timestamps: {
      created: session.$createdAt,
      expires: session.expire,
      updated: session.$updatedAt,
    },
    suspicious: suspiciousSessions?.has(session.$id) || false,
  }))

  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `sessions-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  window.URL.revokeObjectURL(url)
}

/**
 * Export sessions to PDF
 */
export async function exportSessionsToPDF(
  sessions: Session[],
  filters?: {
    includeCurrent?: boolean
    suspiciousOnly?: boolean
  },
  suspiciousSessions?: Set<string>
): Promise<void> {
  try {
    const doc = (
      <SessionsPDF
        sessions={sessions}
        filters={filters}
        suspiciousSessions={suspiciousSessions}
      />
    )
    const blob = await pdf(doc).toBlob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sessions-${new Date().toISOString().split('T')[0]}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to generate PDF:', error)
    throw error
  }
}

