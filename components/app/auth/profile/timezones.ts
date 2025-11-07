/**
 * List of common timezones
 * Organized by region with Asia/Kuala_Lumpur as default
 */
export const TIMEZONES = [
  // Asia (Malaysia/Singapore first as default)
  { value: 'Asia/Kuala_Lumpur', label: 'Asia/Kuala Lumpur (GMT+8)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (GMT+8)' },
  { value: 'Asia/Jakarta', label: 'Asia/Jakarta (GMT+7)' },
  { value: 'Asia/Bangkok', label: 'Asia/Bangkok (GMT+7)' },
  { value: 'Asia/Manila', label: 'Asia/Manila (GMT+8)' },
  { value: 'Asia/Hong_Kong', label: 'Asia/Hong Kong (GMT+8)' },
  { value: 'Asia/Taipei', label: 'Asia/Taipei (GMT+8)' },
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (GMT+8)' },
  { value: 'Asia/Seoul', label: 'Asia/Seoul (GMT+9)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (GMT+9)' },
  { value: 'Asia/Calcutta', label: 'Asia/Kolkata (GMT+5:30)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GMT+4)' },
  { value: 'Asia/Riyadh', label: 'Asia/Riyadh (GMT+3)' },
  
  // Australia & Pacific
  { value: 'Australia/Sydney', label: 'Australia/Sydney (GMT+10/+11)' },
  { value: 'Australia/Melbourne', label: 'Australia/Melbourne (GMT+10/+11)' },
  { value: 'Australia/Perth', label: 'Australia/Perth (GMT+8)' },
  { value: 'Pacific/Auckland', label: 'Pacific/Auckland (GMT+12/+13)' },
  
  // Europe
  { value: 'Europe/London', label: 'Europe/London (GMT+0/+1)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (GMT+1/+2)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (GMT+1/+2)' },
  { value: 'Europe/Rome', label: 'Europe/Rome (GMT+1/+2)' },
  { value: 'Europe/Madrid', label: 'Europe/Madrid (GMT+1/+2)' },
  { value: 'Europe/Amsterdam', label: 'Europe/Amsterdam (GMT+1/+2)' },
  { value: 'Europe/Moscow', label: 'Europe/Moscow (GMT+3)' },
  
  // Americas
  { value: 'America/New_York', label: 'America/New York (GMT-5/-4)' },
  { value: 'America/Chicago', label: 'America/Chicago (GMT-6/-5)' },
  { value: 'America/Denver', label: 'America/Denver (GMT-7/-6)' },
  { value: 'America/Los_Angeles', label: 'America/Los Angeles (GMT-8/-7)' },
  { value: 'America/Toronto', label: 'America/Toronto (GMT-5/-4)' },
  { value: 'America/Mexico_City', label: 'America/Mexico City (GMT-6/-5)' },
  { value: 'America/Sao_Paulo', label: 'America/São Paulo (GMT-3)' },
  { value: 'America/Buenos_Aires', label: 'America/Buenos Aires (GMT-3)' },
  
  // UTC
  { value: 'UTC', label: 'UTC (GMT+0)' },
] as const

export const DEFAULT_TIMEZONE = 'Asia/Kuala_Lumpur'

