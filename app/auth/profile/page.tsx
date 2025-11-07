"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/language-context"
import { account, teams } from "@/lib/appwrite"
import { auditLogger } from "@/lib/audit-log"
import { getUserProfileByUserId, updateLastActivity, type UserProfile } from "@/lib/user-profile"
import { toast } from "sonner"
import { tablesDB, DATABASE_ID, USERS_COLLECTION_ID } from "@/lib/appwrite"
import { ProfileOverview } from "@/components/app/auth/profile/profile-overview"
import { AccountSettingsForm } from "@/components/app/auth/profile/account-settings-form"
import { AccountStatistics } from "@/components/app/auth/profile/account-statistics"
import { TeamsSection } from "@/components/app/auth/profile/teams-section"
import { ProfileFormData } from "@/components/app/auth/profile/types"
import { DEFAULT_TIMEZONE } from "@/components/app/auth/profile/timezones"

export default function ProfilePage() {
  const { user, loading, logout } = useAuth()
  const { t } = useTranslation()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [sessions, setSessions] = useState<any[]>([])
  const [userTeams, setUserTeams] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    email: '',
    bio: '',
    location: '',
    website: '',
    timezone: DEFAULT_TIMEZONE,
    language: 'en',
    theme: 'system',
    notificationsEnabled: true
  })

  // Initialize form data and fetch sessions when user data is available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }))
      fetchUserProfile()
      fetchUserSessions()
      fetchUserTeams()
      // Update last activity when profile page is viewed
      updateLastActivity(user.$id).catch(console.warn)
    }
  }, [user])

  const fetchUserProfile = async () => {
    if (!user) return
    
    setIsLoadingProfile(true)
    try {
      const profile = await getUserProfileByUserId(user.$id)
      setUserProfile(profile)
      
      if (profile) {
        setFormData(prev => ({
          ...prev,
          bio: profile.bio || '',
          location: profile.location || '',
          website: profile.website || '',
          timezone: profile.timezone || DEFAULT_TIMEZONE,
          language: profile.language || 'en',
          theme: profile.theme || 'system',
          notificationsEnabled: profile.notificationsEnabled ?? true
        }))
      } else {
        // Set default timezone if no profile exists
        setFormData(prev => ({
          ...prev,
          timezone: DEFAULT_TIMEZONE
        }))
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  const fetchUserSessions = async () => {
    try {
      const sessionsData = await account.listSessions()
      setSessions(sessionsData.sessions || [])
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
      // Keep empty array on error
    }
  }

  const fetchUserTeams = async () => {
    try {
      const teamsData = await teams.list({})
      setUserTeams(teamsData.teams || [])
    } catch (error) {
      console.error('Failed to fetch user teams:', error)
      // Keep empty array on error
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    setIsUpdating(true)

    try {
      // Get current user data for audit logging
      const currentUser = user
      const oldName = currentUser?.name || ''
      const oldProfile = userProfile

      // Update user name in Appwrite (using object parameter style)
      await account.updateName({ name: formData.name })

      // Update extended profile in users collection
      if (userProfile) {
        await tablesDB.updateRow({
          databaseId: DATABASE_ID,
          tableId: USERS_COLLECTION_ID,
          rowId: userProfile.$id,
          data: {
            bio: formData.bio || null,
            location: formData.location || null,
            website: formData.website || null,
            timezone: formData.timezone || null,
            language: formData.language,
            theme: formData.theme,
            notificationsEnabled: formData.notificationsEnabled
          }
        })
      } else {
        // Profile doesn't exist, create it
        const { createUserProfile } = await import('@/lib/user-profile')
        await createUserProfile(user.$id)
        
        // Then update it with the form data
        const newProfile = await getUserProfileByUserId(user.$id)
        if (newProfile) {
          await tablesDB.updateRow({
            databaseId: DATABASE_ID,
            tableId: USERS_COLLECTION_ID,
            rowId: newProfile.$id,
            data: {
              bio: formData.bio || null,
              location: formData.location || null,
              website: formData.website || null,
              timezone: formData.timezone || null,
              language: formData.language,
              theme: formData.theme,
              notificationsEnabled: formData.notificationsEnabled
            }
          })
        }
      }

      // Log the profile update
      try {
        await auditLogger.logProfileUpdate(
          user.$id,
          { 
            name: oldName,
            bio: oldProfile?.bio,
            location: oldProfile?.location,
            website: oldProfile?.website
          },
          { 
            name: formData.name,
            bio: formData.bio,
            location: formData.location,
            website: formData.website
          }
        )
      } catch (auditError) {
        console.warn('Failed to log profile update audit event:', auditError)
      }

      // Refresh profile data
      await fetchUserProfile()

      toast.success(t("profile.update_profile"))
    } catch (error: any) {
      console.error('Profile update error:', error)
      toast.error(error.message || t('general_use.error'))
    } finally {
      setIsUpdating(false)
    }
  }

  if (loading || isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("profile.title")}</h1>
        <p className="text-muted-foreground">
          {t("profile.subtitle")}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ProfileOverview user={user} userProfile={userProfile} />
        <AccountSettingsForm
          formData={formData}
          isUpdating={isUpdating}
          onInputChange={handleInputChange}
          onSubmit={handleUpdateProfile}
        />
        <AccountStatistics
          sessionsCount={sessions.length}
          teamsCount={userTeams.length}
          userProfile={userProfile}
        />
        <TeamsSection teams={userTeams} />
      </div>
    </div>
  )
}
