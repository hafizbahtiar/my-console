# Families Database Schema

## Overview
The `families` collection stores family unit definitions that connect parents (partners) with their children. This collection enables complex family tree structures supporting multiple spouses, polygamy, single parents, and multi-generational families. This normalized approach allows one person to belong to multiple families (e.g., as a child in one family and a parent in another).

## Collection Configuration

**Collection ID**: `families`
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
   - **Purpose**: Admin user who created this family record

2. **updatedBy** (Relationship, Optional)
   - **Type**: Relationship
   - **Related Collection**: `users`
   - **Cardinality**: Many to One
   - **On Delete**: Set null (allow deletion, set to null)
   - **Two-Way**: No
   - **Purpose**: Admin user who last updated this family record

**Note**: When creating relationship attributes in Appwrite Console, ensure the related collection (`users`) exists first. The `husband`, `wife`, `partners`, and `children` fields are string arrays/IDs that reference the `persons` collection (not Appwrite relationships, but string references for flexibility).

## Attributes

| Attribute | Type | Size | Required | Default | Description | Index | Relation |
|-----------|------|------|----------|---------|-------------|-------|----------|
| `husband` | String | 128 | ❌ | null | Person ID of husband (for traditional families) | ✅ | `persons.$id` |
| `wife` | String | 128 | ❌ | null | Person ID of wife (for traditional families) | ✅ | `persons.$id` |
| `partners` | String[] | - | ❌ | [] | Array of person IDs (for polygamy/multiple spouses) | ❌ | `persons.$id[]` |
| `children` | String[] | - | ❌ | [] | Array of person IDs (children of this family) | ❌ | `persons.$id[]` |
| `familyName` | String | 200 | ❌ | null | Optional family name (e.g., "House of Abdul Rahman") | ✅ | - |
| `marriageDate` | Datetime | - | ❌ | null | Marriage date (for primary partnership) | ✅ | - |
| `marriagePlace` | String | 300 | ❌ | null | Marriage place (city, country) | ❌ | - |
| `divorceDate` | Datetime | - | ❌ | null | Divorce date (if divorced) | ✅ | - |
| `isDivorced` | Boolean | - | ✅ | false | Divorced status flag | ✅ | - |
| `isHistoric` | Boolean | - | ✅ | false | True for royal/state trees or historic families | ✅ | - |
| `notes` | String | 5000 | ❌ | null | General notes about the family (JSON string) | ❌ | - |
| `metadata` | String | 5000 | ❌ | null | Additional metadata (JSON string) | ❌ | - |
| `status` | String | 20 | ✅ | 'active' | Family status | ✅ | - |
| `displayOrder` | Integer | - | ✅ | 0 | Display order for tree visualization (Min: 0) | ✅ | - |
| `createdBy` | Relationship | - | ✅ | - | User who created this record (Many to One) | ❌ | `users` |
| `updatedBy` | Relationship | - | ❌ | null | User who last updated (Many to One) | ❌ | `users` |

## Enum Values

### Status Values
- `active` - Active family record
- `inactive` - Inactive/hidden family
- `archived` - Archived family
- `draft` - Draft family (not yet published)

## Indexes

### Key Indexes
1. **husband** (ascending) - For husband-based queries
2. **wife** (ascending) - For wife-based queries
3. **marriageDate** (ascending) - For chronological sorting
4. **divorceDate** (ascending) - For divorce queries
5. **isDivorced** (ascending) - For divorce status filtering
6. **isHistoric** (ascending) - For historic family filtering
7. **familyName** (ascending) - For family name search
8. **status** (ascending) - For status filtering
9. **displayOrder** (ascending) - For tree visualization ordering
10. **createdAt** (descending) - For new family queries
11. **updatedAt** (descending) - For recently updated queries

**Note**: For `partners[]` and `children[]` array fields, Appwrite doesn't support direct indexing on array elements. Use application-level filtering or create separate relationship records if needed.

## Permissions

- **Create**: `role:super_admin` (only admins can create families)
- **Read**: `users` (authenticated users can read families), `role:super_admin` (admins can read all families)
- **Update**: `role:super_admin` (only admins can update families)
- **Delete**: `role:super_admin` (only admins can delete families)

### Permission Notes
- **Admin-Only Model**: Only super admins can create, update, and delete family records
- **Public Access**: All authenticated users can read family records
- **Privacy**: Family records are visible to all authenticated users
- **Audit Trail**: All family changes should be logged in audit_logs

## Relations

### Outgoing Relations (Appwrite Relationships)

**Relationship Attributes:**
- `createdBy` → `users` collection (Many to One)
  - **Type**: Relationship
  - **Related Collection**: `users`
  - **Cardinality**: Many families to one user
  - **On Delete**: Set null (allow deletion, set to null)
  - **Purpose**: Admin user who created this family record
  
- `updatedBy` → `users` collection (Many to One, optional)
  - **Type**: Relationship
  - **Related Collection**: `users`
  - **Cardinality**: Many families to one user
  - **On Delete**: Set null (allow deletion, set to null)
  - **Purpose**: Admin user who last updated this family record

### String References (Not Appwrite Relationships)
- `husband` → `persons.$id` (String reference)
  - **Type**: String (Person ID)
  - **Purpose**: Reference to husband person
  - **Validation**: Must reference existing person in `persons` collection
  
- `wife` → `persons.$id` (String reference)
  - **Type**: String (Person ID)
  - **Purpose**: Reference to wife person
  - **Validation**: Must reference existing person in `persons` collection
  
- `partners[]` → `persons.$id[]` (String array references)
  - **Type**: String array (Person IDs)
  - **Purpose**: References to multiple partners (polygamy, multiple marriages)
  - **Validation**: All IDs must reference existing persons in `persons` collection
  
- `children[]` → `persons.$id[]` (String array references)
  - **Type**: String array (Person IDs)
  - **Purpose**: References to children of this family
  - **Validation**: All IDs must reference existing persons in `persons` collection

### Relationship Notes
- **Flexible Structure**: Supports traditional (husband/wife), modern (partners array), and single-parent families
- **Multiple Partners**: `partners[]` array allows polygamy and multiple marriages
- **Multiple Children**: `children[]` array supports families with any number of children
- **Cross-Reference**: A person can be a child in one family and a parent in another
- **Historic Families**: `isHistoric` flag marks royal, noble, or historically significant families
- **Marriage Tracking**: `marriageDate` and `divorceDate` track relationship timeline

## TypeScript Interface

```typescript
interface Family {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  // Relationship fields (Appwrite returns relationship objects)
  createdBy: string | User; // Relationship to users collection (Many to One)
  updatedBy?: string | User; // Relationship to users collection (Many to One, optional)
  // Regular fields
  husband?: string; // Person ID (string reference, not relationship)
  wife?: string; // Person ID (string reference, not relationship)
  partners: string[]; // Array of person IDs (string references)
  children: string[]; // Array of person IDs (string references)
  familyName?: string;
  marriageDate?: string;
  marriagePlace?: string;
  divorceDate?: string;
  isDivorced: boolean;
  isHistoric: boolean;
  notes?: string; // JSON string
  metadata?: string; // JSON string
  status: 'active' | 'inactive' | 'archived' | 'draft';
  displayOrder: number; // Min: 0
}

// When using Appwrite relationship queries, related objects are populated
interface FamilyWithRelations extends Family {
  createdBy: User; // Populated user object
  updatedBy?: User; // Populated user object (optional)
  // Note: husband, wife, partners, children are string IDs, not populated objects
  // Use separate queries to fetch person details if needed
}

// Family with populated person objects (application-level join)
interface FamilyWithPersons extends Family {
  husbandPerson?: Person;
  wifePerson?: Person;
  partnerPersons?: Person[];
  childPersons?: Person[];
}

// Notes structure (stored as JSON string in notes field)
interface FamilyNotes {
  general?: string;
  importantEvents?: string;
  customFields?: Record<string, any>;
}

// Metadata structure (stored as JSON string in metadata field)
interface FamilyMetadata {
  tags?: string[];
  customFields?: Record<string, any>;
  treePosition?: {
    x?: number;
    y?: number;
    level?: number;
  };
  lastSyncAt?: string;
}
```

## Data Validation Rules

### Husband / Wife
- Optional string (Person ID)
- Must reference existing person in `persons` collection
- Used for traditional family structures
- Either `husband` or `wife` or both can be set
- Can be used together with `partners[]` array

### Partners Array
- Optional string array (Person IDs)
- Default: empty array `[]`
- All IDs must reference existing persons in `persons` collection
- Used for polygamy, multiple marriages, or modern family structures
- Can contain 2+ person IDs
- Can be used instead of or in addition to `husband`/`wife`

### Children Array
- Optional string array (Person IDs)
- Default: empty array `[]`
- All IDs must reference existing persons in `persons` collection
- Can contain any number of child person IDs
- Children can belong to multiple families (e.g., step-families)

### Family Name
- Optional string, max 200 characters
- Used for historic families, royal houses, or family group names
- Examples: "House of Abdul Rahman", "The Smith Family", "Royal Family of Kedah"

### Marriage Date
- Optional datetime
- Should be valid date
- Used for relationship timeline
- Should be before divorce date if divorced

### Divorce Date
- Optional datetime
- Should be valid date
- Only set if `isDivorced` is true
- Should be after marriage date if married
- Used for relationship timeline

### Is Historic
- Required boolean, default: false
- Marks royal, noble, or historically significant families
- Used for filtering and special display in tree visualization

### Status
- Required, one of: `active`, `inactive`, `archived`, `draft`
- Default: `active`
- `active`: Visible and published
- `inactive`: Hidden but not deleted
- `archived`: Archived family
- `draft`: Not yet published

## Business Logic

### Get All Partners
```typescript
function getAllPartners(family: Family): string[] {
  const partners: string[] = [];
  if (family.husband) partners.push(family.husband);
  if (family.wife) partners.push(family.wife);
  if (family.partners && family.partners.length > 0) {
    partners.push(...family.partners);
  }
  // Remove duplicates
  return [...new Set(partners)];
}
```

### Validate Family Structure
```typescript
function validateFamily(family: Family, allPersons: Person[]): string[] {
  const errors: string[] = [];
  const personIds = new Set(allPersons.map(p => p.$id));

  // Validate husband
  if (family.husband && !personIds.has(family.husband)) {
    errors.push('Husband person ID does not exist');
  }

  // Validate wife
  if (family.wife && !personIds.has(family.wife)) {
    errors.push('Wife person ID does not exist');
  }

  // Validate partners
  if (family.partners) {
    family.partners.forEach((partnerId, index) => {
      if (!personIds.has(partnerId)) {
        errors.push(`Partner ${index + 1} person ID does not exist`);
      }
    });
  }

  // Validate children
  if (family.children) {
    family.children.forEach((childId, index) => {
      if (!personIds.has(childId)) {
        errors.push(`Child ${index + 1} person ID does not exist`);
      }
    });
  }

  // At least one partner or child required
  const allPartners = getAllPartners(family);
  if (allPartners.length === 0 && (!family.children || family.children.length === 0)) {
    errors.push('Family must have at least one partner or child');
  }

  // Marriage date validation
  if (family.marriageDate && family.divorceDate) {
    if (new Date(family.divorceDate) < new Date(family.marriageDate)) {
      errors.push('Divorce date must be after marriage date');
    }
  }

  return errors;
}
```

### Find Families for Person
```typescript
async function findFamiliesForPerson(personId: string): Promise<Family[]> {
  // Find families where person is husband
  const asHusband = await databases.listDocuments('console-db', 'families', [
    Query.equal('husband', personId)
  ]);

  // Find families where person is wife
  const asWife = await databases.listDocuments('console-db', 'families', [
    Query.equal('wife', personId)
  ]);

  // Find families where person is in partners array
  // Note: Appwrite doesn't support array contains query directly
  // Need to fetch all families and filter in application
  const allFamilies = await databases.listDocuments('console-db', 'families');
  const asPartner = allFamilies.documents.filter(f => 
    f.partners && f.partners.includes(personId)
  );

  // Find families where person is a child
  const allFamiliesForChildren = await databases.listDocuments('console-db', 'families');
  const asChild = allFamiliesForChildren.documents.filter(f =>
    f.children && f.children.includes(personId)
  );

  // Combine and deduplicate
  const allFamilies = [
    ...asHusband.documents,
    ...asWife.documents,
    ...asPartner,
    ...asChild
  ];

  // Remove duplicates by $id
  const uniqueFamilies = Array.from(
    new Map(allFamilies.map(f => [f.$id, f])).values()
  );

  return uniqueFamilies;
}
```

## Migration Notes

### Initial Setup
- Create `families` collection in Appwrite Console
- Set up all relationship attributes as specified
- Create all indexes for optimal query performance
- Set up permissions for admin-only model

### Data Migration
- If migrating from existing family data, ensure:
  - All person IDs in `husband`, `wife`, `partners[]`, `children[]` reference existing persons
  - Marriage/divorce dates are in ISO 8601 format
  - Family names are properly formatted
  - Historic families are marked with `isHistoric = true`

### Future Considerations
- Consider adding support for family photos
- Plan for family tree versioning/history
- Design for family merging (duplicate detection)
- Prepare for bulk import/export functionality
- Consider adding family search with full-text indexing
- Plan for family statistics and analytics
- Design for family timeline/chronology view

## Notes

- **Admin-Only Model**: Only super admins can create, update, and delete family records
- **Flexible Structure**: Supports traditional, modern, and complex family structures
- **Multiple Partners**: `partners[]` array enables polygamy and multiple marriages
- **String References**: `husband`, `wife`, `partners[]`, `children[]` use string IDs (not Appwrite relationships) for flexibility
- **Cross-Reference**: Persons can belong to multiple families (as child, parent, partner)
- **Historic Families**: `isHistoric` flag marks significant families for special display
- **Audit Trail**: All family changes should be logged in audit_logs

