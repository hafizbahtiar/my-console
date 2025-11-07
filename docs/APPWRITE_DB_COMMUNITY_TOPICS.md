# Community Topics Database Schema

## Overview
The `community_topics` collection manages discussion topics/categories for organizing community posts. Topics help users find relevant discussions and create focused communities.

## Collection Configuration

**Collection ID**: `community_topics`
**Database**: `console-db`

## Attributes

| Attribute | Type | Size | Required | Default | Description | Index |
|-----------|------|------|----------|---------|-------------|-------|
| `name` | String | 100 | ✅ | - | Topic display name | ✅ |
| `slug` | String | 100 | ✅ | - | URL-friendly identifier | ✅ |
| `description` | String | 500 | ❌ | null | Topic description | ❌ |
| `parentId` | String | 50 | ❌ | null | Parent topic ID (hierarchical) | ✅ |
| `isActive` | Boolean | - | ✅ | true | Topic active status | ✅ |
| `isPublic` | Boolean | - | ✅ | true | Public visibility flag | ✅ |
| `displayOrder` | Integer | - | ✅ | 0 | Sort order for display (Min: 0) | ✅ |
| `color` | String | 15 | ❌ | null | Color for UI theming | ❌ |
| `icon` | String | 50 | ❌ | null | Icon identifier | ❌ |
| `postCount` | Integer | - | ✅ | 0 | Number of posts (calculated, Min: 0) | ✅ |
| `replyCount` | Integer | - | ✅ | 0 | Number of replies (calculated, Min: 0) | ✅ |
| `lastPostAt` | Datetime | - | ❌ | null | Last post timestamp | ✅ |
| `moderatorIds` | String[] | 100 | ❌ | null | Moderator user IDs (each ID max 100 chars) | ❌ |
| `rules` | String | 2000 | ❌ | null | Topic rules/guidelines | ❌ |

## Indexes

### Key Indexes
1. **name** (ascending) - For name-based search
2. **slug** (ascending, unique) - For URL routing
3. **parentId** (ascending) - For hierarchical queries
4. **isActive** (ascending) - For active topic filtering
5. **isPublic** (ascending) - For public topic filtering
6. **displayOrder** (ascending) - For ordered display
7. **postCount** (descending) - For popular topics
8. **lastPostAt** (descending) - For recent activity

## Permissions

- **Create**: `role:super_admin` (only admins can create topics)
- **Read**: `*` (public topics visible to all, private topics to members)
- **Update**: `role:super_admin` (only admins can update topics)
- **Delete**: `role:super_admin` (only admins can delete topics)

## Relations

### Outgoing Relations
- `parentId` → `community_topics.$id` (Many to One, self-referencing for hierarchy)

### Incoming Relations
- `community_posts.communityTopics` → This topic (One to Many, bidirectional) *[Topic's posts]*

### Bidirectional Relationship Notes
- **Post Relationship**: Topics are linked to posts via `communityTopics` bidirectional relationship
- **Dynamic Counts**: Post and reply counts are calculated dynamically from relationships
- **Real-time Accuracy**: Counts always reflect current number of posts/replies
- **Hierarchical Queries**: Topics support parent-child relationships for organization
- **Set NULL Behavior**: Orphaned relationships are automatically cleaned up

## TypeScript Interface

```typescript
interface CommunityTopic {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string; // For hierarchical topics
  isActive: boolean;
  isPublic: boolean;
  displayOrder: number; // Min: 0
  color?: string; // Color code (max 15 chars)
  icon?: string; // Icon identifier (max 50 chars)
  postCount: number; // Calculated from relationships (Min: 0)
  replyCount: number; // Calculated from relationships (Min: 0)
  lastPostAt?: string;
  moderatorIds?: string[]; // Each moderator ID max 100 characters (optional)
  rules?: string; // Max 2000 characters
}
```

## Data Validation Rules

### Name
- Required, max 100 characters
- Display name for the topic
- Must be unique

### Slug
- Required, max 100 characters
- URL-friendly format (lowercase, hyphens)
- Must be unique across all topics

### Parent ID
- Optional reference to parent topic
- Cannot reference itself
- Cannot create circular references
- Maximum depth of 3 levels

### Display Order
- Integer for sorting topics
- Lower numbers appear first
- Default 0
- Minimum value: 0

### Color
- Optional color code for UI theming
- Max 15 characters
- Can be hex color, CSS color name, or custom identifier

### Moderator IDs
- Array of user IDs
- Each moderator ID max 100 characters
- Moderators can approve/reject posts in their topic
- Admins are automatically moderators

### Rules
- Optional topic rules/guidelines
- Max 2000 characters
- Displayed to users before posting

## Business Logic

### Slug Generation
```typescript
function generateTopicSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .substring(0, 100); // Limit length
}
```

### Hierarchical Validation
```typescript
async function validateTopicHierarchy(topicId: string, parentId?: string): Promise<boolean> {
  if (!parentId) return true; // Root topic

  // Prevent self-reference
  if (topicId === parentId) return false;

  // Prevent circular references
  const parent = await getTopic(parentId);
  if (!parent) return false;

  // Check depth (max 3 levels)
  const depth = await calculateDepth(parentId);
  if (depth >= 3) return false;

  return true;
}
```

### Count Updates
```typescript
async function updateTopicCounts(topicId: string): Promise<void> {
  const posts = await databases.listDocuments(
    DATABASE_ID,
    'community_posts',
    [
      Query.equal('communityTopics', topicId),
      Query.equal('status', 'approved')
    ]
  );

  const replies = await databases.listDocuments(
    DATABASE_ID,
    'community_replies',
    [
      Query.equal('postId', posts.documents.map(p => p.$id)),
      Query.equal('status', 'approved')
    ]
  );

  const lastPost = posts.documents.sort((a, b) => 
    new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
  )[0];

  await databases.updateDocument(
    DATABASE_ID,
    'community_topics',
    topicId,
    {
      postCount: posts.total,
      replyCount: replies.total,
      lastPostAt: lastPost?.$createdAt || null
    }
  );
}
```

## Moderation

- Topics can have assigned moderators
- Moderators can approve/reject posts in their topics
- Moderators can lock/unlock posts
- Moderators can pin posts
- Topic rules displayed to users before posting

## Usage Examples

### Creating a Topic
```typescript
const topicData = {
  name: "General Discussion",
  slug: "general-discussion",
  description: "General community discussions",
  isActive: true,
  isPublic: true,
  displayOrder: 1,
  color: "#3B82F6",
  icon: "message-circle",
  moderatorIds: []
};

await databases.createDocument(
  DATABASE_ID,
  'community_topics',
  ID.unique(),
  topicData
);
```

### Hierarchical Topics
```typescript
// Parent topic
const techTopic = {
  name: "Technology",
  slug: "technology",
  displayOrder: 1
};

// Child topic
const webDevTopic = {
  name: "Web Development",
  slug: "web-development",
  parentId: techTopic.$id,
  displayOrder: 1
};
```

## Future Considerations

- Topic subscriptions/notifications
- Topic-specific permissions
- Topic analytics and insights
- Topic templates
- Multi-language topic support
- Topic badges and achievements

