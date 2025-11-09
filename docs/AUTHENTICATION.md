# Authentication System Documentation

## Overview

My Console uses Appwrite's built-in authentication system for secure user management, combined with extended user profiles stored in the `users` collection. The authentication system provides login, registration, session management, rate limiting, and comprehensive audit logging.

## Architecture

### Authentication Flow

```
User → Login Form → Auth Context → Appwrite Auth → Session Created
                                              ↓
                                    User Profile Created/Updated
                                              ↓
                                    Audit Log Entry
                                              ↓
                                    Redirect to Dashboard
```

### Components

#### 1. Auth Context (`lib/auth-context.tsx`)
- **Purpose**: Centralized authentication state management
- **Features**:
  - User session management
  - Login/Logout/Registration functions
  - Rate limiting (10 seconds between login attempts)
  - Session validation (5 seconds between checks)
  - Automatic session refresh

#### 2. Login Page (`/` - `app/page.tsx`)
- **Component**: `components/app/login.tsx`
- **Features**:
  - Email/password authentication
  - Password visibility toggle
  - Rate limiting feedback
  - Error handling
  - Link to registration page
  - Theme toggle

#### 3. Registration Page (`/register` - `app/register/page.tsx`)
- **Component**: `components/app/register.tsx`
- **Features**:
  - User registration with email/password
  - Optional name field
  - Password confirmation
  - Password strength requirements (min 8 characters)
  - Automatic login after registration
  - User profile creation

#### 4. Profile Page (`/auth/profile` - `app/auth/profile/page.tsx`)
- **Component**: `components/app/auth/profile/`
- **Features**:
  - User profile overview and editing
  - Account settings integration
  - Teams display
  - Session statistics
  - **Email Verification**: Resend verification emails with callback handling
  - **Password Reset**: Forgot password flow (initiated from login page)
  - **Personal Activity Timeline**: Visual timeline of user-specific audit logs

#### 5. User Profile Management (`lib/user-profile.ts`)
- **Purpose**: Extended user profile operations
- **Features**:
  - Profile creation on first login/registration
  - Login statistics tracking
  - Activity tracking
  - Graceful handling of missing users table

#### 6. Password Reset (`/reset-password` - `app/reset-password/page.tsx`)
- **Features**:
  - Secure token-based password reset
  - URL parameters: `userId`, `secret`, `expire`
  - Password validation and confirmation
  - Audit logging for password reset events (success and failure)
  - Automatic redirect to login after success

#### 7. Personal Activity Timeline (`components/app/auth/profile/personal-activity-timeline.tsx`)
- **Purpose**: Display user-specific audit logs in a visual timeline format
- **Features**:
  - Fetches user-specific audit logs using `auditLogger.getUserAuditLogs()`
  - Visual timeline UI with continuous vertical line and activity nodes
  - Activity icons for different event types (login, logout, profile, email, password, security)
  - Badge variants based on action type
  - Expandable view (shows 5 by default, expandable to all)
  - Pagination with "load more" functionality
  - Tooltips for activity details and timestamps
  - Empty state with helpful messaging
  - Loading states with skeleton UI
  - Uses shadcn UI components (Card, ScrollArea, Badge, Avatar, Tooltip, Empty, etc.)

## Authentication Features

### Email Verification
- **Resend Verification**: Users can resend verification emails from the profile page
- **Verification Callback**: Handles email verification links with `userId` and `secret` parameters
- **Error Handling**: Comprehensive error handling for invalid/expired tokens, already verified accounts, and SMTP configuration issues
- **Audit Logging**: All verification events logged (`VERIFICATION_EMAIL_SENT`, `EMAIL_VERIFIED`)

### Password Reset
- **Forgot Password**: Users can request password reset from the login page
- **Reset Flow**: Secure token-based reset using Appwrite's recovery system
- **Reset Page**: Dedicated page (`/reset-password`) for completing password reset
- **Audit Logging**: All password reset events logged (`PASSWORD_RESET_REQUESTED`, `PASSWORD_RESET`, `PASSWORD_RESET_FAILED`)
- **Error Handling**: User-friendly error messages for invalid/expired tokens

### Personal Activity Timeline
- **User-Specific Logs**: Displays only the current user's audit log activities
- **Visual Timeline**: Proper timeline UI with continuous vertical line and activity nodes
- **Activity Types**: Supports all audit event types (login, logout, profile updates, email verification, password reset, security events)
- **Interactive UI**: Expandable view, pagination, tooltips, and hover effects
- **Real-Time Updates**: Fetches latest activities on component mount and page changes

### Login Process

1. **User submits credentials** via login form
2. **Rate limiting check** (10 seconds between attempts)
3. **Delete existing session** (if any)
4. **Create new session** via Appwrite
5. **Create/update user profile** in `users` collection
6. **Update login statistics** (lastLoginAt, loginCount)
7. **Log audit event** (USER_LOGIN)
8. **Redirect to dashboard**

### Registration Process

1. **User submits registration form** (email, password, optional name)
2. **Form validation** (password length, password match)
3. **Create Appwrite account** via `account.create()`
4. **Automatic login** after successful registration
5. **Create extended user profile** in `users` collection
6. **Update login statistics**
7. **Log audit event** (USER_REGISTERED)
8. **Redirect to dashboard**

### Logout Process

1. **User clicks logout**
2. **Log audit event** (USER_LOGOUT) before logout
3. **Delete current session** via Appwrite
4. **Clear local user state**
5. **Redirect to login page**

## Rate Limiting

### Client-Side Rate Limiting

- **Login Attempts**: 10 seconds between attempts (`LOGIN_RATE_LIMIT_MS`)
- **Auth Checks**: 5 seconds between checks (`CHECK_INTERVAL_MS`)
- **Purpose**: Prevent brute force attacks and reduce API calls

### Server-Side Rate Limiting

- **Appwrite Built-in**: Automatic rate limiting (429 errors)
- **Extended Limit**: 5 minutes when Appwrite rate limit is hit
- **Error Handling**: Clear user feedback with remaining time

### Rate Limit Implementation

```typescript
// Client-side rate limiting
const LOGIN_RATE_LIMIT_MS = 10000 // 10 seconds
const CHECK_INTERVAL_MS = 5000 // 5 seconds

// Check before login attempt
if (now - lastLoginAttempt < LOGIN_RATE_LIMIT_MS) {
  throw new Error(`Please wait ${remainingTime} seconds`)
}

// Handle Appwrite 429 errors
if (error.code === 429) {
  setLastLoginAttempt(now + 300000) // 5 minutes
  throw new Error('Too many login attempts. Please wait 5 minutes.')
}
```

## Session Management

### Session Lifecycle

1. **Session Creation**: On successful login via `account.createEmailPasswordSession()`
2. **Session Validation**: Automatic checks every 5 seconds via `account.get()`
3. **Session Storage**: Managed by Appwrite (localStorage by default)
4. **Session Deletion**: On logout via `account.deleteSession({ sessionId: 'current' })`

### Session Security

- **Secure Tokens**: Appwrite-managed session tokens
- **Automatic Refresh**: Session validated on each auth check
- **Session Cleanup**: Existing sessions deleted before new login
- **Logout Tracking**: All logout events logged in audit system

## User Profile Integration

### Profile Creation

User profiles are automatically created in the `users` collection:

- **On Registration**: Profile created after account creation
- **On First Login**: Profile created if it doesn't exist
- **On Subsequent Logins**: Profile updated with login statistics

### Profile Fields

The extended user profile stores:
- `userId`: Reference to Appwrite Auth user ID
- `role`: User role (user, admin, moderator)
- `status`: Account status (active, inactive, suspended, banned)
- `lastLoginAt`: Last login timestamp
- `lastActiveAt`: Last activity timestamp
- `loginCount`: Total number of logins
- Additional fields: avatar, bio, location, website, preferences, etc.

**Note**: Email, name, and labels are stored in Appwrite Auth, not duplicated in the `users` collection.

## Protected Routes

### Route Protection

All routes under `/auth/*` are protected by the `AuthLayout` component:

```typescript
// app/auth/layout.tsx
useEffect(() => {
  if (!loading && !user) {
    router.push('/')
  }
}, [loading, user, router])
```

### Access Control

- **Public Routes**: `/` (login), `/register`, `/pricing`
- **Protected Routes**: All routes under `/auth/*`
- **Admin Routes**: Additional checks for Super Admin team membership or admin label

## Error Handling

### Login Errors

- **Invalid Credentials**: Clear error message
- **Rate Limiting**: Time remaining feedback
- **Network Errors**: Graceful error handling
- **Failed Attempts**: Logged in audit system

### Registration Errors

- **Email Already Exists**: Appwrite error message
- **Password Too Short**: Client-side validation
- **Password Mismatch**: Client-side validation
- **Network Errors**: Graceful error handling

### Profile Creation Errors

- **Table Not Found**: Graceful fallback (doesn't block login)
- **Query Errors**: Fallback to client-side filtering
- **Creation Failures**: Logged but don't block authentication

## Audit Logging

### Login Events

- **Successful Login**: `USER_LOGIN` event with user ID, session info, user agent
- **Failed Login**: `FAILED_LOGIN_ATTEMPT` security event with email, error, user agent
- **Logout**: `USER_LOGOUT` event with user ID

### Registration Events

- **Successful Registration**: `USER_REGISTERED` event with user ID, email, name
- **Failed Registration**: `FAILED_REGISTRATION_ATTEMPT` security event

### Audit Event Structure

```typescript
{
  action: 'USER_LOGIN' | 'USER_LOGOUT' | 'USER_REGISTERED' | 'FAILED_LOGIN_ATTEMPT',
  resource: 'auth',
  resourceId: userId,
  userId: userId,
  metadata: {
    email?: string,
    userAgent?: string,
    ipAddress?: string,
    sessionId?: string,
    error?: string
  }
}
```

## Security Features

### Password Security

- **Minimum Length**: 8 characters (registration)
- **Password Visibility**: Toggle for better UX
- **Password Confirmation**: Required on registration
- **No Password Storage**: Passwords managed by Appwrite (hashed)

### Session Security

- **Secure Tokens**: Appwrite-managed session tokens
- **Automatic Expiration**: Managed by Appwrite
- **Session Validation**: Regular checks for session validity
- **Multiple Sessions**: Can be managed via sessions page

### Rate Limiting

- **Client-Side**: 10 seconds between login attempts
- **Server-Side**: Appwrite automatic rate limiting
- **Extended Limits**: 5 minutes when server limit hit
- **Clear Feedback**: User-friendly error messages

### Audit Trail

- **All Auth Events**: Logged in audit system
- **Failed Attempts**: Tracked for security monitoring
- **User Activity**: Login counts and timestamps tracked
- **Security Events**: Failed login/registration attempts logged

## Implementation Details

### Auth Context Usage

```typescript
import { useAuth } from '@/lib/auth-context'

function MyComponent() {
  const { user, loading, isAuthenticated, login, logout, register } = useAuth()
  
  // Check authentication status
  if (loading) return <Loading />
  if (!isAuthenticated) return <LoginPrompt />
  
  // Use user data
  return <div>Welcome, {user?.email}</div>
}
```

### Login Implementation

```typescript
// components/app/login.tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  try {
    await login(email, password)
    
    // Get current user
    const currentUser = await account.get()
    
    // Update profile and stats
    await updateLoginStats(currentUser.$id)
    
    // Log audit event
    await auditLogger.logUserLogin(currentUser.$id, ...)
    
    // Redirect
    window.location.href = '/auth/dashboard'
  } catch (error) {
    // Handle error
    setError(error.message)
  }
}
```

### Registration Implementation

```typescript
// components/app/register.tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  // Validation
  if (password.length < 8) {
    setError('Password must be at least 8 characters')
    return
  }
  
  if (password !== confirmPassword) {
    setError('Passwords do not match')
    return
  }
  
  try {
    // Register (automatically logs in)
    await register(email, password, name)
    
    // Get current user
    const currentUser = await account.get()
    
    // Create profile and update stats
    await updateLoginStats(currentUser.$id)
    
    // Log audit event
    await auditLogger.log({ action: 'USER_REGISTERED', ... })
    
    // Redirect
    window.location.href = '/auth/dashboard'
  } catch (error) {
    // Handle error
    setError(error.message)
  }
}
```

## User Profile Management

### Profile Creation

```typescript
// lib/user-profile.ts
export async function createUserProfile(appwriteUserId: string): Promise<UserProfile> {
  const appwriteUser = await account.get()
  
  const userProfile = await tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: USERS_COLLECTION_ID,
    rowId: ID.unique(),
    data: {
      userId: appwriteUserId,
      role: 'user',
      status: 'active',
      loginCount: 0,
      notificationsEnabled: true,
      twoFactorEnabled: false
    }
  })
  
  return userProfile as unknown as UserProfile
}
```

### Login Statistics Update

```typescript
export async function updateLoginStats(userId: string): Promise<void> {
  const userProfile = await getUserProfileByUserId(userId)
  
  if (userProfile) {
    // Update existing profile
    await tablesDB.updateRow({
      databaseId: DATABASE_ID,
      tableId: USERS_COLLECTION_ID,
      rowId: userProfile.$id,
      data: {
        lastLoginAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        loginCount: (userProfile.loginCount || 0) + 1
      }
    })
  } else {
    // Create new profile
    await createUserProfile(userId)
    // Then update stats
  }
}
```

## Translation Keys

### Authentication Keys

All authentication-related text uses translation keys:

- `auth.welcome_back` - Welcome message
- `auth.login_prompt` - Login instructions
- `auth.sign_in` - Sign in button
- `auth.sign_up` - Sign up link
- `auth.create_account` - Create account button
- `auth.email` - Email label
- `auth.password` - Password label
- `auth.confirm_password` - Confirm password label
- `auth.password_requirements` - Password requirements text
- `auth.password_too_short` - Password too short error
- `auth.passwords_dont_match` - Password mismatch error
- `auth.login_successful` - Success message
- `auth.login_failed` - Error message
- `auth.registration_successful` - Registration success
- `auth.registration_failed` - Registration error
- `auth.logout` - Logout button
- `auth.logout_success` - Logout success message
- `auth.already_logged_in` - Already logged in message
- `auth.go_to_dashboard` - Dashboard link

## Environment Variables

### Required Variables

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://appwrite.hafizbahtiar.com/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=console-db
```

## Troubleshooting

### Common Issues

#### 1. "Users table does not exist"
**Solution**: Create the `users` table in Appwrite Console following [APPWRITE_DB_USERS.md](./APPWRITE_DB_USERS.md). The application will work without it, but profiles won't be created until the table exists.

#### 2. "Invalid query: Syntax error"
**Solution**: The query syntax might be incorrect or the table doesn't exist. The code includes a fallback to client-side filtering. Ensure the `users` table is created with proper indexes.

#### 3. "Rate limit exceeded"
**Solution**: Wait for the rate limit period to expire. Client-side: 10 seconds. Server-side: 5 minutes if Appwrite rate limit is hit.

#### 4. "Session expired"
**Solution**: User needs to log in again. Sessions are managed by Appwrite and expire based on Appwrite configuration.

#### 5. "CORS errors"
**Solution**: Configure CORS in Appwrite Console (Settings > Platforms). Add your domain (e.g., `http://localhost:3000`) to allowed origins.

### Debug Tips

1. **Check Browser Console**: Look for error messages and warnings
2. **Check Appwrite Console**: Verify user exists and sessions are created
3. **Check Network Tab**: Inspect API requests and responses
4. **Check Audit Logs**: View authentication events in `/auth/audit`
5. **Check User Profile**: Verify profile exists in `users` collection

## Best Practices

### Security

1. **Never store passwords**: Always use Appwrite Auth for password management
2. **Use HTTPS**: Always use HTTPS in production
3. **Rate Limiting**: Respect rate limits to prevent abuse
4. **Session Management**: Always delete sessions on logout
5. **Audit Logging**: Log all authentication events for security monitoring

### User Experience

1. **Clear Error Messages**: Provide user-friendly error messages
2. **Loading States**: Show loading indicators during authentication
3. **Success Feedback**: Confirm successful login/registration
4. **Password Visibility**: Allow users to toggle password visibility
5. **Form Validation**: Validate inputs before submission

### Performance

1. **Rate Limiting**: Prevent excessive API calls
2. **Session Caching**: Cache user data to reduce API calls
3. **Lazy Loading**: Load user profile data on demand
4. **Error Handling**: Don't block authentication if profile creation fails

## Future Enhancements

- **Email Verification**: Verify email addresses on registration
- **Password Reset**: Forgot password functionality
- **Two-Factor Authentication**: 2FA support (field exists in profile)
- **Social Login**: OAuth providers (Google, GitHub, etc.)
- **Remember Me**: Persistent sessions across browser restarts
- **Session Management**: View and manage active sessions
- **Account Lockout**: Lock accounts after multiple failed attempts
- **Password Strength Meter**: Visual password strength indicator

## Related Documentation

- [APPWRITE_SETUP.md](./APPWRITE_SETUP.md) - Appwrite configuration
- [APPWRITE_DB_USERS.md](./APPWRITE_DB_USERS.md) - User profiles schema
- [APPWRITE_DB_AUDIT_LOG.md](./APPWRITE_DB_AUDIT_LOG.md) - Audit logging
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Overall system architecture
- [I18N_SETUP.md](./I18N_SETUP.md) - Internationalization

