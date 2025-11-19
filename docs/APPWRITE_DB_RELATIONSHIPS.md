# Relationships Database Schema

## Overview
The `relationships` collection stores individual relationship records between two persons. This collection provides flexibility for complex relationship mapping similar to Wikipedia Family Trees, allowing relationships beyond the standard family structure (e.g., siblings, cousins, in-laws, adopted relationships, step-relationships). This is an optional but powerful collection that enables very detailed family tree mapping.

## Collection Configuration

**Collection ID**: `relationships`
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
   - **Purpose**: Admin user who created this relationship record

2. **updatedBy** (Relationship, Optional)
   - **Type**: Relationship
   - **Related Collection**: `users`
   - **Cardinality**: Many to One
   - **On Delete**: Set null (allow deletion, set to null)
   - **Two-Way**: No
   - **Purpose**: Admin user who last updated this relationship record

**Note**: When creating relationship attributes in Appwrite Console, ensure the related collection (`users`) exists first. The `personA` and `personB` fields are string IDs that reference the `persons` collection (not Appwrite relationships, but string references for flexibility and bidirectional relationships).

## Attributes

| Attribute | Type | Size | Required | Default | Description | Index | Relation |
|-----------|------|------|----------|---------|-------------|-------|----------|
| `personA` | String | 128 | ✅ | - | Person ID (first person in relationship) | ✅ | `persons.$id` |
| `personB` | String | 128 | ✅ | - | Person ID (second person in relationship) | ✅ | `persons.$id` |
| `type` | String | 50 | ✅ | - | Relationship type (see enum values) | ✅ | - |
| `date` | Datetime | - | ❌ | null | Relationship date (e.g., marriage date, adoption date) | ✅ | - |
| `place` | String | 300 | ❌ | null | Relationship place (e.g., marriage place) | ❌ | - |
| `note` | String | 2000 | ❌ | null | Extra information about the relationship | ❌ | - |
| `isBidirectional` | Boolean | - | ✅ | true | Whether relationship is bidirectional (e.g., sibling) | ✅ | - |
| `status` | String | 20 | ✅ | 'active' | Relationship status | ✅ | - |
| `metadata` | String | 5000 | ❌ | null | Additional metadata (JSON string) | ❌ | - |
| `createdBy` | Relationship | - | ✅ | - | User who created this record (Many to One) | ❌ | `users` |
| `updatedBy` | Relationship | - | ❌ | null | User who last updated (Many to One) | ❌ | `users` |

## Enum Values

### Relationship Type Values
- `married` - Married relationship
- `divorced` - Divorced relationship
- `engaged` - Engaged relationship
- `parent` - Parent-child relationship (personA is parent of personB)
- `child` - Child-parent relationship (personA is child of personB)
- `sibling` - Sibling relationship (brother/sister)
- `half_sibling` - Half-sibling relationship (same parent, different other parent)
- `step_sibling` - Step-sibling relationship
- `adopted` - Adopted relationship (personA adopted personB)
- `adoptive_parent` - Adoptive parent relationship (personA is adoptive parent of personB)
- `cousin` - Cousin relationship
- `uncle_aunt` - Uncle/Aunt relationship (personA is uncle/aunt of personB)
- `nephew_niece` - Nephew/Niece relationship (personA is nephew/niece of personB)
- `grandparent` - Grandparent relationship (personA is grandparent of personB)
- `grandchild` - Grandchild relationship (personA is grandchild of personB)
- `in_law` - In-law relationship (e.g., brother-in-law, mother-in-law)
- `godparent` - Godparent relationship
- `godchild` - Godchild relationship
- `guardian` - Guardian relationship
- `ward` - Ward relationship (personA is ward of personB)
- `other` - Other relationship type

### Status Values
- `active` - Active relationship
- `inactive` - Inactive relationship (e.g., divorced, deceased)
- `archived` - Archived relationship
- `draft` - Draft relationship (not yet published)

## Indexes

### Key Indexes
1. **personA** (ascending) - For personA-based queries
2. **personB** (ascending) - For personB-based queries
3. **type** (ascending) - For relationship type filtering
4. **date** (ascending) - For chronological sorting
5. **isBidirectional** (ascending) - For bidirectional relationship filtering
6. **status** (ascending) - For status filtering
7. **createdAt** (descending) - For new relationship queries
8. **updatedAt** (descending) - For recently updated queries

### Composite Indexes (Recommended)
1. **personA + type** (ascending) - For finding all relationships of a specific type for a person
2. **personB + type** (ascending) - For finding reverse relationships
3. **personA + personB** (ascending) - For checking if relationship exists between two persons

## Permissions

- **Create**: `role:super_admin` (only admins can create relationships)
- **Read**: `users` (authenticated users can read relationships), `role:super_admin` (admins can read all relationships)
- **Update**: `role:super_admin` (only admins can update relationships)
- **Delete**: `role:super_admin` (only admins can delete relationships)

### Permission Notes
- **Admin-Only Model**: Only super admins can create, update, and delete relationship records
- **Public Access**: All authenticated users can read relationship records
- **Privacy**: Relationship records are visible to all authenticated users
- **Audit Trail**: All relationship changes should be logged in audit_logs

## Relations

### Outgoing Relations (Appwrite Relationships)

**Relationship Attributes:**
- `createdBy` → `users` collection (Many to One)
  - **Type**: Relationship
  - **Related Collection**: `users`
  - **Cardinality**: Many relationships to one user
  - **On Delete**: Set null (allow deletion, set to null)
  - **Purpose**: Admin user who created this relationship record
  
- `updatedBy` → `users` collection (Many to One, optional)
  - **Type**: Relationship
  - **Related Collection**: `users`
  - **Cardinality**: Many relationships to one user
  - **On Delete**: Set null (allow deletion, set to null)
  - **Purpose**: Admin user who last updated this relationship record

### String References (Not Appwrite Relationships)
- `personA` → `persons.$id` (String reference)
  - **Type**: String (Person ID)
  - **Purpose**: Reference to first person in relationship
  - **Validation**: Must reference existing person in `persons` collection
  
- `personB` → `persons.$id` (String reference)
  - **Type**: String (Person ID)
  - **Purpose**: Reference to second person in relationship
  - **Validation**: Must reference existing person in `persons` collection

### Relationship Notes
- **Bidirectional Relationships**: Some relationships are bidirectional (e.g., sibling, cousin). Use `isBidirectional` flag.
- **Directional Relationships**: Some relationships have direction (e.g., parent-child, uncle-nephew). Direction matters.
- **Multiple Relationships**: Two persons can have multiple relationship records (e.g., married + in-law)
- **Flexible Mapping**: Allows mapping complex relationships beyond family structures
- **Wikipedia-Style**: Mirrors Wikipedia's complex relationship patterns

## TypeScript Interface

```typescript
interface Relationship {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  // Relationship fields (Appwrite returns relationship objects)
  createdBy: string | User; // Relationship to users collection (Many to One)
  updatedBy?: string | User; // Relationship to users collection (Many to One, optional)
  // Regular fields
  personA: string; // Person ID (string reference, not relationship)
  personB: string; // Person ID (string reference, not relationship)
  type: 'married' | 'divorced' | 'engaged' | 'parent' | 'child' | 'sibling' | 'half_sibling' | 'step_sibling' | 'adopted' | 'adoptive_parent' | 'cousin' | 'uncle_aunt' | 'nephew_niece' | 'grandparent' | 'grandchild' | 'in_law' | 'godparent' | 'godchild' | 'guardian' | 'ward' | 'other';
  date?: string;
  place?: string;
  note?: string;
  isBidirectional: boolean;
  status: 'active' | 'inactive' | 'archived' | 'draft';
  metadata?: string; // JSON string
}

// When using Appwrite relationship queries, related objects are populated
interface RelationshipWithRelations extends Relationship {
  createdBy: User; // Populated user object
  updatedBy?: User; // Populated user object (optional)
  // Note: personA and personB are string IDs, not populated objects
  // Use separate queries to fetch person details if needed
}

// Relationship with populated person objects (application-level join)
interface RelationshipWithPersons extends Relationship {
  personAObj?: Person;
  personBObj?: Person;
}

// Metadata structure (stored as JSON string in metadata field)
interface RelationshipMetadata {
  tags?: string[];
  customFields?: Record<string, any>;
  lastSyncAt?: string;
  source?: string; // Source of relationship information
  confidence?: number; // Confidence level (0-100) for relationship accuracy
}
```

## Data Validation Rules

### Person A / Person B
- Required string (Person ID)
- Must reference existing person in `persons` collection
- `personA` and `personB` must be different persons
- Used to define the two persons in the relationship

### Type
- Required, one of the relationship type enum values
- Defines the nature of the relationship
- Some types are directional (e.g., `parent`, `child`)
- Some types are bidirectional (e.g., `sibling`, `cousin`)

### Date
- Optional datetime
- Should be valid date
- Used for relationship timeline (e.g., marriage date, adoption date)
- Can be used for chronological sorting

### Is Bidirectional
- Required boolean, default: true
- Indicates whether relationship works both ways
- Examples:
  - `sibling`: bidirectional (if A is sibling of B, B is sibling of A)
  - `parent`: not bidirectional (if A is parent of B, B is child of A, not parent)
  - `married`: bidirectional (if A is married to B, B is married to A)

### Status
- Required, one of: `active`, `inactive`, `archived`, `draft`
- Default: `active`
- `active`: Current/active relationship
- `inactive`: Past relationship (e.g., divorced, deceased)
- `archived`: Archived relationship
- `draft`: Not yet published

## Business Logic

### Get Reverse Relationship Type
```typescript
function getReverseRelationshipType(type: string): string {
  const reverseMap: Record<string, string> = {
    'parent': 'child',
    'child': 'parent',
    'uncle_aunt': 'nephew_niece',
    'nephew_niece': 'uncle_aunt',
    'grandparent': 'grandchild',
    'grandchild': 'grandparent',
    'godparent': 'godchild',
    'godchild': 'godparent',
    'guardian': 'ward',
    'ward': 'guardian',
  };

  return reverseMap[type] || type; // Return same type if no reverse
}
```

### Create Bidirectional Relationship
```typescript
async function createBidirectionalRelationship(
  personA: string,
  personB: string,
  type: string,
  date?: string,
  place?: string,
  note?: string
): Promise<Relationship[]> {
  const relationships: Relationship[] = [];

  // Create relationship A -> B
  const rel1 = await databases.createDocument('console-db', 'relationships', ID.unique(), {
    personA,
    personB,
    type,
    date,
    place,
    note,
    isBidirectional: true,
    status: 'active',
    createdBy: currentUserId,
  });
  relationships.push(rel1);

  // Create reverse relationship B -> A (if not symmetric)
  const reverseType = getReverseRelationshipType(type);
  if (reverseType !== type) {
    const rel2 = await databases.createDocument('console-db', 'relationships', ID.unique(), {
      personA: personB,
      personB: personA,
      type: reverseType,
      date,
      place,
      note,
      isBidirectional: true,
      status: 'active',
      createdBy: currentUserId,
    });
    relationships.push(rel2);
  }

  return relationships;
}
```

### Find All Relationships for Person
```typescript
async function findAllRelationshipsForPerson(personId: string): Promise<Relationship[]> {
  // Find relationships where person is personA
  const asPersonA = await databases.listDocuments('console-db', 'relationships', [
    Query.equal('personA', personId)
  ]);

  // Find relationships where person is personB
  const asPersonB = await databases.listDocuments('console-db', 'relationships', [
    Query.equal('personB', personId)
  ]);

  // Combine results
  return [
    ...asPersonA.documents,
    ...asPersonB.documents
  ];
}
```

### Validate Relationship
```typescript
function validateRelationship(relationship: Relationship, allPersons: Person[]): string[] {
  const errors: string[] = [];
  const personIds = new Set(allPersons.map(p => p.$id));

  // Validate personA
  if (!personIds.has(relationship.personA)) {
    errors.push('PersonA does not exist');
  }

  // Validate personB
  if (!personIds.has(relationship.personB)) {
    errors.push('PersonB does not exist');
  }

  // PersonA and PersonB must be different
  if (relationship.personA === relationship.personB) {
    errors.push('PersonA and PersonB must be different');
  }

  // Date validation
  if (relationship.date) {
    const date = new Date(relationship.date);
    if (isNaN(date.getTime())) {
      errors.push('Invalid date format');
    }
  }

  return errors;
}
```

## Migration Notes

### Initial Setup
- Create `relationships` collection in Appwrite Console
- Set up all relationship attributes as specified
- Create all indexes for optimal query performance
- Set up permissions for admin-only model

### Data Migration
- If migrating from existing relationship data, ensure:
  - All person IDs in `personA` and `personB` reference existing persons
  - Relationship types are standardized
  - Bidirectional relationships are properly flagged
  - Dates are in ISO 8601 format

### Future Considerations
- Consider adding relationship strength/confidence scoring
- Plan for relationship verification/validation workflow
- Design for relationship conflict detection (contradictory relationships)
- Prepare for bulk import/export functionality
- Consider adding relationship search with full-text indexing
- Plan for relationship statistics and analytics
- Design for relationship timeline/chronology view

## Notes

- **Admin-Only Model**: Only super admins can create, update, and delete relationship records
- **Flexible Mapping**: Allows mapping any type of relationship between persons
- **Bidirectional Support**: `isBidirectional` flag indicates symmetric relationships
- **String References**: `personA` and `personB` use string IDs (not Appwrite relationships) for flexibility
- **Wikipedia-Style**: Mirrors Wikipedia's complex relationship patterns
- **Optional but Powerful**: This collection is optional but enables very detailed family tree mapping
- **Audit Trail**: All relationship changes should be logged in audit_logs

