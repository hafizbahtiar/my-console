# Blog Posts Database Schema

## Overview
The `blog_posts` collection stores all blog post data including content, metadata, and analytics counters.

## Collection Configuration

**Collection ID**: `blog_posts`

## Attributes

| Attribute | Type | Size | Required | Default | Description | Index |
|-----------|------|------|----------|---------|-------------|-------|
| `title` | String | 200 | ✅ | - | Post title | ✅ |
| `slug` | String | 200 | ✅ | - | URL-friendly identifier | ✅ |
| `excerpt` | String | 500 | ✅ | - | Brief post summary | ❌ |
| `content` | String | - | ✅ | - | HTML content from TipTap editor | ❌ |
| `author` | String | 100 | ✅ | - | Author's name | ✅ |
| `authorId` | String | 50 | ❌ | null | Author's user ID | ✅ |
| `blogCategories` | Relationship | - | ❌ | null | Category relationship (Many to One) | ❌ |
| `readTime` | String | 20 | ✅ | - | Estimated reading time | ❌ |
| `featuredImage` | String | 2000 | ❌ | null | Featured image URL | ❌ |
| `featuredImageAlt` | String | 200 | ❌ | null | Alt text for featured image | ❌ |
| `status` | String | 20 | ✅ | 'draft' | Publication status | ✅ |
| `publishedAt` | Datetime | - | ❌ | null | Publication timestamp | ✅ |
| `views` | Integer | - | ✅ | 0 | View count | ✅ |
| `likes` | Integer | - | ✅ | 0 | Like count | ✅ |
| `isFeatured` | Boolean | - | ✅ | false | Featured post flag | ✅ |
| `seoTitle` | String | 60 | ❌ | null | SEO title override | ❌ |
| `seoDescription` | String | 160 | ❌ | null | SEO description | ❌ |
| `seoKeywords` | String[] | - | ✅ | [] | SEO keywords array | ❌ |
| `allowComments` | Boolean | - | ✅ | true | Comments enabled flag | ❌ |
| `commentCount` | Integer | - | ✅ | 0 | Comment count | ✅ |
| `relatedPosts` | String[] | - | ✅ | [] | Related post IDs | ❌ |

## Enum Values

### Status Values
- `draft` - Post is in draft state
- `published` - Post is live and visible
- `archived` - Post is archived and hidden

## Indexes

### Key Indexes
1. **title** (ascending) - For title-based search
2. **slug** (ascending, unique) - For URL routing
3. **author** (ascending) - For author filtering
4. **authorId** (ascending) - For user-based queries
5. **category** (ascending) - For category filtering
6. **status** (ascending) - For status filtering
7. **publishedAt** (ascending) - For chronological sorting
8. **views** (descending) - For popular posts
9. **likes** (descending) - For trending posts
10. **isFeatured** (ascending) - For featured posts

## Permissions

- **Create**: `role:super_admin` (only admins can create posts)
- **Read**: `users` (authenticated users can read posts)
- **Update**: `role:super_admin` (only admins can update posts)
- **Delete**: `role:super_admin` (only admins can delete posts)

## Relations

### Outgoing Relations
- `blogCategories` → `blog_categories` (Many to One, bidirectional) *[Relationship-based categorization]*
- `blogTags` → `blog_tags` (Many to Many, bidirectional) *[Tag-based content organization]*
- `relatedPosts[]` → `blog_posts.$id` (Many to Many, self-referencing)

### Incoming Relations
- `blog_comments.postId` → This post (One to Many) *[Post comments]*
- `blog_tags.blogPosts` → This post (Many to Many, bidirectional) *[Tag associations]*
- `blog_views.postId` → This post (One to Many)
- `blog_likes.postId` → This post (One to Many)

### Bidirectional Relationship Notes
- **blogCategories Relationship**: The `blogCategories` field creates a bidirectional many-to-one relationship between `blog_posts` and `blog_categories`
- **blogTags Relationship**: The `blogTags` field creates a bidirectional many-to-many relationship between `blog_posts` and `blog_tags`
- **blogComments Relationship**: Comments are linked to posts via `postId`, supporting threaded discussions and community engagement
- **Data Integrity**: When a post references a category, tag, or receives comments, the relationships are automatically maintained
- **Query Benefits**: Allows efficient querying of posts by category/tag/comments and related content
- **Relationship Management**: Set NULL behavior ensures orphaned relationships are cleaned up properly

### Migration Notes
- **Field Removal**: The deprecated `category` string field has been removed from the collection
- **Array to Relationship**: The `tags[]` array field has been replaced with `blogTags` many-to-many relationship
- **Relationship Only**: All posts now use relationship fields (`blogCategories`, `blogTags`) exclusively
- **Automatic Counts**: Post counts are calculated dynamically from relationship data
- **Data Integrity**: Bidirectional relationships ensure referential integrity
- **Set NULL Behavior**: Orphaned relationships are automatically cleaned up

## TypeScript Interface

```typescript
interface BlogPost {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string; // HTML content from TipTap
  author: string;
  authorId?: string;
  blogCategories?: {
    $id: string;
    name: string;
    slug: string;
    description?: string;
    isActive: boolean;
  }; // Category relationship (Many to One, bidirectional)
  blogTags?: Array<{
    $id: string;
    name: string;
    slug: string;
    description?: string;
    color?: string;
    isActive: boolean;
  }>; // Tag relationships (Many to Many, bidirectional)
  readTime: string;
  featuredImage?: string; // Valid URL required
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
  commentCount: number; // Calculated from blog_comments collection
  relatedPosts: string[]; // Array of related post IDs
}
```

## Data Validation Rules

### Title
- Required, max 200 characters
- Used for slug generation

### Slug
- Required, max 200 characters
- URL-friendly format (lowercase, hyphens)
- Must be unique across all posts

### Content
- Required HTML content
- Generated by TipTap editor
- No character limit (stored as text)

### Excerpt
- Required, max 500 characters
- Generated automatically or manually
- Used in post listings and SEO

### Featured Image
- Optional URL string
- Must be valid HTTP/HTTPS URL if provided
- Max 2000 characters

### SEO Fields
- `seoTitle`: Max 60 characters (Google title limit)
- `seoDescription`: Max 160 characters (Google description limit)
- `seoKeywords`: Array of relevant keywords

## Business Logic

### Slug Generation
```typescript
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .substring(0, 200); // Limit length
}
```

### Read Time Calculation
```typescript
function calculateReadTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}
```

## Migration Notes

### From Legacy System
- Ensure all existing posts have valid slugs
- Migrate view/like counts from separate counters
- Validate all featured image URLs
- Convert legacy content format if needed

### Future Considerations
- Consider adding content versioning
- Plan for scheduled publishing
- Prepare for multi-author support
- Design for content templates
