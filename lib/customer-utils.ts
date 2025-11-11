/**
 * Customer utility functions for tags and metadata management
 */

export interface CustomerMetadata {
  tags?: string[];
  customFields?: Record<string, any>;
  integrationData?: Record<string, any>;
  lastSyncAt?: string;
}

/**
 * Parse customer metadata from JSON string
 */
export function parseCustomerMetadata(metadata?: string | null): CustomerMetadata {
  if (!metadata) return {};
  try {
    return JSON.parse(metadata);
  } catch {
    return {};
  }
}

/**
 * Stringify customer metadata to JSON string
 */
export function stringifyCustomerMetadata(metadata: CustomerMetadata): string {
  return JSON.stringify(metadata);
}

/**
 * Get tags from customer metadata
 */
export function getCustomerTags(metadata?: string | null): string[] {
  const parsed = parseCustomerMetadata(metadata);
  return parsed.tags || [];
}

/**
 * Set tags in customer metadata
 */
export function setCustomerTags(metadata: string | null | undefined, tags: string[]): string {
  const parsed = parseCustomerMetadata(metadata);
  parsed.tags = tags;
  return stringifyCustomerMetadata(parsed);
}

/**
 * Add a tag to customer metadata
 */
export function addCustomerTag(metadata: string | null | undefined, tag: string): string {
  const tags = getCustomerTags(metadata);
  if (!tags.includes(tag.trim())) {
    tags.push(tag.trim());
  }
  return setCustomerTags(metadata, tags);
}

/**
 * Remove a tag from customer metadata
 */
export function removeCustomerTag(metadata: string | null | undefined, tag: string): string {
  const tags = getCustomerTags(metadata);
  return setCustomerTags(metadata, tags.filter(t => t !== tag));
}

