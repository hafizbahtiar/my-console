// Shared types for blog posts functionality

export interface BlogTag {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  isActive: boolean;
}

export interface BlogPost {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  authorId?: string;
  blogCategories?: {
    $id: string;
    name: string;
    slug: string;
    description?: string;
    isActive: boolean;
  }; // Relationship field (Many to One, bidirectional)
  blogTags?: Array<{
    $id: string;
    name: string;
    slug: string;
    description?: string;
    color?: string;
    isActive: boolean;
  }>; // Tag relationships (Many to Many, bidirectional)
  readTime: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  views: number;
  likes: number;
  isFeatured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords: string[];
  allowComments: boolean;
  commentCount: number;
  relatedPosts: string[];
}

// Analytics types for blog post views and likes
export interface ViewAnalytics {
  totalViews: number;
  uniqueViews: number;
  topReferrers: Array<{ source: string; count: number }>;
  geographic: Array<{ country: string; count: number }>;
  recentViews: Array<{ timestamp: string; userAgent: string }>;
}

export interface LikeAnalytics {
  totalLikes: number;
  activeLikes: number;
  likeTypes: Array<{ type: string; count: number }>;
  recentLikes: Array<{ timestamp: string; userId: string; type: string }>;
}

// Blog comment interface
export interface BlogComment {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  content: string;
  author: string;
  authorId?: string;
  authorEmail?: string;
  blogPosts?: {
    $id: string;
    title: string;
    slug: string;
    excerpt: string;
    status: 'draft' | 'published' | 'archived';
  }; // Relationship to parent blog post
  parentId?: string;
  isApproved: boolean;
  isSpam: boolean;
  likes: number;
  dislikes: number;
  depth: number;
  ipAddress?: string;
  userAgent?: string;
  // Populated relationships
  replies?: BlogComment[]; // Child comments
}

// Form data type for creating/editing posts
export interface BlogPostFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  authorId: string;
  blogCategories: any; // Relationship object
  blogTags: any[]; // Tag relationship objects
  readTime: string;
  featuredImage: string;
  featuredImageAlt: string;
  featuredImageFile?: File; // Temporary file storage (uploaded on save)
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  views: number;
  likes: number;
  commentCount: number;
  isFeatured: boolean;
  allowComments: boolean;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  relatedPosts: string[];
}
