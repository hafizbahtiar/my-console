# Community Replies Database Schema

## Overview
The `community_replies` collection stores replies to community posts. This collection supports threaded discussions, moderation, and user engagement tracking.

## Collection Configuration

**Collection ID**: `community_replies`
**Database**: `console-db`

## Attributes

| Attribute | Type | Size | Required | Default | Description | Index |
|-----------|------|------|----------|---------|-------------|-------|
| `content` | String | 5000 | ✅ | - | Reply text content | ❌ |
| `author` | String | 100 | ✅ | - | Author's display name | ✅ |
| `authorId` | String | 50 | ✅ | - | Author's user ID | ✅ |
| `authorEmail` | String | 255 | ❌ | null | Author's email | ❌ |
| `postId` | String | 50 | ✅ | - | Parent post ID | ✅ |
| `parentId` | String | 50 | ❌ | null | ID of parent reply (for threading) | ✅ |
| `status` | String | 20 | ✅ | 'pending' | Reply status | ✅ |
| `isSpam` | Boolean | - | ✅ | false | Spam detection flag | ✅ |
| `upvotes` | Integer | - | ✅ | 0 | Upvote count | ✅ |
| `downvotes` | Integer | - | ✅ | 0 | Downvote count | ✅ |
| `depth` | Integer | - | ✅ | 0 | Nesting level (0 = top level) | ✅ |
| `isSolution` | Boolean | - | ✅ | false | Marked as solution flag | ✅ |
| `ipAddress` | String | 45 | ❌ | null | IP address for moderation | ❌ |
| `userAgent` | String | 500 | ❌ | null | Browser/client info | ❌ |

## Enum Values

### Status Values
- `pending` - Reply awaiting moderation
- `approved` - Reply approved and visible
- `rejected` - Reply rejected by moderator
- `deleted` - Reply soft-deleted

## Indexes

### Key Indexes
1. **authorId** (ascending) - For user reply lookup
2. **postId** (ascending) - For post reply lookup
3. **parentId** (ascending) - For reply threading
4. **status** (ascending) - For filtering approved replies
5. **isSpam** (ascending) - For spam management
6. **depth** (ascending) - For comment nesting queries
7. **isSolution** (ascending) - For solution filtering
8. **upvotes** (descending) - For popular replies
9. **$createdAt** (ascending) - For chronological sorting

### Fulltext Indexes
- `content` - For reply search functionality

## Permissions

- **Create**: `users` (authenticated users can create replies)
- **Read**: `*` (approved replies are public, pending replies visible to author and admins)
- **Update**: `users` (authors can update their own replies, admins can update any)
- **Delete**: `users` (authors can delete their own replies, admins can delete any)

## Relations

### Outgoing Relations
- `postId` → `community_posts.$id` (Many to One) *[Reply belongs to post]*
- `parentId` → `community_replies.$id` (Many to One, self-referencing) *[Reply to reply]*
- `authorId` → `users.$id` (Many to One) *[Reply author]*

### Incoming Relations
- `community_replies.parentId` → This reply (One to Many) *[Replies to this reply]*
- `community_votes.replyId` → This reply (One to Many) *[Reply votes]*

### Relationship Notes
- **Post Relationship**: Replies are linked to posts via `postId`
- **Threading Support**: Replies can reply to other replies via `parentId`, supporting nested discussions
- **Maximum Depth**: Limited to 3 levels to prevent infinite nesting
- **Solution Marking**: Only one reply per post can be marked as solution
- **Deletion Behavior**: CASCADE deletion - when a post is deleted, all associated replies are automatically deleted

## TypeScript Interface

```typescript
interface CommunityReply {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  content: string;
  author: string;
  authorId: string;
  authorEmail?: string;
  postId: string;
  parentId?: string;
  status: 'pending' | 'approved' | 'rejected' | 'deleted';
  isSpam: boolean;
  upvotes: number;
  downvotes: number;
  depth: number;
  isSolution: boolean;
  ipAddress?: string;
  userAgent?: string;

  // Populated relationships
  post?: CommunityPost; // Parent post
  parent?: CommunityReply; // Parent reply
  replies?: CommunityReply[]; // Child replies
}
```

## Data Validation Rules

### Content
- **Required**: Must be provided and non-empty
- **Length**: 1-5000 characters
- **Format**: HTML sanitization applied, basic formatting allowed
- **Spam Check**: Automatic spam detection on submission

### Author Information
- **Author**: Required display name (1-100 characters)
- **AuthorId**: Required user ID for authenticated users
- **AuthorEmail**: Optional for notification purposes

### Relationships
- **postId**: Must reference an existing, approved post
- **parentId**: Must reference an existing approved reply (if provided)
- **Depth**: Automatically calculated based on parent reply depth

### Moderation
- **status**: Defaults to `pending`, requires admin/moderator approval
- **isSpam**: Defaults to false, can be flagged by users/admins
- **Upvotes/Downvotes**: Non-negative integers, user engagement tracking

## Business Logic

### Depth Calculation
```typescript
async function calculateDepth(parentId?: string): Promise<number> {
  if (!parentId) return 0;
  
  const parent = await getReply(parentId);
  if (!parent) return 0;
  
  return parent.depth + 1;
}

async function validateDepth(depth: number): Promise<boolean> {
  return depth < 3; // Maximum 3 levels of nesting
}
```

### Solution Marking
```typescript
async function markAsSolution(replyId: string, postId: string): Promise<void> {
  // Unmark existing solution
  const existingSolutions = await databases.listDocuments(
    DATABASE_ID,
    'community_replies',
    [
      Query.equal('postId', postId),
      Query.equal('isSolution', true)
    ]
  );

  for (const solution of existingSolutions.documents) {
    await databases.updateDocument(
      DATABASE_ID,
      'community_replies',
      solution.$id,
      { isSolution: false }
    );
  }

  // Mark new solution
  await databases.updateDocument(
    DATABASE_ID,
    'community_replies',
    replyId,
    { isSolution: true }
  );
}
```

### Reply Count Update
```typescript
async function updatePostReplyCount(postId: string): Promise<void> {
  const replies = await databases.listDocuments(
    DATABASE_ID,
    'community_replies',
    [
      Query.equal('postId', postId),
      Query.equal('status', 'approved')
    ]
  );

  const lastReply = replies.documents.sort((a, b) => 
    new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
  )[0];

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

1. **Reply Creation**: User creates reply → status = `pending`
2. **Auto-Approval**: Trusted users (based on history) may be auto-approved
3. **Admin Review**: Admin/moderator reviews pending replies
4. **Approval**: Admin approves → status = `approved` → reply becomes visible
5. **Rejection**: Admin rejects → status = `rejected` → reply hidden, author notified
6. **Spam Detection**: Automatic spam detection flags suspicious replies

## Spam Prevention

- Rate limiting: Max 10 replies per hour per user
- Content analysis for spam patterns
- IP-based blocking for repeat offenders
- Automatic flagging of suspicious content
- Manual review queue for flagged replies

## Threading

- Maximum depth of 3 levels
- Parent replies must be approved before child replies are allowed
- Thread structure maintained through `parentId` and `depth` fields
- Flat view option available for better readability

## Performance Considerations

- Replies loaded lazily with pagination (50 per page)
- Thread structure cached for performance
- Indexes optimized for common query patterns
- Denormalized depth field for efficient sorting
- Reply counts updated asynchronously

## Notification System

- Email notifications for reply mentions (@username)
- Email notifications for replies to user's posts
- Email notifications for replies to user's replies
- Admin notifications for new replies requiring approval

## Migration Considerations

### From External Systems
- Import existing replies with proper relationship mapping
- Set appropriate approval status during migration
- Recalculate depth fields for threaded replies
- Validate all relationships post-migration

### Schema Evolution
- Backward compatibility maintained for existing fields
- New moderation fields added with safe defaults
- Relationship constraints enforced at application level

