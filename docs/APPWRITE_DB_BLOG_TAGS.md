# Appwrite Database Schema: blog_tags

## Overview

The `blog_tags` collection stores tags that can be associated with blog posts. This collection implements a many-to-many relationship with `blog_posts` using Appwrite's relationship system.

## Collection Details

**Collection ID**: `blog_tags`
**Database**: `console-db`

## Attributes

| Attribute | Type | Size | Required | Default | Description | Indexed |
|-----------|------|------|----------|---------|-------------|---------|
| `name` | String | 100 | ✅ | - | Tag display name | ✅ |
| `slug` | String | 100 | ✅ | - | URL-friendly identifier | ✅ |
| `description` | String | 500 | ❌ | null | Tag description | ❌ |
| `color` | String | 7 | ❌ | null | Hex color for UI theming | ❌ |
| `isActive` | Boolean | - | ✅ | true | Tag active status | ✅ |

## Permissions

- **Create**: `role:super_admin` (only admins can create tags)
- **Read**: `*` (anyone can read tags)
- **Update**: `role:super_admin` (only admins can update tags)
- **Delete**: `role:super_admin` (only admins can delete tags)

## Relations

### Outgoing Relations
- `blogPosts` → `blog_posts` (Many to Many, bidirectional) *[Post associations]*

### Incoming Relations
- `blog_posts.blogTags` → This tag (Many to Many, bidirectional) *[Post associations]*

## Indexes

### Key Indexes
- `name` (String, ascending) - For tag name lookups
- `slug` (String, ascending) - For URL-based tag lookups
- `isActive` (Boolean, ascending) - For filtering active tags

### Fulltext Indexes
- `name, description` - For tag search functionality

## Bidirectional Relationship Notes

- **blogPosts Relationship**: The `blogPosts` field creates a bidirectional many-to-many relationship between `blog_tags` and `blog_posts`
- **Data Integrity**: When a tag is associated with posts, the relationship is automatically maintained in both directions
- **Query Benefits**: Allows efficient querying of tags by posts and posts by tags
- **Relationship Management**: Set NULL behavior ensures orphaned relationships are cleaned up properly

## TypeScript Interface

```typescript
interface BlogTag {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  name: string;
  slug: string;
  description?: string;
  color?: string; // Hex color code
  isActive: boolean;
  blogPosts?: Array<{
    $id: string;
    title: string;
    slug: string;
    excerpt: string;
    status: 'draft' | 'published' | 'archived';
  }>; // Post relationships (Many to Many, bidirectional)
}
```

## Data Validation Rules

### Name
- **Required**: Must be provided
- **Length**: 1-100 characters
- **Format**: Alphanumeric characters, spaces, hyphens, and underscores only
- **Uniqueness**: Must be unique across all tags

### Slug
- **Required**: Must be provided
- **Length**: 1-100 characters
- **Format**: Lowercase alphanumeric characters, hyphens, and underscores only
- **Uniqueness**: Must be unique across all tags
- **Auto-generation**: Automatically generated from name if not provided

### Description
- **Optional**: Can be null
- **Length**: 0-500 characters
- **Purpose**: SEO description and user information

### Color
- **Optional**: Can be null
- **Format**: Hex color code (e.g., #FF5733)
- **Purpose**: UI theming and visual organization

### isActive
- **Required**: Must be provided
- **Default**: true
- **Purpose**: Soft delete functionality

## Implementation Notes

### Tag Management
- Tags are managed by administrators only
- Inactive tags should not be displayed in tag selection UIs
- Tag relationships are automatically managed by Appwrite

### Performance Considerations
- Many-to-many relationships can impact query performance with large datasets
- Consider pagination for tag-related queries
- Use indexes effectively for common query patterns

### Migration Considerations
- Previous array-based tag storage has been migrated to relationship-based system
- All existing tag associations have been converted to relationships
- Set NULL behavior ensures clean relationship management
