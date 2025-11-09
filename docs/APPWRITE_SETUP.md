# Appwrite Integration Setup

## Prerequisites

1. **Install Appwrite SDK**:
   ```bash
   bun add appwrite
   # or
   npm install appwrite
   ```

2. **Environment Variables**:
   Create a `.env.local` file in your project root with the following variables:

   ```env
   NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
   NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   NEXT_PUBLIC_APPWRITE_DATABASE_ID=console-db
   NEXT_PUBLIC_APPWRITE_BUCKET_ID=default
   OPENROUTER_API_KEY=your_openrouter_api_key  # Optional, for AI features
   ```

   Replace the values with your actual Appwrite project details from your Appwrite console.

   **Note**: All database and collection IDs are centralized in `lib/appwrite.ts`. When using Appwrite in your code, import the constants instead of defining them locally:
   ```typescript
   import { 
     DATABASE_ID, 
     BLOG_POSTS_COLLECTION_ID,
     BLOG_CATEGORIES_COLLECTION_ID,
     // ... other collection IDs
   } from '@/lib/appwrite'
   ```

## Appwrite Project Setup

1. **Create an Appwrite account** at [appwrite.io](https://appwrite.io)
2. **Create a new project** in your Appwrite console
3. **Get your project ID** from the project settings
4. **Configure authentication**:
   - Go to Authentication → Settings
   - Enable Email/Password authentication
   - Configure any additional auth methods you need

## Database Setup

### Create Database
1. Go to **Database** in your Appwrite console
2. Click **Create Database**
3. Set Database ID: `console-db`
4. Set Database Name: `Console Database`

### Setup Collections

After creating the database, set up the required collections:

1. **[Audit Logs Collection](APPWRITE_DB_AUDIT_LOG.md)** - Essential for tracking user activities and security events
2. **[Users Collection](APPWRITE_DB_USERS.md)** - Extended user profiles, preferences, and activity tracking
3. **[Blog System Collections](BLOG_MANAGEMENT.md)** - Complete blog management with rich text editor
   - `blog_posts` - Main content storage
   - `blog_categories` - Content categorization
   - `blog_tags` - Content tagging system
   - `blog_views` - Detailed view analytics (see setup guide below)
   - `blog_likes` - User engagement tracking (see setup guide below)
4. **[Community System Collections](COMMUNITY_MANAGEMENT.md)** - Community discussion platform
   - `community_posts` - Discussion posts
   - `community_topics` - Discussion topics/categories
   - `community_replies` - Threaded replies
   - `community_votes` - User votes

### Optional: Additional Collections

You may also want to create these collections for a complete console setup:

1. **System Settings** (`system_settings`)
   - Application configuration
   - Feature flags

2. **Notifications** (`notifications`)
   - User notifications and alerts

## Current Implementation Status

### ✅ Authentication System
- **Login Form**: Complete with rate limiting (10s between attempts)
- **Registration Form**: User registration with profile creation
- **Session Management**: Automatic session validation and refresh (5s intervals)
- **Protected Routes**: Dashboard and admin routes with auth guards
- **Logout**: Secure session termination with audit logging
- **User Profiles**: Extended profiles in `users` collection
- **Login Statistics**: Automatic tracking of login counts and timestamps
- **Error Handling**: Comprehensive error messages and user feedback
- **Security Events**: Failed login/registration attempt tracking
- **Rate Limiting**: Client-side (10s) and server-side (5min) protection

See [AUTHENTICATION.md](./AUTHENTICATION.md) for complete authentication documentation.

### ✅ Audit Logging System
- **Comprehensive Logging**: All authentication and user actions tracked
- **Rate Limiting**: 500ms between log writes, 1s between reads
- **Predefined Events**: Login, logout, profile updates, security events
- **Data Storage**: JSON serialization for complex data types
- **Query Interface**: Recent logs and user-specific log retrieval
- **Performance**: Client-side filtering and sorting

### ✅ Database Integration
- **Tables API**: Using Appwrite Tables for structured data
- **Type Safety**: Full TypeScript integration
- **Error Recovery**: Graceful handling of database failures
- **Singleton Pattern**: Centralized audit logger instance

## Usage

### Authentication Flow
1. **Login**: User visits `/` and enters credentials
2. **Validation**: Appwrite validates email/password with rate limiting
3. **Audit Logging**: Successful logins are recorded with session info
4. **Redirect**: User redirected to `/auth/dashboard`
5. **Failed Attempts**: Failed logins trigger security event logging

### Audit Logging Usage

#### Automatic Logging
The system automatically logs:
- User login/logout events
- Failed authentication attempts
- Profile updates (when implemented)
- Security events

#### Manual Logging
```typescript
import { auditLogger } from '@/lib/audit-log'

// Log custom events
await auditLogger.logSecurityEvent(userId, 'SUSPICIOUS_ACTIVITY', {
  reason: 'Multiple failed login attempts',
  ipAddress: '192.168.1.1'
})

// Log system events
await auditLogger.logSystemEvent('BACKUP_COMPLETED', 'backup', {
  duration: '2.5s',
  size: '1.2GB'
})
```

#### Querying Audit Logs
```typescript
import { auditLogger } from '@/lib/audit-log'

// Get user's recent activity
const userLogs = await auditLogger.getUserAuditLogs(userId, 50)

// Get recent system activity
const recentLogs = await auditLogger.getRecentLogs(100)
```

### Protected Routes
All routes under `/auth/` require authentication and automatically redirect unauthenticated users to the login page.

### Rate Limiting
- **Authentication**: 3-second cooldown between login attempts
- **Audit Writes**: 500ms minimum interval between log entries
- **Audit Reads**: 1-second minimum interval between queries

## Implementation Files

```
├── lib/
│   ├── appwrite.ts              # Appwrite client & Tables API setup
│   ├── auth-context.tsx         # Authentication context with rate limiting
│   ├── audit-log.ts             # Comprehensive audit logging system
│   └── language-context.tsx     # Internationalization context
├── components/app/
│   ├── login.tsx                # Login form with audit logging
│   ├── auth/
│   │   ├── sidebar-nav.tsx      # Navigation with translations
│   │   └── dashboard/
│   │       └── audit-activity.tsx # Audit log display component
├── app/
│   ├── layout.tsx               # Root layout with all providers
│   ├── page.tsx                 # Public login page
│   └── auth/                    # Protected application routes
│       ├── layout.tsx           # Auth layout with navigation
│       ├── dashboard/page.tsx   # Main dashboard
│       ├── audit/page.tsx       # Audit log viewer
│       ├── profile/page.tsx     # User profile management
│       ├── sessions/page.tsx    # Session management
│       └── settings/page.tsx    # Application settings
```

## Next Steps

### ✅ Completed
- [x] Authentication system with rate limiting
- [x] [Audit logging infrastructure](APPWRITE_DB_AUDIT_LOG.md)
- [x] Internationalization setup
- [x] Basic dashboard and navigation
- [x] Appwrite Tables integration
- [x] Comprehensive error handling
- [x] **Email Verification**: Resend verification emails and callback handling
- [x] **Password Reset**: Email-based password recovery with secure token flow
- [x] **Personal Activity Timeline**: User-specific activity timeline on profile page
- [x] **Session Management**: Complete session management with details and activity timeline

### 🔄 Ready for Implementation
- [ ] **Social Login**: Google, GitHub OAuth integration
- [ ] **Two-Factor Authentication**: Complete 2FA implementation (UI toggle exists)
- [ ] **Account Deletion**: User account deletion with data export (GDPR compliance)
- [ ] **Email Change**: Allow users to change their email address
- [ ] **Avatar Upload**: Profile picture upload functionality
- [ ] **Real-time Updates**: Live audit log updates
- [ ] **Advanced Security**: MFA, session management

## Troubleshooting

- **"AppwriteException: Invalid credentials"**: Check your email/password and ensure the user exists in Appwrite
- **"Project not found"**: Verify your project ID in environment variables
- **Connection issues**: Check your Appwrite endpoint URL

## Additional Resources

- [Audit Logs Collection Setup](APPWRITE_DB_AUDIT_LOG.md) - Detailed audit logging configuration
- [Blog Management System](BLOG_MANAGEMENT.md) - Complete blog CMS with rich text editor and analytics setup
- [TipTap Components](TIPTAP_COMPONENTS.md) - Rich text editor documentation and API
- [Nice to Have Features](NICE_TO_HAVE.md) - Future enhancement roadmap and wishlist
- [Database Administration](DATABASE_ADMIN.md) - Backup and monitoring features
- [Appwrite Documentation](https://appwrite.io/docs)
- [Next.js Authentication Guide](https://nextjs.org/docs/authentication)
- [Appwrite JavaScript SDK](https://github.com/appwrite/sdk-for-js)
