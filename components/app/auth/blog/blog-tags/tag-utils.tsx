import { BlogTag } from "./tags-table";

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function generateUniqueSlug(
  baseSlug: string,
  tags: BlogTag[],
  excludeId?: string
): string {
  let uniqueSlug = baseSlug;
  let counter = 1;

  // Check if slug exists in current tags (excluding the one being edited)
  while (tags.some(tag =>
    tag.slug === uniqueSlug && tag.$id !== excludeId
  )) {
    uniqueSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
}

