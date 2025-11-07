# Appwrite Database Schema: blog_comments

## Overview

The `blog_comments` collection stores user comments on blog posts. This collection implements a many-to-one relationship with `blog_posts` and supports threaded replies, moderation, and user engagement tracking.

## Collection Details

**Collection ID**: `blog_comments`
**Database**: `console-db`

## Attributes

| Attribute | Type | Size | Required | Default | Description | Indexed |
|-----------|------|------|----------|---------|-------------|---------|
| `content` | String | 2000 | ✅ | - | Comment text content | ❌ |
| `author` | String | 100 | ✅ | - | Author's display name | ✅ |
| `authorId` | String | 50 | ❌ | null | Author's user ID | ✅ |
| `authorEmail` | String | 255 | ❌ | null | Author's email (for notifications) | ❌ |
| `blogPosts` | Relationship | - | ✅ | - | Parent blog post relationship | ✅ |
| `parentId` | String | 50 | ❌ | null | ID of parent comment (for replies) | ✅ |
| `isApproved` | Boolean | - | ✅ | false | Moderation approval status | ✅ |
| `isSpam` | Boolean | - | ✅ | false | Spam detection flag | ✅ |
| `likes` | Integer | - | ✅ | 0 | Number of likes on the comment | ✅ |
| `dislikes` | Integer | - | ✅ | 0 | Number of dislikes on the comment | ✅ |
| `depth` | Integer | - | ✅ | 0 | Nesting level (0 = top level, 1 = reply, etc.) | ✅ |
| `ipAddress` | String | 45 | ❌ | null | IP address for moderation | ❌ |
| `userAgent` | String | 500 | ❌ | null | Browser/client info | ❌ |

## Permissions

- **Create**: `*` (anyone can create comments, subject to spam filtering)
- **Read**: `*` (comments are public once approved)
- **Update**: `role:super_admin` (only admins can moderate comments)
- **Delete**: `role:super_admin` (only admins can delete comments)

## Relations

### Outgoing Relations
- `blogPosts` → `blog_posts` (Many to One, bidirectional) *[Comment belongs to post]*
- `parentId` → `blog_comments.$id` (Many to One, self-referencing) *[Reply relationship]*

### Incoming Relations
- `blog_comments.parentId` → This comment (One to Many) *[Replies to this comment]*
- `blog_posts.blogComments` → This comment (One to Many, bidirectional) *[Post's comments]*

## Indexes

### Key Indexes
- `authorId` (String, ascending) - For user comment lookup
- `blogPosts` (Relationship, ascending) - For post comment lookup
- `parentId` (String, ascending) - For reply threading
- `isApproved` (Boolean, ascending) - For filtering approved comments
- `isSpam` (Boolean, ascending) - For spam management
- `depth` (Integer, ascending) - For comment nesting queries
- `$createdAt` (Datetime, descending) - For chronological sorting

### Fulltext Indexes
- `content` - For comment search functionality

## Bidirectional Relationship Notes

- **Post Relationship**: Comments are linked to blog posts via `blogPosts` bidirectional relationship, allowing efficient querying of all comments for a specific post
- **Threading Support**: Comments can reply to other comments via `parentId`, supporting nested discussion threads
- **Moderation Workflow**: Comments start unapproved and require admin approval before becoming visible
- **Spam Protection**: Built-in spam detection with manual review capabilities
- **Deletion Behavior**: CASCADE deletion - when a blog post is deleted, all associated comments are automatically deleted to maintain data integrity

### Deletion Behavior

When deleting records in related collections:

- **Blog Post Deletion**: CASCADE - All comments associated with the deleted post are automatically removed
- **Comment Deletion**: CASCADE - All child replies to the deleted comment are automatically removed (for threaded comments)
- **User/Account Deletion**: SET NULL - Comment author references are set to null, preserving comment history while removing user association

## TypeScript Interface

```typescript
interface BlogComment {
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
  parent?: BlogComment; // For nested replies
  replies?: BlogComment[]; // Child comments
}
```

## Data Validation Rules

### Content
- **Required**: Must be provided and non-empty
- **Length**: 1-2000 characters
- **Format**: HTML sanitization applied, basic formatting allowed
- **Spam Check**: Automatic spam detection on submission

### Author Information
- **Author**: Required display name (1-100 characters)
- **AuthorId**: Optional user ID for authenticated users
- **AuthorEmail**: Optional for notification purposes

### Relationships
- **blogPosts**: Must reference an existing, published blog post (Many-to-One relationship)
- **ParentId**: Must reference an existing approved comment (if provided)
- **Depth**: Automatically calculated based on parent comment depth

### Moderation
- **isApproved**: Defaults to false, requires admin approval
- **isSpam**: Defaults to false, can be flagged by users/admins
- **Likes/Dislikes**: Non-negative integers, user engagement tracking

## Implementation Notes

### Comment Threading
- Maximum depth of 3 levels to prevent infinite nesting
- Parent comments must be approved before replies are allowed
- Thread structure maintained through `parentId` and `depth` fields

### Moderation Workflow
1. User submits comment (isApproved = false)
2. Admin reviews and approves/rejects
3. Approved comments become visible to all users
4. Rejected comments remain hidden but stored for audit

### Spam Prevention
- Rate limiting per IP/user
- Content analysis for spam patterns
- Manual spam flagging by users
- Admin spam queue for review

### Performance Considerations
- Comments loaded lazily with pagination
- Thread structure cached for performance
- Indexes optimized for common query patterns
- Denormalized depth field for efficient sorting

### Notification System
- Email notifications for comment replies
- Admin notifications for new comments requiring approval
- User mentions in comments (@username)

## Migration Considerations

### From External Systems
- Import existing comments with proper relationship mapping
- Set appropriate approval status during migration
- Recalculate depth fields for threaded comments
- Validate all relationships post-migration

### Schema Evolution
- Backward compatibility maintained for existing fields
- New moderation fields added with safe defaults
- Relationship constraints enforced at application level
