// Global Error Handler for Client and Server
import { toast } from 'sonner'

// Error types
export enum ErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  SERVER = 'server',
  CLIENT = 'client',
  UNKNOWN = 'unknown'
}

export interface AppError {
  type: ErrorType
  message: string
  code?: string | number
  details?: any
  timestamp: Date
  userId?: string
  url?: string
  userAgent?: string
  stack?: string
}

// Error logging function
export function logError(error: AppError) {
  const errorLog = {
    ...error,
    timestamp: error.timestamp.toISOString(),
    level: 'error'
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('App Error:', errorLog)
  }

  // Here you would typically send to error monitoring service
  // Example: Sentry.captureException(error, { extra: errorLog })

  // You could also send to a logging service
  // Example: sendToLoggingService(errorLog)
}

// Create standardized error object
export function createAppError(
  type: ErrorType,
  message: string,
  originalError?: any,
  additionalDetails?: any
): AppError {
  return {
    type,
    message,
    code: originalError?.code || originalError?.status,
    details: additionalDetails,
    timestamp: new Date(),
    stack: originalError?.stack,
    userId: typeof window !== 'undefined' ? localStorage.getItem('userId') || undefined : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined
  }
}

// Handle different types of errors
export function handleError(error: any, context?: string): AppError {
  let appError: AppError

  // Network errors
  if (!navigator.onLine) {
    appError = createAppError(
      ErrorType.NETWORK,
      'You appear to be offline. Please check your internet connection.',
      error
    )
  }
  // Authentication errors
  else if (error?.code === 401 || error?.message?.includes('unauthorized')) {
    appError = createAppError(
      ErrorType.AUTHENTICATION,
      'Your session has expired. Please log in again.',
      error
    )
  }
  // Authorization errors
  else if (error?.code === 403 || error?.message?.includes('forbidden')) {
    appError = createAppError(
      ErrorType.AUTHORIZATION,
      'You do not have permission to perform this action.',
      error
    )
  }
  // Validation errors
  else if (error?.code === 422 || error?.message?.includes('validation')) {
    appError = createAppError(
      ErrorType.VALIDATION,
      error.message || 'Please check your input and try again.',
      error
    )
  }
  // Server errors
  else if (error?.code >= 500) {
    appError = createAppError(
      ErrorType.SERVER,
      'A server error occurred. Please try again later.',
      error,
      { context }
    )
  }
  // Appwrite specific errors
  else if (error?.type && error?.message) {
    appError = createAppError(
      ErrorType.SERVER,
      error.message,
      error,
      { context, appwriteType: error.type }
    )
  }
  // Generic client errors
  else {
    appError = createAppError(
      ErrorType.CLIENT,
      error?.message || 'An unexpected error occurred.',
      error,
      { context }
    )
  }

  // Log the error
  logError(appError)

  return appError
}

// Show user-friendly error message
export function showErrorToast(error: AppError) {
  let toastMessage = error.message

  // Customize messages based on error type
  switch (error.type) {
    case ErrorType.NETWORK:
      toastMessage = 'Connection error. Please check your internet and try again.'
      break
    case ErrorType.AUTHENTICATION:
      toastMessage = 'Session expired. Redirecting to login...'
      // Could redirect to login here
      break
    case ErrorType.AUTHORIZATION:
      toastMessage = 'Access denied. You may not have permission for this action.'
      break
    case ErrorType.VALIDATION:
      toastMessage = error.message // Keep validation messages as-is
      break
    case ErrorType.SERVER:
      toastMessage = 'Server error. Our team has been notified.'
      break
  }

  toast.error(toastMessage)
}

// Global error handlers for unhandled errors
export function setupGlobalErrorHandlers() {
  // Handle unhandled promise rejections
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      const error = handleError(event.reason, 'unhandled_promise_rejection')
      showErrorToast(error)
      // Prevent default browser behavior
      event.preventDefault()
    })

    // Handle unhandled errors
    window.addEventListener('error', (event) => {
      const error = handleError(event.error, 'unhandled_error')
      showErrorToast(error)
    })

    // Handle React-specific errors
    window.addEventListener('error', (event) => {
      if (event.error && event.error.message?.includes('React')) {
        const error = handleError(event.error, 'react_error')
        showErrorToast(error)
      }
    })
  }
}

// Utility function for API error handling
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    const appError = handleError(error, context)
    showErrorToast(appError)
    throw appError
  }
}
