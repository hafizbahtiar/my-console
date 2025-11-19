# Persons Database Schema

## Overview
The `persons` collection stores individual person records for the family tree system. This collection is the core entity that represents every individual in the genealogy database. Each person can belong to multiple families and have multiple relationships, supporting complex family tree structures like Wikipedia-style genealogies.

## Collection Configuration

**Collection ID**: `persons`
**Database**: `console-db`

## Appwrite Relationship Setup

When creating this collection in Appwrite Console, you need to set up relationship attributes:

### Relationship Attributes to Create

1. **createdBy** (Relationship, Required)
   - **Type**: Relationship
   - **Related Collection**: `users`
   - **Cardinality**: Many to One
   - **On Delete**: Set null (allow deletion, set to null)
   - **Two-Way**: No
   - **Purpose**: Admin user who created this person record

2. **updatedBy** (Relationship, Optional)
   - **Type**: Relationship
   - **Related Collection**: `users`
   - **Cardinality**: Many to One
   - **On Delete**: Set null (allow deletion, set to null)
   - **Two-Way**: No
   - **Purpose**: Admin user who last updated this person record

**Note**: When creating relationship attributes in Appwrite Console, ensure the related collection (`users`) exists first.

## Attributes

| Attribute | Type | Size | Required | Default | Description | Index | Relation |
|-----------|------|------|----------|---------|-------------|-------|----------|
| `name` | String | 200 | ✅ | - | Full name of the person | ✅ | - |
| `firstName` | String | 100 | ❌ | null | First name | ✅ | - |
| `lastName` | String | 100 | ❌ | null | Last name (surname) | ✅ | - |
| `middleName` | String | 100 | ❌ | null | Middle name | ❌ | - |
| `maidenName` | String | 100 | ❌ | null | Maiden name (for married women) | ❌ | - |
| `nickname` | String | 50 | ❌ | null | Nickname or preferred name | ❌ | - |
| `title` | String | 50 | ❌ | null | Title (e.g., "Tunku", "Dato", "Dr.", "Prof.") | ❌ | - |
| `gender` | String | 1 | ✅ | - | Gender code: "M" (Male), "F" (Female), "O" (Other), "U" (Unknown) | ✅ | - |
| `birthDate` | Datetime | - | ❌ | null | Birth date | ✅ | - |
| `birthPlace` | String | 300 | ❌ | null | Birth place (city, state, country) | ❌ | - |
| `birthCountry` | String | 100 | ❌ | null | Birth country | ✅ | - |
| `deathDate` | Datetime | - | ❌ | null | Death date (if deceased) | ✅ | - |
| `deathPlace` | String | 300 | ❌ | null | Death place (city, state, country) | ❌ | - |
| `deathCountry` | String | 100 | ❌ | null | Death country | ✅ | - |
| `isDeceased` | Boolean | - | ✅ | false | Deceased status flag | ✅ | - |
| `photo` | String | 2000 | ❌ | null | Photo URL (Appwrite Storage or external URL) | ❌ | - |
| `photoThumbnail` | String | 2000 | ❌ | null | Thumbnail photo URL | ❌ | - |
| `bio` | String | 10000 | ❌ | null | Rich biography (Markdown allowed) | ❌ | - |
| `wikiId` | String | 50 | ❌ | null | Wikipedia ID (e.g., "Q75383737") | ✅ | - |
| `occupation` | String | 200 | ❌ | null | Occupation or profession | ❌ | - |
| `education` | String | 500 | ❌ | null | Education details | ❌ | - |
| `nationality` | String | 100 | ❌ | null | Nationality | ✅ | - |
| `ethnicity` | String | 100 | ❌ | null | Ethnicity | ❌ | - |
| `religion` | String | 100 | ❌ | null | Religion | ❌ | - |
| `email` | String | 255 | ❌ | null | Email address | ✅ | - |
| `phone` | String | 50 | ❌ | null | Phone number | ❌ | - |
| `address` | String | 500 | ❌ | null | Current address | ❌ | - |
| `city` | String | 100 | ❌ | null | City | ✅ | - |
| `state` | String | 100 | ❌ | null | State/Province | ✅ | - |
| `country` | String | 100 | ❌ | null | Country | ✅ | - |
| `zipCode` | String | 20 | ❌ | null | ZIP/Postal code | ❌ | - |
| `notes` | String | 5000 | ❌ | null | General notes (JSON string) | ❌ | - |
| `metadata` | String | 5000 | ❌ | null | Additional metadata (JSON string) | ❌ | - |
| `status` | String | 20 | ✅ | 'active' | Person status | ✅ | - |
| `isPublic` | Boolean | - | ✅ | false | Public visibility flag | ✅ | - |
| `displayOrder` | Integer | - | ✅ | 0 | Display order for tree visualization (Min: 0) | ✅ | - |
| `createdBy` | Relationship | - | ✅ | - | User who created this record (Many to One) | ❌ | `users` |
| `updatedBy` | Relationship | - | ❌ | null | User who last updated (Many to One) | ❌ | `users` |

## Enum Values

### Gender Values
- `M` - Male
- `F` - Female
- `O` - Other gender identity
- `U` - Unknown/not specified

### Status Values
- `active` - Active person record
- `inactive` - Inactive/hidden person
- `archived` - Archived person
- `draft` - Draft person (not yet published)

## Indexes

### Key Indexes
1. **name** (ascending) - For name-based search (primary search field)
2. **firstName** (ascending) - For first name search
3. **lastName** (ascending) - For last name search
4. **gender** (ascending) - For gender filtering
5. **birthDate** (ascending) - For chronological sorting
6. **deathDate** (ascending) - For deceased person queries
7. **isDeceased** (ascending) - For deceased status filtering
8. **birthCountry** (ascending) - For location-based queries
9. **deathCountry** (ascending) - For location-based queries
10. **wikiId** (ascending, unique) - For Wikipedia ID lookup (unique if provided)
11. **email** (ascending) - For email lookup
12. **city** (ascending) - For location-based queries
13. **state** (ascending) - For location-based queries
14. **country** (ascending) - For location-based queries
15. **status** (ascending) - For status filtering
16. **isPublic** (ascending) - For public visibility filtering
17. **displayOrder** (ascending) - For tree visualization ordering
18. **createdAt** (descending) - For new person queries
19. **updatedAt** (descending) - For recently updated queries

## Permissions

- **Create**: `role:super_admin` (only admins can create persons)
- **Read**: `users` (authenticated users can read public persons), `role:super_admin` (admins can read all persons)
- **Update**: `role:super_admin` (only admins can update persons)
- **Delete**: `role:super_admin` (only admins can delete persons)

### Permission Notes
- **Admin-Only Model**: Only super admins can create, update, and delete person records
- **Public Visibility**: Users can read persons where `isPublic = true`
- **Privacy**: Non-public persons are only visible to admins
- **Audit Trail**: All person changes should be logged in audit_logs

## Relations

### Outgoing Relations (Appwrite Relationships)

**Relationship Attributes:**
- `createdBy` → `users` collection (Many to One)
  - **Type**: Relationship
  - **Related Collection**: `users`
  - **Cardinality**: Many persons to one user
  - **On Delete**: Set null (allow deletion, set to null)
  - **Purpose**: Admin user who created this person record
  
- `updatedBy` → `users` collection (Many to One, optional)
  - **Type**: Relationship
  - **Related Collection**: `users`
  - **Cardinality**: Many persons to one user
  - **On Delete**: Set null (allow deletion, set to null)
  - **Purpose**: Admin user who last updated this person record

### Incoming Relations
- `families.husband` → This person (One to Many) *[Families where person is husband]*
  - **Related Collection**: `families`
  - **Relationship Field**: `husband` (String ID reference)
  - **Cardinality**: One person to many families
  
- `families.wife` → This person (One to Many) *[Families where person is wife]*
  - **Related Collection**: `families`
  - **Relationship Field**: `wife` (String ID reference)
  - **Cardinality**: One person to many families
  
- `families.partners[]` → This person (Many to Many) *[Families where person is a partner]*
  - **Related Collection**: `families`
  - **Relationship Field**: `partners` (String array)
  - **Cardinality**: One person to many families
  
- `families.children[]` → This person (Many to Many) *[Families where person is a child]*
  - **Related Collection**: `families`
  - **Relationship Field**: `children` (String array)
  - **Cardinality**: One person to many families
  
- `relationships.personA` → This person (One to Many) *[Relationships where person is personA]*
  - **Related Collection**: `relationships`
  - **Relationship Field**: `personA` (String ID reference)
  - **Cardinality**: One person to many relationships
  
- `relationships.personB` → This person (One to Many) *[Relationships where person is personB]*
  - **Related Collection**: `relationships`
  - **Relationship Field**: `personB` (String ID reference)
  - **Cardinality**: One person to many relationships

### Relationship Notes
- **Multiple Families**: A person can belong to multiple families (e.g., as a child in one family and a parent in another)
- **Multiple Partners**: A person can have multiple partners (polygamy, multiple marriages)
- **Complex Relationships**: The `relationships` collection allows for additional relationship types beyond family structures
- **Wikipedia Integration**: `wikiId` field allows linking to Wikipedia person pages
- **Public Visibility**: `isPublic` flag controls whether person appears on public family tree site

## TypeScript Interface

```typescript
interface Person {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  // Relationship fields (Appwrite returns relationship objects)
  createdBy: string | User; // Relationship to users collection (Many to One)
  updatedBy?: string | User; // Relationship to users collection (Many to One, optional)
  // Regular fields
  name: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  maidenName?: string;
  nickname?: string;
  title?: string;
  gender: 'M' | 'F' | 'O' | 'U';
  birthDate?: string;
  birthPlace?: string;
  birthCountry?: string;
  deathDate?: string;
  deathPlace?: string;
  deathCountry?: string;
  isDeceased: boolean;
  photo?: string; // Valid URL required
  photoThumbnail?: string; // Valid URL required
  bio?: string; // Markdown allowed
  wikiId?: string; // Wikipedia ID (e.g., "Q75383737")
  occupation?: string;
  education?: string;
  nationality?: string;
  ethnicity?: string;
  religion?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  notes?: string; // JSON string
  metadata?: string; // JSON string
  status: 'active' | 'inactive' | 'archived' | 'draft';
  isPublic: boolean;
  displayOrder: number; // Min: 0
}

// When using Appwrite relationship queries, related objects are populated
interface PersonWithRelations extends Person {
  createdBy: User; // Populated user object
  updatedBy?: User; // Populated user object (optional)
}

// Notes structure (stored as JSON string in notes field)
interface PersonNotes {
  general?: string;
  achievements?: string;
  importantEvents?: string;
  medicalHistory?: string;
  awards?: string;
  customFields?: Record<string, any>;
}

// Metadata structure (stored as JSON string in metadata field)
interface PersonMetadata {
  tags?: string[];
  customFields?: Record<string, any>;
  treePosition?: {
    x?: number;
    y?: number;
    level?: number;
  };
  lastSyncAt?: string;
  externalIds?: {
    geni?: string;
    myheritage?: string;
    ancestry?: string;
    [key: string]: string | undefined;
  };
}
```

## Data Validation Rules

### Name
- Required, max 200 characters
- Person's full name
- Used as primary display name
- Should be unique or have distinguishing information

### First Name / Last Name
- Optional, max 100 characters each
- Used for structured name searches
- If provided, should be consistent with `name` field

### Gender
- Required, one character: `M`, `F`, `O`, or `U`
- Used for tree visualization and relationship validation
- Single character for efficiency (matches family-chart format)

### Birth Date
- Optional datetime
- Should be valid date
- Used for chronological sorting and age calculation
- Should be before death date if deceased

### Death Date
- Optional datetime
- Should be valid date
- Only set if `isDeceased` is true
- Should be after birth date
- Used for deceased person filtering

### Photo
- Optional URL string
- Must be valid HTTP/HTTPS URL if provided
- Max 2000 characters
- Can be Appwrite Storage URL or external URL
- Used in tree visualization and person profiles

### Wiki ID
- Optional string, max 50 characters
- Wikipedia entity ID format (e.g., "Q75383737")
- Should be unique if provided
- Used for Wikipedia integration and external linking

### Bio
- Optional string, max 10000 characters
- Markdown formatting allowed
- Rich biography text
- Used in person detail pages

### Status
- Required, one of: `active`, `inactive`, `archived`, `draft`
- Default: `active`
- `active`: Visible and published
- `inactive`: Hidden but not deleted
- `archived`: Archived person
- `draft`: Not yet published

### Is Public
- Required boolean, default: false
- Controls visibility on public family tree site
- Only public persons appear on family.hafizbahtiar.com
- Admins can see all persons regardless of this flag

## Business Logic

### Full Name Generation
```typescript
function getFullName(person: Person): string {
  if (person.name) return person.name;
  
  const parts: string[] = [];
  if (person.title) parts.push(person.title);
  if (person.firstName) parts.push(person.firstName);
  if (person.middleName) parts.push(person.middleName);
  if (person.lastName) parts.push(person.lastName);
  if (person.maidenName && person.gender === 'F') {
    parts.push(`(${person.maidenName})`);
  }
  return parts.join(' ') || 'Unknown';
}
```

### Age Calculation
```typescript
function calculateAge(birthDate: string, deathDate?: string): number | null {
  if (!birthDate) return null;
  const endDate = deathDate ? new Date(deathDate) : new Date();
  const startDate = new Date(birthDate);
  const age = endDate.getFullYear() - startDate.getFullYear();
  const monthDiff = endDate.getMonth() - startDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < startDate.getDate())) {
    return age - 1;
  }
  return age;
}
```

### Wikipedia URL Generation
```typescript
function getWikipediaUrl(wikiId: string): string {
  return `https://www.wikidata.org/wiki/${wikiId}`;
}
```

## Migration Notes

### Initial Setup
- Create `persons` collection in Appwrite Console
- Set up all relationship attributes as specified
- Create all indexes for optimal query performance
- Set up permissions for admin-only model

### Data Migration
- If migrating from existing person data, ensure:
  - All persons have valid `name` field
  - Gender codes are standardized (M/F/O/U)
  - Birth/death dates are in ISO 8601 format
  - Wikipedia IDs are in correct format if provided
  - Public visibility is set appropriately

### Future Considerations
- Consider adding support for multiple photos (photo gallery)
- Plan for person versioning/history
- Design for person merging (duplicate detection)
- Prepare for bulk import/export functionality
- Consider adding person search with full-text indexing
- Plan for person relationships visualization
- Design for person timeline/chronology view

## Notes

- **Admin-Only Model**: Only super admins can create, update, and delete person records
- **Public Visibility**: `isPublic` flag controls whether person appears on public site
- **Wikipedia Integration**: `wikiId` allows linking to Wikipedia for additional information
- **Multiple Families**: A person can belong to multiple families (as child, parent, partner)
- **Rich Biography**: `bio` field supports Markdown for rich formatting
- **Photo Management**: Photo URLs can point to Appwrite Storage or external sources
- **Audit Trail**: All person changes should be logged in audit_logs

