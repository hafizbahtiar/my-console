"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useTranslation } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { teams } from "@/lib/appwrite"
import { useState, useEffect, useRef } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Home,
  User,
  Settings,
  Shield,
  Database,
  FileText,
  BarChart3,
  Key,
  BookOpen,
  Tag,
  MessageSquare,
  Users,
  FolderTree,
  ClipboardList,
  Clock,
} from "lucide-react"

const navigationItems = [
  {
    titleKey: "nav.dashboard",
    url: "/auth/dashboard",
    icon: Home,
  },
  {
    titleKey: "nav.profile",
    url: "/auth/profile",
    icon: User,
  },
  {
    titleKey: "nav.settings",
    url: "/auth/settings",
    icon: Settings,
  },
]


const adminItems = [
  {
    titleKey: "nav.audit",
    url: "/auth/audit",
    icon: ClipboardList,
  },
  {
    titleKey: "nav.sessions",
    url: "/auth/sessions",
    icon: Clock,
  },
  {
    titleKey: "nav.security",
    url: "/auth/admin/security",
    icon: Shield,
  },
  {
    titleKey: "nav.database",
    url: "/auth/admin/database",
    icon: Database,
  },
  {
    titleKey: "nav.analytics",
    url: "/auth/admin/analytics",
    icon: BarChart3,
  },
]

const blogItems = [
  {
    titleKey: "nav.blog_categories",
    url: "/auth/blog/blog-categories",
    icon: BookOpen,
    requiresSuperAdmin: false,
  },
  {
    titleKey: "nav.blog_tags",
    url: "/auth/blog/blog-tags",
    icon: Tag,
    requiresSuperAdmin: true,
  },
  {
    titleKey: "nav.blog_posts",
    url: "/auth/blog/blog-posts",
    icon: FileText,
    requiresSuperAdmin: false,
  },
]

const communityItems = [
  {
    titleKey: "nav.community_posts",
    url: "/auth/community/community-posts",
    icon: MessageSquare,
    requiresSuperAdmin: false,
  },
  {
    titleKey: "nav.community_topics",
    url: "/auth/community/community-topics",
    icon: FolderTree,
    requiresSuperAdmin: true,
  },
]

const developerItems = [
  {
    titleKey: "nav.keys",
    url: "/auth/developer/keys",
    icon: Key,
  },
  {
    titleKey: "nav.docs",
    url: "/auth/developer/docs",
    icon: FileText,
  },
]

export function SidebarNav() {
  const pathname = usePathname()
  const { isMobile } = useSidebar()
  const { t } = useTranslation()
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const isCheckingRef = useRef(false)

  // Check if user is a member of Super Admin team
  useEffect(() => {
    const checkSuperAdminAccess = async () => {
      // Don't check if auth is still loading or user is not authenticated
      if (authLoading || !isAuthenticated || !user) {
        setIsSuperAdmin(false)
        return
      }

      // Prevent multiple simultaneous checks
      if (isCheckingRef.current) {
        return
      }

      isCheckingRef.current = true

      try {
        // Use Appwrite SDK directly on client-side
        // According to https://appwrite.io/docs/products/auth/teams
        // The SDK handles authentication via cookies automatically in the browser
        const userTeams = await teams.list({})

        console.log('userTeams', userTeams)
        
        const hasSuperAdminAccess = userTeams.teams?.some((team: any) => team.name === 'Super Admin')
        setIsSuperAdmin(hasSuperAdminAccess || false)
      } catch (error: any) {
        // Handle specific error cases
        const isScopeError = error.type === 'general_unauthorized_scope' || 
                            error.message?.includes('missing scopes') ||
                            error.message?.includes('teams.read')
        
        const isCorsError = error.message?.includes('Failed to fetch') || 
                           error.message?.includes('CORS') || 
                           error.message?.includes('ERR_FAILED') ||
                           error.name === 'TypeError' && error.message?.includes('fetch')
        
        if (isScopeError) {
          console.warn('Missing teams.read scope. User may need to re-authenticate or permissions may have changed.')
          console.warn('Error details:', error)
          setIsSuperAdmin(false)
        } else if (isCorsError) {
          // CORS error - Could be nginx reverse proxy or Appwrite platform configuration
          if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
            const currentOrigin = window.location.origin
            console.warn(
              `⚠️ CORS Error: Requests blocked from ${currentOrigin}\n` +
              `📋 Possible causes:\n` +
              `   1. Nginx reverse proxy not forwarding CORS headers properly\n` +
              `   2. Appwrite platform not configured for localhost\n` +
              `\n` +
              `🔧 To fix:\n` +
              `   A. Check nginx config includes proper proxy headers\n` +
              `   B. In Appwrite Console > Project > Settings > Platforms:\n` +
              `      - Ensure platform identifier is: localhost\n` +
              `      - Or add: ${currentOrigin} to allowed origins\n` +
              `\n` +
              `   Note: This error is non-critical. The app will work, but Super Admin features may be hidden.`
            )
          }
          setIsSuperAdmin(false)
        } else if (error.code === 401 || error.message?.includes('Unauthorized')) {
          // User is not authenticated, don't set as super admin
          setIsSuperAdmin(false)
        } else {
          // Other errors - log and set to false
          console.error('Failed to check Super Admin access:', error)
          setIsSuperAdmin(false)
        }
      } finally {
        isCheckingRef.current = false
      }
    }

    checkSuperAdminAccess()
  }, [user, authLoading, isAuthenticated])

  // Filter admin items based on Super Admin access
  const filteredAdminItems = adminItems.filter(item => {
    // Database admin page requires Super Admin access
    if (item.url === "/auth/admin/database") {
      return isSuperAdmin
    }
    // Other admin items are available to all authenticated users
    return true
  })

  // Filter blog items based on Super Admin access
  const filteredBlogItems = blogItems.filter(item => {
    // Blog tags page requires Super Admin access
    if (item.requiresSuperAdmin) {
      return isSuperAdmin
    }
    // Other blog items are available to all authenticated users
    return true
  })

  // Filter community items based on Super Admin access
  const filteredCommunityItems = communityItems.filter(item => {
    // Community items that require Super Admin access
    if (item.requiresSuperAdmin) {
      return isSuperAdmin
    }
    // Other community items are available to all authenticated users
    return true
  })

  return (
    <Sidebar variant="inset" className="border-r">
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden bg-primary/10 dark:bg-primary/20 shrink-0">
            <Image
              src="/favicon.svg"
              alt="My Console Logo"
              width={32}
              height={32}
              className="h-full w-full object-contain p-1"
              priority
            />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
            <span className="truncate font-semibold">My Console</span>
            <span className="truncate text-xs text-muted-foreground">Admin Panel</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.main_navigation", "Main Navigation")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={t(item.titleKey)}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.administration")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredAdminItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={t(item.titleKey)}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.blog_management")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredBlogItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={t(item.titleKey)}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.community_management")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredCommunityItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url || pathname?.startsWith(item.url)}
                    tooltip={t(item.titleKey)}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.developer")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {developerItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={t(item.titleKey)}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
