// Utilities for handling async operations with error handling and loading states

import { useState, useCallback } from 'react'
import { handleError, withErrorHandling, AppError } from './error-handler'
import { toast } from 'sonner'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: AppError | null
}

// Hook for handling async operations
export function useAsync<T>() {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null
  })

  const execute = useCallback(async (
    operation: () => Promise<T>,
    options?: {
      onSuccess?: (data: T) => void
      onError?: (error: AppError) => void
      successMessage?: string
      errorMessage?: string
      showToast?: boolean
    }
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const result = await withErrorHandling(operation)

      setState({
        data: result,
        loading: false,
        error: null
      })

      if (options?.onSuccess) {
        options.onSuccess(result)
      }

      if (options?.successMessage && options?.showToast !== false) {
        toast.success(options.successMessage)
      }

      return result
    } catch (error) {
      const appError = error as AppError

      setState(prev => ({
        ...prev,
        loading: false,
        error: appError
      }))

      if (options?.onError) {
        options.onError(appError)
      }

      // Error toast is already shown by withErrorHandling
      // unless custom error message is provided
      if (options?.errorMessage && options?.showToast !== false) {
        toast.error(options.errorMessage)
      }

      throw appError
    }
  }, [])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null
    })
  }, [])

  return {
    ...state,
    execute,
    reset
  }
}

// Hook for handling multiple async operations
export function useAsyncMultiple() {
  const [operations, setOperations] = useState<Record<string, AsyncState<any>>>({})

  const execute = useCallback(async (
    key: string,
    operation: () => Promise<any>,
    options?: {
      onSuccess?: (data: any) => void
      onError?: (error: AppError) => void
      successMessage?: string
      errorMessage?: string
      showToast?: boolean
    }
  ) => {
    setOperations(prev => ({
      ...prev,
      [key]: { data: null, loading: true, error: null }
    }))

    try {
      const result = await withErrorHandling(operation)

      setOperations(prev => ({
        ...prev,
        [key]: { data: result, loading: false, error: null }
      }))

      if (options?.onSuccess) {
        options.onSuccess(result)
      }

      if (options?.successMessage && options?.showToast !== false) {
        toast.success(options.successMessage)
      }

      return result
    } catch (error) {
      const appError = error as AppError

      setOperations(prev => ({
        ...prev,
        [key]: { data: null, loading: false, error: appError }
      }))

      if (options?.onError) {
        options.onError(appError)
      }

      if (options?.errorMessage && options?.showToast !== false) {
        toast.error(options.errorMessage)
      }

      throw appError
    }
  }, [])

  const reset = useCallback((key?: string) => {
    if (key) {
      setOperations(prev => ({
        ...prev,
        [key]: { data: null, loading: false, error: null }
      }))
    } else {
      setOperations({})
    }
  }, [])

  const getOperation = useCallback((key: string) => {
    return operations[key] || { data: null, loading: false, error: null }
  }, [operations])

  return {
    operations,
    execute,
    reset,
    getOperation
  }
}

// Utility function to retry failed operations
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      if (attempt === maxRetries) {
        throw lastError
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }

  throw lastError
}

// Debounce utility for search inputs
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useState(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  })

  return debouncedValue
}
