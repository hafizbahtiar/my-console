/**
 * Pagination Utilities
 * 
 * Helper functions for implementing pagination with Appwrite TablesDB
 */

export interface PaginationParams {
  limit?: number
  offset?: number
}

export interface PaginationResult<T> {
  data: T[]
  total: number
  hasMore: boolean
}

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

/**
 * Default pagination constants
 */
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

/**
 * Calculate offset from page number and page size
 */
export function getOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize
}

/**
 * Calculate total pages from total items and page size
 */
export function getTotalPages(total: number, pageSize: number): number {
  return Math.ceil(total / pageSize)
}

/**
 * Create pagination query parameters for Appwrite
 */
export function createPaginationParams(page: number, pageSize: number = DEFAULT_PAGE_SIZE): PaginationParams {
  const limit = Math.min(pageSize, MAX_PAGE_SIZE)
  const offset = getOffset(page, limit)
  
  return {
    limit,
    offset
  }
}

/**
 * Validate pagination state
 */
export function validatePagination(page: number, pageSize: number, total: number): PaginationState {
  const validPageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE)
  const validPage = Math.max(1, Math.min(page, getTotalPages(total, validPageSize) || 1))
  
  return {
    page: validPage,
    pageSize: validPageSize,
    total
  }
}

