# Customer Notes Database Schema

## Overview
The `customer_notes` collection stores structured notes and annotations for customers. This collection provides a dedicated space for customer-specific notes, separate from general interactions, allowing for better organization and retrieval of important customer information. In the **self-service model**, users can create and manage notes for their own customer record, enabling them to keep personal notes, reminders, and important information.

## Collection Configuration

**Collection ID**: `customer_notes`
**Database**: `console-db`

## Attributes

| Attribute | Type | Size | Required | Default | Description | Index |
|-----------|------|------|----------|---------|-------------|-------|
| `customerId` | String | 128 | ✅ | - | Customer ID reference | ✅ |
| `noteType` | String | 50 | ✅ | 'general' | Type of note | ✅ |
| `title` | String | 200 | ❌ | null | Note title | ✅ |
| `content` | String | 10000 | ✅ | - | Note content | ❌ |
| `isImportant` | Boolean | - | ✅ | false | Important note flag | ✅ |
| `isPinned` | Boolean | - | ✅ | false | Pinned note flag | ✅ |
| `tags` | String[] | - | ✅ | [] | Note tags for categorization | ❌ |
| `userId` | String | 128 | ✅ | - | User who created note | ✅ |
| `relatedEntityType` | String | 50 | ❌ | null | Related entity type | ❌ |
| `relatedEntityId` | String | 128 | ❌ | null | Related entity ID | ❌ |
| `metadata` | String | 5000 | ❌ | null | Additional metadata (JSON string) | ❌ |
| `createdBy` | String | 128 | ❌ | null | User who created this note | ❌ |
| `updatedBy` | String | 128 | ❌ | null | User who last updated | ❌ |

## Enum Values

### Note Type Values
- `general` - General note
- `internal` - Internal note (not visible to customer)
- `customer_facing` - Customer-facing note
- `meeting` - Meeting notes
- `call` - Call notes
- `email` - Email notes
- `contract` - Contract notes
- `payment` - Payment notes
- `support` - Support notes
- `complaint` - Complaint notes
- `feedback` - Feedback notes
- `reminder` - Reminder note
- `task` - Task note
- `other` - Other note type

## Indexes

### Key Indexes
1. **customerId** (ascending) - For customer-based queries
2. **noteType** (ascending) - For type filtering
3. **userId** (ascending) - For user-based queries
4. **isImportant** (ascending) - For important notes filtering
5. **isPinned** (ascending) - For pinned notes filtering
6. **createdAt** (descending) - For chronological sorting
7. **updatedAt** (descending) - For recently updated notes

## Permissions

- **Create**: `users` (users can create notes for their own customer record), `role:super_admin` (admins can create notes for any customer)
- **Read**: `users` (users can read notes for their own customer record via `customerId` → `userId` match), `role:super_admin` (admins can read all notes)
- **Update**: `users` (users can update notes for their own customer record), `role:super_admin` (admins can update any note)
- **Delete**: `users` (users can delete notes for their own customer record), `role:super_admin` (admins can delete any note)

### Permission Notes
- **Self-Service Model**: Users can create/read/update/delete notes for their own customer record
- **Customer Ownership**: Users can only access notes where `customerId` matches their own customer record's `userId`
- **Admin Access**: Admins have full CRUD access to all notes
- **User Attribution**: `userId` field tracks which user created the note

## Relations

### Outgoing Relations
- `customerId` → `customers.$id` (Many to One, customer reference)
- `userId` → `users.$id` (Many to One, user who created note)
- `createdBy` → `users.$id` (Many to One, user who created record)
- `updatedBy` → `users.$id` (Many to One, user who last updated)

### Incoming Relations
- None (this is a leaf collection)

### Relationship Notes
- **Customer Notes**: All notes for a customer provide detailed information
- **User Attribution**: Notes track which user created/updated them
- **Entity Linking**: Notes can link to related entities (invoices, contracts, etc.)

## TypeScript Interface

```typescript
interface CustomerNote {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  customerId: string;
  noteType: 'general' | 'internal' | 'customer_facing' | 'meeting' | 'call' | 'email' | 'contract' | 'payment' | 'support' | 'complaint' | 'feedback' | 'reminder' | 'task' | 'other';
  title?: string;
  content: string;
  isImportant: boolean;
  isPinned: boolean;
  tags: string[];
  userId: string; // User who created note
  relatedEntityType?: string; // e.g., 'invoice', 'contract', 'quote'
  relatedEntityId?: string; // ID of related entity
  metadata?: string; // JSON string
  createdBy?: string; // User ID who created this record
  updatedBy?: string; // User ID who last updated
}

// Metadata structure (stored as JSON string in metadata field)
interface NoteMetadata {
  attachments?: string[]; // URLs to attached files
  mentions?: string[]; // User IDs mentioned in note
  customFields?: Record<string, any>;
  version?: number; // For note versioning
  editHistory?: Array<{
    editedAt: string;
    editedBy: string;
    changes: string;
  }>;
}
```

## Data Validation Rules

### Customer ID
- Required, max 128 characters
- Must reference existing customer
- Cannot be changed after creation

### Note Type
- Required, one of the defined enum values
- Default: `general`
- Determines note visibility and behavior

### Title
- Optional, max 200 characters
- Brief title/description of note
- Recommended for better organization

### Content
- Required, max 10000 characters
- Main note content
- Can include formatted text, links, etc.

### Is Important
- Required boolean
- Default: `false`
- Important notes are highlighted in UI
- Used for filtering and prioritization

### Is Pinned
- Required boolean
- Default: `false`
- Pinned notes appear at top of note list
- Only one pinned note per customer recommended

### Tags
- Required array of strings
- Default: empty array
- Used for categorization and filtering
- Each tag should be max 50 characters

### User ID
- Required, max 128 characters
- User who created the note
- Must reference existing user

## Business Logic

### Create Note (Self-Service)
```typescript
async function createNote(
  noteData: Partial<CustomerNote>,
  userId: string
): Promise<CustomerNote> {
  // Validate required fields
  if (!noteData.content) {
    throw new Error('Note content is required');
  }
  
  // Get user's customer record
  const customer = await getCustomerByUserId(userId);
  if (!customer) {
    throw new Error('Customer record not found. Please create your customer profile first.');
  }
  
  // Set defaults - customerId must match user's customer record
  const newNote = {
    ...noteData,
    customerId: customer.$id, // Must match user's customer record
    userId: userId, // User who created the note
    noteType: noteData.noteType || 'general',
    isImportant: noteData.isImportant || false,
    isPinned: noteData.isPinned || false,
    tags: noteData.tags || [],
    createdBy: userId,
    createdAt: new Date().toISOString()
  };
  
  const note = await tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: CUSTOMER_NOTES_COLLECTION_ID,
    rowId: ID.unique(),
    body: newNote
  });
  
  // Log note creation in audit log
  await auditLogger.logCustomerNoteCreated(userId, note.$id, customer.$id);
  
  return note;
}
```

### Update Note (Self-Service)
```typescript
async function updateNote(
  noteId: string,
  updates: Partial<CustomerNote>,
  userId: string
): Promise<CustomerNote> {
  const note = await getNote(noteId);
  
  if (!note) {
    throw new Error('Note not found');
  }
  
  // Get user's customer record
  const customer = await getCustomerByUserId(userId);
  if (!customer) {
    throw new Error('Customer record not found');
  }
  
  // Check permissions (user can only update notes for their own customer record unless admin)
  const user = await getUserProfile(userId);
  if (note.customerId !== customer.$id && user?.role !== 'admin') {
    throw new Error('Permission denied - you can only update notes for your own customer record');
  }
  
  // Update note
  const updatedNote = await tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: CUSTOMER_NOTES_COLLECTION_ID,
    rowId: noteId,
    body: {
      ...updates,
      updatedBy: userId,
      updatedAt: new Date().toISOString()
    }
  });
  
  // Log note update in audit log
  await auditLogger.logCustomerNoteUpdated(userId, noteId, note.customerId);
  
  return updatedNote;
}
```

### Get Customer Notes (Self-Service)
```typescript
async function getCustomerNotes(
  userId: string,
  filters?: {
    noteType?: string;
    isImportant?: boolean;
    isPinned?: boolean;
    tags?: string[];
  },
  limit: number = 50
): Promise<CustomerNote[]> {
  // Get user's customer record
  const customer = await getCustomerByUserId(userId);
  if (!customer) {
    return [];
  }
  
  const queries = [
    Query.equal('customerId', customer.$id) // Must match user's customer record
  ];
  
  if (filters?.noteType) {
    queries.push(Query.equal('noteType', filters.noteType));
  }
  
  if (filters?.isImportant !== undefined) {
    queries.push(Query.equal('isImportant', filters.isImportant));
  }
  
  if (filters?.isPinned !== undefined) {
    queries.push(Query.equal('isPinned', filters.isPinned));
  }
  
  // Note: Appwrite doesn't support array contains directly
  // Tags filtering would need to be done client-side
  
  queries.push(Query.orderDesc('isPinned')); // Pinned notes first
  queries.push(Query.orderDesc('$createdAt')); // Then by date
  queries.push(Query.limit(limit));
  
  const notes = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: CUSTOMER_NOTES_COLLECTION_ID,
    queries: queries
  });
  
  // Filter by tags client-side if needed
  let filteredNotes = notes.rows;
  if (filters?.tags && filters.tags.length > 0) {
    filteredNotes = filteredNotes.filter(note =>
      filters.tags!.some(tag => note.tags.includes(tag))
    );
  }
  
  return filteredNotes;
}
```

## Query Patterns

### Get All Notes for Customer
```typescript
const notes = await tablesDB.listRows({
  databaseId: DATABASE_ID,
  tableId: CUSTOMER_NOTES_COLLECTION_ID,
  queries: [
    Query.equal('customerId', customerId),
    Query.orderDesc('isPinned'),
    Query.orderDesc('$createdAt'),
    Query.limit(100)
  ]
});
```

### Get Important Notes
```typescript
const importantNotes = await tablesDB.listRows({
  databaseId: DATABASE_ID,
  tableId: CUSTOMER_NOTES_COLLECTION_ID,
  queries: [
    Query.equal('customerId', customerId),
    Query.equal('isImportant', true),
    Query.orderDesc('$createdAt')
  ]
});
```

### Get Pinned Notes
```typescript
const pinnedNotes = await tablesDB.listRows({
  databaseId: DATABASE_ID,
  tableId: CUSTOMER_NOTES_COLLECTION_ID,
  queries: [
    Query.equal('customerId', customerId),
    Query.equal('isPinned', true),
    Query.orderDesc('$createdAt')
  ]
});
```

### Get Notes by Type
```typescript
const meetingNotes = await tablesDB.listRows({
  databaseId: DATABASE_ID,
  tableId: CUSTOMER_NOTES_COLLECTION_ID,
  queries: [
    Query.equal('customerId', customerId),
    Query.equal('noteType', 'meeting'),
    Query.orderDesc('$createdAt')
  ]
});
```

### Get Notes by User
```typescript
const userNotes = await tablesDB.listRows({
  databaseId: DATABASE_ID,
  tableId: CUSTOMER_NOTES_COLLECTION_ID,
  queries: [
    Query.equal('userId', userId),
    Query.orderDesc('$createdAt'),
    Query.limit(50)
  ]
});
```

### Search Notes by Content
```typescript
const searchResults = await tablesDB.listRows({
  databaseId: DATABASE_ID,
  tableId: CUSTOMER_NOTES_COLLECTION_ID,
  queries: [
    Query.equal('customerId', customerId),
    Query.search('content', searchTerm),
    Query.orderDesc('$createdAt')
  ]
});
```

## Best Practices

### Data Consistency
- Always link notes to valid customers
- Use appropriate note types for better organization
- Mark important notes with `isImportant` flag
- Pin only the most critical notes (one per customer recommended)

### Performance
- Index frequently queried fields (customerId, noteType, isImportant, isPinned)
- Use pagination for note lists
- Limit content length to prevent performance issues
- Archive old notes if needed

### User Experience
- Provide rich text editing for note content
- Support note templates for common note types
- Enable quick note creation from customer detail page
- Show note previews in lists

### Organization
- Use tags for categorization
- Use note types for filtering
- Pin important notes for quick access
- Link notes to related entities when relevant

## Common Use Cases

### Customer Notes Section
- Display all notes for a customer
- Filter by type, importance, tags
- Search notes by content
- Quick note creation form

### Note Management
- Create/edit/delete notes
- Mark notes as important
- Pin/unpin notes
- Add tags to notes

### Note Templates
- Pre-defined note templates for common scenarios
- Quick note creation with templates
- Consistent note formatting

### Note History
- Track note edits
- Show edit history
- Version control for notes

## Related Documentation

- [APPWRITE_DB_CUSTOMERS.md](./APPWRITE_DB_CUSTOMERS.md) - Customer schema
- [APPWRITE_DB_CUSTOMER_INTERACTIONS.md](./APPWRITE_DB_CUSTOMER_INTERACTIONS.md) - Customer interactions schema
- [APPWRITE_DB_USERS.md](./APPWRITE_DB_USERS.md) - User schema (for userId)
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Overall system architecture

