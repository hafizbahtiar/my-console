# Internationalization (i18n) Setup Guide

## Overview

This application supports multiple languages through a JSON-based translation system. Currently, the following languages are supported:

- **English (en)** - Default language
- **Malay (ms)** - Bahasa Malaysia

## Status

✅ **Complete**: All 19 pages have been fully internationalized with:
- Multi-language support (English & Malay)
- Skeleton loading states to prevent raw keys
- Component separation for maintainability
- Root-level key usage for common terms
- Translation preloading for smooth language switching

## Locale File Structure

Translation files are located in `public/locales/{language}/common.json`.

```
public/locales/
├── en/
│   └── common.json     # English translations
└── ms/
    └── common.json     # Malay translations
```

## Translation Key Access Pattern

### Dot Notation for Nested Keys

Translation keys use **dot notation** to access nested properties in the JSON structure. The dot (`.`) is used as a separator to traverse through nested objects.

### Examples

#### Simple Keys
```typescript
// Accessing top-level keys
t('title')           // Returns: "Title" (en) or "Tajuk" (ms)
t('description')     // Returns: "Description" (en) or "Penerangan" (ms)
t('save')            // Returns: "Save" (en) or "Simpan" (ms)
```

#### Nested Keys (Single Level)
```typescript
// Accessing nested keys under login_page
t('login_page.welcome_back')                    // Returns: "Welcome back" (en) or "Selamat kembali" (ms)
t('login_page.enter_credentials')              // Returns: "Enter your credentials to access your account" (en) or "Masukkan maklumat masuk anda untuk mengakses akaun anda" (ms)
t('login_page.sign_in')                         // Returns: "Sign in" (en) or "Log masuk" (ms)
t('login_page.login_success')                   // Returns: "Login successful!" (en) or "Berjaya log masuk!" (ms)
t('login_page.login_failed')                    // Returns: "Login failed" (en) or "Log masuk gagal" (ms)

// Accessing nested keys under register_page
t('register_page.create_account')               // Returns: "Create Account" (en) or "Cipta Akaun" (ms)
t('register_page.confirm_password')             // Returns: "Confirm Password" (en) or "Sahkan Kata Laluan" (ms)
t('register_page.password_min_length')          // Returns: "Must be at least 8 characters long" (en) or "Mesti sekurang-kurangnya 8 aksara" (ms)

// Accessing nested keys under sidebar
t('sidebar.dashboard')                          // Returns: "Dashboard" (en) or "Papan Pemuka" (ms)
t('sidebar.audit_logs')                        // Returns: "Audit Logs" (en) or "Log Audit" (ms)
t('sidebar.blog_management')                    // Returns: "Blog Management" (en) or "Pengurusan Blog" (ms)
```

### Template Variables

Some translation keys support template variables using double curly braces `{{variable}}`:

```typescript
// Template variables in translations
t('add_item', { item: 'Post' })        // Returns: "Add Post" (en) or "Tambah Post" (ms)
t('remove_item', { item: 'Category' }) // Returns: "Remove Category" (en) or "Buang Category" (ms)
t('edit_item', { item: 'Tag' })       // Returns: "Edit Tag" (en) or "Sunting Tag" (ms)
t('save_item', { item: 'Settings' })  // Returns: "Save Settings" (en) or "Simpan Settings" (ms)

// Form field templates
t('enter_field', { field: 'Email' })           // Returns: "Enter Email" (en) or "Masukkan Email" (ms)
t('required_field', { field: 'Name' })         // Returns: "Name is required" (en) or "Nama wajib diisi" (ms)
```

## Current Translation Keys

### Basic Actions
- `title`, `description`, `content`
- `add`, `add_item`, `remove`, `remove_item`
- `cancel`, `save`, `save_item`, `refresh`
- `loading`, `back`, `next`, `previous`, `continue`
- `choose`, `choose_item`, `close`
- `edit`, `edit_item`, `delete`, `delete_item`
- `confirm`

### Status Labels
- `active`, `inactive`
- `public`, `private`
- `published`, `draft`, `archived`
- `pending`, `approved`, `rejected`
- `deleted`, `cancelled`, `completed`, `in_progress`

### Form Fields
- `name`, `email`, `phone`, `address`
- `city`, `state`, `zip`, `country`
- `password`
- `enter_field`, `required_field`
- `profile`, `settings`, `database`

### Login Page
- `login_page.welcome_back`
- `login_page.already_logged_in` (with `{{email}}` template)
- `login_page.go_to_dashboard`
- `login_page.enter_credentials`
- `login_page.remember_me`
- `login_page.forgot_password`
- `login_page.sign_in`
- `login_page.sign_up`
- `login_page.no_account`
- `login_page.login_success`
- `login_page.login_failed`

### Register Page
- `register_page.create_account`
- `register_page.create_account_description`
- `register_page.confirm_password`
- `register_page.password_min_length`
- `register_page.password_too_short`
- `register_page.passwords_no_match`
- `register_page.registration_success`
- `register_page.registration_failed`
- `register_page.already_have_account`

### Sidebar Navigation
- `sidebar.app_name`
- `sidebar.admin_panel`
- `sidebar.main_navigation`
- `sidebar.administration`
- `sidebar.blog_management`
- `sidebar.community_management`
- `sidebar.developer`
- `sidebar.dashboard`
- `sidebar.audit_logs`
- `sidebar.active_sessions`
- `sidebar.security`
- `sidebar.analytics`
- `sidebar.blog_categories`
- `sidebar.blog_tags`
- `sidebar.blog_posts`
- `sidebar.community_posts`
- `sidebar.community_topics`
- `sidebar.api_keys`
- `sidebar.documentation`

### Settings Page
- `settings_page.title`
- `settings_page.description`
- `settings_page.appearance.title`
- `settings_page.appearance.description`
- `settings_page.appearance.theme`
- `settings_page.appearance.theme_description`
- `settings_page.appearance.primary_color`
- `settings_page.appearance.primary_color_description`
- `settings_page.appearance.primary_color_placeholder`
- `settings_page.appearance.primary_color_updated`
- `settings_page.appearance.language_description`
- `settings_page.appearance.language_updated`
- `settings_page.appearance.languages.en`
- `settings_page.appearance.languages.ms`
- `settings_page.appearance.colors.*` (default, blue, green, purple, red, orange, pink, cyan, amber)
- `settings_page.notifications.title`
- `settings_page.notifications.description`
- `settings_page.notifications.push_notifications`
- `settings_page.notifications.push_notifications_description`
- `settings_page.notifications.email_updates`
- `settings_page.notifications.email_updates_description`
- `settings_page.security.title`
- `settings_page.security.description`
- `settings_page.security.two_factor_auth`
- `settings_page.security.two_factor_auth_description`
- `settings_page.security.change_password`
- `settings_page.security.change_password_description`
- `settings_page.security.change_password_dialog_title`
- `settings_page.security.change_password_dialog_description`
- `settings_page.security.current_password`
- `settings_page.security.current_password_placeholder`
- `settings_page.security.new_password`
- `settings_page.security.new_password_requirements`
- `settings_page.security.new_password_placeholder`
- `settings_page.security.confirm_password`
- `settings_page.security.confirm_password_placeholder`
- `settings_page.security.updating`
- `settings_page.security.current_password_required`
- `settings_page.security.passwords_no_match`
- `settings_page.security.password_length_error`
- `settings_page.security.password_weak_error`
- `settings_page.security.password_same_error`
- `settings_page.security.password_change_failed`
- `settings_page.security.password_incorrect`
- `settings_page.security.password_invalid_format`
- `settings_page.security.password_change_success`
- `settings_page.connection_test.title`
- `settings_page.connection_test.description`
- `settings_page.connection_test.test_button`
- `settings_page.connection_test.test_description`
- `settings_page.connection_test.testing`
- `settings_page.connection_test.connected`
- `settings_page.connection_test.connection_failed`
- `settings_page.connection_test.connection_success`
- `settings_page.connection_test.endpoint`
- `settings_page.connection_test.project_id`
- `settings_page.connection_test.connection_logs`

## Implementation Pattern

### Usage in Components

```typescript
// In a React component
import { useTranslation } from '@/lib/language-context'
import { Skeleton } from '@/components/ui/skeleton'

function MyComponent() {
  const { t, language, setLanguage, loading } = useTranslation()
  
  // Show skeleton while translations are loading
  if (loading) {
    return (
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>
    )
  }
  
  return (
    <div>
      <h1 suppressHydrationWarning>{t('title')}</h1>
      <button>{t('save')}</button>
      <p suppressHydrationWarning>{t('login_page.enter_credentials')}</p>
      
      {/* With template variables */}
      <button>{t('add_item', { item: 'Post' })}</button>
      <p suppressHydrationWarning>{t('login_page.already_logged_in', { email: user.email })}</p>
      
      {/* Language switcher - setLanguage is async */}
      <select value={language} onChange={(e) => setLanguage(e.target.value as 'en' | 'ms')}>
        <option value="en">{t('settings_page.appearance.languages.en')}</option>
        <option value="ms">{t('settings_page.appearance.languages.ms')}</option>
      </select>
    </div>
  )
}
```

### Important Notes

- **Hydration Safety**: Use `suppressHydrationWarning` on elements that display translations to prevent hydration mismatches
- **Client-Side Only**: The translation system is client-side only and uses `"use client"` directive
- **Cache Busting**: Translation files use cache busting to ensure fresh translations are loaded
- **Loading States**: Show skeleton UI while `loading === true` to prevent raw keys from appearing
- **Language Switching**: Translations are preloaded before switching to prevent showing raw keys
- **Async setLanguage**: The `setLanguage` function is async and preloads translations before switching

## Language Detection Flow

1. **Browser Detection**: Check `navigator.language`
2. **LocalStorage**: Load saved preference
3. **Fallback**: Default to English (`en`)
4. **Persistence**: Save changes to `localStorage`

## Adding New Translations

### Steps to Add New Translation Keys

1. **Add to English file** (`public/locales/en/common.json`):
   ```json
   {
     "new_key": "New Translation",
     "nested": {
       "deep_key": "Deep Translation"
     }
   }
   ```

2. **Add to Malay file** (`public/locales/ms/common.json`):
   ```json
   {
     "new_key": "Terjemahan Baru",
     "nested": {
       "deep_key": "Terjemahan Mendalam"
     }
   }
   ```

3. **Access in code**:
   ```typescript
   t('new_key')                    // Simple key
   t('nested.deep_key')           // Nested key with dot notation
   ```

### Best Practices

- **Keep keys descriptive**: Use clear, descriptive key names
- **Organize by feature**: Group related translations under nested objects
- **Use consistent naming**: Follow the existing naming conventions
- **Maintain both languages**: Always update both `en` and `ms` files
- **Test template variables**: Ensure template variables work in both languages

## JSON Structure Example

```json
{
  "title": "Title",
  "save": "Save",
  "profile": "Profile",
  "settings": "Settings",
  "database": "Database",
  "login_page": {
    "welcome_back": "Welcome back",
    "already_logged_in": "You are already logged in as {{email}}",
    "enter_credentials": "Enter your credentials to access your account",
    "sign_in": "Sign in",
    "login_success": "Login successful!",
    "login_failed": "Login failed"
  },
  "register_page": {
    "create_account": "Create Account",
    "confirm_password": "Confirm Password",
    "password_min_length": "Must be at least 8 characters long",
    "registration_success": "Registration successful!"
  },
  "sidebar": {
    "app_name": "My Console",
    "admin_panel": "Admin Panel",
    "dashboard": "Dashboard",
    "audit_logs": "Audit Logs",
    "blog_management": "Blog Management"
  }
}
```

Access patterns:
- `t('title')` → "Title"
- `t('save')` → "Save"
- `t('profile')` → "Profile"
- `t('login_page.welcome_back')` → "Welcome back"
- `t('login_page.already_logged_in', { email: 'user@example.com' })` → "You are already logged in as user@example.com"
- `t('register_page.create_account')` → "Create Account"
- `t('sidebar.dashboard')` → "Dashboard"

## Implementation Details

### Current Status
✅ **Fully Implemented**: The translation system is fully functional and integrated into the application.

### Key Features
- ✅ **Client-Side Translation System**: Implemented in `lib/language-context.tsx`
- ✅ **Hydration Safe**: Uses `suppressHydrationWarning` to prevent React hydration mismatches
- ✅ **Cache Busting**: Translation files use cache busting to ensure fresh translations
- ✅ **Service Worker**: Caching disabled - all requests pass through to network for fresh translations
- ✅ **Browser Language Detection**: Automatically detects user's browser language
- ✅ **LocalStorage Persistence**: Saves language preference to localStorage
- ✅ **Fallback Support**: Missing translations gracefully fallback to English
- ✅ **Template Variables**: Supports `{{variable}}` syntax for dynamic translations
- ✅ **Preloading**: Translations are preloaded before language switching to prevent raw keys
- ✅ **Skeleton Loading**: Components show skeleton UI while translations load
- ✅ **Smooth Language Switching**: Old translations remain visible while new ones load

### Components Using Translations (19/19 Pages Complete)

#### Authentication Pages
- ✅ Login Form (`components/app/login.tsx`)
- ✅ Register Form (`components/app/register/register.tsx`)
- ✅ Auth Layout (`app/auth/layout.tsx`)

#### Navigation & Settings
- ✅ Sidebar Navigation (`components/app/auth/sidebar-nav.tsx`)
- ✅ Settings Page (`app/auth/settings/page.tsx`)
  - ✅ Appearance Settings (`components/app/auth/settings/appearance-settings.tsx`)
  - ✅ Notification Settings (`components/app/auth/settings/notification-settings.tsx`)
  - ✅ Security Settings (`components/app/auth/settings/security-settings.tsx`)
  - ✅ Connection Test (`components/app/auth/settings/connection-test.tsx`)

#### User Management
- ✅ Profile Page (`app/auth/profile/page.tsx`)
  - ✅ Profile Overview (`components/app/auth/profile/profile-overview.tsx`)
  - ✅ Account Settings Form (`components/app/auth/profile/account-settings-form.tsx`)
  - ✅ Account Statistics (`components/app/auth/profile/account-statistics.tsx`)
  - ✅ Teams Section (`components/app/auth/profile/teams-section.tsx`)

#### Dashboard & Analytics
- ✅ Dashboard Page (`app/auth/dashboard/page.tsx`)
  - ✅ Welcome Header (`components/app/auth/dashboard/welcome-header.tsx`)
  - ✅ Stats Cards (`components/app/auth/dashboard/stats-cards.tsx`)
  - ✅ User Profile Card (`components/app/auth/dashboard/user-profile-card.tsx`)
  - ✅ Quick Actions Card (`components/app/auth/dashboard/quick-actions-card.tsx`)
  - ✅ Activity Chart (`components/app/auth/dashboard/activity-chart.tsx`)
  - ✅ Content Distribution Chart (`components/app/auth/dashboard/content-distribution-chart.tsx`)

#### Audit & Security
- ✅ Audit Page (`app/auth/audit/page.tsx`)
  - ✅ Audit Stats (`components/app/auth/audit/audit-stats.tsx`)
  - ✅ Audit Filters (`components/app/auth/audit/audit-filters.tsx`)
  - ✅ Audit Table (`components/app/auth/audit/audit-table.tsx`)
- ✅ Sessions Page (`app/auth/sessions/page.tsx`)
  - ✅ Security Alert (`components/app/auth/sessions/security-alert.tsx`)
  - ✅ Current Session Card (`components/app/auth/sessions/current-session-card.tsx`)
  - ✅ Other Sessions List (`components/app/auth/sessions/other-sessions-list.tsx`)
  - ✅ Sessions Stats (`components/app/auth/sessions/sessions-stats.tsx`)
- ✅ Admin Security Page (`app/auth/admin/security/page.tsx`)
  - ✅ Security Header (`components/app/auth/admin/security/security-header.tsx`)
  - ✅ Security Overview Cards (`components/app/auth/admin/security/security-overview-cards.tsx`)
  - ✅ Recent Alerts Card (`components/app/auth/admin/security/recent-alerts-card.tsx`)
  - ✅ Security Status Card (`components/app/auth/admin/security/security-status-card.tsx`)
  - ✅ Block IP Form (`components/app/auth/admin/security/block-ip-form.tsx`)
  - ✅ Blocked IPs List (`components/app/auth/admin/security/blocked-ips-list.tsx`)
  - ✅ Security Events List (`components/app/auth/admin/security/security-events-list.tsx`)

#### Database Administration
- ✅ Database Admin Page (`app/auth/admin/database/page.tsx`)
  - ✅ Database Overview (`components/app/auth/admin/database/database-overview.tsx`)
  - ✅ Database Collections (`components/app/auth/admin/database/database-collections.tsx`)
  - ✅ Database Backups (`components/app/auth/admin/database/database-backups.tsx`)
  - ✅ Database Performance (`components/app/auth/admin/database/database-performance.tsx`)

#### Blog Management
- ✅ Blog Categories Page (`app/auth/blog/blog-categories/page.tsx`)
  - ✅ Categories Table (`components/app/auth/blog/blog-categories/categories-table.tsx`)
  - ✅ Create Category Dialog (`components/app/auth/blog/blog-categories/create-category-dialog.tsx`)
  - ✅ Edit Category Dialog (`components/app/auth/blog/blog-categories/edit-category-dialog.tsx`)
  - ✅ Delete Category Dialog (`components/app/auth/blog/blog-categories/delete-category-dialog.tsx`)
- ✅ Blog Tags Page (`app/auth/blog/blog-tags/page.tsx`)
  - ✅ Tags Table (`components/app/auth/blog/blog-tags/tags-table.tsx`)
  - ✅ Create Tag Dialog (`components/app/auth/blog/blog-tags/create-tag-dialog.tsx`)
  - ✅ Edit Tag Dialog (`components/app/auth/blog/blog-tags/edit-tag-dialog.tsx`)
  - ✅ Delete Tag Dialog (`components/app/auth/blog/blog-tags/delete-tag-dialog.tsx`)
- ✅ Blog Posts List Page (`app/auth/blog/blog-posts/page.tsx`)
  - ✅ Posts Filters (`components/app/auth/blog/blog-posts/posts-filters.tsx`)
  - ✅ Posts Table (`components/app/auth/blog/blog-posts/posts-table.tsx`)
  - ✅ View Post Dialog (`components/app/auth/blog/blog-posts/view-post-dialog.tsx`)
  - ✅ Delete Post Dialog (`components/app/auth/blog/blog-posts/delete-post-dialog.tsx`)
- ✅ Blog Post Create Page (`app/auth/blog/blog-posts/create/page.tsx`)
  - ✅ Breadcrumb Nav (`components/app/auth/blog/blog-posts/create/breadcrumb-nav.tsx`)
  - ✅ Progress Indicator (`components/app/auth/blog/blog-posts/create/progress-indicator.tsx`)
  - ✅ Basic Info Section (`components/app/auth/blog/blog-posts/create/basic-info-section.tsx`)
  - ✅ Publishing Settings (`components/app/auth/blog/blog-posts/create/publishing-settings.tsx`)
  - ✅ Tags Section (`components/app/auth/blog/blog-posts/create/tags-section.tsx`)
  - ✅ SEO Settings (`components/app/auth/blog/blog-posts/create/seo-settings.tsx`)
- ✅ Blog Post Edit Page (`app/auth/blog/blog-posts/[id]/edit/page.tsx`)
  - ✅ Edit Breadcrumb Nav (`components/app/auth/blog/blog-posts/create/edit-breadcrumb-nav.tsx`)
  - ✅ (Reuses create page components)
- ✅ Blog Post View Page (`app/auth/blog/blog-posts/[id]/page.tsx`)
  - ✅ View Breadcrumb Nav (`components/app/auth/blog/blog-posts/view/view-breadcrumb-nav.tsx`)
  - ✅ View Header (`components/app/auth/blog/blog-posts/view/view-header.tsx`)
  - ✅ View Tabs (`components/app/auth/blog/blog-posts/view/view-tabs.tsx`)
  - ✅ View Content Tab (`components/app/auth/blog/blog-posts/view/view-content-tab.tsx`)
  - ✅ View Analytics Tab (`components/app/auth/blog/blog-posts/view/view-analytics-tab.tsx`)
  - ✅ View Comments Tab (`components/app/auth/blog/blog-posts/view/view-comments-tab.tsx`)

#### Community Management
- ✅ Community Topics Page (`app/auth/community/community-topics/page.tsx`)
  - ✅ Topics Table (`components/app/auth/community/community-topics/topics-table.tsx`)
  - ✅ Topic Form (`components/app/auth/community/community-topics/topic-form.tsx`)
  - ✅ Delete Topic Dialog (`components/app/auth/community/community-topics/delete-topic-dialog.tsx`)
  - ✅ Access Control (`components/app/auth/community/community-topics/access-control.tsx`)
- ✅ Community Posts List Page (`app/auth/community/community-posts/page.tsx`)
  - ✅ Posts Filters (`components/app/auth/community/community-posts/posts-filters.tsx`)
  - ✅ Posts Table (`components/app/auth/community/community-posts/posts-table.tsx`)
  - ✅ Delete Post Dialog (`components/app/auth/community/community-posts/delete-post-dialog.tsx`)
- ✅ Community Post Create Page (`app/auth/community/community-posts/create/page.tsx`)
  - ✅ Create Breadcrumb Nav (`components/app/auth/community/community-posts/create/create-breadcrumb-nav.tsx`)
  - ✅ Post Settings Section (`components/app/auth/community/community-posts/create/post-settings-section.tsx`)
  - ✅ (Reuses edit page components for basic info, topic, tags)
- ✅ Community Post Edit Page (`app/auth/community/community-posts/[id]/edit/page.tsx`)
  - ✅ Edit Breadcrumb Nav (`components/app/auth/community/community-posts/edit/edit-breadcrumb-nav.tsx`)
  - ✅ Basic Info Section (`components/app/auth/community/community-posts/edit/basic-info-section.tsx`)
  - ✅ Topic Section (`components/app/auth/community/community-posts/edit/topic-section.tsx`)
  - ✅ Tags Section (`components/app/auth/community/community-posts/edit/tags-section.tsx`)
  - ✅ Post Settings Section (`components/app/auth/community/community-posts/edit/post-settings-section.tsx`)
- ✅ Community Post View Page (`app/auth/community/community-posts/[id]/page.tsx`)
  - ✅ View Breadcrumb Nav (`components/app/auth/community/community-posts/view/view-breadcrumb-nav.tsx`)
  - ✅ View Header (`components/app/auth/community/community-posts/view/view-header.tsx`)
  - ✅ View Metadata (`components/app/auth/community/community-posts/view/view-metadata.tsx`)
  - ✅ View Content (`components/app/auth/community/community-posts/view/view-content.tsx`)

#### Custom Components
- ✅ StatusBadge Component (`components/custom/status-badge.tsx`) - Internationalized for all status types

### Loading States
To prevent showing raw translation keys during initial load, all pages use skeleton loading states:
- ✅ All 19 pages show skeleton UI while translations load
- ✅ Sidebar navigation shows skeleton while translations load
- ✅ Translations are preloaded before language switching to prevent raw keys
- ✅ Old translations remain visible during language switch for smooth UX

### Service Worker Configuration
**Note**: Caching is currently **DISABLED** for all requests. The service worker acts as a pass-through to ensure fresh translations are always loaded from the network. All caches are cleared on service worker install/activate.

### Best Practices
- Always use `suppressHydrationWarning` on elements displaying translations
- Keep translation keys flat when possible (avoid deep nesting)
- Use template variables for dynamic content (e.g., `{{email}}`, `{{item}}`)
- Always update both `en` and `ms` locale files together
- Test translations in both languages after changes

### Future Enhancements
- TypeScript types for translation keys (type-safe translations)
- Additional language support
- Translation key validation tooling

