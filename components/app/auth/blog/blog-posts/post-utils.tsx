import { BlogPost } from "@/app/auth/blog/blog-posts/types";

export function getCategoryName(post: BlogPost, categories: any[]): string {
  // Use only the relationship field
  if (post.blogCategories) {
    // Check if blogCategories is an object (expanded relationship)
    if (typeof post.blogCategories === 'object' && post.blogCategories.name) {
      return post.blogCategories.name;
    }
    // Check if blogCategories is a string (unexpanded relationship ID)
    else if (typeof post.blogCategories === 'string') {
      const category = categories.find(cat => cat.$id === post.blogCategories);
      return category?.name || post.blogCategories;
    }
  }
  return "__UNCATEGORIZED__"; // Placeholder that will be translated in the component
}

