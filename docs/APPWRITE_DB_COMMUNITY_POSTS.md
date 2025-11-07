# Community Posts Database Schema

## Overview
The `community_posts` collection stores community discussion posts, questions, and content shared by users. This collection supports community engagement, moderation, and content organization.

## Collection Configuration

**Collection ID**: `community_posts`
**Database**: `console-db`

## Attributes

| Attribute | Type | Size | Required | Default | Description | Index |
|-----------|------|------|----------|---------|-------------|-------|
| `title` | String | 200 | ✅ | - | Post title | ✅ |
| `slug` | String | 200 | ✅ | - | URL-friendly identifier | ✅ |
| `content` | String | 5000 | ✅ | - | Post content (HTML from TipTap) | ❌ |
| `excerpt` | String | 500 | ❌ | null | Brief post summary | ❌ |
| `author` | String | 100 | ❌ | null | Author's display name | ✅ |
| `authorId` | String | 50 | ✅ | - | Author's user ID | ✅ |
| `authorEmail` | String | 255 | ❌ | null | Author's email | ❌ |
| `communityTopics` | Relationship | - | ❌ | null | Topic relationship (Many to One) | ✅ |
| `status` | String | 20 | ✅ | 'pending' | Post status | ✅ |
| `isPinned` | Boolean | - | ✅ | false | Pinned post flag | ✅ |
| `isLocked` | Boolean | - | ✅ | false | Locked post flag | ✅ |
| `isFeatured` | Boolean | - | ✅ | false | Featured post flag | ✅ |
| `views` | Integer | - | ✅ | 0 | View count (Min: 0) | ✅ |
| `upvotes` | Integer | - | ✅ | 0 | Upvote count (Min: 0) | ✅ |
| `downvotes` | Integer | - | ✅ | 0 | Downvote count (Min: 0) | ✅ |
| `replyCount` | Integer | - | ✅ | 0 | Reply count (Min: 0) | ✅ |
| `lastReplyAt` | Datetime | - | ❌ | null | Last reply timestamp | ✅ |
| `lastReplyBy` | String | 100 | ❌ | null | Last reply author | ❌ |
| `tags` | String[] | 20 | ❌ | [] | Post tags (each tag max 20 chars) | ❌ |
| `ipAddress` | String | 45 | ❌ | null | IP address for moderation | ❌ |
| `userAgent` | String | 500 | ❌ | null | Browser/client info | ❌ |

## Enum Values

### Status Values
- `pending` - Post awaiting moderation approval
- `approved` - Post approved and visible
- `rejected` - Post rejected by moderator
- `archived` - Post archived and hidden
- `deleted` - Post soft-deleted

## Indexes

### Key Indexes
1. **title** (ascending) - For title-based search
2. **slug** (ascending, unique) - For URL routing
3. **author** (ascending) - For author filtering
4. **authorId** (ascending) - For user-based queries
5. **communityTopics** (ascending) - For topic filtering
6. **status** (ascending) - For status filtering
7. **isPinned** (ascending) - For pinned posts
8. **isLocked** (ascending) - For locked posts
9. **isFeatured** (ascending) - For featured posts
10. **views** (descending) - For popular posts
11. **upvotes** (descending) - For trending posts
12. **replyCount** (descending) - For active discussions
13. **lastReplyAt** (descending) - For recent activity
14. **$createdAt** (descending) - For chronological sorting

### Fulltext Indexes
- `title` - For post title search
- `content` - For post content search

## Permissions

- **Create**: `users` (authenticated users can create posts)
- **Read**: `*` (public posts are visible to all, pending posts visible to author and admins)
- **Update**: `users` (authors can update their own posts, admins can update any)
- **Delete**: `users` (authors can delete their own posts, admins can delete any)

## Relations

### Outgoing Relations
- `communityTopics` → `community_topics` (Many to One, bidirectional) *[Post belongs to topic]*
- `authorId` → `users.$id` (Many to One) *[Post author]*

### Incoming Relations
- `community_replies.postId` → This post (One to Many) *[Post replies]*
- `community_votes.postId` → This post (One to Many) *[Post votes]*

### Bidirectional Relationship Notes
- **Topic Relationship**: Posts are linked to topics via `communityTopics` bidirectional relationship
- **Reply Relationship**: Replies are linked to posts via `postId` in `community_replies` collection
- **Vote Relationship**: Votes are tracked in `community_votes` collection
- **Data Integrity**: When a post is deleted, associated replies and votes are handled based on deletion behavior
- **Set NULL Behavior**: Orphaned relationships are automatically cleaned up

## TypeScript Interface

```typescript
interface CommunityPost {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  title: string;
  slug: string;
  content: string; // HTML content from TipTap (max 5000 chars)
  excerpt?: string;
  author?: string; // Optional display name
  authorId: string;
  authorEmail?: string;
  communityTopics?: {
    $id: string;
    name: string;
    slug: string;
    description?: string;
    isActive: boolean;
  }; // Topic relationship (Many to One, bidirectional)
  status: 'pending' | 'approved' | 'rejected' | 'archived' | 'deleted';
  isPinned: boolean;
  isLocked: boolean;
  isFeatured: boolean;
  views: number;
  upvotes: number;
  downvotes: number;
  replyCount: number; // Calculated from community_replies collection
  lastReplyAt?: string;
  lastReplyBy?: string;
  tags: string[]; // Each tag max 20 characters
  ipAddress?: string;
  userAgent?: string;
}
```

## Data Validation Rules

### Title
- Required, max 200 characters
- Used for slug generation
- Must be unique per topic (optional constraint)

### Slug
- Required, max 200 characters
- URL-friendly format (lowercase, hyphens)
- Must be unique across all posts

### Content
- Required HTML content
- Generated by TipTap editor
- Max 5000 characters
- Minimum 10 characters

### Author Information
- **author**: Optional display name (1-100 characters, can be null)
- **authorId**: Required user ID for authenticated users
- **authorEmail**: Optional for notification purposes

### Status Workflow
- New posts default to `pending` status
- Requires admin approval to become `approved`
- Rejected posts remain in database for audit
- Authors can edit pending posts

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

### Vote Calculation
```typescript
function calculateScore(upvotes: number, downvotes: number): number {
  return upvotes - downvotes;
}

function calculateHotScore(upvotes: number, downvotes: number, createdAt: string): number {
  const score = upvotes - downvotes;
  const order = Math.log10(Math.max(Math.abs(score), 1));
  const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
  const seconds = (Date.now() - new Date(createdAt).getTime()) / 1000;
  return Math.round(sign * order + seconds / 45000);
}
```

### Reply Count Update
```typescript
async function updateReplyCount(postId: string): Promise<void> {
  const replies = await databases.listDocuments(
    DATABASE_ID,
    'community_replies',
    [Query.equal('postId', postId), Query.equal('status', 'approved')]
  );
  
  const lastReply = replies.documents[0];
  await databases.updateDocument(
    DATABASE_ID,
    'community_posts',
    postId,
    {
      replyCount: replies.total,
      lastReplyAt: lastReply?.$createdAt || null,
      lastReplyBy: lastReply?.author || null
    }
  );
}
```

## Moderation Workflow

1. **Post Creation**: User creates post → status = `pending`
2. **Admin Review**: Admin reviews post in moderation queue
3. **Approval**: Admin approves → status = `approved` → post becomes visible
4. **Rejection**: Admin rejects → status = `rejected` → post hidden, author notified
5. **Editing**: Author can edit pending/approved posts
6. **Locking**: Admin can lock posts to prevent further replies
7. **Pinning**: Admin can pin important posts to top of topic

## Spam Prevention

- Rate limiting: Max 5 posts per hour per user
- Content analysis for spam patterns
- IP-based blocking for repeat offenders
- Automatic flagging of suspicious content
- Manual review queue for flagged posts

## Performance Considerations

- Posts loaded with pagination (20 per page)
- Reply counts cached and updated asynchronously
- Hot score calculated on-demand for trending
- Fulltext search optimized with indexes
- Views tracked asynchronously to avoid write contention

## Migration Notes

### From Legacy System
- Ensure all existing posts have valid slugs
- Migrate view/vote counts from separate counters
- Set appropriate status during migration
- Validate all topic relationships
- Recalculate reply counts

### Future Considerations
- Scheduled post publishing
- Post templates and drafts
- Rich media attachments
- Post versioning/history
- Advanced search filters
- Post recommendations

