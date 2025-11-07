# Blog Categories Database Schema

## Overview
The `blog_categories` collection manages hierarchical blog categories for content organization.

## Collection Configuration

**Collection ID**: `blog_categories`

## Attributes

| Attribute | Type | Size | Required | Default | Description | Index |
|-----------|------|------|----------|---------|-------------|-------|
| `name` | String | 100 | ✅ | - | Category display name | ✅ |
| `slug` | String | 100 | ✅ | - | URL-friendly identifier | ✅ |
| `description` | String | 500 | ❌ | null | Category description | ❌ |
| `parentId` | String | 50 | ❌ | null | Parent category ID (hierarchical) | ✅ |
| `isActive` | Boolean | - | ✅ | true | Category active status | ✅ |
| `displayOrder` | Integer | - | ✅ | 0 | Sort order for display | ✅ |
| `color` | String | 7 | ❌ | null | Hex color for UI theming | ❌ |
| `icon` | String | 50 | ❌ | null | Icon identifier | ❌ |

## Indexes

### Key Indexes
1. **name** (ascending) - For name-based search
2. **slug** (ascending, unique) - For URL routing
3. **parentId** (ascending) - For hierarchical queries
4. **isActive** (ascending) - For active category filtering
5. **displayOrder** (ascending) - For ordered display

*Note: postCount is calculated dynamically and not indexed*

## Permissions

- **Create**: `role:super_admin` (only admins can create categories)
- **Read**: `users` (authenticated users can read categories)
- **Update**: `role:super_admin` (only admins can update categories)
- **Delete**: `role:super_admin` (only admins can delete categories)

## Relations

### Outgoing Relations
- `parentId` → `blog_categories.$id` (Many to One, self-referencing for hierarchy)

### Incoming Relations
- `blog_posts.category` → This category (One to Many) *[Deprecated - use blogCategories instead]*
- `blog_posts.blogCategories` → This category (One to Many, bidirectional) *[New preferred relationship]*

### Bidirectional Relationship Notes
- **blogCategories Relationship**: Categories can be queried with their associated posts through the bidirectional relationship
- **Dynamic Post Counts**: Post counts are calculated dynamically by counting posts with category relationships
- **Real-time Accuracy**: Counts always reflect the current number of posts in each category
- **No Stored Counts**: The `postCount` field has been removed - counts are computed on-demand
- **Hierarchical Queries**: Categories support parent-child relationships for complex content organization

## TypeScript Interface

```typescript
interface BlogCategory {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string; // For hierarchical categories
  postCount?: number; // Calculated dynamically from relationships (not stored)
  isActive: boolean;
  displayOrder: number;
  color?: string; // Hex color code
  icon?: string; // Icon identifier
}
```

## Data Validation Rules

### Name
- Required, max 100 characters
- Display name for the category

### Slug
- Required, max 100 characters
- URL-friendly format (lowercase, hyphens)
- Must be unique across all categories

### Parent ID
- Optional reference to parent category
- Cannot reference itself
- Cannot create circular references

### Display Order
- Integer for sorting categories
- Lower numbers appear first
- Default 0

## Business Logic

### Slug Generation
```typescript
function generateCategorySlug(name: string): string {
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
async function validateCategoryHierarchy(categoryId: string, parentId?: string): Promise<boolean> {
  if (!parentId) return true; // Root category

  // Prevent self-reference
  if (categoryId === parentId) return false;

  // Prevent circular references
  const parent = await getCategory(parentId);
  if (!parent) return false;

  // Check if parent has this category as ancestor
  return !await hasCircularReference(categoryId, parentId);
}
```

### Post Count Updates
```typescript
async function updateCategoryPostCount(categoryId: string): Promise<void> {
  const postCount = await countPostsInCategory(categoryId);
  await updateCategory(categoryId, { postCount });
}
```

## Appwrite Collection Setup Guide

### Creating Blog Categories Collection

1. **Go to Appwrite Console** → Database → Your Database
2. **Create Collection** with ID: `blog_categories`
3. **Add Attributes** (in order):

#### Required Attributes:
```
Key: name
Type: String
Required: Yes
Default: (empty)
Size: 100
```

```
Key: slug
Type: String
Required: Yes
Default: (empty)
Size: 100
```

```
Key: postCount
Type: Integer
Required: Yes
Default: 0
Min: 0
```

```
Key: isActive
Type: Boolean
Required: Yes
Default: true
```

```
Key: displayOrder
Type: Integer
Required: Yes
Default: 0
Min: 0
```

#### Optional Attributes:
```
Key: description
Type: String
Required: No
Default: (empty)
Size: 500
```

```
Key: parentId
Type: String
Required: No
Default: (empty)
Size: 50
```

```
Key: color
Type: String
Required: No
Default: (empty)
Size: 7
```

```
Key: icon
Type: String
Required: No
Default: (empty)
Size: 50
```

### Setting Up Indexes

1. **name Index**:
   - Type: Key
   - Key: name
   - Order: ASC

2. **slug Index**:
   - Type: Unique
   - Key: slug
   - Order: ASC

3. **parentId Index**:
   - Type: Key
   - Key: parentId
   - Order: ASC

4. **postCount Index**:
   - Type: Key
   - Key: postCount
   - Order: DESC

5. **isActive Index**:
   - Type: Key
   - Key: isActive
   - Order: ASC

6. **displayOrder Index**:
   - Type: Key
   - Key: displayOrder
   - Order: ASC

## Usage Examples

### Creating a Category
```typescript
const categoryData = {
  name: "Technology",
  slug: "technology",
  description: "Posts about technology and programming",
  isActive: true,
  displayOrder: 1,
  color: "#3B82F6",
  icon: "code"
};

await tablesDB.createRow({
  databaseId: DATABASE_ID,
  tableId: 'blog_categories',
  rowId: `category_${Date.now()}`,
  data: categoryData
});
```

### Hierarchical Categories
```typescript
// Parent category
const techCategory = {
  name: "Technology",
  slug: "technology",
  displayOrder: 1
};

// Child category
const webDevCategory = {
  name: "Web Development",
  slug: "web-development",
  parentId: techCategory.$id,
  displayOrder: 1
};
```

## Future Considerations

- Category templates and presets
- Category-specific SEO settings
- Multi-language category support
- Category analytics and performance tracking
