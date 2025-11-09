import { Monitor, Smartphone, Tablet } from "lucide-react"
import { ReactNode } from "react"

export interface Session {
  $id: string
  $createdAt: string
  $updatedAt: string
  userId: string
  expire: string
  provider: string
  providerUid: string
  providerAccessToken: string
  providerAccessTokenExpiry: string
  providerRefreshToken: string
  ip: string
  osCode: string
  osName: string
  osVersion: string
  clientType: string
  clientCode: string
  clientName: string
  clientVersion: string
  clientEngine: string
  clientEngineVersion: string
  deviceName: string
  deviceBrand: string
  deviceModel: string
  countryCode: string
  countryName: string
  current: boolean
}

export const getDeviceIcon = (clientType: string, deviceModel?: string): ReactNode => {
  if (clientType === 'browser') {
    return <Monitor className="h-5 w-5" />
  }
  if (deviceModel?.toLowerCase().includes('phone') || clientType === 'phone') {
    return <Smartphone className="h-5 w-5" />
  }
  if (deviceModel?.toLowerCase().includes('tablet') || clientType === 'tablet') {
    return <Tablet className="h-5 w-5" />
  }
  return <Monitor className="h-5 w-5" />
}

export const formatDate = (dateString: string, t: (key: string, params?: Record<string, string | number>) => string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    if (diffInMinutes >= 0) {
      return diffInMinutes === 1 
        ? t('sessions_page.time.minute_ago', { count: diffInMinutes })
        : t('sessions_page.time.minutes_ago', { count: diffInMinutes })
    } else {
      return Math.abs(diffInMinutes) === 1
        ? t('sessions_page.time.in_minute', { count: Math.abs(diffInMinutes) })
        : t('sessions_page.time.in_minutes', { count: Math.abs(diffInMinutes) })
    }
  } else if (diffInHours < 24) {
    if (diffInHours >= 0) {
      return diffInHours === 1
        ? t('sessions_page.time.hour_ago', { count: diffInHours })
        : t('sessions_page.time.hours_ago', { count: diffInHours })
    } else {
      return Math.abs(diffInHours) === 1
        ? t('sessions_page.time.in_hour', { count: Math.abs(diffInHours) })
        : t('sessions_page.time.in_hours', { count: Math.abs(diffInHours) })
    }
  } else {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

export const formatExpirationDate = (dateString: string, t: (key: string, params?: Record<string, string | number>) => string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = date.getTime() - now.getTime()
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInMs < 0) {
    return t('expired')
  } else if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    return diffInMinutes === 1
      ? t('sessions_page.time.in_minute', { count: diffInMinutes })
      : t('sessions_page.time.in_minutes', { count: diffInMinutes })
  } else if (diffInHours < 24) {
    return diffInHours === 1
      ? t('sessions_page.time.in_hour', { count: diffInHours })
      : t('sessions_page.time.in_hours', { count: diffInHours })
  } else if (diffInDays < 7) {
    return diffInDays === 1
      ? t('sessions_page.time.in_day', { count: diffInDays })
      : t('sessions_page.time.in_days', { count: diffInDays })
  } else {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

export const getSessionStatus = (session: Session, t: (key: string) => string) => {
  const now = new Date()
  const expireDate = new Date(session.expire)

  if (session.current) {
    return { status: t('active'), color: 'bg-green-500', textColor: 'text-green-700' }
  } else if (expireDate < now) {
    return { status: t('expired'), color: 'bg-red-500', textColor: 'text-red-700' }
  } else {
    const diffInDays = Math.floor((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diffInDays < 1) {
      return { status: t('sessions_page.status.expiring_soon'), color: 'bg-yellow-500', textColor: 'text-yellow-700' }
    } else {
      return { status: t('active'), color: 'bg-blue-500', textColor: 'text-blue-700' }
    }
  }
}

export const getBrowserName = (clientName: string, clientEngine: string | undefined, t: (key: string) => string) => {
  if (clientName) return clientName
  if (clientEngine) return clientEngine
  return t('sessions_page.time.unknown_browser')
}

export const getDeviceName = (deviceName: string, deviceModel: string | undefined, deviceBrand: string | undefined, t: (key: string) => string) => {
  if (deviceName) return deviceName
  if (deviceBrand && deviceModel) return `${deviceBrand} ${deviceModel}`
  if (deviceModel) return deviceModel
  return t('sessions_page.time.unknown_device')
}

