import { tablesDB, DATABASE_ID, BLOG_POSTS_COLLECTION_ID } from "@/lib/appwrite";
import { BlogCategory } from "./categories-table";

// Function to calculate post counts for categories
export async function calculatePostCounts(categories: BlogCategory[]): Promise<BlogCategory[]> {
  try {
    // Get all posts to count relationships
    const postsResponse = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: BLOG_POSTS_COLLECTION_ID,
    });

    const posts = postsResponse.rows as any[];

    // Count posts per category using relationships
    const categoryCounts = new Map<string, number>();

    posts.forEach(post => {
      // Handle different relationship field formats
      let categoryId: string | null = null;

      // Case 1: blogCategories is an object with $id (expanded relationship)
      if (post.blogCategories && typeof post.blogCategories === 'object' && post.blogCategories.$id) {
        categoryId = post.blogCategories.$id;
      }
      // Case 2: blogCategories is just a string ID (unexpanded relationship)
      else if (typeof post.blogCategories === 'string' && post.blogCategories.trim()) {
        categoryId = post.blogCategories;
      }
      // Case 3: Fallback to old category string field
      else if (post.category && typeof post.category === 'string' && post.category.trim()) {
        categoryId = post.category;
      }

      if (categoryId) {
        categoryCounts.set(categoryId, (categoryCounts.get(categoryId) || 0) + 1);
      }
    });

    // Update categories with calculated counts
    const result = categories.map(category => ({
      ...category,
      postCount: categoryCounts.get(category.$id) || 0,
    }));

    return result;
  } catch (error) {
    console.warn('Failed to calculate post counts:', error);
    // Return categories with 0 counts on error
    return categories.map(category => ({
      ...category,
      postCount: 0,
    }));
  }
}

import { generateSlug, generateUniqueSlug as generateUniqueSlugBase } from '@/lib/slug';

// Re-export from global slug utility
export { generateSlug };

// Type-specific wrapper for blog categories
export function generateUniqueSlug(
  baseSlug: string,
  categories: BlogCategory[],
  excludeId?: string
): string {
  return generateUniqueSlugBase(baseSlug, categories, excludeId);
}

