// Shared types for community posts functionality

export interface CommunityTopic {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  isPublic: boolean;
  displayOrder: number;
  color?: string;
  icon?: string;
  postCount: number;
  replyCount: number;
  lastPostAt?: string;
  moderatorIds?: string[];
  rules?: string;
}

export interface CommunityPost {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  title: string;
  slug: string;
  content: string; // Max 5000 chars
  excerpt?: string;
  author?: string; // Optional
  authorId: string;
  authorEmail?: string;
  communityTopics?: {
    $id: string;
    name: string;
    slug: string;
    description?: string;
    isActive: boolean;
  }; // Relationship field (Many to One, bidirectional)
  status: 'pending' | 'approved' | 'rejected' | 'archived' | 'deleted';
  isPinned: boolean;
  isLocked: boolean;
  isFeatured: boolean;
  views: number;
  upvotes: number;
  downvotes: number;
  replyCount: number;
  lastReplyAt?: string;
  lastReplyBy?: string;
  tags: string[]; // Each tag max 20 chars
  ipAddress?: string;
  userAgent?: string;
}

// Form data type for creating/editing community posts
export interface CommunityPostFormData {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  author?: string;
  authorId: string;
  authorEmail?: string;
  communityTopics: any; // Relationship object
  status: 'pending' | 'approved' | 'rejected' | 'archived' | 'deleted';
  isPinned: boolean;
  isLocked: boolean;
  isFeatured: boolean;
  views: number;
  upvotes: number;
  downvotes: number;
  replyCount: number;
  lastReplyAt?: string;
  lastReplyBy?: string;
  tags: string[];
  ipAddress?: string;
  userAgent?: string;
}

