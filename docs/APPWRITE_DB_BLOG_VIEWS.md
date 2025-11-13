# Blog Views Database Schema

## Overview
The `blog_views` collection tracks audience engagement by recording view events for blog posts.

## Collection Configuration

**Collection ID**: `blog_views`

## Attributes

| Attribute | Type | Size | Required | Default | Description | Index |
|-----------|------|------|----------|---------|-------------|-------|
| `postId` | String (Relation) | - | ✅ | - | Reference to blog post ID (relation with cascade delete) | ✅ |
| `userId` | String | 50 | ❌ | null | Authenticated user ID | ✅ |
| `sessionId` | String | 100 | ✅ | - | Anonymous session identifier | ✅ |
| `ipAddress` | String | 45 | ❌ | null | Client IP address (required for anonymous users) | ✅ |
| `userAgent` | String | 500 | ❌ | null | Browser/device info | ❌ |
| `referrer` | String | 2000 | ❌ | null | Referring URL | ❌ |
| `viewDuration` | Integer | - | ❌ | null | Time spent in seconds (0-3600) | ❌ |
| `isUnique` | Boolean | - | ✅ | true | First visit from session | ✅ |
| `country` | String | 100 | ❌ | null | Geographic country | ✅ |
| `city` | String | 100 | ❌ | null | Geographic city | ❌ |

## Indexes

### Key Indexes
1. **postId** (ascending) - For post-specific view queries
2. **userId** (ascending) - For user-specific view history
3. **sessionId** (ascending) - For session-based tracking
4. **isUnique** (ascending) - For unique view filtering
5. **country** (ascending) - For geographic analytics

### Compound Indexes
6. **Unique View Index (Authenticated)** (postId + userId):
   - Type: Unique
   - Prevents duplicate views from same authenticated user per post
   - Only applies when userId is not null
   - Ensures 1 view per authenticated user per post

7. **Unique View Index (Anonymous)** (postId + ipAddress):
   - Type: Unique
   - Prevents duplicate views from same IP address per post
   - Only applies when userId is null
   - Ensures 1 view per IP address per post

## Permissions

- **Create**: `*` (both authenticated and anonymous users can create views)
- **Read**: `*` (views are readable by all)
- **Update**: `role:super_admin` (only admins can update)
- **Delete**: `role:super_admin` (only admins can delete)

## Relations

### Outgoing Relations
- `postId` → `blog_posts.$id` (Many to One, cascade delete)

## TypeScript Interface

```typescript
interface BlogView {
  $id: string;
  $createdAt: string;
  postId: string; // Reference to blog post
  sessionId: string; // User session identifier
  userId?: string; // Authenticated user ID (null for anonymous users)
  ipAddress?: string; // Client IP address (required for anonymous users)
  userAgent?: string; // Browser/device info
  referrer?: string; // Traffic source
  isUnique: boolean; // Whether this is a unique view
  country?: string; // Geographic data
  city?: string; // Geographic data
  viewDuration?: number; // Time spent in seconds (0-3600)
}
```

## Appwrite Collection Setup Guide

### Important Notes for Relations

**Relation Setup in Appwrite:**
- When creating a relation attribute, Appwrite automatically creates the relationship
- **Cascade Delete**: When a blog post is deleted, all related views are automatically deleted
- **Data Type**: Relations store document IDs as strings in the database
- **Querying**: You can query related data using joins in your application code

**Relation Configuration:**
- **Type**: Many to One (multiple views can reference one post)
- **Target Collection**: `blog_posts`
- **Delete Rule**: Cascade (delete related records when parent is deleted)

### Creating Blog Views Collection

1. **Go to Appwrite Console** → Database → Your Database
2. **Create Collection** with ID: `blog_views`
3. **Add Attributes** (in order):

#### Required Attributes:
```
Key: postId
Type: Relation
Related Collection: blog_posts
Relation Type: Many to One
Cascade Delete: Yes (delete all related views when post is deleted)
Required: Yes
```

```
Key: sessionId
Type: String
Required: Yes
Default: (empty)
Size: 100
```

```
Key: isUnique
Type: Boolean
Required: Yes
Default: true
```

#### Optional Attributes:
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
Key: userAgent
Type: String
Required: No
Default: (empty)
Size: 500
```

```
Key: referrer
Type: String
Required: No
Default: (empty)
Size: 2000
```

```
Key: viewDuration
Type: Integer
Required: No
Default: (empty)
Min: 0
Max: 3600
```

```
Key: country
Type: String
Required: No
Default: (empty)
Size: 100
```

```
Key: city
Type: String
Required: No
Default: (empty)
Size: 100
```

### Setting Up Indexes

#### Blog Views Indexes:
1. **postId Index**:
   - Type: Key
   - Key: postId
   - Order: ASC

2. **userId Index**:
   - Type: Key
   - Key: userId
   - Order: ASC

3. **sessionId Index**:
   - Type: Key
   - Key: sessionId
   - Order: ASC

4. **isUnique Index**:
   - Type: Key
   - Key: isUnique
   - Order: ASC

5. **country Index**:
   - Type: Key
   - Key: country
   - Order: ASC

6. **ipAddress Index**:
   - Type: Key
   - Key: ipAddress
   - Order: ASC

7. **Unique View Index (Authenticated)** (Compound):
   - Type: Unique
   - Attributes: postId, userId
   - Condition: Only enforces uniqueness when userId is not null

8. **Unique View Index (Anonymous)** (Compound):
   - Type: Unique
   - Attributes: postId, ipAddress
   - Condition: Only enforces uniqueness when userId is null and ipAddress is not null

## View Tracking Strategy

### View Limitation Rules
- **Authenticated Users**: Only 1 view per authenticated user per post (enforced by unique index on `postId + userId`)
- **Anonymous Users**: Only 1 view per IP address per post (enforced by unique index on `postId + ipAddress`)
- **Implementation**: Application logic checks for existing view before creating new one
- **Data Integrity**: Unique indexes prevent duplicate views at database level

### View Tracking Flow
1. **Check Authentication**: Determine if user is authenticated
2. **Authenticated User**:
   - Check for existing view with `postId + userId`
   - If exists, skip tracking (already viewed)
   - If not exists, create view with `userId` and optional `ipAddress`
3. **Anonymous User**:
   - Get client IP address (required)
   - Check for existing view with `postId + ipAddress`
   - If exists, skip tracking (already viewed from this IP)
   - If not exists, create view with `ipAddress` and `userId = null`
4. **Update Counter**: Increment view count in `blog_posts` collection

## Implementation Examples

### View Tracking System
```typescript
// Track a blog post view (supports both authenticated and anonymous users)
async function trackView(postId: string, userId?: string, ipAddress?: string) {
  // Get IP address if not provided (required for anonymous users)
  const clientIp = ipAddress || getClientIP();
  
  if (!clientIp) {
    throw new Error('IP address is required for view tracking');
  }

  // Check for existing view
  const existingView = await findExistingView(postId, userId, clientIp);
  if (existingView) {
    // View already exists, skip tracking
    return;
  }

  const viewData = {
    postId,
    userId: userId || null, // Set to null for anonymous users
    sessionId: getSessionId(),
    ipAddress: clientIp, // Required for anonymous users
    userAgent: navigator.userAgent,
    referrer: document.referrer,
    isUnique: true
  };

  try {
    await tablesDB.createRow({
      databaseId: DATABASE_ID,
      tableId: 'blog_views',
      rowId: `view_${Date.now()}_${userId || clientIp}`,
      data: viewData
    });

    // Update view counter in blog_posts
    await incrementViewCount(postId);
  } catch (error: any) {
    // Handle unique constraint violation (view already exists)
    if (error.code === 409) {
      // View already tracked, ignore
      return;
    }
    throw error;
  }
}

// Find existing view based on authentication status
async function findExistingView(postId: string, userId?: string, ipAddress?: string) {
  if (userId) {
    // Check for authenticated user view
    const views = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: 'blog_views',
      queries: [
        Query.equal('postId', postId),
        Query.equal('userId', userId)
      ]
    });
    return views.rows[0] || null;
  } else {
    // Check for anonymous user view by IP
    if (!ipAddress) return null;
    
    const views = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: 'blog_views',
      queries: [
        Query.equal('postId', postId),
        Query.equal('ipAddress', ipAddress),
        Query.isNull('userId')
      ]
    });
    return views.rows[0] || null;
  }
}
```

### Analytics Queries
```typescript
// Get detailed audience analytics (excludes admin views)
async function getPostAnalytics(postId: string) {
  const views = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: 'blog_views',
    queries: [`equal("postId", "${postId}")`] // Audience views only
  });

  return {
    totalViews: views.rows.length,        // Real audience views only
    uniqueViews: views.rows.filter(v => v.isUnique).length,
    viewSources: groupByReferrer(views.rows),
    geographicData: extractGeoData(views.rows),
    engagementMetrics: calculateEngagement(views.rows)
  };
}
```

### Helper Functions
```typescript
// Generate or retrieve session ID
function getSessionId(): string {
  let sessionId = localStorage.getItem('blog_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('blog_session_id', sessionId);
  }
  return sessionId;
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

// Increment view count in blog_posts
async function incrementViewCount(postId: string) {
  const post = await tablesDB.getRow({
    databaseId: DATABASE_ID,
    tableId: 'blog_posts',
    rowId: postId
  });
  
  await tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: 'blog_posts',
    rowId: postId,
    data: {
      views: (post.views || 0) + 1
    }
  });
}
```

## Data Privacy Considerations

### User Data Handling
- **Anonymous Tracking**: No personal data stored for anonymous users
- **Session-Based**: Uses session IDs instead of personal identifiers
- **IP Address**: Optional, for geographic analytics only
- **Data Retention**: Consider implementing automatic cleanup for old view data

### GDPR Compliance
- **Consent**: View tracking should be disclosed in privacy policy
- **Data Minimization**: Only collect necessary data for analytics
- **Right to Deletion**: Users can request deletion of their view history
- **Anonymization**: Ensure view data cannot be traced back to individuals

## Performance Optimization

### Indexing Strategy
- **Compound Index**: Prevents duplicate views efficiently
- **Partitioning**: Consider partitioning by date for large datasets
- **Archiving**: Move old view data to separate collection for performance

### Query Optimization
- **Filtered Queries**: Use indexed fields for filtering
- **Pagination**: Implement pagination for large result sets
- **Aggregation**: Use Appwrite's aggregation features for analytics

## Future Enhancements

- Real-time analytics dashboard
- Advanced geographic reporting
- Device and browser analytics
- Traffic source attribution
- Conversion tracking
- A/B testing integration
