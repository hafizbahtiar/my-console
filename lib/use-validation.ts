// React hook for form validation using our validation schemas

import { useState, useCallback } from 'react'
import { createSchema } from './validation'

export interface ValidationErrors {
  [key: string]: string
}

export interface FormState<T = any> {
  data: T
  errors: ValidationErrors
  isValid: boolean
  isSubmitting: boolean
}

// Custom hook for form validation
export function useValidation<T extends Record<string, any>>(
  initialData: T,
  validationSchema?: ReturnType<typeof createSchema>
) {
  const [formState, setFormState] = useState<FormState<T>>({
    data: initialData,
    errors: {},
    isValid: true,
    isSubmitting: false
  })

  // Update field value
  const setValue = useCallback((field: keyof T, value: any) => {
    setFormState(prev => ({
      ...prev,
      data: { ...prev.data, [field]: value },
      errors: { ...prev.errors, [field]: '' } // Clear field error
    }))
  }, [])

  // Set multiple values
  const setValues = useCallback((updates: Partial<T>) => {
    setFormState(prev => ({
      ...prev,
      data: { ...prev.data, ...updates }
    }))
  }, [])

  // Validate single field
  const validateField = useCallback((field: keyof T, value: any): string => {
    // Basic validation - you can extend this based on field types
    if (!value && value !== 0 && value !== false) {
      return `${String(field)} is required`
    }

    // Email validation
    if (field === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address'
      }
    }

    // Password validation
    if (field === 'password' && value) {
      if (value.length < 6) {
        return 'Password must be at least 6 characters'
      }
    }

    // Name validation
    if (field === 'name' && value) {
      if (value.length < 2) {
        return 'Name must be at least 2 characters'
      }
      if (value.length > 50) {
        return 'Name must be less than 50 characters'
      }
    }

    return ''
  }, [])

  // Validate entire form
  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {}
    let isValid = true

    // Validate each field
    Object.keys(formState.data).forEach(key => {
      const error = validateField(key as keyof T, formState.data[key])
      if (error) {
        newErrors[key] = error
        isValid = false
      }
    })

    // Use schema validation if provided
    if (validationSchema) {
      const schemaResult = validationSchema.safeParse(formState.data)
      if (!schemaResult.success && schemaResult.error) {
        newErrors.schema = schemaResult.error.message
        isValid = false
      }
    }

    setFormState(prev => ({
      ...prev,
      errors: newErrors,
      isValid
    }))

    return isValid
  }, [formState.data, validateField, validationSchema])

  // Handle form submission
  const handleSubmit = useCallback(async (
    onSubmit: (data: T) => Promise<void> | void,
    options?: {
      validateBeforeSubmit?: boolean
      onSuccess?: (result?: any) => void
      onError?: (error: any) => void
    }
  ) => {
    const { validateBeforeSubmit = true, onSuccess, onError } = options || {}

    if (validateBeforeSubmit && !validateForm()) {
      return
    }

    setFormState(prev => ({ ...prev, isSubmitting: true }))

    try {
      const result = await onSubmit(formState.data)
      onSuccess?.(result)
    } catch (error) {
      onError?.(error)
    } finally {
      setFormState(prev => ({ ...prev, isSubmitting: false }))
    }
  }, [formState.data, validateForm])

  // Reset form
  const reset = useCallback((newData?: Partial<T>) => {
    setFormState({
      data: { ...initialData, ...newData } as T,
      errors: {},
      isValid: true,
      isSubmitting: false
    })
  }, [initialData])

  return {
    ...formState,
    setValue,
    setValues,
    validateField,
    validateForm,
    handleSubmit,
    reset
  }
}

// Hook for API form submissions with validation
export function useApiForm<T extends Record<string, any>>(
  initialData: T,
  submitUrl: string,
  method: 'POST' | 'PUT' | 'PATCH' = 'POST',
  validationSchema?: ReturnType<typeof createSchema>
) {
  const form = useValidation(initialData, validationSchema)

  const submitToApi = useCallback(async (data: T) => {
    const response = await fetch(submitUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Request failed with status ${response.status}`)
    }

    return response.json()
  }, [submitUrl, method])

  return {
    ...form,
    handleSubmit: (options?: {
      validateBeforeSubmit?: boolean
      onSuccess?: (result: any) => void
      onError?: (error: any) => void
    }) => form.handleSubmit(submitToApi, options)
  }
}
