/**
 * Suspicious Activity Detector
 * 
 * Detects and flags suspicious session activity based on various heuristics
 */

import { Session } from './session-utils'
import { AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export interface SuspiciousActivity {
  sessionId: string
  reasons: string[]
  severity: 'low' | 'medium' | 'high'
}

export interface SuspiciousActivityResult {
  suspiciousSessions: Map<string, SuspiciousActivity>
  hasSuspiciousActivity: boolean
  totalSuspiciousCount: number
}

/**
 * Detect suspicious activity in sessions
 */
export function detectSuspiciousActivity(
  sessions: Session[],
  currentSession: Session | undefined
): SuspiciousActivityResult {
  const suspiciousSessions = new Map<string, SuspiciousActivity>()
  
  if (!currentSession || sessions.length === 0) {
    return {
      suspiciousSessions,
      hasSuspiciousActivity: false,
      totalSuspiciousCount: 0,
    }
  }

  // Group sessions by IP address
  const ipGroups = new Map<string, Session[]>()
  sessions.forEach(session => {
    if (session.ip) {
      const ip = session.ip
      if (!ipGroups.has(ip)) {
        ipGroups.set(ip, [])
      }
      ipGroups.get(ip)!.push(session)
    }
  })

  // Group sessions by country
  const countryGroups = new Map<string, Session[]>()
  sessions.forEach(session => {
    if (session.countryCode) {
      const country = session.countryCode
      if (!countryGroups.has(country)) {
        countryGroups.set(country, [])
      }
      countryGroups.get(country)!.push(session)
    }
  })

  // Analyze each session
  sessions.forEach(session => {
    if (session.current) return // Skip current session

    const reasons: string[] = []
    let severity: 'low' | 'medium' | 'high' = 'low'

    // 1. Different IP address from current session
    if (currentSession.ip && session.ip && currentSession.ip !== session.ip) {
      reasons.push('different_ip')
      severity = 'medium'
    }

    // 2. Different country from current session
    if (
      currentSession.countryCode &&
      session.countryCode &&
      currentSession.countryCode !== session.countryCode
    ) {
      reasons.push('different_country')
      severity = 'high'
    }

    // 3. Multiple sessions from different IPs
    const sessionIpCount = ipGroups.get(session.ip || '')?.length || 0
    if (sessionIpCount > 1 && session.ip !== currentSession.ip) {
      reasons.push('multiple_ips')
      if (severity === 'low') severity = 'medium'
    }

    // 4. Multiple sessions from different countries
    const sessionCountryCount = countryGroups.get(session.countryCode || '')?.length || 0
    if (sessionCountryCount > 1 && session.countryCode !== currentSession.countryCode) {
      reasons.push('multiple_countries')
      severity = 'high'
    }

    // 5. Unusual device/browser combination
    if (
      currentSession.deviceName &&
      session.deviceName &&
      currentSession.deviceName !== session.deviceName &&
      currentSession.clientName !== session.clientName
    ) {
      reasons.push('different_device')
      if (severity === 'low') severity = 'medium'
    }

    // 6. Session created at unusual time (outside normal hours, e.g., 2 AM - 6 AM)
    const sessionDate = new Date(session.$createdAt)
    const hour = sessionDate.getHours()
    if (hour >= 2 && hour <= 6) {
      reasons.push('unusual_time')
      if (severity === 'low') severity = 'medium'
    }

    // 7. Rapid session creation (multiple sessions created within short time)
    const recentSessions = sessions.filter(s => {
      const timeDiff = Math.abs(
        new Date(s.$createdAt).getTime() - new Date(session.$createdAt).getTime()
      )
      return timeDiff < 5 * 60 * 1000 // 5 minutes
    })
    if (recentSessions.length > 3) {
      reasons.push('rapid_creation')
      severity = 'high'
    }

    // 8. Unknown/empty device information
    if (!session.deviceName && !session.deviceModel && !session.deviceBrand) {
      reasons.push('unknown_device')
      if (severity === 'low') severity = 'medium'
    }

    // 9. Unknown/empty location information
    if (!session.countryCode && !session.countryName) {
      reasons.push('unknown_location')
      if (severity === 'low') severity = 'medium'
    }

    if (reasons.length > 0) {
      suspiciousSessions.set(session.$id, {
        sessionId: session.$id,
        reasons,
        severity,
      })
    }
  })

  return {
    suspiciousSessions,
    hasSuspiciousActivity: suspiciousSessions.size > 0,
    totalSuspiciousCount: suspiciousSessions.size,
  }
}

/**
 * Get suspicious activity badge
 */
export function SuspiciousActivityBadge({
  activity,
  t,
}: {
  activity: SuspiciousActivity
  t: (key: string, params?: Record<string, string | number>) => string
}) {
  const severityColors = {
    low: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
    medium: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
    high: 'bg-red-500/10 text-red-700 border-red-500/20',
  }

  return (
    <Badge
      variant="outline"
      className={`${severityColors[activity.severity]} flex items-center gap-1`}
    >
      <AlertTriangle className="h-3 w-3" />
      <span suppressHydrationWarning>
        {t(`sessions_page.suspicious.severity.${activity.severity}`)}
      </span>
    </Badge>
  )
}

/**
 * Suspicious Activity Alert Component
 */
export function SuspiciousActivityAlert({
  suspiciousCount,
  t,
}: {
  suspiciousCount: number
  t: (key: string, params?: Record<string, string | number>) => string
}) {
  if (suspiciousCount === 0) return null

  return (
    <Alert variant="destructive" className="border-orange-500/50 bg-orange-500/5">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle suppressHydrationWarning>
        {t('sessions_page.suspicious.alert.title')}
      </AlertTitle>
      <AlertDescription suppressHydrationWarning>
        {t('sessions_page.suspicious.alert.description', { count: suspiciousCount.toString() })}
      </AlertDescription>
    </Alert>
  )
}

