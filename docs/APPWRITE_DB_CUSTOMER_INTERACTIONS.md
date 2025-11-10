# Customer Interactions Database Schema

## Overview
The `customer_interactions` collection tracks all customer interactions including calls, emails, meetings, notes, and other communication activities. This collection provides a comprehensive activity timeline for each customer. In the **self-service model**, users can create and manage interactions for their own customer record, allowing them to track their communication history and activities.

## Collection Configuration

**Collection ID**: `customer_interactions`
**Database**: `console-db`

## Attributes

| Attribute | Type | Size | Required | Default | Description | Index |
|-----------|------|------|----------|---------|-------------|-------|
| `customerId` | String | 128 | ✅ | - | Customer ID reference | ✅ |
| `interactionType` | String | 50 | ✅ | - | Type of interaction | ✅ |
| `subject` | String | 200 | ❌ | null | Interaction subject/title | ✅ |
| `description` | String | 5000 | ❌ | null | Interaction description/notes | ❌ |
| `userId` | String | 128 | ✅ | - | User who created interaction | ✅ |
| `contactMethod` | String | 50 | ❌ | null | Contact method used | ✅ |
| `direction` | String | 20 | ✅ | 'outbound' | Interaction direction | ✅ |
| `duration` | Integer | - | ❌ | null | Duration in minutes | ❌ |
| `outcome` | String | 50 | ❌ | null | Interaction outcome | ✅ |
| `nextAction` | String | 500 | ❌ | null | Next action required | ❌ |
| `nextActionDate` | Datetime | - | ❌ | null | Next action due date | ✅ |
| `relatedEntityType` | String | 50 | ❌ | null | Related entity type | ❌ |
| `relatedEntityId` | String | 128 | ❌ | null | Related entity ID | ❌ |
| `metadata` | String | 5000 | ❌ | null | Additional metadata (JSON string) | ❌ |
| `createdBy` | String | 128 | ❌ | null | User who created this interaction | ❌ |

## Enum Values

### Interaction Type Values
- `call` - Phone call
- `email` - Email communication
- `meeting` - In-person or virtual meeting
- `note` - General note
- `task` - Task or to-do
- `quote` - Quote sent
- `proposal` - Proposal sent
- `contract` - Contract discussion
- `support` - Support ticket
- `complaint` - Customer complaint
- `feedback` - Customer feedback
- `other` - Other interaction type

### Contact Method Values
- `phone` - Phone call
- `email` - Email
- `in_person` - In-person meeting
- `video_call` - Video call (Zoom, Teams, etc.)
- `chat` - Live chat
- `social_media` - Social media
- `other` - Other method

### Direction Values
- `inbound` - Customer initiated
- `outbound` - Company initiated

### Outcome Values
- `successful` - Successful interaction
- `no_answer` - No answer/response
- `voicemail` - Left voicemail
- `busy` - Line busy
- `follow_up_required` - Follow-up needed
- `resolved` - Issue resolved
- `escalated` - Escalated to management
- `cancelled` - Cancelled
- `other` - Other outcome

## Indexes

### Key Indexes
1. **customerId** (ascending) - For customer-based queries
2. **interactionType** (ascending) - For type filtering
3. **userId** (ascending) - For user-based queries
4. **contactMethod** (ascending) - For method filtering
5. **direction** (ascending) - For direction filtering
6. **outcome** (ascending) - For outcome filtering
7. **nextActionDate** (ascending) - For follow-up scheduling
8. **createdAt** (descending) - For chronological sorting

## Permissions

- **Create**: `users` (users can create interactions for their own customer record), `role:super_admin` (admins can create interactions for any customer)
- **Read**: `users` (users can read interactions for their own customer record via `customerId` → `userId` match), `role:super_admin` (admins can read all interactions)
- **Update**: `users` (users can update interactions for their own customer record), `role:super_admin` (admins can update any interaction)
- **Delete**: `users` (users can delete interactions for their own customer record), `role:super_admin` (admins can delete any interaction)

### Permission Notes
- **Self-Service Model**: Users can create/read/update/delete interactions for their own customer record
- **Customer Ownership**: Users can only access interactions where `customerId` matches their own customer record's `userId`
- **Admin Access**: Admins have full CRUD access to all interactions
- **User Attribution**: `userId` field tracks which user created the interaction

## Relations

### Outgoing Relations
- `customerId` → `customers.$id` (Many to One, customer reference)
- `userId` → `users.$id` (Many to One, user who created interaction)
- `createdBy` → `users.$id` (Many to One, user who created record)

### Incoming Relations
- None (this is a leaf collection)

### Relationship Notes
- **Customer Timeline**: All interactions for a customer form their activity timeline
- **User Activity**: Interactions track which user performed the action
- **Follow-up Tracking**: `nextActionDate` links to customer's `nextFollowUpAt`

## TypeScript Interface

```typescript
interface CustomerInteraction {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  customerId: string;
  interactionType: 'call' | 'email' | 'meeting' | 'note' | 'task' | 'quote' | 'proposal' | 'contract' | 'support' | 'complaint' | 'feedback' | 'other';
  subject?: string;
  description?: string;
  userId: string; // User who created/interacted
  contactMethod?: 'phone' | 'email' | 'in_person' | 'video_call' | 'chat' | 'social_media' | 'other';
  direction: 'inbound' | 'outbound';
  duration?: number; // Minutes
  outcome?: 'successful' | 'no_answer' | 'voicemail' | 'busy' | 'follow_up_required' | 'resolved' | 'escalated' | 'cancelled' | 'other';
  nextAction?: string;
  nextActionDate?: string;
  relatedEntityType?: string; // e.g., 'invoice', 'quote', 'contract'
  relatedEntityId?: string; // ID of related entity
  metadata?: string; // JSON string
  createdBy?: string; // User ID who created this record
}

// Metadata structure (stored as JSON string in metadata field)
interface InteractionMetadata {
  attachments?: string[]; // URLs to attached files
  participants?: string[]; // User IDs or email addresses
  location?: string; // Meeting location
  tags?: string[]; // Interaction tags
  customFields?: Record<string, any>;
  emailThreadId?: string; // For email interactions
  callRecordingUrl?: string; // For call interactions
}
```

## Data Validation Rules

### Customer ID
- Required, max 128 characters
- Must reference existing customer
- Cannot be changed after creation

### Interaction Type
- Required, one of the defined enum values
- Determines required fields and business logic

### Subject
- Optional, max 200 characters
- Brief title/description of interaction
- Recommended for all interaction types

### Description
- Optional, max 5000 characters
- Detailed notes about the interaction
- Required for notes and meetings

### User ID
- Required, max 128 characters
- User who performed the interaction
- Must reference existing user

### Direction
- Required, one of: `inbound`, `outbound`
- Default: `outbound`
- `inbound`: Customer initiated contact
- `outbound`: Company initiated contact

### Duration
- Optional integer (minutes)
- Used for calls and meetings
- Should be positive number

### Next Action Date
- Optional datetime
- Used to schedule follow-ups
- Should be in the future when set
- Links to customer's `nextFollowUpAt`

## Business Logic

### Create Interaction (Self-Service)
```typescript
async function createInteraction(
  interactionData: Partial<CustomerInteraction>,
  userId: string
): Promise<CustomerInteraction> {
  // Validate required fields
  if (!interactionData.interactionType) {
    throw new Error('Interaction type is required');
  }
  
  // Get user's customer record
  const customer = await getCustomerByUserId(userId);
  if (!customer) {
    throw new Error('Customer record not found. Please create your customer profile first.');
  }
  
  // Set defaults - customerId must match user's customer record
  const newInteraction = {
    ...interactionData,
    customerId: customer.$id, // Must match user's customer record
    userId: userId, // User who created the interaction
    direction: interactionData.direction || 'outbound',
    createdBy: userId,
    createdAt: new Date().toISOString()
  };
  
  const interaction = await tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: CUSTOMER_INTERACTIONS_COLLECTION_ID,
    rowId: ID.unique(),
    body: newInteraction
  });
  
  // Update customer's last contact date
  await updateLastContact(customer.$id);
  
  // Update customer's next follow-up if nextActionDate is set
  if (interactionData.nextActionDate) {
    await updateCustomerNextFollowUp(customer.$id, interactionData.nextActionDate);
  }
  
  // Log interaction creation in audit log
  await auditLogger.logCustomerInteractionCreated(userId, interaction.$id, customer.$id);
  
  return interaction;
}
```

### Get Customer Interactions (Self-Service)
```typescript
async function getCustomerInteractions(
  userId: string,
  limit: number = 50
): Promise<CustomerInteraction[]> {
  // Get user's customer record
  const customer = await getCustomerByUserId(userId);
  if (!customer) {
    return [];
  }
  
  // Get interactions for user's customer record
  const interactions = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: CUSTOMER_INTERACTIONS_COLLECTION_ID,
    queries: [
      Query.equal('customerId', customer.$id),
      Query.orderDesc('$createdAt'),
      Query.limit(limit)
    ]
  });
  
  return interactions.rows;
}
```

### Get Interactions Needing Follow-up
```typescript
async function getInteractionsNeedingFollowUp(userId?: string): Promise<CustomerInteraction[]> {
  const queries = [
    Query.lessThanEqual('nextActionDate', new Date().toISOString()),
    Query.notEqual('outcome', 'resolved'),
    Query.orderAsc('nextActionDate')
  ];
  
  if (userId) {
    queries.push(Query.equal('userId', userId));
  }
  
  const interactions = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: CUSTOMER_INTERACTIONS_COLLECTION_ID,
    queries: queries
  });
  
  return interactions.rows;
}
```

## Query Patterns

### Get All Interactions for Customer
```typescript
const interactions = await tablesDB.listRows({
  databaseId: DATABASE_ID,
  tableId: CUSTOMER_INTERACTIONS_COLLECTION_ID,
  queries: [
    Query.equal('customerId', customerId),
    Query.orderDesc('$createdAt'),
    Query.limit(100)
  ]
});
```

### Get Interactions by Type
```typescript
const calls = await tablesDB.listRows({
  databaseId: DATABASE_ID,
  tableId: CUSTOMER_INTERACTIONS_COLLECTION_ID,
  queries: [
    Query.equal('customerId', customerId),
    Query.equal('interactionType', 'call'),
    Query.orderDesc('$createdAt')
  ]
});
```

### Get Interactions by User
```typescript
const userInteractions = await tablesDB.listRows({
  databaseId: DATABASE_ID,
  tableId: CUSTOMER_INTERACTIONS_COLLECTION_ID,
  queries: [
    Query.equal('userId', userId),
    Query.orderDesc('$createdAt'),
    Query.limit(50)
  ]
});
```

### Get Recent Interactions
```typescript
const recentInteractions = await tablesDB.listRows({
  databaseId: DATABASE_ID,
  tableId: CUSTOMER_INTERACTIONS_COLLECTION_ID,
  queries: [
    Query.greaterThan('$createdAt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    Query.orderDesc('$createdAt'),
    Query.limit(100)
  ]
});
```

## Best Practices

### Data Consistency
- Always update customer's `lastContactAt` when creating interactions
- Update customer's `nextFollowUpAt` when `nextActionDate` is set
- Link related entities (invoices, quotes) via `relatedEntityType` and `relatedEntityId`
- Use consistent interaction types across the system

### Performance
- Index frequently queried fields (customerId, interactionType, userId, createdAt)
- Use pagination for interaction lists
- Cache recent interactions for active customers
- Archive old interactions if needed

### User Experience
- Provide quick interaction creation forms
- Show interaction timeline on customer detail page
- Enable filtering by type, date, user
- Support bulk interaction creation

## Common Use Cases

### Customer Activity Timeline
- Display all interactions chronologically
- Filter by interaction type
- Show interaction details on click
- Link to related entities (invoices, quotes)

### Interaction Creation
- Quick log call/email/meeting
- Set follow-up dates
- Link to related documents
- Add attachments and notes

### Follow-up Management
- List interactions needing follow-up
- Filter by user
- Sort by due date
- Mark as completed

### Reporting
- Interaction statistics by type
- User activity reports
- Customer engagement metrics
- Follow-up completion rates

## Related Documentation

- [APPWRITE_DB_CUSTOMERS.md](./APPWRITE_DB_CUSTOMERS.md) - Customer schema
- [APPWRITE_DB_USERS.md](./APPWRITE_DB_USERS.md) - User schema (for userId)
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Overall system architecture

