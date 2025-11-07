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
| `ipAddress` | String | 45 | ❌ | null | Client IP address | ❌ |
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
6. **Unique View Index** (postId + sessionId):
   - Type: Unique
   - Prevents duplicate views from same session
   - Ensures accurate unique visitor counts

## Permissions

- **Create**: `users` (authenticated users can create views)
- **Read**: `users` (users can read their own views)
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
  userId?: string; // Null for anonymous users
  userAgent: string; // Browser/device info
  referrer?: string; // Traffic source
  isUnique: boolean; // Whether this is a unique view
  country?: string; // Geographic data (future)
  city?: string; // Geographic data (future)
  ipAddress?: string; // Client IP address
  viewDuration?: number; // Time spent in seconds
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

6. **Unique View Index** (Compound):
   - Type: Unique
   - Attributes: postId, sessionId

## View Tracking Strategy

### Admin vs Audience Pages
- **Admin Pages** (`/auth/blog/blog-posts/[id]`): No view tracking, analytics dashboard for creators
- **Audience Pages** (Future `/blog/[slug]`): View tracking enabled for engagement metrics
- **Current Implementation**: Views tracked only for non-authenticated users on admin pages (transitional)

### Content Management Flow
1. **Admin Creation**: Content created/edited in admin panel
2. **Admin Review**: Content reviewed via admin view page (this page)
3. **Analytics Access**: Creators see audience engagement data
4. **Future**: Public audience pages with full view tracking

## Implementation Examples

### View Tracking System (Audience Only)
```typescript
// Track a blog post view (only for non-authenticated audience users)
async function trackAudienceView(postId: string) {
  // Skip tracking for authenticated admin users
  if (isAuthenticatedUser()) return;

  const sessionId = getSessionId(); // Generate or retrieve session ID
  const viewData = {
    postId,
    userId: null, // Always null for audience views
    sessionId,
    ipAddress: getClientIP(), // Optional
    userAgent: navigator.userAgent,
    referrer: document.referrer,
    isUnique: await isFirstVisit(sessionId, postId)
  };

  await tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: 'blog_views',
    rowId: `view_${Date.now()}_${sessionId}`,
    data: viewData
  });

  // Update view counter in blog_posts
  await incrementViewCount(postId);
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

### Session Management
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

// Check if this is first visit from session
async function isFirstVisit(sessionId: string, postId: string): Promise<boolean> {
  const existingViews = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: 'blog_views',
    queries: [
      `equal("sessionId", "${sessionId}")`,
      `equal("postId", "${postId}")`
    ]
  });

  return existingViews.rows.length === 0;
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
