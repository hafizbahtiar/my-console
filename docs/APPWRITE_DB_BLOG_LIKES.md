# Blog Likes Database Schema

## Overview
The `blog_likes` collection manages user engagement through like/unlike functionality for blog posts.

## Collection Configuration

**Collection ID**: `blog_likes`

## Attributes

| Attribute | Type | Size | Required | Default | Description | Index |
|-----------|------|------|----------|---------|-------------|-------|
| `postId` | String (Relation) | - | ✅ | - | Reference to blog post ID (relation with cascade delete) | ✅ |
| `userId` | String | 50 | ✅ | - | User who liked the post | ✅ |
| `likeType` | String | 20 | ✅ | 'like' | Type of interaction | ✅ |
| `isActive` | Boolean | - | ✅ | true | Like status (for unliking) | ✅ |
| `updatedAt` | Datetime | - | ✅ | now | Last interaction time | ✅ |

## Enum Values for `likeType`

- `like` (default)
- `love`
- `clap`
- `bookmark`

## Indexes

### Key Indexes
1. **postId** (ascending) - For post-specific like queries
2. **userId** (ascending) - For user-specific like history
3. **likeType** (ascending) - For filtering by interaction type
4. **isActive** (ascending) - For active like filtering

### Compound Indexes
5. **Unique Like Index** (postId + userId):
   - Type: Unique
   - Ensures one like per user per post
   - Enables efficient toggle operations

## Permissions

- **Create**: `users` (authenticated users can create likes)
- **Read**: `users` (users can read their own likes)
- **Update**: `users` (users can update their own likes)
- **Delete**: `role:super_admin` (only admins can delete)

## Relations

### Outgoing Relations
- `postId` → `blog_posts.$id` (Many to One, cascade delete)

## TypeScript Interface

```typescript
interface BlogLike {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  postId: string; // Reference to blog post
  userId: string; // User who liked
  likeType: 'like' | 'love' | 'clap' | 'bookmark'; // Like type
  isActive: boolean; // Whether like is still active
}
```

## Appwrite Collection Setup Guide

### Important Notes for Relations

**Relation Setup in Appwrite:**
- When creating a relation attribute, Appwrite automatically creates the relationship
- **Cascade Delete**: When a blog post is deleted, all related likes are automatically deleted
- **Data Type**: Relations store document IDs as strings in the database
- **Querying**: You can query related data using joins in your application code

**Relation Configuration:**
- **Type**: Many to One (multiple likes can reference one post)
- **Target Collection**: `blog_posts`
- **Delete Rule**: Cascade (delete related records when parent is deleted)

### Creating Blog Likes Collection

1. **Go to Appwrite Console** → Database → Your Database
2. **Create Collection** with ID: `blog_likes`
3. **Add Attributes** (in order):

```
Key: postId
Type: Relation
Related Collection: blog_posts
Relation Type: Many to One
Cascade Delete: Yes (delete all related likes when post is deleted)
Required: Yes
```

```
Key: userId
Type: String
Required: Yes
Default: (empty)
Size: 50
```

```
Key: likeType
Type: String
Required: Yes
Default: like
Size: 20
```

```
Key: isActive
Type: Boolean
Required: Yes
Default: true
```

```
Key: updatedAt
Type: Datetime
Required: Yes
Default: Now
```

### Setting Up Indexes

#### Blog Likes Indexes:
1. **postId Index**:
   - Type: Key
   - Key: postId
   - Order: ASC

2. **userId Index**:
   - Type: Key
   - Key: userId
   - Order: ASC

3. **likeType Index**:
   - Type: Key
   - Key: likeType
   - Order: ASC

4. **isActive Index**:
   - Type: Key
   - Key: isActive
   - Order: ASC

5. **Unique Like Index** (Compound):
   - Type: Unique
   - Attributes: postId, userId

## Like Management System

### Toggle Like Implementation
```typescript
// Toggle like status
async function toggleLike(postId: string, userId: string, likeType: string = 'like') {
  // Check if user already liked this post
  const existingLike = await findUserLike(postId, userId);

  if (existingLike) {
    // Toggle active status
    await tablesDB.updateRow({
      databaseId: DATABASE_ID,
      tableId: 'blog_likes',
      rowId: existingLike.$id,
      data: {
        isActive: !existingLike.isActive,
        updatedAt: new Date().toISOString()
      }
    });
  } else {
    // Create new like
    await tablesDB.createRow({
      databaseId: DATABASE_ID,
      tableId: 'blog_likes',
      rowId: `like_${userId}_${postId}`,
      data: {
        postId,
        userId,
        likeType,
        isActive: true,
        updatedAt: new Date().toISOString()
      }
    });
  }

  // Update like counter in blog_posts
  await updateLikeCount(postId);
}
```

### Helper Functions
```typescript
// Find user's like for a post
async function findUserLike(postId: string, userId: string) {
  const likes = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: 'blog_likes',
    queries: [
      `equal("postId", "${postId}")`,
      `equal("userId", "${userId}")`
    ]
  });

  return likes.rows[0] || null;
}

// Update like count in blog post
async function updateLikeCount(postId: string) {
  const activeLikes = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: 'blog_likes',
    queries: [
      `equal("postId", "${postId}")`,
      `equal("isActive", true)`
    ]
  });

  await tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: 'blog_posts',
    rowId: postId,
    data: {
      likes: activeLikes.rows.length
    }
  });
}
```

## Analytics Queries

### Like Analytics
```typescript
// Get detailed like analytics
async function getPostLikeAnalytics(postId: string) {
  const likes = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: 'blog_likes',
    queries: [
      `equal("postId", "${postId}")`,
      'equal("isActive", true)'
    ]
  });

  return {
    totalLikes: likes.rows.length,        // Active likes from all users
    likeTypes: groupByType(likes.rows),   // Breakdown by like type
    likeTrends: groupByDate(likes.rows),  // Likes over time
    topContributors: getTopLikers(likes.rows) // Most active likers
  };
}

// Group likes by type
function groupByType(likes: BlogLike[]) {
  return likes.reduce((acc, like) => {
    acc[like.likeType] = (acc[like.likeType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

// Group likes by date
function groupByDate(likes: BlogLike[]) {
  return likes.reduce((acc, like) => {
    const date = new Date(like.$createdAt).toDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
```

## Business Logic

### Like Toggle Flow
1. **Check Existing Like**: Query for existing like by user and post
2. **Toggle Status**: If exists, toggle `isActive` field
3. **Create New Like**: If not exists, create new like record
4. **Update Counter**: Recalculate and update post's like count
5. **Audit Log**: Record the like/unlike action

### Data Consistency
- **Atomic Operations**: Use transactions for counter updates
- **Race Condition Prevention**: Handle concurrent like operations
- **Data Validation**: Ensure valid like types and user permissions

## Security Considerations

### Permission Model
- **User Isolation**: Users can only modify their own likes
- **Admin Override**: Admins can manage all like records
- **Audit Trail**: All like operations are logged

### Rate Limiting
- **Spam Prevention**: Implement rate limiting for like operations
- **Bot Detection**: Monitor for suspicious like patterns
- **IP-based Limits**: Additional protection against abuse

## Performance Optimization

### Indexing Strategy
- **Compound Unique Index**: Efficiently prevents duplicate likes
- **Filtered Queries**: Fast retrieval of active likes only
- **User History**: Quick access to user's like history

### Caching Strategy
- **Like Counts**: Cache post like counts for performance
- **User Status**: Cache user's like status for posts
- **Analytics Data**: Cache aggregated analytics data

## UI/UX Considerations

### Like Button States
- **Not Liked**: Default state, allows liking
- **Liked**: Shows current like type, allows unliking
- **Loading**: Shows during API operations
- **Disabled**: For unauthenticated users

### Like Type Selection
- **Single Type**: Simple like/unlike functionality
- **Multiple Types**: Allow users to choose like type
- **Custom Types**: Future expansion for custom reactions

## Future Enhancements

- Like notifications for authors
- Social sharing integration
- Like streaks and achievements
- Advanced analytics dashboard
- Like export functionality
- Like moderation tools
