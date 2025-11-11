# Appwrite Tables Permissions Setup Guide

## Critical: Fix "Unauthorized" Errors

If you're getting **"The current user is not authorized to perform the requested action"** errors, you need to set the correct permissions on your Appwrite tables.

**IMPORTANT**: Setting permissions to "all users" (`*` or `users`) is NOT enough for Create/Update/Delete operations. These require the `super_admin` role!

## Required Permissions for Blog Tables

### 1. `blog_posts` Table

**Go to**: Appwrite Console → Databases → `console-db` → Tables → `blog_posts` → Settings → Permissions

**Set the following permissions:**

- **Read**: `users` (authenticated users can read posts)
- **Create**: `role:super_admin` (only admins can create posts)
- **Update**: `role:super_admin` (only admins can update posts)
- **Delete**: `role:super_admin` (only admins can delete posts)

**How to set in Appwrite Console:**
1. Click on the `blog_posts` table
2. Go to **Settings** tab
3. Scroll to **Permissions** section
4. For **Read** permission:
   - Click **Add Permission**
   - Select **Users** (not "Any" - this is for authenticated users only)
   - Click **Save**
5. For **Create/Update/Delete** permissions (CRITICAL - DO NOT SET TO "users" or "any"):
   - Click **Add Permission**
   - Select **Role** → `super_admin` (NOT "Users" or "Any")
   - Click **Save**
   - **If you set these to "users" or "any", you'll still get unauthorized errors!**

### 2. `blog_categories` Table

**Required Permissions:**
- **Read**: `users` (authenticated users can read categories)
- **Create**: `role:super_admin`
- **Update**: `role:super_admin`
- **Delete**: `role:super_admin`

### 3. `blog_tags` Table

**Required Permissions:**
- **Read**: `*` (anyone can read tags - public)
- **Create**: `role:super_admin`
- **Update**: `role:super_admin`
- **Delete**: `role:super_admin`

## Important Notes

### Difference between `users` and `*` (Any)

- **`users`**: Only authenticated/logged-in users can access
- **`*` (Any)**: Anyone (including unauthenticated users) can access

### For Admin Panel (my-console)

Since `my-console` is an admin panel that requires authentication:
- All blog tables should have **Read: `users`** permission
- This allows any authenticated user to read the data
- Only `super_admin` role can create/update/delete

### For Public Portfolio (portfolio-next)

For public-facing blog pages:
- `blog_posts` should have **Read: `*`** (public) for published posts
- `blog_categories` should have **Read: `*`** (public)
- `blog_tags` should have **Read: `*`** (public)

## Quick Fix Steps

1. **Open Appwrite Console**
   - Go to your Appwrite instance (e.g., `https://appwrite.hafizbahtiar.com`)
   - Navigate to your project

2. **For each blog table** (`blog_posts`, `blog_categories`, `blog_tags`):
   - Click on the table
   - Go to **Settings** → **Permissions**
   - Ensure **Read** permission includes `users` (for admin panel) or `*` (for public access)
   - Ensure **Create/Update/Delete** permissions include `role:super_admin`

3. **Save and Test**
   - Save the permissions
   - Refresh your admin panel
   - The "Unauthorized" error should be resolved

## Troubleshooting

### Still getting "Unauthorized" error?

1. **Check if you're logged in**: Make sure you're authenticated in the admin panel
2. **Check your user role**: Ensure your user has the `super_admin` role for create/update/delete operations
3. **Check Appwrite session**: Try logging out and logging back in
4. **Check CORS settings**: Ensure your domain is added to Appwrite project platforms

### Permission Format in Appwrite Console

When setting permissions, use:
- **For authenticated users**: Select "Users" (this sets `users` permission)
- **For public access**: Select "Any" (this sets `*` permission)
- **For admin role**: Select "Role" → `super_admin` (this sets `role:super_admin` permission)

