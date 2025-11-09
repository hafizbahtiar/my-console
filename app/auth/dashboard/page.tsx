"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/language-context"
import { AuditActivity } from "@/components/app/auth/dashboard/audit-activity"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { tablesDB, DATABASE_ID, BLOG_POSTS_COLLECTION_ID, COMMUNITY_POSTS_COLLECTION_ID, USERS_COLLECTION_ID, teams } from "@/lib/appwrite"
import { getUserProfileByUserId } from "@/lib/user-profile"
import {
  WelcomeHeader,
  StatsCards,
  UserProfileCard,
  QuickActionsCard
} from "@/components/app/auth/dashboard"

interface DashboardStats {
  totalBlogPosts: number
  totalCommunityPosts: number
  totalUsers: number
  activeUsers: number
  myBlogPosts: number
  myCommunityPosts: number
}


export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const { t, loading: translationLoading } = useTranslation()
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoadingAccess, setIsLoadingAccess] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalBlogPosts: 0,
    totalCommunityPosts: 0,
    totalUsers: 0,
    activeUsers: 0,
    myBlogPosts: 0,
    myCommunityPosts: 0
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)

  // Check admin access
  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setIsLoadingAccess(false)
        return
      }

      try {
        // Check for Super Admin team membership
        let hasSuperAdminAccess = false
        try {
          const userTeams = await teams.list({})
          hasSuperAdminAccess = userTeams.teams?.some((team: any) => team.name === 'Super Admin') || false
        } catch (teamError) {
          console.warn('Failed to check teams:', teamError)
        }

        // Check for admin label in user object
        const userLabels = (user as any).labels || []
        const userPrefs = (user as any).prefs || {}
        const hasAdminLabel = Array.isArray(userLabels) && userLabels.some((label: string) =>
          label.toLowerCase() === 'admin'
        ) || userPrefs.role === 'admin' || userPrefs.label === 'admin'

        setIsSuperAdmin(hasSuperAdminAccess)
        setIsAdmin(hasAdminLabel)
      } catch (error) {
        console.error('Failed to check access:', error)
      } finally {
        setIsLoadingAccess(false)
      }
    }

    checkAccess()
  }, [user])

  // Load dashboard statistics
  useEffect(() => {
    const loadStats = async () => {
      if (!user || isLoadingAccess) return

      try {
        setIsLoadingStats(true)

        // Load all data in parallel
        const [blogPostsData, communityPostsData, usersData, profile] = await Promise.all([
          tablesDB.listRows({
            databaseId: DATABASE_ID,
            tableId: BLOG_POSTS_COLLECTION_ID,
          }).catch(() => ({ rows: [] })),
          tablesDB.listRows({
            databaseId: DATABASE_ID,
            tableId: COMMUNITY_POSTS_COLLECTION_ID,
          }).catch(() => ({ rows: [] })),
          tablesDB.listRows({
            databaseId: DATABASE_ID,
            tableId: USERS_COLLECTION_ID,
          }).catch(() => ({ rows: [] })),
          getUserProfileByUserId(user.$id).catch(() => null)
        ])

        const blogPosts = blogPostsData.rows || []
        const communityPosts = communityPostsData.rows || []
        const users = usersData.rows || []

        // Filter posts by user if not admin
        const myBlogPosts = isSuperAdmin || isAdmin
          ? blogPosts
          : blogPosts.filter((post: any) => post.authorId === user.$id)

        const myCommunityPosts = isSuperAdmin || isAdmin
          ? communityPosts
          : communityPosts.filter((post: any) => post.authorId === user.$id)

        // Calculate active users (logged in within last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const activeUsers = users.filter((u: any) => {
          if (!u.lastLoginAt) return false
          return new Date(u.lastLoginAt) >= thirtyDaysAgo
        }).length

        setStats({
          totalBlogPosts: isSuperAdmin || isAdmin ? blogPosts.length : myBlogPosts.length,
          totalCommunityPosts: isSuperAdmin || isAdmin ? communityPosts.length : myCommunityPosts.length,
          totalUsers: isSuperAdmin || isAdmin ? users.length : 0,
          activeUsers: isSuperAdmin || isAdmin ? activeUsers : 0,
          myBlogPosts: myBlogPosts.length,
          myCommunityPosts: myCommunityPosts.length
        })

        setUserProfile(profile)
      } catch (error) {
        console.error('Failed to load dashboard stats:', error)
        toast.error('Failed to load dashboard statistics')
      } finally {
        setIsLoadingStats(false)
      }
    }

    loadStats()
  }, [user, isSuperAdmin, isAdmin, isLoadingAccess])

  // Show skeleton while translations, auth, or access is loading
  if (translationLoading || authLoading || isLoadingAccess) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-6">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-2 sm:gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <Skeleton className="h-8 w-48 sm:h-9 sm:w-64" />
              <Skeleton className="h-4 w-64 sm:h-5 sm:w-80" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border rounded-lg p-4 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
            <div className="lg:col-span-4 border rounded-lg p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-16 w-16 rounded-full" />
            </div>
            <div className="lg:col-span-3 border rounded-lg p-6 space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    window.location.href = '/'
    return null
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6">
      {/* Welcome Header */}
      <WelcomeHeader user={user} isSuperAdmin={isSuperAdmin} isAdmin={isAdmin} />

      {/* Quick Stats */}
      <StatsCards
        stats={stats}
        isLoadingStats={isLoadingStats}
        isSuperAdmin={isSuperAdmin}
        isAdmin={isAdmin}
      />

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 px-2 sm:px-4" suppressHydrationWarning>
            {t('dashboard_page.tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-xs sm:text-sm py-2 px-2 sm:px-4" suppressHydrationWarning>
            {t('dashboard_page.tabs.activity')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
            <UserProfileCard user={user} userProfile={userProfile} />
            <QuickActionsCard isSuperAdmin={isSuperAdmin} isAdmin={isAdmin} />
          </div>

          {/* Welcome Alert */}
          <Alert className="mt-4">
            <Info className="h-4 w-4 shrink-0" />
            <AlertDescription className="text-xs sm:text-sm" suppressHydrationWarning>
              {t('dashboard_page.welcome_alert')}
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <AuditActivity />
        </TabsContent>
      </Tabs>
    </div>
  )
}
