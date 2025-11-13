# Blog Likes Database Schema

## Overview
The `blog_likes` collection manages user engagement through like/unlike functionality for blog posts.

## Collection Configuration

**Collection ID**: `blog_likes`

## Attributes

| Attribute | Type | Size | Required | Default | Description | Index |
|-----------|------|------|----------|---------|-------------|-------|
| `postId` | String (Relation) | - | ✅ | - | Reference to blog post ID (relation with cascade delete) | ✅ |
| `userId` | String | 50 | ❌ | null | User who liked the post (null for anonymous users) | ✅ |
| `ipAddress` | String | 45 | ❌ | null | IP address (required for anonymous users) | ✅ |
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
5. **Unique Like Index (Authenticated)** (postId + userId):
   - Type: Unique
   - Ensures one like per authenticated user per post
   - Only applies when userId is not null
   - Enables efficient toggle operations for authenticated users

6. **Unique Like Index (Anonymous)** (postId + ipAddress):
   - Type: Unique
   - Ensures one like per IP address per post
   - Only applies when userId is null
   - Prevents duplicate likes from same IP address

## Permissions

- **Create**: `*` (both authenticated and anonymous users can create likes)
- **Read**: `*` (likes are readable by all)
- **Update**: `users` (authenticated users can update their own likes), `*` (anonymous users can update likes from their IP)
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
  userId?: string; // User who liked (null for anonymous users)
  ipAddress?: string; // IP address (required for anonymous users)
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
Required: No
Default: (empty)
Size: 50
```

```
Key: ipAddress
Type: String
Required: No
Default: (empty)
Size: 45
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

5. **ipAddress Index**:
   - Type: Key
   - Key: ipAddress
   - Order: ASC

6. **Unique Like Index (Authenticated)** (Compound):
   - Type: Unique
   - Attributes: postId, userId
   - Condition: Only enforces uniqueness when userId is not null

7. **Unique Like Index (Anonymous)** (Compound):
   - Type: Unique
   - Attributes: postId, ipAddress
   - Condition: Only enforces uniqueness when userId is null and ipAddress is not null

## Like Management System

### Like Limitation Rules
- **Authenticated Users**: Only 1 like per authenticated user per post (enforced by unique index on `postId + userId`)
- **Anonymous Users**: Only 1 like per IP address per post (enforced by unique index on `postId + ipAddress`)
- **Implementation**: Application logic checks for existing like before creating new one
- **Data Integrity**: Unique indexes prevent duplicate likes at database level

### Toggle Like Implementation
```typescript
// Toggle like status (supports both authenticated and anonymous users)
async function toggleLike(
  postId: string, 
  userId?: string, 
  ipAddress?: string, 
  likeType: string = 'like'
) {
  // Get IP address if not provided (required for anonymous users)
  const clientIp = ipAddress || getClientIP();
  
  if (!userId && !clientIp) {
    throw new Error('Either userId or ipAddress is required for like tracking');
  }

  // Check for existing like
  const existingLike = await findExistingLike(postId, userId, clientIp);

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
    try {
      await tablesDB.createRow({
        databaseId: DATABASE_ID,
        tableId: 'blog_likes',
        rowId: `like_${userId || clientIp}_${postId}_${Date.now()}`,
        data: {
          postId,
          userId: userId || null,
          ipAddress: userId ? null : clientIp, // Only set IP for anonymous users
          likeType,
          isActive: true,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error: any) {
      // Handle unique constraint violation (like already exists)
      if (error.code === 409) {
        // Like already exists, find and toggle it
        const like = await findExistingLike(postId, userId, clientIp);
        if (like) {
          await tablesDB.updateRow({
            databaseId: DATABASE_ID,
            tableId: 'blog_likes',
            rowId: like.$id,
            data: {
              isActive: !like.isActive,
              updatedAt: new Date().toISOString()
            }
          });
        }
      } else {
        throw error;
      }
    }
  }

  // Update like counter in blog_posts
  await updateLikeCount(postId);
}
```

### Helper Functions
```typescript
// Find existing like based on authentication status
async function findExistingLike(
  postId: string, 
  userId?: string, 
  ipAddress?: string
) {
  if (userId) {
    // Check for authenticated user like
    const likes = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: 'blog_likes',
      queries: [
        Query.equal('postId', postId),
        Query.equal('userId', userId)
      ]
    });
    return likes.rows[0] || null;
  } else {
    // Check for anonymous user like by IP
    if (!ipAddress) return null;
    
    const likes = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: 'blog_likes',
      queries: [
        Query.equal('postId', postId),
        Query.equal('ipAddress', ipAddress),
        Query.isNull('userId')
      ]
    });
    return likes.rows[0] || null;
  }
}

// Get client IP address (server-side)
function getClientIP(request: Request): string {
  // Try various headers for IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  // Fallback (should not happen in production)
  return 'unknown';
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
1. **Check Authentication**: Determine if user is authenticated
2. **Authenticated User**:
   - Check for existing like with `postId + userId`
   - If exists, toggle `isActive` field
   - If not exists, create new like with `userId` and `ipAddress = null`
3. **Anonymous User**:
   - Get client IP address (required)
   - Check for existing like with `postId + ipAddress` where `userId` is null
   - If exists, toggle `isActive` field
   - If not exists, create new like with `ipAddress` and `userId = null`
4. **Update Counter**: Recalculate and update post's like count
5. **Audit Log**: Record the like/unlike action
6. **Error Handling**: Handle unique constraint violations gracefully

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
