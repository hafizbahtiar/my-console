"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Models } from 'appwrite'
import { account } from './appwrite'

interface AuthContextType {
  user: Models.User<Models.Preferences> | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastCheckTime, setLastCheckTime] = useState(0)
  const [lastLoginAttempt, setLastLoginAttempt] = useState(0)
  const CHECK_INTERVAL_MS = 5000 // 5 seconds between auth checks
  const LOGIN_RATE_LIMIT_MS = 10000 // 10 seconds between login attempts

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const now = Date.now()
    if (now - lastCheckTime < CHECK_INTERVAL_MS) {
      // Skip check if too frequent
      setLoading(false)
      return
    }

    setLastCheckTime(now)

    try {
      const userData = await account.get()
      setUser(userData)
    } catch (error: any) {
      // Check for CORS errors
      const isCorsError = error?.message?.includes('CORS') || 
                         error?.message?.includes('Failed to fetch') ||
                         error?.message?.includes('ERR_FAILED') ||
                         (error?.name === 'TypeError' && error?.message?.includes('fetch'))
      
      if (isCorsError && typeof window !== 'undefined') {
        const currentOrigin = window.location.origin
        const appwriteEndpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://appwrite.hafizbahtiar.com/v1'
        
        console.error(
          `🚫 CORS Error: Requests from ${currentOrigin} are blocked by Appwrite server\n` +
          `\n` +
          `📋 To fix this issue:\n` +
          `   1. Go to your Appwrite Console: ${appwriteEndpoint.replace('/v1', '')}\n` +
          `   2. Navigate to: Project Settings > Platforms\n` +
          `   3. Add a new platform with:\n` +
          `      - Platform Identifier: ${new URL(currentOrigin).hostname}\n` +
          `      - Allowed Origins: ${currentOrigin}\n` +
          `\n` +
          `   Note: If you're using a reverse proxy (Nginx), also ensure it forwards CORS headers properly.\n` +
          `   This error prevents authentication and API calls from working.`
        )
      }
      
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const now = Date.now()

    // Check if we're still under rate limiting (either client-side or server-side extended)
    if (lastLoginAttempt > 0 && now < lastLoginAttempt) {
      // We're under server-side rate limiting (lastLoginAttempt is a future timestamp)
      const remainingTime = Math.ceil((lastLoginAttempt - now) / 1000)
      if (remainingTime > 60) {
        // Server-side limit (minutes)
        const remainingMinutes = Math.ceil(remainingTime / 60)
        const timeUnit = remainingMinutes === 1 ? 'minute' : 'minutes'
        throw new Error(`Too many login attempts. Please wait ${remainingMinutes} ${timeUnit} before trying again.`)
      } else {
        // Client-side limit (seconds)
        const timeUnit = remainingTime === 1 ? 'second' : 'seconds'
        throw new Error(`Please wait ${remainingTime} ${timeUnit} before trying again`)
      }
    } else if (lastLoginAttempt > 0 && now - lastLoginAttempt < LOGIN_RATE_LIMIT_MS) {
      // Client-side rate limiting
      const remainingTime = Math.ceil((LOGIN_RATE_LIMIT_MS - (now - lastLoginAttempt)) / 1000)
      const timeUnit = remainingTime === 1 ? 'second' : 'seconds'
      throw new Error(`Please wait ${remainingTime} ${timeUnit} before trying again`)
    }

    setLastLoginAttempt(now)

    try {
      // Delete any existing session first (this handles the case where a user is already logged in)
      try {
        await account.deleteSession({ sessionId: 'current' })
      } catch (sessionError: any) {
        // Ignore 401 (no current session) - this is expected for first-time logins
        if (sessionError.code !== 401) {
          console.warn('Session deletion failed:', sessionError.message)
        }
      }

      // Create new email/password session
      await account.createEmailPasswordSession({ email, password })

      // Update user state
      await checkUser()

      // Reset rate limit on successful login
      setLastLoginAttempt(0)
    } catch (error: any) {
      // If it's a rate limit error from Appwrite, reset client-side limiting
      if (error.code === 429) {
        // Extend client-side rate limit to match server-side (5 minutes = 300000ms)
        setLastLoginAttempt(now + 300000)
        throw new Error('Too many login attempts. Please wait 5 minutes before trying again.')
      }
      throw new Error(error.message || 'Login failed')
    }
  }

  const logout = async () => {
    try {
      await account.deleteSession({ sessionId: 'current' })
      setUser(null)
    } catch (error: any) {
      // Even if logout API fails, clear local user state
      setUser(null)
      throw new Error(error.message || 'Logout failed')
    }
  }

  const register = async (email: string, password: string, name?: string) => {
    try {
      await account.create({ userId: 'unique()', email, password, name })
      // Automatically log in after registration
      await login(email, password)
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed')
    }
  }

  const refreshSession = async () => {
    try {
      await checkUser()
    } catch (error: any) {
      console.warn('Failed to refresh session:', error.message)
      setUser(null)
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    refreshSession,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
