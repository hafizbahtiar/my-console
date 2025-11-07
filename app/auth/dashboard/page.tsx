"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/language-context"
import { AuditActivity } from "@/components/app/auth/dashboard/audit-activity"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Settings,
  Activity,
  BarChart3,
  TrendingUp,
  Users,
  Database,
  Shield,
  Clock,
  CheckCircle,
  Info,
  FileText,
  MessageSquare,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
import { tablesDB, DATABASE_ID, BLOG_POSTS_COLLECTION_ID, COMMUNITY_POSTS_COLLECTION_ID, USERS_COLLECTION_ID, teams } from "@/lib/appwrite"
import { getUserProfileByUserId } from "@/lib/user-profile"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts"
import Link from "next/link"

interface DashboardStats {
  totalBlogPosts: number
  totalCommunityPosts: number
  totalUsers: number
    activeUsers: number
  myBlogPosts: number
  myCommunityPosts: number
}

interface ChartData {
  date: string
  blogPosts: number
  communityPosts: number
  users: number
}

interface ContentDistribution {
  name: string
  value: number
  color: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export default function Dashboard() {
  const { user, loading } = useAuth()
  const { t } = useTranslation()
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
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [contentDistribution, setContentDistribution] = useState<ContentDistribution[]>([])
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

        // Generate chart data (last 7 days)
        const chartDataArray: ChartData[] = []
        const now = new Date()
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now)
          date.setDate(date.getDate() - i)
          const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          
          const dayStart = new Date(date)
          dayStart.setHours(0, 0, 0, 0)
          const dayEnd = new Date(date)
          dayEnd.setHours(23, 59, 59, 999)

          const blogCount = blogPosts.filter((post: any) => {
            const postDate = new Date(post.$createdAt)
            return postDate >= dayStart && postDate <= dayEnd
          }).length

          const communityCount = communityPosts.filter((post: any) => {
            const postDate = new Date(post.$createdAt)
            return postDate >= dayStart && postDate <= dayEnd
          }).length

          const userCount = users.filter((u: any) => {
            if (!u.$createdAt) return false
            const userDate = new Date(u.$createdAt)
            return userDate >= dayStart && userDate <= dayEnd
          }).length

          chartDataArray.push({
            date: dateStr,
            blogPosts: blogCount,
            communityPosts: communityCount,
            users: isSuperAdmin || isAdmin ? userCount : 0
          })
        }

        setChartData(chartDataArray)

        // Content distribution
        const distribution: ContentDistribution[] = [
          {
            name: 'Blog Posts',
            value: blogPosts.length,
            color: COLORS[0]
          },
          {
            name: 'Community Posts',
            value: communityPosts.length,
            color: COLORS[1]
          }
        ]

        if (isSuperAdmin || isAdmin) {
          distribution.push({
            name: 'Users',
            value: users.length,
            color: COLORS[2]
          })
        }

        setContentDistribution(distribution.filter(d => d.value > 0))
      } catch (error) {
        console.error('Failed to load dashboard stats:', error)
        toast.error('Failed to load dashboard statistics')
      } finally {
        setIsLoadingStats(false)
      }
    }

    loadStats()
  }, [user, isSuperAdmin, isAdmin, isLoadingAccess])

  if (loading || isLoadingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    window.location.href = '/'
    return null
  }

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  const chartConfig = {
    blogPosts: {
      label: "Blog Posts",
      color: "hsl(var(--chart-1))",
    },
    communityPosts: {
      label: "Community Posts",
      color: "hsl(var(--chart-2))",
    },
    users: {
      label: "Users",
      color: "hsl(var(--chart-3))",
    },
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.title")}</h1>
            <p className="text-muted-foreground">
              {t("dashboard.welcome_back", { name: user.name || user.email })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              {t("status.online")}
            </Badge>
            {(isSuperAdmin || isAdmin) && (
              <Badge variant="default">
                <Shield className="h-3 w-3 mr-1" />
                {isSuperAdmin ? 'Super Admin' : 'Admin'}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {(isSuperAdmin || isAdmin) ? t('dashboard.total_users') : t('dashboard.my_posts')}
            </CardTitle>
            {(isSuperAdmin || isAdmin) ? (
            <Users className="h-4 w-4 text-muted-foreground" />
            ) : (
              <FileText className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                (isSuperAdmin || isAdmin) ? stats.totalUsers : (stats.myBlogPosts + stats.myCommunityPosts)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {(isSuperAdmin || isAdmin) 
                ? `${stats.activeUsers} ${t('dashboard.active_users')}`
                : `${stats.myBlogPosts} blog, ${stats.myCommunityPosts} community`
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.blog_posts')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                stats.totalBlogPosts
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {(isSuperAdmin || isAdmin) ? t('dashboard.total_posts') : t('dashboard.my_posts')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.community_posts')}</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                stats.totalCommunityPosts
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {(isSuperAdmin || isAdmin) ? t('dashboard.total_posts') : t('dashboard.my_posts')}
            </p>
          </CardContent>
        </Card>

        {(isSuperAdmin || isAdmin) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.active_users')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  stats.activeUsers
                )}
            </div>
            <p className="text-xs text-muted-foreground">
                {t('dashboard.last_30_days')}
            </p>
          </CardContent>
        </Card>
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">{t("dashboard.overview")}</TabsTrigger>
          <TabsTrigger value="activity">{t("dashboard.activity")}</TabsTrigger>
          <TabsTrigger value="analytics">{t("dashboard.analytics")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* User Profile */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t("profile.user_profile")}
                </CardTitle>
                <CardDescription>
                  {t("profile.user_profile_desc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={userProfile?.avatar} />
                    <AvatarFallback className="text-lg">
                      {getInitials(user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">{user.name || 'User'}</h3>
                    <p className="text-muted-foreground">{user.email}</p>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{t('general_use.active')}</Badge>
                      <Badge variant={user.emailVerification ? "default" : "secondary"}>
                        {user.emailVerification ? t('status.verified') : t('status.unverified')}
                      </Badge>
                      {userProfile?.role && (
                        <Badge variant="outline">{userProfile.role}</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('dashboard.account_completion')}</span>
                    <span className="font-medium">
                      {userProfile ? (
                        Math.round(
                          ((user.name ? 1 : 0) +
                           (userProfile.bio ? 1 : 0) +
                           (userProfile.location ? 1 : 0) +
                           (userProfile.website ? 1 : 0) +
                           (user.emailVerification ? 1 : 0)) / 5 * 100
                        )
                      ) : 20}%
                    </span>
                  </div>
                  <Progress 
                    value={userProfile ? (
                      Math.round(
                        ((user.name ? 1 : 0) +
                         (userProfile.bio ? 1 : 0) +
                         (userProfile.location ? 1 : 0) +
                         (userProfile.website ? 1 : 0) +
                         (user.emailVerification ? 1 : 0)) / 5 * 100
                      )
                    ) : 20} 
                    className="h-2" 
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('dashboard.complete_profile')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>{t("actions.quick_actions")}</CardTitle>
                <CardDescription>
                  {t("actions.common_tasks")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="default" className="w-full justify-start" size="sm" asChild>
                  <Link href="/auth/blog/blog-posts/create">
                  <FileText className="h-4 w-4 mr-2" />
                    {t("actions.create_blog_post")}
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm" asChild>
                  <Link href="/auth/profile">
                  <Settings className="h-4 w-4 mr-2" />
                  {t("actions.account_settings")}
                  </Link>
                </Button>
                {(isSuperAdmin || isAdmin) && (
                  <>
                    <Button variant="outline" className="w-full justify-start" size="sm" asChild>
                      <Link href="/auth/admin/database">
                        <Database className="h-4 w-4 mr-2" />
                        {t("actions.database_admin")}
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm" asChild>
                      <Link href="/auth/audit">
                  <Shield className="h-4 w-4 mr-2" />
                        {t("actions.audit_logs")}
                      </Link>
                </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Welcome Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {t("welcome.welcome_desc")}
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <AuditActivity />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Activity Over Time Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {t('dashboard.activity_over_time')}
                </CardTitle>
                <CardDescription>
                  {t('dashboard.last_7_days')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="blogPosts" 
                        stroke="var(--color-blogPosts)" 
                        strokeWidth={2}
                        name="Blog Posts"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="communityPosts" 
                        stroke="var(--color-communityPosts)" 
                        strokeWidth={2}
                        name="Community Posts"
                      />
                      {(isSuperAdmin || isAdmin) && (
                        <Line 
                          type="monotone" 
                          dataKey="users" 
                          stroke="var(--color-users)" 
                          strokeWidth={2}
                          name="Users"
                        />
                      )}
                    </LineChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            {/* Content Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {t('dashboard.content_distribution')}
                </CardTitle>
                <CardDescription>
                  {t('dashboard.content_overview')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : contentDistribution.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <PieChart>
                      <Pie
                        data={contentDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {contentDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    {t('dashboard.no_data')}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
