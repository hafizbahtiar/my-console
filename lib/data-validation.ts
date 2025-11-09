/**
 * Data Validation and Integrity Checks
 * 
 * Provides utilities for validating data integrity across collections,
 * checking relationships, and identifying data inconsistencies.
 */

import { tablesDB, DATABASE_ID } from './appwrite';

export interface ValidationRule {
  name: string
  description: string
  severity: 'error' | 'warning' | 'info'
}

export interface ValidationResult {
  rule: ValidationRule
  passed: boolean
  message: string
  affectedRecords?: number
  details?: Array<{
    recordId: string
    issue: string
  }>
}

export interface CollectionValidationResult {
  collectionId: string
  collectionName: string
  totalRecords: number
  validations: ValidationResult[]
  overallStatus: 'valid' | 'warning' | 'error'
}

/**
 * Validate data integrity for a specific collection
 */
export async function validateCollection(
  collectionId: string,
  rules: ValidationRule[]
): Promise<CollectionValidationResult> {
  try {
    const response = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: collectionId,
    })

    const records = response.rows || []
    const validationResults: ValidationResult[] = []

    // Run each validation rule
    for (const rule of rules) {
      const result = await runValidationRule(collectionId, rule, records)
      validationResults.push(result)
    }

    // Determine overall status
    const hasErrors = validationResults.some(r => !r.passed && r.rule.severity === 'error')
    const hasWarnings = validationResults.some(r => !r.passed && r.rule.severity === 'warning')
    const overallStatus = hasErrors ? 'error' : hasWarnings ? 'warning' : 'valid'

    return {
      collectionId,
      collectionName: collectionId,
      totalRecords: records.length,
      validations: validationResults,
      overallStatus,
    }
  } catch (error) {
    console.error(`Failed to validate collection ${collectionId}:`, error)
    throw error
  }
}

/**
 * Run a specific validation rule
 */
async function runValidationRule(
  collectionId: string,
  rule: ValidationRule,
  records: any[]
): Promise<ValidationResult> {
  switch (rule.name) {
    case 'required_fields':
      return validateRequiredFields(collectionId, rule, records)
    case 'data_types':
      return validateDataTypes(collectionId, rule, records)
    case 'foreign_keys':
      return validateForeignKeys(collectionId, rule, records)
    case 'unique_constraints':
      return validateUniqueConstraints(collectionId, rule, records)
    case 'date_ranges':
      return validateDateRanges(collectionId, rule, records)
    default:
      return {
        rule,
        passed: true,
        message: 'Validation not implemented',
      }
  }
}

/**
 * Validate required fields
 */
function validateRequiredFields(
  collectionId: string,
  rule: ValidationRule,
  records: any[]
): ValidationResult {
  // Define required fields per collection
  const requiredFields: Record<string, string[]> = {
    audit_logs: ['userId', 'action', 'resource'],
    blog_posts: ['title', 'slug', 'status'],
    blog_categories: ['name', 'slug'],
    blog_tags: ['name', 'slug'],
    users: ['email', 'name'],
  }

  const required = requiredFields[collectionId] || []
  if (required.length === 0) {
    return {
      rule,
      passed: true,
      message: 'No required fields defined for this collection',
    }
  }

  const issues: Array<{ recordId: string; issue: string }> = []

  for (const record of records) {
    for (const field of required) {
      if (!record[field] || (typeof record[field] === 'string' && record[field].trim() === '')) {
        issues.push({
          recordId: record.$id || 'unknown',
          issue: `Missing required field: ${field}`,
        })
      }
    }
  }

  return {
    rule,
    passed: issues.length === 0,
    message: issues.length === 0
      ? 'All required fields are present'
      : `${issues.length} records missing required fields`,
    affectedRecords: issues.length,
    details: issues.slice(0, 10), // Limit details to first 10
  }
}

/**
 * Validate data types
 */
function validateDataTypes(
  collectionId: string,
  rule: ValidationRule,
  records: any[]
): ValidationResult {
  // Define expected types per collection
  const typeDefinitions: Record<string, Record<string, string>> = {
    audit_logs: {
      userId: 'string',
      action: 'string',
      resource: 'string',
    },
    blog_posts: {
      title: 'string',
      slug: 'string',
      status: 'string',
    },
  }

  const typeDef = typeDefinitions[collectionId] || {}
  if (Object.keys(typeDef).length === 0) {
    return {
      rule,
      passed: true,
      message: 'No type definitions for this collection',
    }
  }

  const issues: Array<{ recordId: string; issue: string }> = []

  for (const record of records) {
    for (const [field, expectedType] of Object.entries(typeDef)) {
      const value = record[field]
      if (value !== null && value !== undefined) {
        const actualType = typeof value
        if (actualType !== expectedType) {
          issues.push({
            recordId: record.$id || 'unknown',
            issue: `Field ${field} expected ${expectedType}, got ${actualType}`,
          })
        }
      }
    }
  }

  return {
    rule,
    passed: issues.length === 0,
    message: issues.length === 0
      ? 'All data types are correct'
      : `${issues.length} records have type mismatches`,
    affectedRecords: issues.length,
    details: issues.slice(0, 10),
  }
}

/**
 * Validate foreign key relationships
 */
async function validateForeignKeys(
  collectionId: string,
  rule: ValidationRule,
  records: any[]
): Promise<ValidationResult> {
  // Define foreign key relationships
  const foreignKeys: Record<string, Array<{ field: string; references: string }>> = {
    blog_posts: [
      { field: 'blogCategories', references: 'blog_categories' },
    ],
    blog_comments: [
      { field: 'postId', references: 'blog_posts' },
      { field: 'parentId', references: 'blog_comments' },
    ],
  }

  const fks = foreignKeys[collectionId] || []
  if (fks.length === 0) {
    return {
      rule,
      passed: true,
      message: 'No foreign key relationships defined',
    }
  }

  const issues: Array<{ recordId: string; issue: string }> = []

  for (const fk of fks) {
    // Get all referenced IDs
    const referencedIds = new Set<string>()
    try {
      const refResponse = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: fk.references,
      })
      refResponse.rows.forEach((row: any) => referencedIds.add(row.$id))
    } catch (error) {
      console.warn(`Could not validate foreign key ${fk.field}:`, error)
      continue
    }

    // Check each record
    for (const record of records) {
      const fkValue = record[fk.field]
      if (fkValue) {
        // Handle both string IDs and object references
        const fkId = typeof fkValue === 'string' ? fkValue : fkValue.$id
        if (fkId && !referencedIds.has(fkId)) {
          issues.push({
            recordId: record.$id || 'unknown',
            issue: `Foreign key ${fk.field} references non-existent record: ${fkId}`,
          })
        }
      }
    }
  }

  return {
    rule,
    passed: issues.length === 0,
    message: issues.length === 0
      ? 'All foreign key relationships are valid'
      : `${issues.length} records have invalid foreign keys`,
    affectedRecords: issues.length,
    details: issues.slice(0, 10),
  }
}

/**
 * Validate unique constraints
 */
function validateUniqueConstraints(
  collectionId: string,
  rule: ValidationRule,
  records: any[]
): ValidationResult {
  // Define unique fields per collection
  const uniqueFields: Record<string, string[]> = {
    blog_categories: ['slug'],
    blog_tags: ['slug'],
    users: ['email'],
  }

  const unique = uniqueFields[collectionId] || []
  if (unique.length === 0) {
    return {
      rule,
      passed: true,
      message: 'No unique constraints defined',
    }
  }

  const issues: Array<{ recordId: string; issue: string }> = []

  for (const field of unique) {
    const valueMap = new Map<string, string[]>()
    for (const record of records) {
      const value = record[field]
      if (value !== null && value !== undefined) {
        const key = String(value)
        if (!valueMap.has(key)) {
          valueMap.set(key, [])
        }
        valueMap.get(key)!.push(record.$id || 'unknown')
      }
    }

    // Find duplicates
    for (const [value, recordIds] of valueMap.entries()) {
      if (recordIds.length > 1) {
        issues.push({
          recordId: recordIds[0],
          issue: `Duplicate ${field} value: ${value} (found in ${recordIds.length} records)`,
        })
      }
    }
  }

  return {
    rule,
    passed: issues.length === 0,
    message: issues.length === 0
      ? 'All unique constraints are satisfied'
      : `${issues.length} unique constraint violations found`,
    affectedRecords: issues.length,
    details: issues.slice(0, 10),
  }
}

/**
 * Validate date ranges
 */
function validateDateRanges(
  collectionId: string,
  rule: ValidationRule,
  records: any[]
): ValidationResult {
  const issues: Array<{ recordId: string; issue: string }> = []

  for (const record of records) {
    // Check createdAt is before updatedAt
    if (record.$createdAt && record.$updatedAt) {
      const createdAt = new Date(record.$createdAt)
      const updatedAt = new Date(record.$updatedAt)
      if (updatedAt < createdAt) {
        issues.push({
          recordId: record.$id || 'unknown',
          issue: 'updatedAt is before createdAt',
        })
      }
    }

    // Check for future dates in createdAt
    if (record.$createdAt) {
      const createdAt = new Date(record.$createdAt)
      if (createdAt > new Date()) {
        issues.push({
          recordId: record.$id || 'unknown',
          issue: 'createdAt is in the future',
        })
      }
    }
  }

  return {
    rule,
    passed: issues.length === 0,
    message: issues.length === 0
      ? 'All date ranges are valid'
      : `${issues.length} records have invalid date ranges`,
    affectedRecords: issues.length,
    details: issues.slice(0, 10),
  }
}

/**
 * Get default validation rules for a collection
 */
export function getDefaultValidationRules(collectionId: string): ValidationRule[] {
  const baseRules: ValidationRule[] = [
    {
      name: 'required_fields',
      description: 'Check that all required fields are present',
      severity: 'error',
    },
    {
      name: 'data_types',
      description: 'Validate data types match expected types',
      severity: 'error',
    },
    {
      name: 'date_ranges',
      description: 'Validate date ranges and timestamps',
      severity: 'warning',
    },
  ]

  // Add collection-specific rules
  const specificRules: Record<string, ValidationRule[]> = {
    blog_posts: [
      {
        name: 'foreign_keys',
        description: 'Validate category and tag relationships',
        severity: 'error',
      },
    ],
    blog_categories: [
      {
        name: 'unique_constraints',
        description: 'Check for duplicate slugs',
        severity: 'error',
      },
    ],
    blog_tags: [
      {
        name: 'unique_constraints',
        description: 'Check for duplicate slugs',
        severity: 'error',
      },
    ],
    users: [
      {
        name: 'unique_constraints',
        description: 'Check for duplicate emails',
        severity: 'error',
      },
    ],
  }

  return [...baseRules, ...(specificRules[collectionId] || [])]
}

/**
 * Validate all collections
 */
export async function validateAllCollections(
  collectionIds: string[]
): Promise<CollectionValidationResult[]> {
  const results: CollectionValidationResult[] = []

  for (const collectionId of collectionIds) {
    try {
      const rules = getDefaultValidationRules(collectionId)
      const result = await validateCollection(collectionId, rules)
      results.push(result)
    } catch (error) {
      console.error(`Failed to validate ${collectionId}:`, error)
      results.push({
        collectionId,
        collectionName: collectionId,
        totalRecords: 0,
        validations: [],
        overallStatus: 'error',
      })
    }
  }

  return results
}

