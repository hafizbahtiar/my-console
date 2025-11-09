/**
 * Global slug generation utilities
 * 
 * Provides optimized, reusable slug generation functions for blog posts,
 * community posts, categories, tags, topics, and any other entities that need slugs.
 */

export interface SlugEntity {
  $id: string
  slug: string
}

export interface GenerateSlugOptions {
  /** Maximum length of the slug (default: unlimited) */
  maxLength?: number
  /** Custom separator (default: '-') */
  separator?: string
  /** Whether to preserve case (default: false, converts to lowercase) */
  preserveCase?: boolean
}

/**
 * Generates a URL-friendly slug from a string
 * 
 * @param text - The text to convert to a slug
 * @param options - Optional configuration for slug generation
 * @returns A URL-friendly slug string
 * 
 * @example
 * ```ts
 * generateSlug("Hello World!") // "hello-world"
 * generateSlug("My Awesome Post", { maxLength: 20 }) // "my-awesome-post"
 * generateSlug("Test@#$%^&*()", { separator: '_' }) // "test"
 * ```
 */
export function generateSlug(
  text: string,
  options: GenerateSlugOptions = {}
): string {
  if (!text || typeof text !== 'string') {
    return ''
  }

  const {
    maxLength,
    separator = '-',
    preserveCase = false,
  } = options

  let slug = text

  // Convert to lowercase unless preserveCase is true
  if (!preserveCase) {
    slug = slug.toLowerCase()
  }

  // Remove special characters, keep only alphanumeric, spaces, and the separator
  // This regex allows the separator character in the input to be preserved if needed
  const allowedChars = separator === '-' 
    ? /[^a-z0-9\s-]/g 
    : new RegExp(`[^a-z0-9\\s${separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`, 'gi')
  
  slug = slug.replace(allowedChars, '')

  // Replace spaces and multiple separators with single separator
  slug = slug
    .replace(/\s+/g, separator)
    .replace(new RegExp(`${separator}+`, 'g'), separator)

  // Trim separators from start and end
  slug = slug.replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), '')

  // Apply max length if specified
  if (maxLength && maxLength > 0) {
    slug = slug.substring(0, maxLength)
    // Remove trailing separator if truncation happened in the middle
    slug = slug.replace(new RegExp(`${separator}+$`, 'g'), '')
  }

  return slug
}

/**
 * Generates a unique slug by appending a counter if the base slug already exists
 * 
 * @param baseSlug - The base slug to make unique
 * @param entities - Array of entities to check for existing slugs
 * @param excludeId - Optional ID to exclude from uniqueness check (useful when editing)
 * @returns A unique slug string
 * 
 * @example
 * ```ts
 * const tags = [{ $id: '1', slug: 'my-tag' }, { $id: '2', slug: 'my-tag-1' }]
 * generateUniqueSlug('my-tag', tags) // "my-tag-2"
 * generateUniqueSlug('my-tag', tags, '1') // "my-tag" (excludes id '1')
 * ```
 */
export function generateUniqueSlug<T extends SlugEntity>(
  baseSlug: string,
  entities: T[],
  excludeId?: string
): string {
  if (!baseSlug) {
    return ''
  }

  let uniqueSlug = baseSlug
  let counter = 1

  // Check if slug exists in entities (excluding the one being edited)
  while (entities.some(entity => 
    entity.slug === uniqueSlug && entity.$id !== excludeId
  )) {
    uniqueSlug = `${baseSlug}-${counter}`
    counter++
  }

  return uniqueSlug
}

/**
 * Generates a slug and ensures it's unique in one step
 * 
 * @param text - The text to convert to a slug
 * @param entities - Array of entities to check for existing slugs
 * @param options - Optional configuration for slug generation
 * @param excludeId - Optional ID to exclude from uniqueness check
 * @returns A unique slug string
 * 
 * @example
 * ```ts
 * const posts = [{ $id: '1', slug: 'hello-world' }]
 * generateUniqueSlugFromText('Hello World!', posts) // "hello-world-1"
 * ```
 */
export function generateUniqueSlugFromText<T extends SlugEntity>(
  text: string,
  entities: T[],
  options: GenerateSlugOptions = {},
  excludeId?: string
): string {
  const baseSlug = generateSlug(text, options)
  return generateUniqueSlug(baseSlug, entities, excludeId)
}

