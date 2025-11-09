import { BlogTag } from "./tags-table";
import { generateSlug, generateUniqueSlug as generateUniqueSlugBase } from '@/lib/slug';

// Re-export from global slug utility
export { generateSlug };

// Type-specific wrapper for blog tags
export function generateUniqueSlug(
  baseSlug: string,
  tags: BlogTag[],
  excludeId?: string
): string {
  return generateUniqueSlugBase(baseSlug, tags, excludeId);
}

