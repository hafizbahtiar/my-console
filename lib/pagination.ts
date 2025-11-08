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

/**
 * Optimized pagination query helper
 * Tries server-side pagination first, falls back to client-side if queries fail
 */
export interface OptimizedPaginationOptions {
  databaseId: string
  tableId: string
  page: number
  pageSize?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
  filters?: Array<{ field: string; operator: string; value: any }>
  transform?: (row: any) => any
}

export interface OptimizedPaginationResult<T> {
  data: T[]
  total: number
  hasMore: boolean
  usedServerSidePagination: boolean
}

/**
 * Optimized pagination that tries server-side first, falls back to client-side
 */
export async function optimizedPagination<T = any>(
  listRows: (params: any) => Promise<{ rows: any[] }>,
  options: OptimizedPaginationOptions
): Promise<OptimizedPaginationResult<T>> {
  const {
    databaseId,
    tableId,
    page,
    pageSize = DEFAULT_PAGE_SIZE,
    orderBy = '$updatedAt',
    orderDirection = 'desc',
    filters = [],
    transform = (row: any) => row
  } = options

  const paginationParams = createPaginationParams(page, pageSize)
  const limit = paginationParams.limit || DEFAULT_PAGE_SIZE
  const offset = paginationParams.offset || 0

  // Try server-side pagination first
  try {
    const queries: string[] = []
    
    // Add filters
    filters.forEach(filter => {
      queries.push(`${filter.operator}("${filter.field}", ${JSON.stringify(filter.value)})`)
    })
    
    // Add ordering
    if (orderDirection === 'desc') {
      queries.push(`orderDesc("${orderBy}")`)
    } else {
      queries.push(`orderAsc("${orderBy}")`)
    }
    
    // Add pagination
    queries.push(`limit(${limit})`)
    queries.push(`offset(${offset})`)

    const response = await listRows({
      databaseId,
      tableId,
      queries
    })

    // Get total count (try to get it efficiently)
    let total = 0
    try {
      const countResponse = await listRows({
        databaseId,
        tableId,
        queries: filters.map(filter => 
          `${filter.operator}("${filter.field}", ${JSON.stringify(filter.value)})`
        )
      })
      total = countResponse.rows.length
    } catch {
      // If count query fails, estimate from current page
      total = response.rows.length < limit ? offset + response.rows.length : offset + limit + 1
    }

    const transformedData = response.rows.map(transform)

    return {
      data: transformedData,
      total,
      hasMore: response.rows.length === limit && (offset + limit) < total,
      usedServerSidePagination: true
    }
  } catch (error) {
    // Fallback to client-side pagination
    console.warn('Server-side pagination failed, falling back to client-side:', error)
    
    try {
      // Load all data
      const allResponse = await listRows({
        databaseId,
        tableId
      })

      // Apply filters client-side
      let filteredData = allResponse.rows
      if (filters.length > 0) {
        filteredData = filteredData.filter((row: any) => {
          return filters.every(filter => {
            const fieldValue = row[filter.field]
            switch (filter.operator) {
              case 'equal':
                return fieldValue === filter.value
              case 'notEqual':
                return fieldValue !== filter.value
              case 'greaterThan':
                return fieldValue > filter.value
              case 'lessThan':
                return fieldValue < filter.value
              default:
                return true
            }
          })
        })
      }

      // Sort client-side
      filteredData.sort((a: any, b: any) => {
        const aValue = a[orderBy]
        const bValue = b[orderBy]
        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        return orderDirection === 'desc' ? -comparison : comparison
      })

      // Apply pagination client-side
      const paginatedData = filteredData.slice(offset, offset + limit)
      const transformedData = paginatedData.map(transform)

      return {
        data: transformedData,
        total: filteredData.length,
        hasMore: (offset + limit) < filteredData.length,
        usedServerSidePagination: false
      }
    } catch (fallbackError) {
      console.error('Client-side pagination fallback also failed:', fallbackError)
      throw fallbackError
    }
  }
}

