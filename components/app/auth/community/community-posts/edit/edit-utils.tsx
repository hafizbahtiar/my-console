// Re-export from global slug utility with maxLength option for community posts
import { generateSlug as generateSlugBase } from '@/lib/slug';

export function generateSlug(title: string): string {
  return generateSlugBase(title, { maxLength: 200 });
}

