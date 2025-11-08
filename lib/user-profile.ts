import { ID } from 'appwrite'
import { tablesDB, DATABASE_ID, USERS_COLLECTION_ID, account } from './appwrite'

export interface UserProfile {
  $id: string
  $createdAt: string
  $updatedAt: string
  userId: string
  avatar?: string
  bio?: string
  location?: string
  website?: string
  role: 'user' | 'admin' | 'moderator'
  status: 'active' | 'inactive' | 'suspended' | 'banned'
  lastLoginAt?: string
  lastActiveAt?: string
  loginCount: number
  metadata?: string
  timezone?: string
  language?: 'en' | 'ms'
  theme?: 'light' | 'dark' | 'system'
  notificationsEnabled: boolean
  twoFactorEnabled: boolean
  createdBy?: string
  updatedBy?: string
}

/**
 * Get user profile by Appwrite user ID
 */
export async function getUserProfileByUserId(userId: string): Promise<UserProfile | null> {
  try {
    // Note: Appwrite tablesDB API doesn't support equal() queries reliably
    // So we load all rows and filter client-side (similar to audit-log.ts pattern)
    const allResponse = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: USERS_COLLECTION_ID
    })

    if (allResponse.rows && allResponse.rows.length > 0) {
      const profile = allResponse.rows.find((row: any) => row.userId === userId)
      if (profile) {
        return profile as unknown as UserProfile
      }
    }

    // No profile found
    return null
  } catch (error: any) {
    // Check if table doesn't exist
    if (error.code === 404 || error.message?.includes('not found') || error.message?.includes('does not exist')) {
      console.warn('Users table does not exist yet. Profile will be created when table is set up.')
      return null
    }

    // Silently return null for other errors to prevent breaking the app
    console.warn('Failed to get user profile:', error?.message || error)
    return null
  }
}

/**
 * Create a new user profile
 */
export async function createUserProfile(appwriteUserId: string): Promise<UserProfile> {
  try {
    // Verify Appwrite user exists
    const appwriteUser = await account.get()
    if (appwriteUser.$id !== appwriteUserId) {
      throw new Error('User ID mismatch')
    }

    // Create extended user profile
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
  } catch (error: any) {
    // If table doesn't exist, log a helpful message
    if (error.code === 404 || error.message?.includes('not found') || error.message?.includes('does not exist')) {
      console.error('Users table does not exist. Please create it in Appwrite Console first.')
      throw new Error('Users table not found. Please create the users table in Appwrite Console.')
    }
    console.error('Failed to create user profile:', error)
    throw error
  }
}

/**
 * Update user login statistics
 */
export async function updateLoginStats(userId: string): Promise<void> {
  try {
    const userProfile = await getUserProfileByUserId(userId)

    if (userProfile) {
      const now = new Date().toISOString()
      await tablesDB.updateRow({
        databaseId: DATABASE_ID,
        tableId: USERS_COLLECTION_ID,
        rowId: userProfile.$id,
        data: {
          lastLoginAt: now,
          lastActiveAt: now,
          loginCount: (userProfile.loginCount || 0) + 1
        }
      })
    } else {
      // Profile doesn't exist, create it
      await createUserProfile(userId)
      // Update login stats on the newly created profile
      const newProfile = await getUserProfileByUserId(userId)
      if (newProfile) {
        const now = new Date().toISOString()
        await tablesDB.updateRow({
          databaseId: DATABASE_ID,
          tableId: USERS_COLLECTION_ID,
          rowId: newProfile.$id,
          data: {
            lastLoginAt: now,
            lastActiveAt: now,
            loginCount: 1
          }
        })
      }
    }
  } catch (error) {
    console.error('Failed to update login stats:', error)
    // Don't throw - login stats update shouldn't break login flow
  }
}

/**
 * Update last activity timestamp
 */
export async function updateLastActivity(userId: string): Promise<void> {
  try {
    const userProfile = await getUserProfileByUserId(userId)

    if (userProfile) {
      await tablesDB.updateRow({
        databaseId: DATABASE_ID,
        tableId: USERS_COLLECTION_ID,
        rowId: userProfile.$id,
        data: {
          lastActiveAt: new Date().toISOString()
        }
      })
    }
  } catch (error) {
    console.error('Failed to update last activity:', error)
    // Don't throw - activity update shouldn't break user flow
  }
}

/**
 * Ensure user profile exists (create if it doesn't)
 */
export async function ensureUserProfile(userId: string): Promise<UserProfile> {
  try {
    let profile = await getUserProfileByUserId(userId)

    if (!profile) {
      profile = await createUserProfile(userId)
    }

    return profile
  } catch (error) {
    console.error('Failed to ensure user profile:', error)
    throw error
  }
}

