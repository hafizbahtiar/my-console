# Users Database Schema

## Overview
The `users` collection stores extended user profile information, preferences, and activity data. This collection complements Appwrite's built-in user authentication system by providing additional metadata and custom fields for the My Console application.

**Important**: This collection does NOT duplicate fields that are already available in Appwrite's built-in user account. Fields like `email`, `name`, `emailVerification`, and `labels` are stored in Appwrite Auth and should be accessed from there. This collection only stores application-specific extensions.

## Collection Configuration

**Collection ID**: `users`
**Database**: `console-db`

## Attributes

| Attribute | Type | Size | Required | Default | Description | Index |
|-----------|------|------|----------|---------|-------------|-------|
| `userId` | String | 128 | ✅ | - | Appwrite user ID (unique reference) | ✅ |
| `avatar` | String | 500 | ❌ | null | Avatar image URL | ❌ |
| `bio` | String | 500 | ❌ | null | User biography/description | ❌ |
| `location` | String | 100 | ❌ | null | User location | ❌ |
| `website` | String | 255 | ❌ | null | Personal website URL | ❌ |
| `role` | String | 50 | ✅ | 'user' | User role (user, admin, moderator) | ✅ |
| `status` | String | 20 | ✅ | 'active' | Account status (active, inactive, suspended, banned) | ✅ |
| `lastLoginAt` | Datetime | - | ❌ | null | Last login timestamp | ✅ |
| `lastActiveAt` | Datetime | - | ❌ | null | Last activity timestamp | ✅ |
| `loginCount` | Integer | - | ✅ | 0 | Total login count (Min: 0) | ✅ |
| `metadata` | String | 5000 | ❌ | null | Additional metadata (JSON string) | ❌ |
| `timezone` | String | 50 | ❌ | null | User timezone | ❌ |
| `language` | String | 10 | ❌ | null | Preferred language (en, ms) | ❌ |
| `theme` | String | 20 | ❌ | null | UI theme preference (light, dark, system) | ❌ |
| `notificationsEnabled` | Boolean | - | ✅ | true | Email notifications enabled | ❌ |
| `twoFactorEnabled` | Boolean | - | ✅ | false | Two-factor authentication enabled | ❌ |
| `createdBy` | String | 128 | ❌ | null | User who created this profile (admin) | ❌ |
| `updatedBy` | String | 128 | ❌ | null | User who last updated this profile | ❌ |

### Fields Available from Appwrite Auth (NOT stored here)

The following fields are available from Appwrite's built-in user account and should NOT be duplicated in this collection:

- `$id` - User ID (use `userId` field to reference)
- `$createdAt` - Account creation timestamp
- `$updatedAt` - Last update timestamp
- `email` - User email address
- `name` - User display name
- `phone` - User phone number
- `emailVerification` - Email verification status (boolean)
- `phoneVerification` - Phone verification status (boolean)
- `prefs` - User preferences (key-value object)
- `labels` - Custom labels/tags (array)

**Note**: Access these fields from `account.get()` or the Appwrite user object. Use `userId` to link this collection to the Appwrite user.

## Indexes

### Key Indexes
1. **userId** (ascending, unique) - Primary lookup by Appwrite user ID
2. **role** (ascending) - Role-based filtering
3. **status** (ascending) - Status-based filtering
4. **lastLoginAt** (descending) - Recent login queries
5. **lastActiveAt** (descending) - Active user queries
6. **createdAt** (descending) - New user queries

**Note**: For email/name searches, query Appwrite Auth directly or join with Appwrite user data.

## Permissions

- **Create**: `users` (users can create their own profile), `role:super_admin` (admins can create profiles)
- **Read**: `users` (users can read their own profile), `role:super_admin` (admins can read all profiles)
- **Update**: `users` (users can update their own profile), `role:super_admin` (admins can update any profile)
- **Delete**: `role:super_admin` (only admins can delete profiles)

### Permission Notes
- Users can only read/update their own profile (via `userId` match)
- Admins have full CRUD access to all profiles
- `userId` is immutable after creation (links to Appwrite Auth user)
- Email and name are managed in Appwrite Auth, not in this collection

## Relations

### Outgoing Relations
- `userId` → `appwrite_users.$id` (One to One, reference to Appwrite Auth user)
- `createdBy` → `users.$id` (Many to One, admin who created profile)
- `updatedBy` → `users.$id` (Many to One, user who last updated)

### Incoming Relations
- `audit_logs.userId` → This user (One to Many) *[User's audit logs]*
- `blog_posts.authorId` → This user (One to Many) *[User's blog posts]*
- `community_posts.authorId` → This user (One to Many) *[User's community posts]*
- `community_replies.authorId` → This user (One to Many) *[User's replies]*
- `community_votes.userId` → This user (One to Many) *[User's votes]*

### Relationship Notes
- **Appwrite User Sync**: `userId` must match an existing Appwrite Auth user
- **Activity Tracking**: Related collections track user activity
- **Audit Trail**: All user actions are logged in audit_logs
- **Content Ownership**: Users own their blog posts, community posts, and replies

## TypeScript Interface

```typescript
// Extended user profile (stored in users collection)
interface UserProfile {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  userId: string; // Appwrite user ID (unique reference)
  avatar?: string; // URL to avatar image
  bio?: string;
  location?: string;
  website?: string; // Personal website URL
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'inactive' | 'suspended' | 'banned';
  lastLoginAt?: string;
  lastActiveAt?: string;
  loginCount: number; // Min: 0
  metadata?: string; // JSON string
  timezone?: string;
  language?: 'en' | 'ms';
  theme?: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  twoFactorEnabled: boolean;
  createdBy?: string; // Admin user ID who created this
  updatedBy?: string; // User ID who last updated
}

// Combined user object (Appwrite Auth + Extended Profile)
interface User {
  // From Appwrite Auth
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  email: string;
  name?: string;
  phone?: string;
  emailVerification: boolean;
  phoneVerification: boolean;
  prefs?: Record<string, any>; // Appwrite preferences
  labels?: string[]; // Appwrite labels
  
  // From users collection (extended profile)
  profile?: UserProfile;
}

// Metadata structure (stored as JSON string in metadata field)
interface UserMetadata {
  registrationSource?: string; // 'web', 'api', 'admin'
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  customFields?: Record<string, any>;
}

// Note: For user preferences, use Appwrite's built-in `prefs` field
// For labels, use Appwrite's built-in `labels` field
```

## Data Validation Rules

### User ID
- Required, max 128 characters
- Must match an existing Appwrite Auth user ID (`$id`)
- Must be unique across all users
- Immutable after creation
- This is the link between Appwrite Auth and extended profile

### Role
- Required, one of: `user`, `admin`, `moderator`
- Default: `user`
- Only admins can change roles
- `admin` role grants full system access
- `moderator` role grants content moderation access

### Status
- Required, one of: `active`, `inactive`, `suspended`, `banned`
- Default: `active`
- `active`: Normal user account
- `inactive`: Account disabled by user
- `suspended`: Temporarily disabled by admin
- `banned`: Permanently disabled by admin

### Metadata
- Optional JSON string, max 5000 characters
- Stores additional application-specific metadata
- Can include registration source, IP address, user agent, etc.
- Structure defined in TypeScript interface below

### Language
- Optional, one of: `en`, `ms`
- Default: `en`
- Used for UI localization

### Theme
- Optional, one of: `light`, `dark`, `system`
- Default: `system`
- Used for UI theme preference

## Business Logic

### User Profile Creation
```typescript
async function createUserProfile(appwriteUserId: string): Promise<UserProfile> {
  // Verify Appwrite user exists
  const appwriteUser = await account.get();
  if (appwriteUser.$id !== appwriteUserId) {
    throw new Error('User ID mismatch');
  }
  
  // Create extended user profile (email/name come from Appwrite)
  const userProfile = await tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: USERS_COLLECTION_ID,
    rowId: ID.unique(),
    body: {
      userId: appwriteUserId,
      role: 'user',
      status: 'active',
      loginCount: 0,
      notificationsEnabled: true,
      twoFactorEnabled: false,
      createdAt: new Date().toISOString()
    }
  });
  
  return userProfile;
}
```

### Get Combined User Data
```typescript
async function getUserWithProfile(appwriteUserId: string): Promise<User> {
  // Get Appwrite Auth user
  const appwriteUser = await account.get();
  
  // Get extended profile
  const profile = await getUserProfileByUserId(appwriteUserId);
  
  // Combine both
  return {
    ...appwriteUser,
    profile: profile || null
  };
}
```

### Update Last Activity
```typescript
async function updateLastActivity(userId: string): Promise<void> {
  const userProfile = await getUserProfileByUserId(userId);
  
  if (userProfile) {
    await tablesDB.updateRow({
      databaseId: DATABASE_ID,
      tableId: USERS_COLLECTION_ID,
      rowId: userProfile.$id,
      body: {
        lastActiveAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
  }
}
```

### Update Login Stats
```typescript
async function updateLoginStats(userId: string): Promise<void> {
  const userProfile = await getUserProfileByUserId(userId);
  
  if (userProfile) {
    await tablesDB.updateRow({
      databaseId: DATABASE_ID,
      tableId: USERS_COLLECTION_ID,
      rowId: userProfile.$id,
      body: {
        lastLoginAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        loginCount: (userProfile.loginCount || 0) + 1,
        updatedAt: new Date().toISOString()
      }
    });
  }
}
```

### Role Management
```typescript
async function updateUserRole(userId: string, newRole: 'user' | 'admin' | 'moderator', updatedBy: string): Promise<void> {
  const userProfile = await getUserProfileByUserId(userId);
  
  if (!userProfile) {
    throw new Error('User profile not found');
  }
  
  // Only admins can change roles
  const adminProfile = await getUserProfileByUserId(updatedBy);
  if (adminProfile?.role !== 'admin') {
    throw new Error('Only admins can change user roles');
  }
  
  await tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: USERS_COLLECTION_ID,
    rowId: userProfile.$id,
    body: {
      role: newRole,
      updatedBy: updatedBy,
      updatedAt: new Date().toISOString()
    }
  });
  
  // Log role change in audit log
  await auditLogger.logUserRoleChange(updatedBy, userId, userProfile.role, newRole);
}
```

### Status Management
```typescript
async function updateUserStatus(
  userId: string, 
  newStatus: 'active' | 'inactive' | 'suspended' | 'banned',
  updatedBy: string,
  reason?: string
): Promise<void> {
  const userProfile = await getUserProfileByUserId(userId);
  
  if (!userProfile) {
    throw new Error('User profile not found');
  }
  
  // Only admins can change status (except users can set themselves to inactive)
  if (newStatus !== 'inactive' || userId !== updatedBy) {
    const adminProfile = await getUserProfileByUserId(updatedBy);
    if (adminProfile?.role !== 'admin') {
      throw new Error('Only admins can change user status');
    }
  }
  
  await tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: USERS_COLLECTION_ID,
    rowId: userProfile.$id,
    body: {
      status: newStatus,
      updatedBy: updatedBy,
      updatedAt: new Date().toISOString(),
      metadata: JSON.stringify({
        ...JSON.parse(userProfile.metadata || '{}'),
        statusChangeReason: reason,
        statusChangedAt: new Date().toISOString(),
        statusChangedBy: updatedBy
      })
    }
  });
  
  // Log status change in audit log
  await auditLogger.logUserStatusChange(updatedBy, userId, userProfile.status, newStatus, reason);
}
```

## Query Patterns

### Get User Profile by Appwrite User ID
```typescript
const profile = await tablesDB.listRows({
  databaseId: DATABASE_ID,
  tableId: USERS_COLLECTION_ID,
  queries: [
    Query.equal('userId', appwriteUserId),
    Query.limit(1)
  ]
});
```

### Get All Active User Profiles
```typescript
const activeProfiles = await tablesDB.listRows({
  databaseId: DATABASE_ID,
  tableId: USERS_COLLECTION_ID,
  queries: [
    Query.equal('status', 'active'),
    Query.orderDesc('lastActiveAt'),
    Query.limit(50)
  ]
});

// To get full user data, combine with Appwrite Auth:
const users = await Promise.all(
  activeProfiles.rows.map(async (profile) => {
    const appwriteUser = await account.get(profile.userId);
    return { ...appwriteUser, profile };
  })
);
```

### Get User Profiles by Role
```typescript
const adminProfiles = await tablesDB.listRows({
  databaseId: DATABASE_ID,
  tableId: USERS_COLLECTION_ID,
  queries: [
    Query.equal('role', 'admin'),
    Query.equal('status', 'active'),
    Query.orderAsc('$createdAt')
  ]
});
```

### Get Recently Active Users
```typescript
const recentUsers = await tablesDB.listRows({
  databaseId: DATABASE_ID,
  tableId: USERS_COLLECTION_ID,
  queries: [
    Query.greaterThan('lastActiveAt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    Query.orderDesc('lastActiveAt'),
    Query.limit(100)
  ]
});
```

### Search Users by Name or Email
```typescript
// Note: Name and email are in Appwrite Auth, not in this collection
// You need to search Appwrite Auth users, then get their profiles

// Option 1: Search Appwrite Auth (if supported by your Appwrite version)
const appwriteUsers = await account.list(); // Filter by search term if possible

// Option 2: Get all active profiles and filter by Appwrite user data
const activeProfiles = await tablesDB.listRows({
  databaseId: DATABASE_ID,
  tableId: USERS_COLLECTION_ID,
  queries: [
    Query.equal('status', 'active'),
    Query.limit(100)
  ]
});

const searchResults = await Promise.all(
  activeProfiles.rows.map(async (profile) => {
    const appwriteUser = await account.get(profile.userId);
    if (appwriteUser.name?.includes(searchTerm) || appwriteUser.email?.includes(searchTerm)) {
      return { ...appwriteUser, profile };
    }
    return null;
  })
).then(results => results.filter(Boolean));
```

### Get Users with Specific Label
```typescript
// Labels are in Appwrite Auth, not in this collection
// Get Appwrite users with label, then get their profiles

const appwriteUsers = await account.list();
const labeledUsers = appwriteUsers.users.filter(user => 
  user.labels?.includes('beta-tester')
);

const profiles = await Promise.all(
  labeledUsers.map(async (user) => {
    const profile = await getUserProfileByUserId(user.$id);
    return { ...user, profile };
  })
);
```

## Integration with Appwrite Auth

### Synchronization Strategy

1. **On User Registration**: Create extended user profile automatically (only store app-specific fields)
2. **On User Login**: Update `lastLoginAt` and `loginCount` in extended profile
3. **On User Activity**: Update `lastActiveAt` in extended profile
4. **Email/Name Changes**: These are managed in Appwrite Auth, no sync needed
5. **Email Verification**: Check `emailVerification` from Appwrite Auth when needed (don't store duplicate)

### Migration from Appwrite Auth

If you have existing Appwrite Auth users, create extended profiles for them:

```typescript
async function migrateExistingUsers(): Promise<void> {
  // Note: Requires admin access to list all users
  const appwriteUsers = await account.list(); // Admin API call
  
  for (const appwriteUser of appwriteUsers.users) {
    // Check if profile already exists
    const existingProfile = await getUserProfileByUserId(appwriteUser.$id);
    
    if (!existingProfile) {
      // Only create extended profile (email/name are in Appwrite)
      await createUserProfile(appwriteUser.$id);
    }
  }
}
```

## Best Practices

### Data Consistency
- Always reference Appwrite Auth user via `userId`
- Do NOT duplicate email, name, or labels (get from Appwrite Auth)
- Update `lastActiveAt` on user actions
- Track all changes in audit logs
- Use Appwrite's `prefs` for general preferences, this collection for app-specific settings

### Performance
- Index frequently queried fields (userId, role, status, lastActiveAt)
- Cache user profiles for active sessions
- Use pagination for user lists
- Batch update operations when possible
- For email/name searches, query Appwrite Auth first, then get profiles

### Security
- Never expose sensitive data in user profiles
- Validate all user inputs
- Use role-based access control
- Log all admin actions (role/status changes)

### Privacy
- Respect user privacy preferences
- Allow users to control visibility of their data
- Implement data export and deletion (GDPR compliance)
- Store minimal required information

## Common Use Cases

### User Profile Page
- Display user information
- Show activity stats (login count, last login)
- Allow profile updates (name, bio, preferences)
- Show user's content (blog posts, community posts)

### Admin User Management
- List all users with filtering
- View user details and activity
- Change user roles and status
- View user's audit logs

### Activity Tracking
- Track user login frequency
- Monitor active users
- Generate user activity reports
- Identify inactive accounts

### User Preferences
- Store UI preferences (theme, language)
- Store notification preferences
- Store display preferences (items per page, date format)
- Sync preferences across devices

## Future Enhancements

- **User Reputation System**: Points/badges based on contributions
- **User Groups**: Organize users into groups
- **User Following**: Follow other users
- **User Blocking**: Block specific users
- **User Verification**: Verified user badges
- **User Statistics**: Detailed activity analytics
- **User Export**: Export user data (GDPR compliance)
- **User Import**: Bulk user import from CSV
- **User Templates**: Pre-defined user profiles for different roles

## Related Documentation

- [APPWRITE_SETUP.md](./APPWRITE_SETUP.md) - Appwrite configuration
- [APPWRITE_DB_AUDIT_LOG.md](./APPWRITE_DB_AUDIT_LOG.md) - Audit log schema
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Overall system architecture
- [BLOG_MANAGEMENT.md](./BLOG_MANAGEMENT.md) - Blog system (user content)
- [COMMUNITY_MANAGEMENT.md](./COMMUNITY_MANAGEMENT.md) - Community system (user content)

