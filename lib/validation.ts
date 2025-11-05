// Validation schemas and utilities for data validation and security

// Basic validation types and utilities (Zod-like implementation)
export interface ValidationResult {
  success: boolean
  data?: any
  error?: ValidationError
}

export interface ValidationError {
  message: string
  path?: string[]
  code?: string
}

// Basic validation functions
export const validators = {
  string: (value: any): value is string => typeof value === 'string',
  number: (value: any): value is number => typeof value === 'number' && !isNaN(value),
  boolean: (value: any): value is boolean => typeof value === 'boolean',
  email: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
  },
  url: (value: string): boolean => {
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  },
  min: (value: string | any[], min: number): boolean => {
    if (typeof value === 'string' || Array.isArray(value)) {
      return value.length >= min
    }
    if (typeof value === 'number') {
      return value >= min
    }
    return false
  },
  max: (value: string | any[], max: number): boolean => {
    if (typeof value === 'string' || Array.isArray(value)) {
      return value.length <= max
    }
    if (typeof value === 'number') {
      return value <= max
    }
    return false
  },
  pattern: (value: string, regex: RegExp): boolean => regex.test(value),
  required: (value: any): boolean => {
    if (value === null || value === undefined) return false
    if (typeof value === 'string') return value.trim().length > 0
    return true
  }
}

// Schema builder functions
export function createSchema<T>(validator: (data: any) => ValidationResult) {
  return {
    parse: (data: any): ValidationResult => validator(data),
    safeParse: (data: any): ValidationResult => {
      try {
        return validator(data)
      } catch (error) {
        return {
          success: false,
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR'
          }
        }
      }
    }
  }
}

// Common validation schemas
export const schemas = {
  // User authentication schemas
  login: createSchema((data: any) => {
    if (!validators.required(data.email) || !validators.string(data.email)) {
      return { success: false, error: { message: 'Email is required' } }
    }
    if (!validators.email(data.email)) {
      return { success: false, error: { message: 'Invalid email format' } }
    }
    if (!validators.required(data.password) || !validators.string(data.password)) {
      return { success: false, error: { message: 'Password is required' } }
    }
    if (!validators.min(data.password, 6)) {
      return { success: false, error: { message: 'Password must be at least 6 characters' } }
    }
    return { success: true, data }
  }),

  register: createSchema((data: any) => {
    if (!validators.required(data.email) || !validators.string(data.email)) {
      return { success: false, error: { message: 'Email is required' } }
    }
    if (!validators.email(data.email)) {
      return { success: false, error: { message: 'Invalid email format' } }
    }
    if (!validators.required(data.password) || !validators.string(data.password)) {
      return { success: false, error: { message: 'Password is required' } }
    }
    if (!validators.min(data.password, 8)) {
      return { success: false, error: { message: 'Password must be at least 8 characters' } }
    }
    if (data.name && (!validators.string(data.name) || !validators.min(data.name, 2))) {
      return { success: false, error: { message: 'Name must be at least 2 characters' } }
    }
    return { success: true, data }
  }),

  // Profile update schema
  profileUpdate: createSchema((data: any) => {
    if (data.name && (!validators.string(data.name) || !validators.min(data.name, 2) || !validators.max(data.name, 50))) {
      return { success: false, error: { message: 'Name must be 2-50 characters' } }
    }
    if (data.email && !validators.email(data.email)) {
      return { success: false, error: { message: 'Invalid email format' } }
    }
    return { success: true, data }
  }),

  // Backup request schema
  backupRequest: createSchema((data: any) => {
    if (data.type && !['auto', 'manual'].includes(data.type)) {
      return { success: false, error: { message: 'Invalid backup type' } }
    }
    return { success: true, data: { type: data.type || 'manual' } }
  }),

  // Generic ID validation
  objectId: createSchema((data: any) => {
    if (!validators.required(data.id) || !validators.string(data.id)) {
      return { success: false, error: { message: 'ID is required' } }
    }
    // Basic UUID/ObjectId pattern check
    const idPattern = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i
    if (!idPattern.test(data.id) && !/^[a-f\d]{24}$/i.test(data.id)) {
      return { success: false, error: { message: 'Invalid ID format' } }
    }
    return { success: true, data }
  })
}

// Input sanitization utilities
export const sanitize = {
  // Remove HTML tags and encode special characters
  html: (input: string): string => {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  },

  // Remove potentially dangerous characters
  text: (input: string): string => {
    return input
      .replace(/[<>'"&]/g, '')
      .trim()
  },

  // Sanitize email
  email: (input: string): string => {
    return input
      .toLowerCase()
      .trim()
      .replace(/[<>'"&]/g, '')
  },

  // Sanitize filename
  filename: (input: string): string => {
    return input
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255)
  },

  // Deep sanitize object
  object: (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitize.text(obj)
    }
    if (Array.isArray(obj)) {
      return obj.map(item => sanitize.object(item))
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize.object(value)
      }
      return sanitized
    }
    return obj
  }
}

// Rate limiting store (in-memory for development, use Redis in production)
class RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>()

  check(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now()
    const record = this.store.get(key)

    if (!record || now > record.resetTime) {
      // New window
      this.store.set(key, { count: 1, resetTime: now + windowMs })
      return { allowed: true, remaining: limit - 1, resetTime: now + windowMs }
    }

    if (record.count >= limit) {
      return { allowed: false, remaining: 0, resetTime: record.resetTime }
    }

    record.count++
    this.store.set(key, record)

    return { allowed: true, remaining: limit - record.count, resetTime: record.resetTime }
  }

  cleanup() {
    const now = Date.now()
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key)
      }
    }
  }
}

export const rateLimitStore = new RateLimitStore()

// Cleanup expired records every 5 minutes
if (typeof global !== 'undefined') {
  setInterval(() => rateLimitStore.cleanup(), 5 * 60 * 1000)
}
