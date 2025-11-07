"use client"

import { useEffect } from 'react'
import { setupGlobalErrorHandlers } from '@/lib/error-handler'

/**
 * Client component to initialize global error handlers
 * This ensures error handlers are only set up on the client side
 */
export function ErrorHandlerInit() {
  useEffect(() => {
    setupGlobalErrorHandlers()
  }, [])

  return null
}

