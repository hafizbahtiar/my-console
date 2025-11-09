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
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProfilePage() {
  const { user, loading, logout } = useAuth()
  const { t, loading: translationLoading } = useTranslation()
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

      toast.success(t('profile_page.profile_updated_success'))
    } catch (error: any) {
      console.error('Profile update error:', error)
      toast.error(error.message || t('profile_page.profile_update_error'))
    } finally {
      setIsUpdating(false)
    }
  }

  // Show skeleton while translations or profile data is loading
  if (translationLoading || loading || isLoadingProfile) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6">
        <div>
          <Skeleton className="h-9 w-32 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Overview Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <Skeleton className="h-px w-full" />
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Account Settings Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-36 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>

          {/* Account Statistics Skeleton */}
          <Card className="md:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="text-center p-4 border rounded-lg">
                    <Skeleton className="h-8 w-12 mx-auto mb-2" />
                    <Skeleton className="h-4 w-16 mx-auto" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Teams Skeleton */}
          <Card className="md:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-4 w-4" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" suppressHydrationWarning>
          {t('profile_page.title')}
        </h1>
        <p className="text-muted-foreground" suppressHydrationWarning>
          {t('profile_page.description')}
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
