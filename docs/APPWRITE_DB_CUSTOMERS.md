# Customers Database Schema

## Overview
The `customers` collection stores customer relationship management (CRM) data including contact information, company details, status, and assignment tracking. This collection supports a **self-service model** where users can create and manage their own customer information. Each authenticated user can have one customer record (linked via `userId`), allowing them to maintain their own profile, view their activity timeline, and manage their interactions and notes.

## Collection Configuration

**Collection ID**: `customers`
**Database**: `console-db`

## Attributes

| Attribute | Type | Size | Required | Default | Description | Index |
|-----------|------|------|----------|---------|-------------|-------|
| `userId` | String | 128 | ✅ | - | Appwrite user ID (owner of this customer record) | ✅ |
| `name` | String | 200 | ✅ | - | Customer full name | ✅ |
| `email` | String | 255 | ❌ | null | Primary email address | ✅ |
| `phone` | String | 50 | ❌ | null | Primary phone number | ✅ |
| `company` | String | 200 | ❌ | null | Company name | ✅ |
| `jobTitle` | String | 100 | ❌ | null | Job title/position | ❌ |
| `address` | String | 500 | ❌ | null | Street address | ❌ |
| `city` | String | 100 | ❌ | null | City | ✅ |
| `state` | String | 100 | ❌ | null | State/Province | ✅ |
| `zipCode` | String | 20 | ❌ | null | ZIP/Postal code | ❌ |
| `country` | String | 100 | ❌ | null | Country | ✅ |
| `website` | String | 255 | ❌ | null | Company website URL | ❌ |
| `status` | String | 20 | ✅ | 'active' | Customer status | ✅ |
| `assignedTo` | String | 128 | ❌ | null | Assigned user ID (sales rep/admin) | ✅ |
| `source` | String | 50 | ❌ | null | Lead source | ✅ |
| `industry` | String | 100 | ❌ | null | Industry type | ✅ |
| `customerType` | String | 50 | ✅ | 'individual' | Customer type | ✅ |
| `currency` | String | 3 | ❌ | 'MYR' | Preferred currency | ❌ |
| `language` | String | 10 | ❌ | 'en' | Preferred language | ❌ |
| `timezone` | String | 50 | ❌ | null | Customer timezone | ❌ |
| `notes` | String | 5000 | ❌ | null | General notes (JSON string) | ❌ |
| `metadata` | String | 5000 | ❌ | null | Additional metadata (JSON string) | ❌ |
| `lastContactAt` | Datetime | - | ❌ | null | Last contact timestamp | ✅ |
| `nextFollowUpAt` | Datetime | - | ❌ | null | Next follow-up date | ✅ |
| `totalRevenue` | Float | - | ✅ | 0.0 | Total revenue (Min: 0) | ✅ |
| `totalInvoices` | Integer | - | ✅ | 0 | Total invoice count (Min: 0) | ✅ |
| `createdBy` | String | 128 | ❌ | null | User who created this customer | ❌ |
| `updatedBy` | String | 128 | ❌ | null | User who last updated | ❌ |

## Enum Values

### Status Values
- `active` - Active customer
- `inactive` - Inactive customer
- `lead` - Potential customer (lead)
- `prospect` - Qualified prospect
- `archived` - Archived customer

### Customer Type Values
- `individual` - Individual customer
- `company` - Company/Organization
- `non-profit` - Non-profit organization
- `government` - Government entity

### Source Values
- `website` - Website inquiry
- `referral` - Referral
- `social_media` - Social media
- `advertising` - Advertising campaign
- `trade_show` - Trade show
- `cold_call` - Cold call
- `email_campaign` - Email campaign
- `other` - Other source

## Indexes

### Key Indexes
1. **userId** (ascending, unique) - For user-based lookup (primary key for self-service)
2. **name** (ascending) - For name-based search
3. **email** (ascending) - For email lookup (unique recommended)
4. **phone** (ascending) - For phone lookup
5. **company** (ascending) - For company-based filtering
6. **status** (ascending) - For status filtering
7. **assignedTo** (ascending) - For assignment filtering
8. **source** (ascending) - For source-based analytics
9. **industry** (ascending) - For industry filtering
10. **customerType** (ascending) - For type filtering
11. **city** (ascending) - For location-based queries
12. **state** (ascending) - For location-based queries
13. **country** (ascending) - For location-based queries
14. **lastContactAt** (descending) - For recent contact queries
15. **nextFollowUpAt** (ascending) - For follow-up scheduling
16. **totalRevenue** (descending) - For revenue-based sorting
17. **totalInvoices** (descending) - For invoice count sorting
18. **createdAt** (descending) - For new customer queries

## Permissions

- **Create**: `users` (users can create their own customer record), `role:super_admin` (admins can create customer records)
- **Read**: `users` (users can read their own customer record via `userId` match), `role:super_admin` (admins can read all customer records)
- **Update**: `users` (users can update their own customer record via `userId` match), `role:super_admin` (admins can update any customer record)
- **Delete**: `users` (users can delete their own customer record), `role:super_admin` (admins can delete any customer record)

### Permission Notes
- **Self-Service Model**: Users can create, read, update, and delete their own customer record (matched via `userId`)
- **One Record Per User**: Each user should have only one customer record (enforced via unique `userId` index)
- **Admin Access**: Admins have full CRUD access to all customer records
- **Assignment**: `assignedTo` field is for admin/internal assignment purposes (sales rep assignment)
- **Email Uniqueness**: Email should be unique (enforced at application level)
- **Phone Duplicate Detection**: Phone can be used for duplicate detection

## Relations

### Outgoing Relations
- `userId` → `users.$id` (One to One, unique - owner of this customer record)
- `assignedTo` → `users.$id` (Many to One, assigned sales rep/admin)
- `createdBy` → `users.$id` (Many to One, user who created customer record)
- `updatedBy` → `users.$id` (Many to One, user who last updated)

### Incoming Relations
- `customer_interactions.customerId` → This customer (One to Many) *[Customer interactions/activities]*
- `customer_notes.customerId` → This customer (One to Many) *[Customer notes]*
- `invoices.customerId` → This customer (One to Many) *[Customer invoices]*

### Relationship Notes
- **Self-Service Ownership**: `userId` links to the Appwrite user who owns this customer record (one-to-one relationship)
- **Assignment Tracking**: `assignedTo` links to admin/sales rep who manages this customer (for internal use)
- **Activity Tracking**: Related collections track customer interactions and notes
- **Invoice Integration**: Customers are linked to invoices for revenue tracking
- **Audit Trail**: All customer changes should be logged in audit_logs

## TypeScript Interface

```typescript
interface Customer {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  userId: string; // Appwrite user ID (owner of this customer record - unique)
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  website?: string;
  status: 'active' | 'inactive' | 'lead' | 'prospect' | 'archived';
  assignedTo?: string; // Admin/sales rep User ID (for internal assignment)
  source?: 'website' | 'referral' | 'social_media' | 'advertising' | 'trade_show' | 'cold_call' | 'email_campaign' | 'other';
  industry?: string;
  customerType: 'individual' | 'company' | 'non-profit' | 'government';
  currency?: string; // ISO 4217 code (e.g., 'USD', 'EUR')
  language?: 'en' | 'ms';
  timezone?: string;
  notes?: string; // JSON string
  metadata?: string; // JSON string
  lastContactAt?: string;
  nextFollowUpAt?: string;
  totalRevenue: number; // Min: 0
  totalInvoices: number; // Min: 0
  createdBy?: string; // User ID who created this record
  updatedBy?: string; // User ID who last updated
}

// Notes structure (stored as JSON string in notes field)
interface CustomerNotes {
  general?: string;
  preferences?: string;
  importantInfo?: string;
  customFields?: Record<string, any>;
}

// Metadata structure (stored as JSON string in metadata field)
interface CustomerMetadata {
  tags?: string[]; // Customer tags for categorization
  customFields?: Record<string, any>;
  integrationData?: Record<string, any>;
  lastSyncAt?: string;
}
```

## Data Validation Rules

### User ID
- Required, max 128 characters
- Must match the authenticated Appwrite user ID
- Must be unique (one customer record per user)
- Immutable after creation
- This is the primary key for self-service access

### Name
- Required, max 200 characters
- Customer's full name or company name
- Can be auto-populated from Appwrite Auth user's name

### Email
- Optional, max 255 characters
- Should be valid email format
- Should be unique (enforced at application level)
- Used for communication and duplicate detection

### Phone
- Optional, max 50 characters
- Can include country code and formatting
- Used for contact and duplicate detection

### Company
- Optional, max 200 characters
- Company or organization name
- Required if `customerType` is 'company', 'non-profit', or 'government'

### Status
- Required, one of: `active`, `inactive`, `lead`, `prospect`, `archived`
- Default: `active`
- `active`: Current active customer
- `inactive`: Inactive customer (no recent activity)
- `lead`: Potential customer (not yet qualified)
- `prospect`: Qualified prospect (in sales pipeline)
- `archived`: Archived customer (no longer active)

### Customer Type
- Required, one of: `individual`, `company`, `non-profit`, `government`
- Default: `individual`
- Determines required fields and business logic

### Assigned To
- Optional user ID reference
- Links to user who manages this customer
- Used for assignment filtering and reporting

### Total Revenue
- Required float, minimum 0
- Default: 0.0
- Calculated from related invoices
- Should be updated when invoices are created/updated

### Total Invoices
- Required integer, minimum 0
- Default: 0
- Count of related invoices
- Should be updated when invoices are created/deleted

### Notes
- Optional JSON string, max 5000 characters
- Stores structured notes data
- Structure defined in TypeScript interface

### Metadata
- Optional JSON string, max 5000 characters
- Stores tags, custom fields, and integration data
- Structure defined in TypeScript interface

## Business Logic

### Customer Creation (Self-Service)
```typescript
async function createCustomer(customerData: Partial<Customer>, userId: string): Promise<Customer> {
  // Validate required fields
  if (!customerData.name) {
    throw new Error('Customer name is required');
  }
  
  // Check if user already has a customer record
  const existing = await getCustomerByUserId(userId);
  if (existing) {
    throw new Error('Customer record already exists for this user');
  }
  
  // Validate email format if provided
  if (customerData.email && !isValidEmail(customerData.email)) {
    throw new Error('Invalid email format');
  }
  
  // Check for duplicate email
  if (customerData.email) {
    const existingByEmail = await findCustomerByEmail(customerData.email);
    if (existingByEmail) {
      throw new Error('Customer with this email already exists');
    }
  }
  
  // Set defaults - userId must match the authenticated user
  const newCustomer = {
    ...customerData,
    userId: userId, // Must match authenticated user
    status: customerData.status || 'active',
    customerType: customerData.customerType || 'individual',
    totalRevenue: 0.0,
    totalInvoices: 0,
    createdBy: userId,
    createdAt: new Date().toISOString()
  };
  
  const customer = await tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: CUSTOMERS_COLLECTION_ID,
    rowId: ID.unique(),
    body: newCustomer
  });
  
  // Log customer creation in audit log
  await auditLogger.logCustomerCreated(userId, customer.$id, customer.name);
  
  return customer;
}
```

### Update Customer Status
```typescript
async function updateCustomerStatus(
  customerId: string,
  newStatus: Customer['status'],
  updatedBy: string,
  reason?: string
): Promise<void> {
  const customer = await getCustomer(customerId);
  
  if (!customer) {
    throw new Error('Customer not found');
  }
  
  await tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: CUSTOMERS_COLLECTION_ID,
    rowId: customerId,
    body: {
      status: newStatus,
      updatedBy: updatedBy,
      updatedAt: new Date().toISOString(),
      metadata: JSON.stringify({
        ...JSON.parse(customer.metadata || '{}'),
        statusChangeReason: reason,
        statusChangedAt: new Date().toISOString(),
        statusChangedBy: updatedBy
      })
    }
  });
  
  // Log status change in audit log
  await auditLogger.logCustomerStatusChange(updatedBy, customerId, customer.status, newStatus, reason);
}
```

### Update Revenue Statistics
```typescript
async function updateCustomerRevenue(customerId: string): Promise<void> {
  // Get all invoices for this customer
  const invoices = await getCustomerInvoices(customerId);
  
  // Calculate total revenue
  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);
  
  // Update customer
  await tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: CUSTOMERS_COLLECTION_ID,
    rowId: customerId,
    body: {
      totalRevenue: totalRevenue,
      totalInvoices: invoices.length,
      updatedAt: new Date().toISOString()
    }
  });
}
```

### Update Last Contact
```typescript
async function updateLastContact(customerId: string, contactDate?: string): Promise<void> {
  await tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: CUSTOMERS_COLLECTION_ID,
    rowId: customerId,
    body: {
      lastContactAt: contactDate || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  });
}
```

## Query Patterns

### Get Customer by User ID (Self-Service)
```typescript
const customer = await tablesDB.listRows({
  databaseId: DATABASE_ID,
  tableId: CUSTOMERS_COLLECTION_ID,
  queries: [
    Query.equal('userId', userId),
    Query.limit(1)
  ]
});
```

### Get Customer by Email
```typescript
const customer = await tablesDB.listRows({
  databaseId: DATABASE_ID,
  tableId: CUSTOMERS_COLLECTION_ID,
  queries: [
    Query.equal('email', email),
    Query.limit(1)
  ]
});
```

### Get Active Customers
```typescript
const activeCustomers = await tablesDB.listRows({
  databaseId: DATABASE_ID,
  tableId: CUSTOMERS_COLLECTION_ID,
  queries: [
    Query.equal('status', 'active'),
    Query.orderDesc('lastContactAt'),
    Query.limit(50)
  ]
});
```

### Get Customers by Assigned User
```typescript
const assignedCustomers = await tablesDB.listRows({
  databaseId: DATABASE_ID,
  tableId: CUSTOMERS_COLLECTION_ID,
  queries: [
    Query.equal('assignedTo', userId),
    Query.equal('status', 'active'),
    Query.orderAsc('name')
  ]
});
```

### Get Customers by Company
```typescript
const companyCustomers = await tablesDB.listRows({
  databaseId: DATABASE_ID,
  tableId: CUSTOMERS_COLLECTION_ID,
  queries: [
    Query.equal('company', companyName),
    Query.orderAsc('name')
  ]
});
```

### Get Customers Needing Follow-up
```typescript
const followUpCustomers = await tablesDB.listRows({
  databaseId: DATABASE_ID,
  tableId: CUSTOMERS_COLLECTION_ID,
  queries: [
    Query.lessThanEqual('nextFollowUpAt', new Date().toISOString()),
    Query.notEqual('status', 'archived'),
    Query.orderAsc('nextFollowUpAt')
  ]
});
```

### Search Customers by Name or Email
```typescript
// Note: Appwrite doesn't support OR queries directly, so we need to search separately
const nameResults = await tablesDB.listRows({
  databaseId: DATABASE_ID,
  tableId: CUSTOMERS_COLLECTION_ID,
  queries: [
    Query.search('name', searchTerm),
    Query.limit(25)
  ]
});

const emailResults = await tablesDB.listRows({
  databaseId: DATABASE_ID,
  tableId: CUSTOMERS_COLLECTION_ID,
  queries: [
    Query.search('email', searchTerm),
    Query.limit(25)
  ]
});

// Combine and deduplicate results
const allResults = [...nameResults.rows, ...emailResults.rows];
const uniqueResults = Array.from(new Map(allResults.map(c => [c.$id, c])).values());
```

### Get Top Revenue Customers
```typescript
const topCustomers = await tablesDB.listRows({
  databaseId: DATABASE_ID,
  tableId: CUSTOMERS_COLLECTION_ID,
  queries: [
    Query.greaterThan('totalRevenue', 0),
    Query.orderDesc('totalRevenue'),
    Query.limit(10)
  ]
});
```

## Best Practices

### Data Consistency
- **User Ownership**: Each user can only have one customer record (enforced via unique `userId` index)
- **Self-Service**: Users can only create/update/delete their own customer record (matched via `userId`)
- Always validate email format before saving
- Check for duplicate emails before creating new customers
- Update `totalRevenue` and `totalInvoices` when invoices change
- Update `lastContactAt` when interactions are logged
- Use `assignedTo` for admin/internal assignment tracking

### Performance
- Index frequently queried fields (email, status, assignedTo, company)
- Use pagination for customer lists
- Cache frequently accessed customer data
- Batch update operations when possible

### Security
- Never expose sensitive customer data without proper permissions
- Validate all user inputs
- Use role-based access control
- Log all customer data changes in audit logs

### Privacy
- Respect customer privacy preferences
- Implement data export and deletion (GDPR compliance)
- Store minimal required information
- Encrypt sensitive data if required

## Common Use Cases

### Customer Self-Service Portal
- **User Profile**: Users can view and edit their own customer information
- **Customer Information Form**: Create/update personal or company information
- **Activity Timeline**: View their own interactions and notes
- **Invoice History**: View their own invoices and payment history
- **Settings**: Manage preferences, language, timezone, notification settings

### Admin Customer Management
- Display all customers in sortable table (admin only)
- Filter by status, assigned user, company, source
- Search by name, email, phone, company
- Show customer statistics (revenue, invoice count)
- Bulk operations (status update, assignment, export)
- Assign customers to sales reps
- View customer activity timeline
- Manage customer notes and interactions

### Customer Creation/Edit Form (Self-Service)
- Users create their own customer record on first use
- Validate required fields based on customer type
- Check for duplicate emails
- Auto-populate from Appwrite Auth user data (email, name)
- Set default values based on user preferences

## Related Collections

### Customer Interactions (`customer_interactions`)
- Tracks all customer interactions (calls, emails, meetings, etc.)
- Links to customer via `customerId`
- See [APPWRITE_DB_CUSTOMER_INTERACTIONS.md](./APPWRITE_DB_CUSTOMER_INTERACTIONS.md)

### Customer Notes (`customer_notes`)
- Stores structured notes for customers
- Links to customer via `customerId`
- See [APPWRITE_DB_CUSTOMER_NOTES.md](./APPWRITE_DB_CUSTOMER_NOTES.md)

### Invoices (`invoices`)
- Customer invoices and payments
- Links to customer via `customerId`
- Updates customer revenue statistics

## Future Enhancements

- **Customer Segmentation**: Advanced tagging and segmentation
- **Customer Scoring**: Lead scoring and customer value calculation
- **Customer Lifecycle**: Track customer journey stages
- **Customer Portal**: Self-service portal for customers
- **Integration APIs**: Connect with external CRM systems
- **Customer Analytics**: Advanced reporting and analytics
- **Customer Communication**: Email/SMS integration
- **Customer Documents**: Document management per customer
- **Customer Tasks**: Task management linked to customers
- **Customer Contracts**: Contract management per customer

## Related Documentation

- [APPWRITE_SETUP.md](./APPWRITE_SETUP.md) - Appwrite configuration
- [APPWRITE_DB_USERS.md](./APPWRITE_DB_USERS.md) - User schema (for assignedTo)
- [APPWRITE_DB_CUSTOMER_INTERACTIONS.md](./APPWRITE_DB_CUSTOMER_INTERACTIONS.md) - Customer interactions schema
- [APPWRITE_DB_CUSTOMER_NOTES.md](./APPWRITE_DB_CUSTOMER_NOTES.md) - Customer notes schema
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Overall system architecture

